import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readCollection, insertRow } from '@/lib/onedrive/store';
import type { PolicySignatureRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { getUserLiteMap, userRef } from '@/lib/onedrive/users';
import { newId } from '@/lib/onedrive/id';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { signedName, signatureData } = await req.json();
  if (!signedName || !signatureData) {
    return NextResponse.json({ error: 'signedName and signatureData are required' }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const existingRows = await readCollection<PolicySignatureRow>(COLLECTIONS.policySignatures);
  const existing = existingRows.find((s) => s.policyId === params.id && s.userId === userId);
  if (existing) {
    return NextResponse.json({ error: 'You have already signed this policy.' }, { status: 409 });
  }

  const signature: PolicySignatureRow = {
    id: newId(),
    policyId: params.id,
    userId,
    signedName,
    signatureData,
    signedAt: new Date().toISOString()
  };
  await insertRow(COLLECTIONS.policySignatures, signature);

  const users = await getUserLiteMap();
  return NextResponse.json({ ...signature, user: users.get(userId) ?? { id: userId, name: 'Unknown', email: '' } });
}
