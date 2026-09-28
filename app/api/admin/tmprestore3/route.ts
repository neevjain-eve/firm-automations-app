import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

const SECRET = 'tmp-restore3-b81f4d02-2026-09-28';

const CLIENTS = [
  { id: 'CLI-101', clientName: 'Illuminati learning solutions pvt ltd', manager: 'Naveen', teamMember: 'Geetha', priority: 'High', status: 'Operating', auditClosure: 'Audit In Progress-Holded' },
  { id: 'CLI-102', clientName: 'Merada technology private limited', manager: 'Naveen', teamMember: 'Geetha', priority: 'Medium', status: 'Operating', auditClosure: 'Done' },
  { id: 'CLI-103', clientName: 'Techjini digital services pvt ltd', manager: 'Naveen', teamMember: 'Geetha', priority: 'Medium', status: 'Operating', auditClosure: 'Done' },
  { id: 'CLI-104', clientName: 'Revcommerce tech platform private limited', manager: 'Naveen', teamMember: 'Geetha', priority: 'High', status: 'GST (PDKA)', auditClosure: 'Done' },
  { id: 'CLI-105', clientName: 'Jobskills solutions pvt ltd', manager: 'Naveen', teamMember: 'Geetha', priority: 'Medium', status: 'Non Operating', auditClosure: 'Audit In Progress' },
  { id: 'CLI-106', clientName: 'Jobcorp solutions private limited', manager: 'Naveen', teamMember: 'Geetha', priority: 'Medium', status: 'Non Operating', auditClosure: 'Audit In Progress' },
  { id: 'CLI-107', clientName: 'Finterscale Technologies private limited', manager: 'Naveen', teamMember: 'Geetha', priority: 'High', status: 'Operating', auditClosure: 'Audit In Progress' },
  { id: 'CLI-108', clientName: 'Finternet Technologies private limited', manager: 'Naveen', teamMember: 'Bhavya', priority: 'Low', status: 'Non Operating', auditClosure: 'Audit In Progress' },
  { id: 'CLI-109', clientName: '100G', manager: 'Naveen', teamMember: 'Geetha', priority: 'Low', status: 'Operating', auditClosure: 'Done' },
  { id: 'CLI-110', clientName: 'Sambhav Innovative Ventures Private Limited', manager: 'Naveen', teamMember: 'Bhavya', priority: 'High', status: 'Operating', auditClosure: 'Not Yet started' },
  { id: 'CLI-111', clientName: 'Swarat Wellness', manager: 'Naveen', teamMember: 'Bhavya', priority: 'High', status: 'Operating', auditClosure: 'ITR Filed' },
  { id: 'CLI-112', clientName: 'ZAPPSECC AI India Private limited', manager: 'Naveen', teamMember: 'Bhavya', priority: 'Medium', status: 'Operating', auditClosure: 'Not Applicable' },
  { id: 'CLI-113', clientName: 'People for Animals', manager: 'Naveen', teamMember: 'Naveen', priority: 'Medium', status: 'Operating', auditClosure: 'Audit In Progress' }
];

const TASKS = [
  { id: 'TSK-1001', name: 'ITR', manager: 'Naveen', department: 'Illuminati learning solutions pvt ltd', teamMember: 'Geetha', priority: 'High', status: 'In Progress', dueDate: '', progress: 0, description: 'The condonation application needs to be filed.', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() },
  { id: 'TSK-1002', name: 'MSA need to sent', manager: 'Naveen', department: 'ZAPPSECC AI India Private limited', teamMember: 'Bhavya', priority: 'Medium', status: 'In Progress', dueDate: '', progress: 0, description: 'MSA need to sent', blockers: '', nextAction: '', comments: [], lastUpdated: new Date().toISOString() }
];

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });

  const current = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  const updated = { ...current, clients: CLIENTS, tasks: TASKS };
  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', updated);

  return NextResponse.json({ clientsRestored: CLIENTS.length, tasksRestored: TASKS.length });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });
  const current = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  return NextResponse.json({ clientsCount: (current.clients||[]).length, tasksCount: (current.tasks||[]).length, clients: current.clients, tasks: current.tasks });
}
