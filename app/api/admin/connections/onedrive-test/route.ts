import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOneDriveConfig } from '@/lib/settings';
import { getGraphAppToken, GraphAuthError } from '@/lib/onedrive/graph-auth';
import { ensureRootFolder, GraphClientError, GraphNotConfiguredError } from '@/lib/onedrive/graph-client';

// Smoke-test the OneDrive backend config end-to-end: get an app-only Graph
// token (proves the Azure AD app + admin-consented Files.ReadWrite.All
// permission both work), then resolve the configured SharePoint site/drive
// and create the root folder if it's missing (proves the site id is right
// and the app can actually write there).
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const { siteId } = await getOneDriveConfig();
  if (!siteId) {
    return NextResponse.json({
      ok: false,
      error: 'No SharePoint site ID set yet. Add one above first.'
    });
  }

  try {
    await getGraphAppToken();
  } catch (err) {
    if (err instanceof GraphAuthError) {
      return NextResponse.json({ ok: false, error: err.message });
    }
    throw err;
  }

  try {
    await ensureRootFolder();
  } catch (err) {
    if (err instanceof GraphNotConfiguredError) {
      return NextResponse.json({ ok: false, error: err.message });
    }
    if (err instanceof GraphClientError) {
      const hint =
        err.status === 403
          ? ' (403 usually means the Files.ReadWrite.All Application permission hasn’t been admin-consented yet in Azure AD.)'
          : err.status === 404
            ? ' (404 usually means the site ID is wrong -- double check it against the SharePoint site’s Graph id.)'
            : '';
      return NextResponse.json({ ok: false, error: `${err.message}${hint}` });
    }
    throw err;
  }

  return NextResponse.json({
    ok: true,
    message: 'Connected. The root folder exists (or was just created) and is ready to use.'
  });
}
