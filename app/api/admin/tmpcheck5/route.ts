import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

const SECRET = 'tmp-check5-6c2f80e1-2026-09-28';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });
  const value = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  const config = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'config', {});
  return NextResponse.json({
    clientsCount: (value.clients||[]).length,
    tasksCount: (value.tasks||[]).length,
    configUsersCount: (config.users||[]).length,
    naveenRole: (config.users||[]).find((u:any)=>u.email==='naveen@pdka.in'),
    clients: value.clients,
    tasks: value.tasks
  });
}
