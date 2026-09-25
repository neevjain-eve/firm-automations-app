import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readCollection, insertRow } from '@/lib/onedrive/store';
import type { GstReconciliationRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { getUserLiteMap, userRef } from '@/lib/onedrive/users';
import { newId } from '@/lib/onedrive/id';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [rows, users] = await Promise.all([
    readCollection<GstReconciliationRow>(COLLECTIONS.gstReconciliations),
    getUserLiteMap()
  ]);
  const result = rows
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((r) => ({ ...r, createdBy: userRef(users, r.createdById) }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { period, returnType, gstin, dueDate, filedBy, amountBooks, amountGst, notes } =
    await req.json();
  if (!period) {
    return NextResponse.json({ error: 'period is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const row: GstReconciliationRow = {
    id: newId(),
    period,
    returnType: returnType || 'GSTR-3B',
    status: 'pending',
    gstin: gstin || null,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    filedBy: filedBy || null,
    amountBooks: amountBooks !== undefined && amountBooks !== '' ? Number(amountBooks) : null,
    amountGst: amountGst !== undefined && amountGst !== '' ? Number(amountGst) : null,
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
    createdById: (session.user as any).id
  };
  await insertRow(COLLECTIONS.gstReconciliations, row);
  return NextResponse.json(row);
}
