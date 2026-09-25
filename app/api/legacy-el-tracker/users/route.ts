// Serves the literally-copied EL Tracker frontend's own staff login list
// (separate from Firm Automations accounts, exactly as in the original app).
// Session-gated by this app's own NextAuth login. Backed by the OneDrive
// legacy-el-tracker-store file, key "users".
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const value = await readLegacyKey(LEGACY_STORE_FILES.legacyElTrackerStore, 'users', []);
  return NextResponse.json(value);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await writeLegacyKey(LEGACY_STORE_FILES.legacyElTrackerStore, 'users', body);
  return NextResponse.json({ ok: true });
}
