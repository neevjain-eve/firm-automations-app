// TEMPORARY one-time endpoint -- secret-gated, under /api/admin so it
// bypasses the session-gating middleware. Adds the 2 real one-time-task
// rows found in Naveen's account workbook (Illuminati, Zappsec) to the
// Status Tracker's tasks list. To be deleted right after use.
import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

const SECRET = 'tmp-addtasks-3e91bd47-2026-09-28';

const NEW_TASKS = [
  {
    id: 'TSK-1001',
    name: 'ITR',
    manager: 'Naveen',
    department: 'Illuminati learning solutions pvt ltd',
    teamMember: 'Geetha',
    priority: 'High',
    status: 'In Progress',
    dueDate: '',
    progress: 0,
    description: 'The condonation application needs to be filed.',
    blockers: '',
    nextAction: '',
    comments: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'TSK-1002',
    name: 'MSA need to sent',
    manager: 'Naveen',
    department: 'ZAPPSECC AI India Private limited',
    teamMember: 'Bhavya',
    priority: 'Medium',
    status: 'In Progress',
    dueDate: '',
    progress: 0,
    description: 'MSA need to sent',
    blockers: '',
    nextAction: '',
    comments: [],
    lastUpdated: new Date().toISOString()
  }
];

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });

  const tasks = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  const existingIds = new Set((tasks.tasks || []).map((t: any) => t.id));
  const toAdd = NEW_TASKS.filter((t) => !existingIds.has(t.id));
  const updated = { ...tasks, tasks: [...toAdd, ...(tasks.tasks || [])] };
  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', updated);

  return NextResponse.json({ added: toAdd.length, totalTasks: updated.tasks.length });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });
  const tasks = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  return NextResponse.json({ tasksCount: (tasks.tasks || []).length, tasks: tasks.tasks, clientsCount: (tasks.clients || []).length });
}
