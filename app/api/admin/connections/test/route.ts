import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAzureAdConfig } from '@/lib/settings';

// Smoke-test the saved Azure AD credentials by asking Microsoft for a token
// with them. This catches a wrong secret/tenant/client id *before* someone
// discovers it by being unable to sign in.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { clientId, clientSecret, tenantId } = await getAzureAdConfig();
  if (!clientId || !clientSecret || !tenantId) {
    return NextResponse.json(
      { ok: false, error: 'Client ID, tenant ID, and client secret must all be set first.' },
      { status: 400 }
    );
  }

  try {
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
      return NextResponse.json({
        ok: false,
        error: body.error_description?.split('\n')[0] ?? 'Microsoft rejected these credentials.'
      });
    }
    return NextResponse.json({ ok: true, message: 'Microsoft accepted these credentials.' });
  } catch {
    return NextResponse.json({ ok: false, error: 'Could not reach Microsoft to verify.' });
  }
}
