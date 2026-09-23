import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidGstin, normalizeGstin } from '@/lib/gst/gstin';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const clients = await prisma.gstClient.findMany({
    orderBy: { name: 'asc' },
    include: { gstins: { orderBy: { gstin: 'asc' } }, createdBy: { select: { name: true, email: true } } },
  });
  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const name = String(body.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Client name is required' }, { status: 400 });

  const gstin = body.gstin ? normalizeGstin(body.gstin) : null;
  if (gstin && !isValidGstin(gstin)) {
    return NextResponse.json({ error: `"${gstin}" is not a valid GSTIN (check digits/format)` }, { status: 400 });
  }
  if (gstin && (await prisma.gstGstin.findUnique({ where: { gstin } }))) {
    return NextResponse.json({ error: `GSTIN ${gstin} is already registered to another client` }, { status: 409 });
  }

  const client = await prisma.gstClient.create({
    data: {
      name,
      notes: body.notes || null,
      createdById: (session.user as any).id,
      gstins: gstin ? { create: [{ gstin, label: body.gstinLabel || null }] } : undefined,
    },
    include: { gstins: true },
  });
  return NextResponse.json(client, { status: 201 });
}
