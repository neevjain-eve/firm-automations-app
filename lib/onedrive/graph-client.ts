// Thin Microsoft Graph REST wrapper, scoped to exactly what the OneDrive
// backend needs: read/write JSON files inside one SharePoint document
// library, using ETags for optimistic concurrency. Deliberately NOT a
// general-purpose Graph SDK -- see lib/onedrive/store.ts for the
// collection-level API most app code should use instead of this directly.

import { getGraphAppToken } from './graph-auth';
import { getOneDriveConfig } from '@/lib/settings';

const GRAPH_ROOT = 'https://graph.microsoft.com/v1.0';

export class GraphClientError extends Error {
  status?: number;
  code?: string;
  constructor(message: string, opts?: { status?: number; code?: string }) {
    super(message);
    this.status = opts?.status;
    this.code = opts?.code;
  }
}

export class GraphNotConfiguredError extends GraphClientError {}
export class GraphConflictError extends GraphClientError {} // 412 Precondition Failed
export class GraphNotFoundError extends GraphClientError {} // 404

async function graphFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getGraphAppToken();
  const res = await fetch(`${GRAPH_ROOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers
    }
  });
  return res;
}

// Resolves the configured site + drive once per call (cheap; Graph caches
// well) rather than storing a raw drive id, so admins can change the
// SharePoint site from Settings without redeploying.
async function resolveDriveId(): Promise<string> {
  const { siteId, driveId } = await getOneDriveConfig();
  if (!siteId) {
    throw new GraphNotConfiguredError(
      'No SharePoint site configured for the OneDrive backend. Set it in Settings -> Connections.'
    );
  }
  if (driveId) return driveId;

  const res = await graphFetch(`/sites/${encodeURIComponent(siteId)}/drive`);
  if (!res.ok) {
    throw new GraphClientError(`Could not resolve the default drive for site "${siteId}".`, {
      status: res.status
    });
  }
  const body = await res.json();
  return body.id as string;
}

function itemPath(rootFolder: string, relativePath: string): string {
  const clean = `${rootFolder}/${relativePath}`.replace(/\/{2,}/g, '/').replace(/^\/+/, '');
  return clean;
}

export type DriveFile<T = unknown> = {
  content: T;
  etag: string;
};

// Reads a JSON file's content + current ETag. Returns null (not an error)
// if the file doesn't exist yet -- callers treat that as "empty collection".
export async function readJsonFile<T>(relativePath: string): Promise<DriveFile<T> | null> {
  const [driveId, { rootFolder }] = await Promise.all([resolveDriveId(), getOneDriveConfig()]);
  const path = itemPath(rootFolder, relativePath);

  const res = await graphFetch(`/drives/${driveId}/root:/${encodeURI(path)}`);
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new GraphClientError(`Could not read "${path}" from OneDrive.`, { status: res.status });
  }
  const meta = await res.json();
  const etag: string | undefined = meta.eTag ?? meta['@microsoft.graph.eTag'];

  const contentRes = await graphFetch(`/drives/${driveId}/items/${meta.id}/content`);
  if (!contentRes.ok) {
    throw new GraphClientError(`Could not download the content of "${path}" from OneDrive.`, {
      status: contentRes.status
    });
  }
  const text = await contentRes.text();
  let content: T;
  try {
    content = text.trim() ? JSON.parse(text) : (({} as unknown) as T);
  } catch {
    throw new GraphClientError(`"${path}" in OneDrive does not contain valid JSON.`);
  }
  return { content, etag: etag ?? '' };
}

// Writes a JSON file. If `expectedEtag` is given, the write is conditional
// (If-Match) and fails with GraphConflictError if the file changed since it
// was read -- callers should re-read, re-apply their change, and retry (see
// lib/onedrive/store.ts). Pass expectedEtag: null to create a new file (or
// overwrite unconditionally if one already exists at that path).
export async function writeJsonFile(
  relativePath: string,
  content: unknown,
  expectedEtag: string | null
): Promise<{ etag: string }> {
  const [driveId, { rootFolder }] = await Promise.all([resolveDriveId(), getOneDriveConfig()]);
  const path = itemPath(rootFolder, relativePath);
  const body = JSON.stringify(content, null, 2);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (expectedEtag) headers['If-Match'] = expectedEtag;
  else {
    // expectedEtag === null means the caller believes this file doesn't
    // exist yet (first write to a brand-new collection). Graph's content-PUT
    // endpoint has no atomic "create only if absent" precondition to enforce
    // that for us, so we narrow (not eliminate -- a true compare-and-swap
    // isn't available here) the race by re-checking right before writing:
    // if someone else created the file in the meantime, bail out as a
    // conflict so mutateCollection's retry loop re-reads their version and
    // merges instead of silently overwriting it.
    const raceCheck = await graphFetch(`/drives/${driveId}/root:/${encodeURI(path)}`);
    if (raceCheck.ok) {
      throw new GraphConflictError(
        `"${path}" was created in OneDrive by someone else just now.`,
        { status: 412 }
      );
    }
  }

  const res = await graphFetch(`/drives/${driveId}/root:/${encodeURI(path)}:/content`, {
    method: 'PUT',
    headers,
    body
  });

  if (res.status === 412) {
    throw new GraphConflictError(`"${path}" changed in OneDrive since it was last read.`, {
      status: 412
    });
  }
  if (!res.ok) {
    throw new GraphClientError(`Could not write "${path}" to OneDrive.`, { status: res.status });
  }
  const meta = await res.json();
  return { etag: meta.eTag ?? meta['@microsoft.graph.eTag'] ?? '' };
}

// Ensures the configured root folder exists (creates it, and any missing
// parent segments, if not). Safe to call repeatedly. Used by the
// "Test connection" admin action and by the migration script before its
// first write.
export async function ensureRootFolder(): Promise<void> {
  const [driveId, { rootFolder }] = await Promise.all([resolveDriveId(), getOneDriveConfig()]);
  const segments = rootFolder.split('/').filter(Boolean);

  let builtPath = '';
  for (const segment of segments) {
    const parentPath = builtPath;
    builtPath = builtPath ? `${builtPath}/${segment}` : segment;

    const checkRes = await graphFetch(`/drives/${driveId}/root:/${encodeURI(builtPath)}`);
    if (checkRes.ok) continue;
    if (checkRes.status !== 404) {
      throw new GraphClientError(`Could not check for folder "${builtPath}" in OneDrive.`, {
        status: checkRes.status
      });
    }

    const parentSegment = parentPath ? `root:/${encodeURI(parentPath)}:` : 'root';
    const createRes = await graphFetch(`/drives/${driveId}/${parentSegment}/children`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: segment,
        folder: {},
        '@microsoft.graph.conflictBehavior': 'replace'
      })
    });
    if (!createRes.ok) {
      throw new GraphClientError(`Could not create folder "${builtPath}" in OneDrive.`, {
        status: createRes.status
      });
    }
  }
}
