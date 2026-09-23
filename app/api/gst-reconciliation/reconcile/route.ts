import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runReconciliation } from '@/lib/gst/run';

/** Body: { gstinId, period }. Re-runs the matching engine without a new import -- useful after
 *  changing which rows are active, or just to refresh after an unrelated fix. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { gstinId, period } = await req.json();
  if (!gstinId || !/^\d{6}$/.test(period ?? '')) {
    return NextResponse.json({ error: 'gstinId and period (MMYYYY) are required' }, { status: 400 });
  }
  const summary = await runReconciliation(gstinId, period);
  return NextResponse.json({ summary });
}
