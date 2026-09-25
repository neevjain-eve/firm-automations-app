// Drop-in replacement for the original app's storage module -- same
// readJSON(key, fallback) / writeJSON(key, value) signature the rest of the
// (otherwise-unmodified) original code expects -- persisted to the firm's
// SharePoint site via the OneDrive backend (lib/onedrive) instead of
// Vercel KV / local JSON files / Postgres.
const { readLegacyKey, writeLegacyKey } = require('../../../onedrive/legacy-kv');
const { LEGACY_STORE_FILES } = require('../../../onedrive/schema');

async function readJSON(key, fallbackValue) {
  return readLegacyKey(LEGACY_STORE_FILES.legacyTodoStore, key, fallbackValue);
}

async function writeJSON(key, value) {
  await writeLegacyKey(LEGACY_STORE_FILES.legacyTodoStore, key, value);
}

module.exports = { readJSON, writeJSON };
