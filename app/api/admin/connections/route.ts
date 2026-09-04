import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { encryptionKeyConfigured } from '@/lib/crypto';
import {
  AZURE_KEYS,
  STORAGE_KEYS,
  getAzureAdConfig,
  getBlobToken,
  writeSetting,
  deleteSetting
} from '@/lib/settings';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') return null;
  return session;
}

// Current Azure AD connection status. The client secret is never sent back --
// only whether one is set, so the page can show "configured" without leaking it.
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const config = await getAzureAdConfig();
  const blobToken = await getBlobToken();
  return NextResponse.json({
    clientId: config.clientId ?? '',
    tenantId: config.tenantId ?? '',
    clientSecretSet: !!config.clientSecret,
    source: config.source,
    blobTokenSet: !!blobToken,
    encryptionKeyConfigured: encryptionKeyConfigured()
  });
}

// Save credentials. Client ID / tenant ID are stored in plain text (they're
// identifiers, not secrets); the client secret is encrypted at rest.
export async function PUT(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { clientId, tenantId, clientSecret, blobToken } = await req.json();

  if ((clientSecret || blobToken) && !encryptionKeyConfigured()) {
    return NextResponse.json(
      {
        error:
          'SETTINGS_ENCRYPTION_KEY is not set in the environment, so the client secret can’t be stored securely. Add it in Vercel first.'
      },
      { status: 400 }
    );
  }

  try {
    if (typeof clientId === 'string') {
      clientId.trim()
        ? await writeSetting(AZURE_KEYS.clientId, clientId.trim(), false)
        : await deleteSetting(AZURE_KEYS.clientId);
    }
    if (typeof tenantId === 'string') {
      tenantId.trim()
        ? await writeSetting(AZURE_KEYS.tenantId, tenantId.trim(), false)
        : await deleteSetting(AZURE_KEYS.tenantId);
    }
    // An empty/absent secret means "leave the existing one alone".
    if (typeof clientSecret === 'string' && clientSecret.trim()) {
      await writeSetting(AZURE_KEYS.clientSecret, clientSecret.trim(), true);
    }
    if (typeof blobToken === 'string' && blobToken.trim()) {
      await writeSetting(STORAGE_KEYS.blobToken, blobToken.trim(), true);
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Could not save these settings.' },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
