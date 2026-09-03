import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isTrackerKey } from '@/lib/permissions';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') return null;
  return session;
}

// List every provisioned account, for the /admin user-management panel.
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, role: true, allowedTrackers: true, createdAt: true, password: true }
  });
  // Never send password hashes to the client -- just whether one is set,
  // so the admin UI can show "Microsoft only" vs "has a fallback password".
  return NextResponse.json(
    users.map((u) => ({ ...u, password: undefined, hasPassword: !!u.password }))
  );
}

// Provision a new Manager or Employee account. No password is required --
// the intended path in is "Sign in with Microsoft" once this row exists.
// A password can optionally be set as a fallback.
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { name, email, role, password, allowedTrackers } = await req.json();
  if (!name || !email) {
    return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 });
  }
  if (role && !['staff', 'manager', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }
  const trackers: string[] = Array.isArray(allowedTrackers) ? allowedTrackers.filter(isTrackerKey) : [];

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      role: role ?? 'staff',
      allowedTrackers: trackers,
      password: password ? await bcrypt.hash(password, 10) : null
    }
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
