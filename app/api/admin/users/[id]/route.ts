import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isTrackerKey } from '@/lib/permissions';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') return null;
  return session;
}

// Update an account's role and/or which trackers it can open.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { role, allowedTrackers } = await req.json();
  const data: { role?: string; allowedTrackers?: string[] } = {};

  if (role !== undefined) {
    if (!['staff', 'manager', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }
    // An admin can't demote themselves out of the only admin seat by accident
    // from this screen -- they'd just lose access to /admin. Simplest guard:
    // block self-demotion entirely; another admin can do it instead.
    if (role !== 'admin' && (session.user as any).id === params.id) {
      return NextResponse.json({ error: "You can't change your own role here." }, { status: 400 });
    }
    data.role = role;
  }

  if (allowedTrackers !== undefined) {
    if (!Array.isArray(allowedTrackers) || !allowedTrackers.every(isTrackerKey)) {
      return NextResponse.json({ error: 'Invalid tracker list.' }, { status: 400 });
    }
    data.allowedTrackers = allowedTrackers;
  }

  const user = await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json({ id: user.id, role: user.role, allowedTrackers: user.allowedTrackers });
}

// Remove a provisioned account entirely.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  if ((session.user as any).id === params.id) {
    return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json(
      { error: 'This account has existing records (tasks, comments, etc.) and can’t be deleted. Consider removing their tracker access instead.' },
      { status: 409 }
    );
  }
  return NextResponse.json({ ok: true });
}
