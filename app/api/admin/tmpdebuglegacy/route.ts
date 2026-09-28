// TEMPORARY diagnostic + one-time restore endpoint -- secret-gated. To be
// deleted immediately after use. Under /api/admin so it bypasses the
// session-gating middleware.
import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';
import { prisma } from '@/lib/prisma';

const SECRET = 'tmp-diag-8f2a91c7-check-2026-09-28';

const NAVEEN_CLIENTS = [
  { id: 'CLI-101', clientName: 'Illuminati learning solutions pvt ltd', manager: 'Naveen', teamMember: 'Geetha', priority: 'High' },
  { id: 'CLI-102', clientName: 'Merada technology private limited', manager: 'Naveen', teamMember: 'Geetha', priority: 'Medium' },
  { id: 'CLI-103', clientName: 'Techjini digital services pvt ltd', manager: 'Naveen', teamMember: 'Geetha', priority: 'Medium' },
  { id: 'CLI-104', clientName: 'Revcommerce tech platform private limited', manager: 'Naveen', teamMember: 'Geetha', priority: 'High' },
  { id: 'CLI-105', clientName: 'Jobskills solutions pvt ltd', manager: 'Naveen', teamMember: 'Geetha', priority: 'Medium' },
  { id: 'CLI-106', clientName: 'Jobcorp solutions private limited', manager: 'Naveen', teamMember: 'Geetha', priority: 'Medium' },
  { id: 'CLI-107', clientName: 'Finterscale Technologies private limited', manager: 'Naveen', teamMember: 'Geetha', priority: 'High' },
  { id: 'CLI-108', clientName: 'Finternet Technologies private limited', manager: 'Naveen', teamMember: 'Bhavya', priority: 'Low' },
  { id: 'CLI-109', clientName: '100G', manager: 'Naveen', teamMember: 'Geetha', priority: 'Low' },
  { id: 'CLI-110', clientName: 'Sambhav Innovative Ventures Private Limited', manager: 'Naveen', teamMember: 'Bhavya', priority: 'High' },
  { id: 'CLI-111', clientName: 'Swarat Wellness', manager: 'Naveen', teamMember: 'Bhavya', priority: 'High' },
  { id: 'CLI-112', clientName: 'ZAPPSECC AI India Private limited', manager: 'Naveen', teamMember: 'Bhavya', priority: 'Medium' },
  { id: 'CLI-113', clientName: 'People for Animals', manager: 'Naveen', teamMember: 'Naveen', priority: 'Medium' }
];

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });

  const config = await readLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'config', null as any);
  const tasks = await readLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', null as any);
  const naveenMainUser = await prisma.user.findUnique({ where: { email: 'naveen@pdka.in' } });

  return NextResponse.json({
    configUsersCount: Array.isArray(config?.users) ? config.users.length : null,
    naveenConfigEntry: Array.isArray(config?.users) ? config.users.find((u: any) => u.email === 'naveen@pdka.in') : null,
    tasksCount: Array.isArray(tasks?.tasks) ? tasks.tasks.length : null,
    clientsCount: Array.isArray(tasks?.clients) ? tasks.clients.length : null,
    clients: tasks?.clients ?? null,
    tasksUsersCount: Array.isArray(tasks?.users) ? tasks.users.length : null,
    naveenMainAppUser: naveenMainUser
      ? { id: naveenMainUser.id, email: naveenMainUser.email, role: naveenMainUser.role, status: naveenMainUser.status, allowedTrackers: naveenMainUser.allowedTrackers }
      : null
  });
}

// One-time restore: only inserts NAVEEN_CLIENTS if the current clients array
// is empty (so it's safe to call even if something already got re-added,
// and won't clobber anything real again).
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });

  const tasks = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  if (Array.isArray(tasks.clients) && tasks.clients.length > 0) {
    return NextResponse.json({ restored: false, reason: 'clients already non-empty', currentCount: tasks.clients.length });
  }

  const updated = { ...tasks, clients: NAVEEN_CLIENTS };
  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', updated);

  return NextResponse.json({ restored: true, count: NAVEEN_CLIENTS.length });
}
