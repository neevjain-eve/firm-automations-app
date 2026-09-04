import { prisma } from '@/lib/prisma';
import { decrypt, encrypt } from '@/lib/crypto';

export const AZURE_KEYS = {
  clientId: 'azure_ad_client_id',
  clientSecret: 'azure_ad_client_secret',
  tenantId: 'azure_ad_tenant_id'
} as const;

export const STORAGE_KEYS = {
  blobToken: 'blob_read_write_token'
} as const;

// Four env vars can never move in here, by definition:
//   DATABASE_URL / DIRECT_URL  - needed to reach this table in the first place
//   NEXTAUTH_SECRET            - middleware verifies JWTs on the edge runtime,
//                                which has no database access
//   SETTINGS_ENCRYPTION_KEY    - it's the key protecting these rows; storing it
//                                beside them would defeat the encryption
// Everything else an admin might need to rotate lives here.

export type AzureAdConfig = {
  clientId: string | null;
  clientSecret: string | null;
  tenantId: string | null;
  // Where each value came from, so the UI can show "set in Vercel" vs
  // "set here" and admins aren't confused about which one is live.
  source: 'database' | 'env' | 'none';
};

async function readSetting(key: string, isSecret: boolean): Promise<string | null> {
  const row = await prisma.appSetting.findUnique({ where: { key } });
  if (!row) return null;
  if (!isSecret) return row.value;
  try {
    return decrypt(row.value);
  } catch {
    // Bad/rotated encryption key -- treat as unset rather than crashing sign-in.
    return null;
  }
}

export async function writeSetting(key: string, value: string, isSecret: boolean) {
  const stored = isSecret ? encrypt(value) : value;
  await prisma.appSetting.upsert({
    where: { key },
    update: { value: stored, isSecret },
    create: { key, value: stored, isSecret }
  });
}

export async function deleteSetting(key: string) {
  await prisma.appSetting.deleteMany({ where: { key } });
}

// Vercel Blob token used for file attachments. Same precedence rule as
// everything else: what an admin saved wins, env var is the fallback.
export async function getBlobToken(): Promise<string | null> {
  try {
    const saved = await readSetting(STORAGE_KEYS.blobToken, true);
    if (saved) return saved;
  } catch {
    // fall through to env
  }
  return process.env.BLOB_READ_WRITE_TOKEN ?? null;
}

// Values saved in Settings -> Connections win; otherwise fall back to the
// env vars, so nothing breaks for a deployment that was already working
// before this page existed.
export async function getAzureAdConfig(): Promise<AzureAdConfig> {
  let clientId: string | null = null;
  let clientSecret: string | null = null;
  let tenantId: string | null = null;

  try {
    [clientId, clientSecret, tenantId] = await Promise.all([
      readSetting(AZURE_KEYS.clientId, false),
      readSetting(AZURE_KEYS.clientSecret, true),
      readSetting(AZURE_KEYS.tenantId, false)
    ]);
  } catch {
    // Database unreachable (or the table doesn't exist yet) -- fall through
    // to env vars so sign-in still works.
  }

  if (clientId && clientSecret && tenantId) {
    return { clientId, clientSecret, tenantId, source: 'database' };
  }

  const envClientId = process.env.AZURE_AD_CLIENT_ID ?? null;
  const envClientSecret = process.env.AZURE_AD_CLIENT_SECRET ?? null;
  const envTenantId = process.env.AZURE_AD_TENANT_ID ?? null;

  if (envClientId && envClientSecret && envTenantId) {
    return {
      clientId: envClientId,
      clientSecret: envClientSecret,
      tenantId: envTenantId,
      source: 'env'
    };
  }

  return { clientId: null, clientSecret: null, tenantId: null, source: 'none' };
}
