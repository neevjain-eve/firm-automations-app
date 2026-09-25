import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readCollection, insertRow } from '@/lib/onedrive/store';
import type { AgreementRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { newId } from '@/lib/onedrive/id';

// Create a new version of an agreement, linked back to the one it renews.
// The old agreement's dates/amount stay as history; the new row becomes the
// active one going forward.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rows = await readCollection<AgreementRow>(COLLECTIONS.agreements);
  const original = rows.find((r) => r.id === params.id);
  if (!original) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const { startDate, endDate, amount, notes } = await req.json();
  if (!startDate || !endDate) {
    return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const renewed: AgreementRow = {
    id: newId(),
    name: original.name,
    clientName: original.clientName,
    agreementType: original.agreementType,
    city: original.city,
    areaLocality: original.areaLocality,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    amount: amount ? Number(amount) : original.amount,
    notes: notes || original.notes,
    createdAt: now,
    updatedAt: now,
    renewedFromId: original.id,
    createdById: (session.user as any).id
  };
  await insertRow(COLLECTIONS.agreements, renewed);
  return NextResponse.json(renewed, { status: 201 });
}
