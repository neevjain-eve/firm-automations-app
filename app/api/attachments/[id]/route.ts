import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { del } from '@vercel/blob';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const attachment = await prisma.attachment.findUnique({ where: { id: params.id } });
  if (!attachment) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const me = session.user as any;
  if (attachment.userId !== me.id && me.role !== 'admin' && me.role !== 'partner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  try {
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      await del(attachment.fileUrl);
    }
  } catch {
    // if the blob is already gone, still clean up the DB row
  }

  await prisma.attachment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
