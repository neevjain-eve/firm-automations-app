import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateRow, deleteRow } from '@/lib/onedrive/store';
import type { AgreementRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const patch: Partial<AgreementRow> = { updatedAt: new Date().toISOString() };
  if (body.name) patch.name = body.name;
  if (body.clientName) patch.clientName = body.clientName;
  if (body.agreementType !== undefined) patch.agreementType = body.agreementType || null;
  if (body.city !== undefined) patch.city = body.city || null;
  if (body.areaLocality !== undefined) patch.areaLocality = body.areaLocality || null;
  if (body.startDate) patch.startDate = new Date(body.startDate).toISOString();
  if (body.endDate) patch.endDate = new Date(body.endDate).toISOString();
  if (body.amount !== undefined) patch.amount = body.amount ? Number(body.amount) : null;
  if (body.notes !== undefined) patch.notes = body.notes || null;

  const agreement = await updateRow<AgreementRow>(COLLECTIONS.agreements, params.id, patch);
  return NextResponse.json(agreement);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await deleteRow(COLLECTIONS.agreements, params.id);
  return NextResponse.json({ ok: true });
}
