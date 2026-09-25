import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readCollection, insertRow } from '@/lib/onedrive/store';
import type { PolicyRow, PolicySignatureRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { getUserLiteMap, userRef } from '@/lib/onedrive/users';
import { newId } from '@/lib/onedrive/id';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [policies, signatures, users] = await Promise.all([
    readCollection<PolicyRow>(COLLECTIONS.policies),
    readCollection<PolicySignatureRow>(COLLECTIONS.policySignatures),
    getUserLiteMap()
  ]);

  const result = policies
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((p) => ({
      ...p,
      createdBy: userRef(users, p.createdById),
      signatures: signatures
        .filter((s) => s.policyId === p.id)
        .map((s) => ({
          id: s.id,
          signedName: s.signedName,
          signedAt: s.signedAt,
          user: users.get(s.userId) ?? { id: s.userId, name: 'Unknown', email: '' }
        }))
    }));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { title, content } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const policy: PolicyRow = {
    id: newId(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
    createdById: (session.user as any).id
  };
  await insertRow(COLLECTIONS.policies, policy);

  const users = await getUserLiteMap();
  return NextResponse.json({ ...policy, createdBy: userRef(users, policy.createdById), signatures: [] });
}
