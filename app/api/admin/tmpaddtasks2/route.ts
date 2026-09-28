import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

const SECRET = 'tmp-addtasks2-e91c4a7f-2026-09-28';

const NEW_TASKS = [
  { id: 'TSK-1003', name: 'No open task logged', manager: 'Naveen', department: 'Merada technology private limited', teamMember: 'Geetha', priority: 'Medium', status: 'In Progress', dueDate: '', progress: 0, description: 'Engagement period: NA. EL available: NA. No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1004', name: 'No open task logged', manager: 'Naveen', department: 'Techjini digital services pvt ltd', teamMember: 'Geetha', priority: 'Medium', status: 'In Progress', dueDate: '', progress: 0, description: 'Engagement period: NA. EL available: NA. No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1005', name: 'No open task logged', manager: 'Naveen', department: 'Revcommerce tech platform private limited', teamMember: 'Geetha', priority: 'High', status: 'In Progress', dueDate: '', progress: 0, description: 'Engagement period: NA. EL available: NA. No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1006', name: 'No open task logged', manager: 'Naveen', department: 'Jobskills solutions pvt ltd', teamMember: 'Geetha', priority: 'Medium', status: 'In Progress', dueDate: '', progress: 0, description: 'Engagement period: NA. EL available: NA. No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1007', name: 'No open task logged', manager: 'Naveen', department: 'Jobcorp solutions private limited', teamMember: 'Geetha', priority: 'Medium', status: 'In Progress', dueDate: '', progress: 0, description: 'Engagement period: NA. EL available: NA. No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1008', name: 'No open task logged', manager: 'Naveen', department: 'Finterscale Technologies private limited', teamMember: 'Geetha', priority: 'High', status: 'In Progress', dueDate: '', progress: 0, description: 'Engagement period: Aug 2025 to March 2027. EL available: Yes. No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1009', name: 'No open task logged', manager: 'Naveen', department: 'Finternet Technologies private limited', teamMember: 'Bhavya', priority: 'Low', status: 'In Progress', dueDate: '', progress: 0, description: 'No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1010', name: 'No open task logged', manager: 'Naveen', department: '100G', teamMember: 'Geetha', priority: 'Low', status: 'In Progress', dueDate: '', progress: 0, description: 'No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1011', name: 'No open task logged', manager: 'Naveen', department: 'Sambhav Innovative Ventures Private Limited', teamMember: 'Bhavya', priority: 'High', status: 'In Progress', dueDate: '', progress: 0, description: 'No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1012', name: 'No open task logged', manager: 'Naveen', department: 'Swarat Wellness', teamMember: 'Bhavya', priority: 'High', status: 'In Progress', dueDate: '', progress: 0, description: 'Engagement period: Confirmed on e-mail. EL available: No. No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1013', name: 'No open task logged', manager: 'Naveen', department: 'People for Animals', teamMember: 'Naveen', priority: 'Medium', status: 'In Progress', dueDate: '', progress: 0, description: 'No task currently logged for this client in the tracker.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() }
];

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });

  const current = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  const existingIds = new Set((current.tasks || []).map((t: any) => t.id));
  const toAdd = NEW_TASKS.filter(t => !existingIds.has(t.id));
  const updated = { ...current, tasks: [...(current.tasks || []), ...toAdd] };
  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', updated);

  return NextResponse.json({ added: toAdd.length, totalTasks: updated.tasks.length });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });
  const current = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  return NextResponse.json({ tasksCount: (current.tasks||[]).length, tasks: current.tasks });
}
