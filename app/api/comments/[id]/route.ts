import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readCollection, deleteRow } from '@/lib/onedrive/store';
import type { CommentRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rows = await readCollection<CommentRow>(COLLECTIONS.comments);
  const comment = rows.find((c) => c.id === params.id);
  if (!comment) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const me = session.user as any;
  if (comment.userId !== me.id && me.role !== 'admin' && me.role !== 'partner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  await deleteRow(COLLECTIONS.comments, params.id);
  return NextResponse.json({ ok: true });
}
