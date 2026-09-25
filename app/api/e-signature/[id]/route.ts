import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deleteRow, mutateCollection } from '@/lib/onedrive/store';
import type { PolicySignatureRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await deleteRow(COLLECTIONS.policies, params.id);
  // Cascade: Prisma had onDelete: Cascade from Policy -> PolicySignature.
  await mutateCollection<PolicySignatureRow>(COLLECTIONS.policySignatures, (rows) =>
    rows.filter((s) => s.policyId !== params.id)
  );
  return NextResponse.json({ ok: true });
}
