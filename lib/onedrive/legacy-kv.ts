// Key-value helper for the 3 legacy trackers' backing stores (see
// LEGACY_STORE_FILES in lib/onedrive/schema.ts). Each store is ONE OneDrive
// JSON file holding a single-element array whose one element is a plain
// object mapping key -> value -- e.g. legacy-status-store.json ->
// [{ "config": {...}, "tasks": {...} }]. That shape matches exactly what
// scripts/migrate-to-onedrive.ts writes (Object.fromEntries of the old
// Prisma rows), and reuses store.ts's mutateCollection (read -> ETag ->
// retry-on-conflict) so concurrent writes to different keys in the same
// file don't clobber each other. `readCollection`/`mutateCollection` are
// typed for row objects with an `id` field (most OneDrive collections are
// row arrays); this file's actual shape is a single loose object instead,
// so calls here go through `any` the same way the migration script does.
import { readCollection, mutateCollection } from './store';

export async function readLegacyKey<T>(file: string, key: string, fallback: T): Promise<T> {
  const rows = await readCollection<any>(file);
  const blob = rows[0];
  if (!blob || !(key in blob)) return fallback;
  return blob[key] as T;
}

export async function writeLegacyKey(file: string, key: string, value: unknown): Promise<void> {
  await mutateCollection<any>(file, (rows) => {
    const current = rows[0] ?? {};
    return [{ ...current, [key]: value }];
  });
}
