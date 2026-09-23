import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isValidGstin, normalizeGstin } from '@/lib/gst/gstin';

export async function POST(req: NextRequest, { params }: { params: { clientId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const gstin = normalizeGstin(body.gstin);
  if (!isValidGstin(gstin)) {
    return NextResponse.json({ error: `"${gstin}" is not a valid GSTIN (check digits/format)` }, { status: 400 });
  }
  if (await prisma.gstGstin.findUnique({ where: { gstin } })) {
    return NextResponse.json({ error: `GSTIN ${gstin} is already registered to another client` }, { status: 409 });
  }

  const row = await prisma.gstGstin.create({
    data: { gstin, label: body.label || null, clientId: params.clientId },
  });
  return NextResponse.json(row, { status: 201 });
}
