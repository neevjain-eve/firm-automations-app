import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { insertRow } from '@/lib/onedrive/store';
import type { ToDoWorkLogRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { getUserLiteMap, userRef } from '@/lib/onedrive/users';
import { newId } from '@/lib/onedrive/id';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { description } = await req.json();
  if (!description) return NextResponse.json({ error: 'description is required' }, { status: 400 });

  const userId = (session.user as any).id;
  const now = new Date().toISOString();
  const entry: ToDoWorkLogRow = {
    id: newId(),
    taskId: params.id,
    userId,
    description,
    logDate: now,
    createdAt: now
  };
  await insertRow(COLLECTIONS.todoWorkLogs, entry);

  const users = await getUserLiteMap();
  return NextResponse.json({ ...entry, user: userRef(users, userId) });
}
