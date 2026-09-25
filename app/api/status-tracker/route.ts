import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readCollection, insertRow } from '@/lib/onedrive/store';
import type { StatusTaskRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { getUserLiteMap, userRef } from '@/lib/onedrive/users';
import { newId } from '@/lib/onedrive/id';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const [rows, users] = await Promise.all([
    readCollection<StatusTaskRow>(COLLECTIONS.statusTasks),
    getUserLiteMap()
  ]);
  const tasks = rows
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((t) => ({ ...t, createdBy: userRef(users, t.createdById) }));
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const {
    title,
    clientName,
    manager,
    teamMember,
    priority,
    notes,
    blockers,
    actionPoints,
    dueDate
  } = await req.json();
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const now = new Date().toISOString();
  const task: StatusTaskRow = {
    id: newId(),
    title,
    clientName: clientName || null,
    manager: manager || null,
    teamMember: teamMember || null,
    priority: priority || 'medium',
    status: 'not_started',
    notes: notes || null,
    blockers: blockers || null,
    actionPoints: actionPoints || null,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    createdAt: now,
    updatedAt: now,
    createdById: (session.user as any).id
  };
  await insertRow(COLLECTIONS.statusTasks, task);
  return NextResponse.json(task);
}
