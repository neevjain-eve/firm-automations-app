import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { clientId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: 'Client name cannot be empty' }, { status: 400 });
    data.name = name;
  }
  if (body.notes !== undefined) data.notes = body.notes || null;

  const client = await prisma.gstClient.update({ where: { id: params.clientId }, data, include: { gstins: true } });
  return NextResponse.json(client);
}

export async function DELETE(_req: NextRequest, { params }: { params: { clientId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Cascades to its GSTINs, whose imports/invoices/decisions cascade in turn (see schema.prisma).
  await prisma.gstClient.delete({ where: { id: params.clientId } });
  return NextResponse.json({ ok: true });
}
