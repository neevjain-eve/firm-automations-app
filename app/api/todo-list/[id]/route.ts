import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readCollection, updateRow, deleteRow, mutateCollection } from '@/lib/onedrive/store';
import type { ToDoTaskRow, ToDoAssigneeRow, ToDoWorkLogRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';
import { getUserLiteMap, userRef } from '@/lib/onedrive/users';
import { newId } from '@/lib/onedrive/id';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const patch: Partial<ToDoTaskRow> = { updatedAt: new Date().toISOString() };
  if (body.title) patch.title = body.title;
  if (body.description !== undefined) patch.description = body.description || null;
  if (body.priority) patch.priority = body.priority;
  if (body.status) patch.status = body.status;
  if (body.department !== undefined) patch.department = body.department || null;
  if (body.client !== undefined) patch.client = body.client || null;
  if (body.dueDate !== undefined) patch.dueDate = body.dueDate ? new Date(body.dueDate).toISOString() : null;

  if (Array.isArray(body.assigneeIds)) {
    const ids: string[] = body.assigneeIds;
    await mutateCollection<ToDoAssigneeRow>(COLLECTIONS.todoAssignees, (rows) => [
      ...rows.filter((a) => a.taskId !== params.id),
      ...ids.map((userId) => ({ id: newId(), taskId: params.id, userId }))
    ]);
  }

  const task = await updateRow<ToDoTaskRow>(COLLECTIONS.todoTasks, params.id, patch);

  const [assignees, workLogs, users] = await Promise.all([
    readCollection<ToDoAssigneeRow>(COLLECTIONS.todoAssignees),
    readCollection<ToDoWorkLogRow>(COLLECTIONS.todoWorkLogs),
    getUserLiteMap()
  ]);
  return NextResponse.json({
    ...task,
    createdBy: userRef(users, task.createdById),
    assignees: assignees
      .filter((a) => a.taskId === task.id)
      .map((a) => ({ id: a.id, user: users.get(a.userId) ?? { id: a.userId, name: 'Unknown', email: '' } })),
    workLogs: workLogs
      .filter((w) => w.taskId === task.id)
      .slice()
      .sort((a, b) => (a.logDate < b.logDate ? 1 : -1))
      .map((w) => ({ ...w, user: userRef(users, w.userId) }))
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await deleteRow(COLLECTIONS.todoTasks, params.id);
  // Cascade: Prisma's schema declared onDelete: Cascade for assignees/worklogs
  // when their task is deleted -- the OneDrive store enforces no relations,
  // so that cleanup has to happen here instead.
  await mutateCollection<ToDoAssigneeRow>(COLLECTIONS.todoAssignees, (rows) =>
    rows.filter((a) => a.taskId !== params.id)
  );
  await mutateCollection<ToDoWorkLogRow>(COLLECTIONS.todoWorkLogs, (rows) =>
    rows.filter((w) => w.taskId !== params.id)
  );
  return NextResponse.json({ ok: true });
}
