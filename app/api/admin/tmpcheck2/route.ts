import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

const SECRET = 'tmp-check2-9f14ab22-2026-09-28';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });

  const config = await readLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'config', null as any);
  const tasks = await readLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', null as any);

  return NextResponse.json({
    configUsersCount: Array.isArray(config?.users) ? config.users.length : null,
    tasksCount: Array.isArray(tasks?.tasks) ? tasks.tasks.length : null,
    clientsCount: Array.isArray(tasks?.clients) ? tasks.clients.length : null,
    clients: tasks?.clients ?? null,
    tasks: tasks?.tasks ?? null
  });
}
