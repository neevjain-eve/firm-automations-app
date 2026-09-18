// One-time migration: dump every row currently in Postgres into the
// OneDrive JSON collections (lib/onedrive/schema.ts). Safe to re-run --
// each collection is fully overwritten from the current Postgres state, so
// running it twice in a row just re-does the same export.
//
// Does NOT touch Postgres (read-only against the database) and does NOT
// change what the live app reads from -- Prisma stays the source of truth
// for the running app until the routes themselves are switched over
// (tracked separately). This script exists so the OneDrive side can be
// populated and verified *before* that cutover, not as the cutover itself.
//
// Usage:
//   npx tsx scripts/migrate-to-onedrive.ts            # writes to OneDrive
//   npx tsx scripts/migrate-to-onedrive.ts --dry-run   # prints counts only
//
// Prerequisites:
//   1. Files.ReadWrite.All (Application) permission admin-consented in Azure AD
//   2. Settings -> Connections -> OneDrive backend: site ID saved and
//      "Test OneDrive connection" succeeds
//   3. DATABASE_URL set (same as any other script that needs Prisma)

import { prisma } from '../lib/prisma';
import { mutateCollection } from '../lib/onedrive/store';
import { ensureRootFolder } from '../lib/onedrive/graph-client';
import { COLLECTIONS, LEGACY_STORE_FILES } from '../lib/onedrive/schema';

const DRY_RUN = process.argv.includes('--dry-run');

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

async function writeCollection(name: string, rows: unknown[]) {
  console.log(`  ${name}: ${rows.length} row(s)`);
  if (DRY_RUN) return;
  // Overwrite unconditionally -- this is a one-shot export, not a merge, so
  // there's no prior state on the OneDrive side worth preserving via ETag.
  await mutateCollection(name, () => rows as any[]);
}

async function migrateUsers() {
  const rows = await prisma.user.findMany();
  await writeCollection(COLLECTIONS.users, rows.map((u) => ({
    id: u.id,
    email: u.email,
    name: u.name,
    password: u.password,
    role: u.role,
    allowedTrackers: u.allowedTrackers,
    createdAt: iso(u.createdAt)
  })));
}

async function migrateComments() {
  const rows = await prisma.comment.findMany();
  await writeCollection(COLLECTIONS.comments, rows.map((c) => ({
    id: c.id,
    entityType: c.entityType,
    entityId: c.entityId,
    body: c.body,
    createdAt: iso(c.createdAt),
    userId: c.userId
  })));
}

async function migrateAttachments() {
  const rows = await prisma.attachment.findMany();
  await writeCollection(COLLECTIONS.attachments, rows.map((a) => ({
    id: a.id,
    entityType: a.entityType,
    entityId: a.entityId,
    fileName: a.fileName,
    fileUrl: a.fileUrl,
    fileSize: a.fileSize,
    createdAt: iso(a.createdAt),
    userId: a.userId
  })));
}

async function migrateAutomationRuns() {
  const rows = await prisma.automationRun.findMany();
  await writeCollection(COLLECTIONS.automationRuns, rows.map((r) => ({
    id: r.id,
    automationId: r.automationId,
    status: r.status,
    input: r.input,
    output: r.output,
    error: r.error,
    startedAt: iso(r.startedAt),
    finishedAt: iso(r.finishedAt),
    userId: r.userId
  })));
}

async function migrateStatusTasks() {
  const rows = await prisma.statusTask.findMany();
  await writeCollection(COLLECTIONS.statusTasks, rows.map((t) => ({
    id: t.id,
    title: t.title,
    clientName: t.clientName,
    manager: t.manager,
    teamMember: t.teamMember,
    priority: t.priority,
    status: t.status,
    notes: t.notes,
    blockers: t.blockers,
    actionPoints: t.actionPoints,
    dueDate: iso(t.dueDate),
    createdAt: iso(t.createdAt),
    updatedAt: iso(t.updatedAt),
    createdById: t.createdById
  })));
}

async function migrateAgreements() {
  const rows = await prisma.agreement.findMany();
  await writeCollection(COLLECTIONS.agreements, rows.map((a) => ({
    id: a.id,
    name: a.name,
    clientName: a.clientName,
    agreementType: a.agreementType,
    city: a.city,
    areaLocality: a.areaLocality,
    startDate: iso(a.startDate),
    endDate: iso(a.endDate),
    amount: a.amount,
    notes: a.notes,
    createdAt: iso(a.createdAt),
    updatedAt: iso(a.updatedAt),
    renewedFromId: a.renewedFromId,
    createdById: a.createdById
  })));
}

async function migrateGstReconciliations() {
  const rows = await prisma.gstReconciliation.findMany();
  await writeCollection(COLLECTIONS.gstReconciliations, rows.map((g) => ({
    id: g.id,
    period: g.period,
    returnType: g.returnType,
    status: g.status,
    gstin: g.gstin,
    dueDate: iso(g.dueDate),
    filedBy: g.filedBy,
    amountBooks: g.amountBooks,
    amountGst: g.amountGst,
    notes: g.notes,
    createdAt: iso(g.createdAt),
    updatedAt: iso(g.updatedAt),
    createdById: g.createdById
  })));
}

async function migrateLeaseAgreements() {
  const rows = await prisma.leaseAgreement.findMany();
  await writeCollection(COLLECTIONS.leaseAgreements, rows.map((l) => ({
    id: l.id,
    propertyName: l.propertyName,
    lessorName: l.lessorName,
    contactPerson: l.contactPerson,
    phone: l.phone,
    email: l.email,
    city: l.city,
    startDate: iso(l.startDate),
    endDate: iso(l.endDate),
    rentAmount: l.rentAmount,
    notes: l.notes,
    createdAt: iso(l.createdAt),
    updatedAt: iso(l.updatedAt),
    createdById: l.createdById
  })));
}

async function migrateToDo() {
  const [tasks, assignees, workLogs] = await Promise.all([
    prisma.toDoTask.findMany(),
    prisma.toDoAssignee.findMany(),
    prisma.toDoWorkLog.findMany()
  ]);
  await writeCollection(COLLECTIONS.todoTasks, tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    status: t.status,
    department: t.department,
    client: t.client,
    dueDate: iso(t.dueDate),
    createdAt: iso(t.createdAt),
    updatedAt: iso(t.updatedAt),
    createdById: t.createdById
  })));
  await writeCollection(COLLECTIONS.todoAssignees, assignees.map((a) => ({
    id: a.id,
    taskId: a.taskId,
    userId: a.userId
  })));
  await writeCollection(COLLECTIONS.todoWorkLogs, workLogs.map((w) => ({
    id: w.id,
    taskId: w.taskId,
    userId: w.userId,
    description: w.description,
    logDate: iso(w.logDate),
    createdAt: iso(w.createdAt)
  })));
}

async function migratePolicies() {
  const [policies, signatures] = await Promise.all([
    prisma.policy.findMany(),
    prisma.policySignature.findMany()
  ]);
  await writeCollection(COLLECTIONS.policies, policies.map((p) => ({
    id: p.id,
    title: p.title,
    content: p.content,
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
    createdById: p.createdById
  })));
  await writeCollection(COLLECTIONS.policySignatures, signatures.map((s) => ({
    id: s.id,
    policyId: s.policyId,
    userId: s.userId,
    signedName: s.signedName,
    signatureData: s.signatureData,
    signedAt: iso(s.signedAt)
  })));
}

async function migrateLegacyStores() {
  const [todoRows, statusRows, elRows] = await Promise.all([
    prisma.legacyTodoStore.findMany(),
    prisma.legacyStatusStore.findMany(),
    prisma.legacyElTrackerStore.findMany()
  ]);

  const toObject = (rows: { key: string; value: unknown }[]) =>
    Object.fromEntries(rows.map((r) => [r.key, r.value]));

  console.log(`  ${LEGACY_STORE_FILES.legacyTodoStore}: ${todoRows.length} key(s)`);
  console.log(`  ${LEGACY_STORE_FILES.legacyStatusStore}: ${statusRows.length} key(s)`);
  console.log(`  ${LEGACY_STORE_FILES.legacyElTrackerStore}: ${elRows.length} key(s)`);
  if (DRY_RUN) return;

  await mutateCollection(LEGACY_STORE_FILES.legacyTodoStore, () => [toObject(todoRows) as any]);
  await mutateCollection(LEGACY_STORE_FILES.legacyStatusStore, () => [toObject(statusRows) as any]);
  await mutateCollection(LEGACY_STORE_FILES.legacyElTrackerStore, () => [toObject(elRows) as any]);
}

async function main() {
  console.log(DRY_RUN ? 'DRY RUN -- counting rows only, nothing will be written.\n' : 'Migrating Postgres -> OneDrive...\n');

  if (!DRY_RUN) {
    console.log('Ensuring root folder exists...');
    await ensureRootFolder();
  }

  await migrateUsers();
  await migrateComments();
  await migrateAttachments();
  await migrateAutomationRuns();
  await migrateStatusTasks();
  await migrateAgreements();
  await migrateGstReconciliations();
  await migrateLeaseAgreements();
  await migrateToDo();
  await migratePolicies();
  await migrateLegacyStores();

  console.log(DRY_RUN ? '\nDry run complete.' : '\nMigration complete.');
}

main()
  .catch((err) => {
    console.error('\nMigration failed:', err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
