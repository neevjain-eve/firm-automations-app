import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readCollection, insertRow } from '@/lib/onedrive/store';
import type { AgreementRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { getUserLiteMap, userRef } from '@/lib/onedrive/users';
import { newId } from '@/lib/onedrive/id';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [rows, users] = await Promise.all([
    readCollection<AgreementRow>(COLLECTIONS.agreements),
    getUserLiteMap()
  ]);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const renewalsByParent = new Map<string, AgreementRow[]>();
  for (const r of rows) {
    if (!r.renewedFromId) continue;
    const list = renewalsByParent.get(r.renewedFromId) ?? [];
    list.push(r);
    renewalsByParent.set(r.renewedFromId, list);
  }

  const agreements = rows
    .slice()
    .sort((a, b) => (a.endDate < b.endDate ? -1 : 1))
    .map((a) => {
      const parent = a.renewedFromId ? byId.get(a.renewedFromId) : null;
      return {
        ...a,
        createdBy: userRef(users, a.createdById),
        renewedFrom: parent ? { id: parent.id, name: parent.name, endDate: parent.endDate } : null,
        renewals: (renewalsByParent.get(a.id) ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          startDate: r.startDate,
          endDate: r.endDate
        }))
      };
    });
  return NextResponse.json(agreements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { name, clientName, agreementType, city, areaLocality, startDate, endDate, amount, notes } =
    await req.json();
  if (!name || !clientName || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'name, clientName, startDate, and endDate are required' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const agreement: AgreementRow = {
    id: newId(),
    name,
    clientName,
    agreementType: agreementType || null,
    city: city || null,
    areaLocality: areaLocality || null,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    amount: amount ? Number(amount) : null,
    notes: notes || null,
    createdAt: now,
    updatedAt: now,
    renewedFromId: null,
    createdById: (session.user as any).id
  };
  await insertRow(COLLECTIONS.agreements, agreement);
  return NextResponse.json(agreement);
}
