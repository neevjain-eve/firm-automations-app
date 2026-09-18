export class GraphClientError extends Error {}
export class GraphConflictError extends GraphClientError {}
export class GraphNotFoundError extends GraphClientError {}
export class GraphNotConfiguredError extends GraphClientError {}

type File = { content: unknown; etag: string };
const files = new Map<string, File>();
let nextEtag = 1;
let forcedConflictsRemaining = 0;
let writeCallCount = 0;

export function __reset() {
  files.clear();
  nextEtag = 1;
  forcedConflictsRemaining = 0;
  writeCallCount = 0;
}
export function __seed(path: string, content: unknown) {
  files.set(path, { content, etag: `etag-${nextEtag++}` });
}
export function __forceConflicts(n: number) {
  forcedConflictsRemaining = n;
}
export function __writeCallCount() {
  return writeCallCount;
}

export async function readJsonFile<T>(path: string): Promise<File | null> {
  const f = files.get(path);
  return f ? { content: f.content as T, etag: f.etag } : null;
}

export async function writeJsonFile(path: string, content: unknown, expectedEtag: string | null) {
  writeCallCount++;
  if (forcedConflictsRemaining > 0) {
    forcedConflictsRemaining--;
    throw new GraphConflictError(`"${path}" changed since it was last read.`);
  }
  const existing = files.get(path);
  if (expectedEtag !== null) {
    if (!existing || existing.etag !== expectedEtag) {
      throw new GraphConflictError(`"${path}" changed since it was last read.`);
    }
  } else if (existing) {
    // Mirrors the real graph-client.ts's race-check: expectedEtag === null
    // means "I believe this file doesn't exist yet" -- if it does now,
    // someone else created it first.
    throw new GraphConflictError(`"${path}" was created by someone else just now.`);
  }
  const etag = `etag-${nextEtag++}`;
  files.set(path, { content, etag });
  return { etag };
}
