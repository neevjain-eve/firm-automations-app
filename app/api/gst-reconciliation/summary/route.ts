import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/** GET ?gstinId= -- per-period counts for the reports page and period pickers. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const gstinId = new URL(req.url).searchParams.get('gstinId');
  if (!gstinId) return NextResponse.json({ error: 'gstinId is required' }, { status: 400 });

  const decisions = await prisma.gstDecision.findMany({
    where: { gstinId },
    select: { period: true, status: true, reviewStatus: true, booksItc: true, gstr2bItc: true, matchedItc: true },
  });

  const byPeriod = new Map<string, { period: string; total: number; matched: number; needsReview: number; missingInGstr2b: number; missingInBooks: number; mismatches: number; open: number; itcAtRisk: number; itcClaimed: number }>();
  for (const d of decisions) {
    if (!byPeriod.has(d.period)) {
      byPeriod.set(d.period, { period: d.period, total: 0, matched: 0, needsReview: 0, missingInGstr2b: 0, missingInBooks: 0, mismatches: 0, open: 0, itcAtRisk: 0, itcClaimed: 0 });
    }
    const row = byPeriod.get(d.period)!;
    row.total++;
    if (d.status === 'MATCHED' || d.status === 'MATCHED_WITH_VARIANCE') row.matched++;
    if (d.status === 'NEEDS_REVIEW') row.needsReview++;
    if (d.status === 'MISSING_IN_GSTR2B') { row.missingInGstr2b++; row.itcAtRisk += Math.abs(d.booksItc); }
    if (d.status === 'MISSING_IN_BOOKS') row.missingInBooks++;
    if (['TAX_MISMATCH', 'GSTIN_MISMATCH', 'INVOICE_NUMBER_MISMATCH', 'DUPLICATE_INVOICE'].includes(d.status)) row.mismatches++;
    if (d.reviewStatus === 'OPEN' && d.status !== 'MATCHED') row.open++;
    row.itcClaimed += d.matchedItc;
  }

  const periods = [...byPeriod.values()].sort((a, b) => b.period.localeCompare(a.period));
  return NextResponse.json(periods);
}
