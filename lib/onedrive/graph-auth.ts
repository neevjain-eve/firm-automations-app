// App-only (client-credentials) Microsoft Graph auth -- separate from
// next-auth's AzureADProvider, which signs *users* in with an authorization
// code flow. This one gets a token for the app itself, no signed-in user
// involved, so the OneDrive backend can be read/written from server code,
// cron-style scripts, and background jobs alike.
//
// Reuses the SAME app registration (and secret) as "Sign in with Microsoft" --
// see lib/settings.ts's getAzureAdConfig(). That app just needs the
// `Files.ReadWrite.All` **Application** permission added under API
// permissions, with tenant admin consent granted. Nothing else changes;
// delegated permissions used for sign-in are untouched.

import { getAzureAdConfig } from '@/lib/settings';

type CachedToken = {
  accessToken: string;
  expiresAt: number; // epoch ms
};

// Process-lifetime cache. Fine for a serverless function instance -- worst
// case we fetch one extra token when a new instance spins up.
let cached: CachedToken | null = null;

export class GraphAuthError extends Error {}

// Returns a valid app-only access token for https://graph.microsoft.com,
// fetching + caching a new one if the cached one is missing or about to
// expire. Throws GraphAuthError with a message safe to show an admin (never
// includes the secret) if the Azure AD app isn't configured or Microsoft
// rejects the credentials.
export async function getGraphAppToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt - now > 60_000) {
    return cached.accessToken;
  }

  const { clientId, clientSecret, tenantId } = await getAzureAdConfig();
  if (!clientId || !clientSecret || !tenantId) {
    throw new GraphAuthError(
      'Azure AD app is not configured (client ID / secret / tenant ID). Set these in Settings -> Connections first.'
    );
  }

  const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
      scope: 'https://graph.microsoft.com/.default'
    })
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new GraphAuthError(
      body.error_description?.split('\n')[0] ??
        'Microsoft rejected the app credentials while requesting a Graph token.'
    );
  }
  if (!body.access_token || typeof body.expires_in !== 'number') {
    throw new GraphAuthError('Microsoft returned an unexpected token response.');
  }

  cached = {
    accessToken: body.access_token,
    expiresAt: now + body.expires_in * 1000
  };
  return cached.accessToken;
}

// Test-only escape hatch; keeps the module's internal cache from leaking
// between unit tests.
export function __resetGraphTokenCacheForTests() {
  cached = null;
}
