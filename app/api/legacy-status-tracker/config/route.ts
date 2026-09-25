// Serves the literally-copied Status Tracker frontend's user list (name/role/
// manager, used for its own in-app login screen). Session-gated by our own
// NextAuth login -- you have to already be signed into Firm Automations to
// reach this at all, so this is a convenience layer, not the real security
// boundary. Backed by the OneDrive legacy-status-store file, key "config".
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

const DEFAULT_USERS = [
  { id: 'USR-1', email: 'bindu@pdka.in', password: 'changeme', role: 'manager', manager: 'Bindu', name: 'Bindu' },
  { id: 'USR-2', email: 'srikrishna@pdka.in', password: 'changeme', role: 'manager', manager: 'Srikrishna', name: 'Srikrishna' },
  { id: 'USR-3', email: 'naveen@pdka.in', password: 'changeme', role: 'admin', manager: null, name: 'Naveen' },
  { id: 'USR-4', email: 'rajesh@pdka.in', password: 'changeme', role: 'manager', manager: 'Rajesh', name: 'Rajesh' },
  { id: 'USR-5', email: 'manju@pdka.in', password: 'changeme', role: 'manager', manager: 'Manju', name: 'Manju' },
  { id: 'USR-6', email: 'ramya@pdka.in', password: 'changeme', role: 'manager', manager: 'Ramya', name: 'Ramya' }
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await readLegacyKey<{ users: unknown[] } | null>(
    LEGACY_STORE_FILES.legacyStatusStore,
    'config',
    null as any
  );
  if (existing) return NextResponse.json(existing);

  // First load: seed with fresh placeholder passwords (never the leaked
  // ones) so the app is usable immediately; tell staff to change them.
  const seeded = { users: DEFAULT_USERS };
  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'config', seeded);
  return NextResponse.json(seeded);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'config', body);
  return NextResponse.json({ ok: true });
}
