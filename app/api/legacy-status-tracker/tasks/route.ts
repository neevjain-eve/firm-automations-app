// Serves the literally-copied Status Tracker frontend's task/client data.
// Replaces the original app's Microsoft Graph + OneDrive sync (which relied
// on a client-side GitHub write token that leaked publicly) with a proper
// server-side read/write against the firm's own SharePoint site via
// lib/onedrive, session-gated by our own NextAuth login.
//
// Manager isolation: the tracker's frontend already hides other managers'
// rows in the UI, but until now this endpoint handed the *entire* shared
// dataset to any signed-in user's browser regardless of role -- the UI
// filter was cosmetic, not a real boundary (visible in the Network tab).
// GET now scopes the response server-side to the caller's own tasks/clients
// unless they're an admin. PUT is scoped to match: a non-admin's save only
// ever replaces their own slice of the shared dataset (merged back in
// alongside everyone else's untouched rows), never a full overwrite --
// otherwise, since their browser only ever holds their own rows after the
// GET scoping above, the very next save from a non-admin would wipe out
// every other manager's data.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

type TrackerUser = { email?: string; role?: string; manager?: string | null };
type TrackerData = { tasks?: any[]; clients?: any[]; users?: TrackerUser[] };

const EMPTY: TrackerData = { tasks: [], clients: [] };

// Resolves the caller's identity inside the tracker's own (separate) user
// system by matching their NextAuth email against its user list -- the same
// lookup the tracker's SSO login performs client-side. Checks the live
// `users` list synced inside the tasks blob first (the current source of
// truth once anyone has saved), falling back to the seed/config store for
// accounts that haven't been through a save cycle yet.
async function resolveAccess(email: string, current: TrackerData) {
  const norm = email.toLowerCase().trim();
  let trackerUser = (current.users || []).find(
    (u) => (u.email || '').toLowerCase().trim() === norm
  );
  if (!trackerUser) {
    const config = await readLegacyKey<{ users?: TrackerUser[] } | null>(
      LEGACY_STORE_FILES.legacyStatusStore,
      'config',
      null as any
    );
    trackerUser = (config?.users || []).find(
      (u) => (u.email || '').toLowerCase().trim() === norm
    );
  }
  return {
    isAdmin: trackerUser?.role === 'admin',
    managerName: trackerUser?.manager || null
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const value = await readLegacyKey<TrackerData>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', EMPTY);

  // Our own NextAuth admins always see everything, same as the tracker's
  // SSO login promotes them to its internal "admin" role.
  const outerRole = (session.user as any)?.role;
  if (outerRole === 'admin') {
    return NextResponse.json(value);
  }

  const email = session.user?.email || '';
  const { isAdmin, managerName } = await resolveAccess(email, value);
  if (isAdmin) {
    return NextResponse.json(value);
  }

  return NextResponse.json({
    ...value,
    tasks: (value.tasks || []).filter((t: any) => t.manager === managerName),
    clients: (value.clients || []).filter((c: any) => c.manager === managerName)
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const outerRole = (session.user as any)?.role;

  if (outerRole === 'admin') {
    await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', body);
    return NextResponse.json({ ok: true });
  }

  const current = await readLegacyKey<TrackerData>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', EMPTY);
  const email = session.user?.email || '';
  const { isAdmin, managerName } = await resolveAccess(email, current);

  if (isAdmin) {
    await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', body);
    return NextResponse.json({ ok: true });
  }

  if (!managerName) {
    // Unrecognized account in the tracker's own user system -- refuse to
    // merge blind, since we can't tell which rows would be "theirs".
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const incomingTasks = Array.isArray(body?.tasks) ? body.tasks : [];
  const incomingClients = Array.isArray(body?.clients) ? body.clients : [];

  const merged: TrackerData = {
    ...current,
    tasks: [
      ...(current.tasks || []).filter((t: any) => t.manager !== managerName),
      ...incomingTasks.filter((t: any) => t.manager === managerName)
    ],
    clients: [
      ...(current.clients || []).filter((c: any) => c.manager !== managerName),
      ...incomingClients.filter((c: any) => c.manager === managerName)
    ]
    // `users` deliberately left untouched -- user management is an
    // admin-only screen in the tracker UI, so a non-admin's body should
    // never be trusted to carry an authoritative user list.
  };

  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', merged);
  return NextResponse.json({ ok: true });
}
