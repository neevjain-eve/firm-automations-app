import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateRow, deleteRow } from '@/lib/onedrive/store';
import type { StatusTaskRow } from '@/lib/onedrive/schema';
import { COLLECTIONS } from '@/lib/onedrive/schema';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const patch: Partial<StatusTaskRow> = { updatedAt: new Date().toISOString() };
  if (body.status) patch.status = body.status;
  if (body.title) patch.title = body.title;
  if (body.clientName !== undefined) patch.clientName = body.clientName || null;
  if (body.manager !== undefined) patch.manager = body.manager || null;
  if (body.teamMember !== undefined) patch.teamMember = body.teamMember || null;
  if (body.priority) patch.priority = body.priority;
  if (body.notes !== undefined) patch.notes = body.notes || null;
  if (body.blockers !== undefined) patch.blockers = body.blockers || null;
  if (body.actionPoints !== undefined) patch.actionPoints = body.actionPoints || null;
  if (body.dueDate !== undefined) patch.dueDate = body.dueDate ? new Date(body.dueDate).toISOString() : null;

  const task = await updateRow<StatusTaskRow>(COLLECTIONS.statusTasks, params.id, patch);
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await deleteRow(COLLECTIONS.statusTasks, params.id);
  return NextResponse.json({ ok: true });
}
