// TEMPORARY one-time endpoint -- secret-gated, under /api/admin. Backfills
// the new status/auditClosure fields onto the 13 existing clients from the
// Master Sheet data. To be deleted right after use.
import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

const SECRET = 'tmp-backfill-c72e19a0-2026-09-28';

const BACKFILL: Record<string, { status: string; auditClosure: string }> = {
  'CLI-101': { status: 'Operating', auditClosure: 'Audit In Progress-Holded' },
  'CLI-102': { status: 'Operating', auditClosure: 'Done' },
  'CLI-103': { status: 'Operating', auditClosure: 'Done' },
  'CLI-104': { status: 'GST (PDKA)', auditClosure: 'Done' },
  'CLI-105': { status: 'Non Operating', auditClosure: 'Audit In Progress' },
  'CLI-106': { status: 'Non Operating', auditClosure: 'Audit In Progress' },
  'CLI-107': { status: 'Operating', auditClosure: 'Audit In Progress' },
  'CLI-108': { status: 'Non Operating', auditClosure: 'Audit In Progress' },
  'CLI-109': { status: 'Operating', auditClosure: 'Done' },
  'CLI-110': { status: 'Operating', auditClosure: 'Not Yet started' },
  'CLI-111': { status: 'Operating', auditClosure: 'ITR Filed' },
  'CLI-112': { status: 'Operating', auditClosure: 'Not Applicable' },
  'CLI-113': { status: 'Operating', auditClosure: 'Audit In Progress' }
};

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });

  const tasks = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  const updatedClients = (tasks.clients || []).map((c: any) =>
    BACKFILL[c.id] ? { ...c, status: BACKFILL[c.id].status, auditClosure: BACKFILL[c.id].auditClosure } : c
  );
  const updated = { ...tasks, clients: updatedClients };
  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', updated);

  return NextResponse.json({ updated: updatedClients.filter((c: any) => BACKFILL[c.id]).length, clients: updatedClients });
}
