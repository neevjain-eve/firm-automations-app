// Drop-in replacement for the original app's storage module -- same
// readJSON(key, fallback) / writeJSON(key, value) signature the rest of the
// (otherwise-unmodified) original code expects -- persisted to the firm's
// own Postgres database via Prisma instead of Vercel KV / local JSON files.
const { prisma } = require('../../../prisma');

async function readJSON(key, fallbackValue) {
  const row = await prisma.legacyTodoStore.findUnique({ where: { key } });
  return row ? row.value : fallbackValue;
}

async function writeJSON(key, value) {
  await prisma.legacyTodoStore.upsert({
    where: { key },
    create: { key, value },
    update: { value }
  });
}

module.exports = { readJSON, writeJSON };
