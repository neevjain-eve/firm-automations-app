// TEMPORARY diagnostic endpoint -- read-only, secret-gated. To be deleted
// immediately after use. Placed under /api/admin so it bypasses the
// session-gating middleware (see middleware.ts matcher), since we need to
// check this without a browser session. Checks: (1) the current state of
// the legacy Status Tracker's SharePoint-backed data after a suspected
// data-loss bug, and (2) whether Naveen's main-app User row actually has
// the "status-tracker" tracker permission needed to reach the page that
// establishes SSO into the embedded tracker.
import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';
import { prisma } from '@/lib/prisma';

const SECRET = 'tmp-diag-8f2a91c7-check-2026-09-28';

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
