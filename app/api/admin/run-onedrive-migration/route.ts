// TEMPORARY, ONE-OFF ENDPOINT -- not linked from any UI, not part of the
// normal admin panel. Exists only to run the Postgres -> OneDrive data
// migration (see scripts/migrate-to-onedrive.ts, which this mirrors) using
// the DATABASE_URL Vercel already injects into this Production deployment
// -- avoiding ever having to move that connection string through a chat
// session or a human's clipboard. Gated by a bearer secret
// (MIGRATION_TRIGGER_SECRET) that exists only as a Vercel env var, set and
// read by nobody but this route. Delete this whole route + the env var
// once the migration has run and been verified.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mutateCollection } from '@/lib/onedrive/store';
import { ensureRootFolder } from '@/lib/onedrive/graph-client';
import { COLLECTIONS, LEGACY_STORE_FILES } from '@/lib/onedrive/schema';

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

async function writeCollection(name: string, rows: unknown[], dryRun: boolean) {
  if (!dryRun) await mutateCollection(name, () => rows as any[]);
  return { collection: name, rows: rows.length };
}

export async function POST(req: NextRequest) {
  const secret = process.env.MIGRATION_TRIGGER_SECRET;
  const auth = req.headers.get('x-migration-secret');
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const dryRun = new URL(req.url).searchParams.get('dryRun') === 'true';
  const results: unknown[] = [];

  try {
    if (!dryRun) await ensureRootFolder();

    const users = await prisma.user.findMany();
    results.push(
      await writeCollection(
        COLLECTIONS.users,
        users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          password: u.password,
          role: u.role,
          allowedTrackers: u.allowedTrackers,
          createdAt: iso(u.createdAt)
        })),
        dryRun
      )
    );

    const comments = await prisma.comment.findMany();
    results.push(
      await writeCollection(
        COLLECTIONS.comments,
        comments.map((c) => ({
          id: c.id,
          entityType: c.entityType,
          entityId: c.entityId,
          body: c.body,
          createdAt: iso(c.createdAt),
          userId: c.userId
        })),
        dryRun
      )
    );

    const attachments = await prisma.attachment.findMany();
    results.push(
      await writeCollection(
        COLLECTIONS.attachments,
        attachments.map((a) => ({
          id: a.id,
          entityType: a.entityType,
          entityId: a.entityId,
          fileName: a.fileName,
          fileUrl: a.fileUrl,
          fileSize: a.fileSize,
          createdAt: iso(a.createdAt),
          userId: a.userId
        })),
        dryRun
      )
    );

    const statusTasks = await prisma.statusTask.findMany();
    results.push(
      await writeCollection(
        COLLECTIONS.statusTasks,
        statusTasks.map((t) => ({
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
        })),
        dryRun
      )
    );

    const agreements = await prisma.agreement.findMany();
    results.push(
      await writeCollection(
        COLLECTIONS.agreements,
        agreements.map((a) => ({
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
        })),
        dryRun
      )
    );

    const gstReconciliations = await prisma.gstReconciliation.findMany();
    results.push(
      await writeCollection(
        COLLECTIONS.gstReconciliations,
        gstReconciliations.map((g) => ({
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
        })),
        dryRun
      )
    );

    const [todoTasks, todoAssignees, todoWorkLogs] = await Promise.all([
      prisma.toDoTask.findMany(),
      prisma.toDoAssignee.findMany(),
      prisma.toDoWorkLog.findMany()
    ]);
    results.push(
      await writeCollection(
        COLLECTIONS.todoTasks,
        todoTasks.map((t) => ({
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
        })),
        dryRun
      )
    );
    results.push(
      await writeCollection(
        COLLECTIONS.todoAssignees,
        todoAssignees.map((a) => ({ id: a.id, taskId: a.taskId, userId: a.userId })),
        dryRun
      )
    );
    results.push(
      await writeCollection(
        COLLECTIONS.todoWorkLogs,
        todoWorkLogs.map((w) => ({
          id: w.id,
          taskId: w.taskId,
          userId: w.userId,
          description: w.description,
          logDate: iso(w.logDate),
          createdAt: iso(w.createdAt)
        })),
        dryRun
      )
    );

    const [policies, signatures] = await Promise.all([
      prisma.policy.findMany(),
      prisma.policySignature.findMany()
    ]);
    results.push(
      await writeCollection(
        COLLECTIONS.policies,
        policies.map((p) => ({
          id: p.id,
          title: p.title,
          content: p.content,
          createdAt: iso(p.createdAt),
          updatedAt: iso(p.updatedAt),
          createdById: p.createdById
        })),
        dryRun
      )
    );
    results.push(
      await writeCollection(
        COLLECTIONS.policySignatures,
        signatures.map((s) => ({
          id: s.id,
          policyId: s.policyId,
          userId: s.userId,
          signedName: s.signedName,
          signatureData: s.signatureData,
          signedAt: iso(s.signedAt)
        })),
        dryRun
      )
    );

    const [todoRows, statusRows, elRows] = await Promise.all([
      prisma.legacyTodoStore.findMany(),
      prisma.legacyStatusStore.findMany(),
      prisma.legacyElTrackerStore.findMany()
    ]);
    const toObject = (rows: { key: string; value: unknown }[]) =>
      Object.fromEntries(rows.map((r) => [r.key, r.value]));

    if (!dryRun) {
      await mutateCollection(LEGACY_STORE_FILES.legacyTodoStore, () => [toObject(todoRows) as any]);
      await mutateCollection(LEGACY_STORE_FILES.legacyStatusStore, () => [toObject(statusRows) as any]);
      await mutateCollection(LEGACY_STORE_FILES.legacyElTrackerStore, () => [toObject(elRows) as any]);
    }
    results.push({ collection: LEGACY_STORE_FILES.legacyTodoStore, keys: todoRows.length });
    results.push({ collection: LEGACY_STORE_FILES.legacyStatusStore, keys: statusRows.length });
    results.push({ collection: LEGACY_STORE_FILES.legacyElTrackerStore, keys: elRows.length });

    return NextResponse.json({ ok: true, dryRun, results });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
