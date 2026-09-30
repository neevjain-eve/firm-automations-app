import { NextRequest, NextResponse } from 'next/server';
import { readLegacyKey, writeLegacyKey } from '@/lib/onedrive/legacy-kv';
import { LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

const SECRET = 'tmp-backfill2-4d8a2e19-2026-09-30';

const BACKFILL: Record<string, { engagementPeriod: string; elAvailable: string }> = {
  'CLI-101': { engagementPeriod: 'Email Confirmation', elAvailable: 'No' },
  'CLI-102': { engagementPeriod: 'NA', elAvailable: 'NA' },
  'CLI-103': { engagementPeriod: 'NA', elAvailable: 'NA' },
  'CLI-104': { engagementPeriod: 'NA', elAvailable: 'NA' },
  'CLI-105': { engagementPeriod: 'NA', elAvailable: 'NA' },
  'CLI-106': { engagementPeriod: 'NA', elAvailable: 'NA' },
  'CLI-107': { engagementPeriod: 'Aug 2025 to March 2027', elAvailable: 'Yes' },
  'CLI-108': { engagementPeriod: '', elAvailable: '' },
  'CLI-109': { engagementPeriod: '', elAvailable: '' },
  'CLI-110': { engagementPeriod: '', elAvailable: '' },
  'CLI-111': { engagementPeriod: 'Confirmed on e-mail', elAvailable: 'No' },
  'CLI-112': { engagementPeriod: 'Confirmed on e-mail', elAvailable: 'No' },
  'CLI-113': { engagementPeriod: '', elAvailable: '' }
};

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });

  const current = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  let updated = 0;
  const clients = (current.clients || []).map((c: any) => {
    const bf = BACKFILL[c.id];
    if (!bf) return c;
    updated++;
    return { ...c, engagementPeriod: bf.engagementPeriod, elAvailable: bf.elAvailable };
  });
  await writeLegacyKey(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { ...current, clients });
  return NextResponse.json({ updated });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== SECRET) return NextResponse.json({ error: 'nope' }, { status: 404 });
  const current = await readLegacyKey<any>(LEGACY_STORE_FILES.legacyStatusStore, 'tasks', { tasks: [], clients: [] });
  return NextResponse.json({ clients: current.clients });
}
