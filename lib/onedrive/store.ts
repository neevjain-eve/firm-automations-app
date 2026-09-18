// Collection-level API for the OneDrive backend. Each "collection" (roughly
// one per Prisma model -- see lib/onedrive/schema.ts) is one JSON file
// holding a flat array of records, e.g.:
//
//   /PDKA Data/status-tasks.json  ->  [{ id: "...", title: "...", ... }, ...]
//
// There's no database underneath, so there's no row-level locking either.
// The concurrency model is optimistic, at the *file* level: read the whole
// array + its ETag, apply the change in memory, write back with
// If-Match: <etag>. If someone else wrote the same file in between, the
// write comes back 412 and we retry (re-read, re-apply, re-write) -- see
// `mutateCollection` below. This is safe for a firm-sized team (tens of
// concurrent users, hundreds to low-thousands of rows per collection); it is
// NOT a substitute for a real database at higher write concurrency.

import { readJsonFile, writeJsonFile, GraphConflictError, GraphNotConfiguredError } from './graph-client';

export type Record_ = { id: string; [key: string]: unknown };

const MAX_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 150;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileNameFor(collection: string): string {
  return `${collection}.json`;
}

// Reads an entire collection. Returns an empty array if the file doesn't
// exist yet (a brand-new collection), so callers don't need a special case
// for "first write ever".
export async function readCollection<T extends Record_>(collection: string): Promise<T[]> {
  const file = await readJsonFile<T[]>(fileNameFor(collection));
  if (!file) return [];
  return Array.isArray(file.content) ? file.content : [];
}

// Read-modify-write with automatic retry on a concurrent-write conflict.
// `mutate` receives the current array and returns the new array (pure
// function -- it may be called more than once if there's contention, so it
// must not have side effects beyond computing the new array).
//
// Example: append a row ->
//   await mutateCollection<StatusTaskRow>('status-tasks', (rows) => [...rows, newRow]);
//
// Example: update one row by id ->
//   await mutateCollection<StatusTaskRow>('status-tasks', (rows) =>
//     rows.map((r) => (r.id === id ? { ...r, ...patch } : r))
//   );
export async function mutateCollection<T extends Record_>(
  collection: string,
  mutate: (current: T[]) => T[]
): Promise<T[]> {
  const path = fileNameFor(collection);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const existing = await readJsonFile<T[]>(path);
    const current = existing && Array.isArray(existing.content) ? existing.content : [];
    const etag = existing?.etag ?? null;

    const next = mutate(current);

    try {
      await writeJsonFile(path, next, etag);
      return next;
    } catch (err) {
      if (err instanceof GraphConflictError && attempt < MAX_RETRIES - 1) {
        await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt + Math.random() * 50);
        continue;
      }
      throw err;
    }
  }
  // Unreachable given the loop above always returns or throws, but keeps
  // TypeScript happy about the function's return type.
  throw new Error(`Could not write "${collection}" after ${MAX_RETRIES} attempts.`);
}

// Convenience wrapper for the common "insert one row" case.
export async function insertRow<T extends Record_>(collection: string, row: T): Promise<T> {
  await mutateCollection<T>(collection, (rows) => [...rows, row]);
  return row;
}

// Convenience wrapper for "update one row by id" -- throws if no row with
// that id exists, matching Prisma's `.update()` behavior.
export async function updateRow<T extends Record_>(
  collection: string,
  id: string,
  patch: Partial<T>
): Promise<T> {
  let updated: T | null = null;
  await mutateCollection<T>(collection, (rows) => {
    let found = false;
    const next = rows.map((r) => {
      if (r.id !== id) return r;
      found = true;
      updated = { ...r, ...patch } as T;
      return updated;
    });
    if (!found) throw new Error(`No row with id "${id}" in collection "${collection}".`);
    return next;
  });
  return updated as unknown as T;
}

// Convenience wrapper for "delete one row by id". No-op (does not throw) if
// the row is already gone, matching how most of the app's existing delete
// routes behave with Prisma's deleteMany.
export async function deleteRow(collection: string, id: string): Promise<void> {
  await mutateCollection(collection, (rows) => rows.filter((r) => r.id !== id));
}

export { GraphNotConfiguredError };
