import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readCollection, insertRow } from '@/lib/onedrive/store';
import type { CommentRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { getUserLiteMap, userRef } from '@/lib/onedrive/users';
import { newId } from '@/lib/onedrive/id';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get('entityType');
  const entityId = searchParams.get('entityId');
  if (!entityType || !entityId) {
    return NextResponse.json({ error: 'entityType and entityId are required' }, { status: 400 });
  }

  const [rows, users] = await Promise.all([
    readCollection<CommentRow>(COLLECTIONS.comments),
    getUserLiteMap()
  ]);
  const comments = rows
    .filter((c) => c.entityType === entityType && c.entityId === entityId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((c) => ({ ...c, user: userRef(users, c.userId) }));
  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { entityType, entityId, body: text } = body;
  if (!entityType || !entityId || !text?.trim()) {
    return NextResponse.json({ error: 'entityType, entityId, and body are required' }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const comment: CommentRow = {
    id: newId(),
    entityType,
    entityId,
    body: text,
    createdAt: new Date().toISOString(),
    userId
  };
  await insertRow(COLLECTIONS.comments, comment);

  const users = await getUserLiteMap();
  return NextResponse.json({ ...comment, user: userRef(users, userId) }, { status: 201 });
}
