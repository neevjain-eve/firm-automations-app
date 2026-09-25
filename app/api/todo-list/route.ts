import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readCollection, insertRow, mutateCollection } from '@/lib/onedrive/store';
import type { ToDoTaskRow, ToDoAssigneeRow, ToDoWorkLogRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { getUserLiteMap, userRef } from '@/lib/onedrive/users';
import { newId } from '@/lib/onedrive/id';

async function hydrate(tasks: ToDoTaskRow[]) {
  const [assignees, workLogs, users] = await Promise.all([
    readCollection<ToDoAssigneeRow>(COLLECTIONS.todoAssignees),
    readCollection<ToDoWorkLogRow>(COLLECTIONS.todoWorkLogs),
    getUserLiteMap()
  ]);

  return tasks.map((t) => ({
    ...t,
    createdBy: userRef(users, t.createdById),
    assignees: assignees
      .filter((a) => a.taskId === t.id)
      .map((a) => ({ id: a.id, user: users.get(a.userId) ?? { id: a.userId, name: 'Unknown', email: '' } })),
    workLogs: workLogs
      .filter((w) => w.taskId === t.id)
      .slice()
      .sort((a, b) => (a.logDate < b.logDate ? 1 : -1))
      .map((w) => ({ ...w, user: userRef(users, w.userId) }))
  }));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const rows = await readCollection<ToDoTaskRow>(COLLECTIONS.todoTasks);
  const sorted = rows.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json(await hydrate(sorted));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { title, description, priority, department, client, dueDate, assigneeIds } = await req.json();
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 });

  const now = new Date().toISOString();
  const task: ToDoTaskRow = {
    id: newId(),
    title,
    description: description || null,
    priority: priority || 'medium',
    status: 'not_started',
    department: department || null,
    client: client || null,
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    createdAt: now,
    updatedAt: now,
    createdById: (session.user as any).id
  };
  await insertRow(COLLECTIONS.todoTasks, task);

  const ids: string[] = Array.isArray(assigneeIds) ? assigneeIds : [];
  if (ids.length) {
    await mutateCollection<ToDoAssigneeRow>(COLLECTIONS.todoAssignees, (rows) => [
      ...rows,
      ...ids.map((userId) => ({ id: newId(), taskId: task.id, userId }))
    ]);
  }

  const [hydrated] = await hydrate([task]);
  return NextResponse.json(hydrated);
}
