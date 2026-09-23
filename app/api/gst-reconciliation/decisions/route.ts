import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET ?gstinId=&period=&status=&reviewStatus= -- the tracker's main list. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const gstinId = searchParams.get('gstinId');
  const period = searchParams.get('period');
  const status = searchParams.get('status');
  const reviewStatus = searchParams.get('reviewStatus');
  if (!gstinId || !period) return NextResponse.json({ error: 'gstinId and period are required' }, { status: 400 });

  const decisions = await prisma.gstDecision.findMany({
    where: {
      gstinId,
      period,
      ...(status ? { status } : {}),
      ...(reviewStatus ? { reviewStatus } : {}),
    },
    include: { reviewedBy: { select: { name: true, email: true } } },
    orderBy: [{ status: 'asc' }, { invoiceDate: 'asc' }],
  });
  return NextResponse.json(decisions);
}
