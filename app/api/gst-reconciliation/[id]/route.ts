import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateRow, deleteRow } from '@/lib/onedrive/store';
import type { GstReconciliationRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const patch: Partial<GstReconciliationRow> = { updatedAt: new Date().toISOString() };
  if (body.period) patch.period = body.period;
  if (body.returnType) patch.returnType = body.returnType;
  if (body.status) patch.status = body.status;
  if (body.gstin !== undefined) patch.gstin = body.gstin || null;
  if (body.dueDate !== undefined) patch.dueDate = body.dueDate ? new Date(body.dueDate).toISOString() : null;
  if (body.filedBy !== undefined) patch.filedBy = body.filedBy || null;
  if (body.amountBooks !== undefined)
    patch.amountBooks = body.amountBooks !== '' ? Number(body.amountBooks) : null;
  if (body.amountGst !== undefined)
    patch.amountGst = body.amountGst !== '' ? Number(body.amountGst) : null;
  if (body.notes !== undefined) patch.notes = body.notes || null;

  const row = await updateRow<GstReconciliationRow>(COLLECTIONS.gstReconciliations, params.id, patch);
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await deleteRow(COLLECTIONS.gstReconciliations, params.id);
  return NextResponse.json({ ok: true });
}
