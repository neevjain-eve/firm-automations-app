// Serves the literally-copied Status Tracker frontend's task/client data.
// Replaces the original app's Microsoft Graph + OneDrive sync (which relied
// on a client-side GitHub write token that leaked publicly) with a proper
// server-side read/write against the firm's own SharePoint site via
// lib/onedrive, session-gated by our own NextAuth login.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const value = await readLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  return NextResponse.json(value);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', body);
  return NextResponse.json({ ok: true });
}
