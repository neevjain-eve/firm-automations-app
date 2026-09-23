import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const REVIEW_STATUSES = ['OPEN', 'ACCEPTED', 'FLAGGED', 'IGNORED'];

/** PATCH { reviewStatus?, reviewNote? } -- the staff review, kept separate from the engine's own
 *  classification (status/matchMethod/confidence), which only lib/gst/run.ts writes. */
export async function PATCH(req: NextRequest, { params }: { params: { decisionId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const data: Record<string, unknown> = {};
  if (body.reviewStatus !== undefined) {
    if (!REVIEW_STATUSES.includes(body.reviewStatus)) {
      return NextResponse.json({ error: `reviewStatus must be one of ${REVIEW_STATUSES.join(', ')}` }, { status: 400 });
    }
    data.reviewStatus = body.reviewStatus;
    data.reviewedById = (session.user as any).id;
    data.reviewedAt = new Date();
  }
  if (body.reviewNote !== undefined) data.reviewNote = body.reviewNote || null;

  const row = await prisma.gstDecision.update({ where: { id: params.decisionId }, data });
  return NextResponse.json(row);
}
