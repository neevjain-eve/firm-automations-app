// TEMPORARY diagnostic endpoint -- read-only, secret-gated. To be deleted
// immediately after use. Checks the current state of the legacy Status
// Tracker's SharePoint-backed data after a suspected data-loss bug.
import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

const SECRET = 'tmp-diag-8f2a91c7-check-2026-09-28';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });

  const config = await readLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'config', null as any);
  const tasks = await readLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', null as any);

  return NextResponse.json({
    configUsersCount: Array.isArray(config?.users) ? config.users.length : null,
    naveenConfigEntry: Array.isArray(config?.users) ? config.users.find((u: any) => u.email === 'naveen@pdka.in') : null,
    tasksCount: Array.isArray(tasks?.tasks) ? tasks.tasks.length : null,
    clientsCount: Array.isArray(tasks?.clients) ? tasks.clients.length : null,
    clients: tasks?.clients ?? null,
    tasksUsersCount: Array.isArray(tasks?.users) ? tasks.users.length : null
  });
}
