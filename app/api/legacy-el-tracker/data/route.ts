// Serves the literally-copied EL Tracker frontend's core data blob
// ({agreements, bills, clientTasks, lastUpdated, updatedBy}). Replaces the
// original app's OneDrive/Graph sync (which relied on a client-side GitHub
// write token that leaked publicly) with a read/write against the firm's
// own SharePoint site via lib/onedrive, session-gated by this app's own
// login. The frontend's own IndexedDB-based merge/conflict logic is
// untouched -- this route is just the new transport.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const value = await readLegacyKey(LEGACY_STORE_FILES.legacyElTrackerStore, 'data', {
    agreements: [],
    bills: [],
    clientTasks: []
  });
  return NextResponse.json(value);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await writeLegacyKey(LEGACY_STORE_FILES.legacyElTrackerStore, 'data', body);
  return NextResponse.json({ ok: true });
}
