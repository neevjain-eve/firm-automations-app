import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { gstinId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const row = await prisma.gstGstin.update({
    where: { id: params.gstinId },
    data: { label: body.label !== undefined ? body.label || null : undefined }
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: { gstinId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  // Cascades to its import jobs, invoices and decisions (see schema.prisma).
  await prisma.gstGstin.delete({ where: { id: params.gstinId } });
  return NextResponse.json({ ok: true });
}
