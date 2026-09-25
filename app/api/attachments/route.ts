import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import { getBlobToken } from '@/lib/settings';
import { readCollection, insertRow } from '@/lib/onedrive/store';
import type { AttachmentRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { getUserLiteMap, userRef } from '@/lib/onedrive/users';
import { newId } from '@/lib/onedrive/id';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
  }

  const [rows, users] = await Promise.all([
    readCollection<AttachmentRow>(COLLECTIONS.attachments),
    getUserLiteMap()
  ]);
  const attachments = rows
    .filter((a) => a.entityType === entityType && a.entityId === entityId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((a) => ({ ...a, user: userRef(users, a.userId) }));
  return NextResponse.json(attachments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const blobToken = await getBlobToken();
  if (!blobToken) {
    return NextResponse.json(
      { error: 'File storage is not set up yet. Add a Blob read/write token in Settings → Connections.' },
      { status: 503 }
    );
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const entityType = formData.get('entityType') as string | null;
  const entityId = formData.get('entityId') as string | null;

  if (!file || !entityType || !entityId) {
    return NextResponse.json({ error: 'file, entityType, and entityId are required' }, { status: 400 });
  }
  if (file.size > 15 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 15MB)' }, { status: 413 });
  }

  const blob = await put(`${entityType}/${entityId}/${Date.now()}-${file.name}`, file, {
    access: 'public',
    token: blobToken
  });

  const userId = (session.user as any).id;
  const attachment: AttachmentRow = {
    id: newId(),
    entityType,
    entityId,
    fileName: file.name,
    fileUrl: blob.url,
    fileSize: file.size,
    createdAt: new Date().toISOString(),
    userId
  };
  await insertRow(COLLECTIONS.attachments, attachment);

  const users = await getUserLiteMap();
  return NextResponse.json({ ...attachment, user: userRef(users, userId) }, { status: 201 });
}
