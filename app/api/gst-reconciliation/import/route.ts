import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { normalizeInvoiceNumber } from '@/lib/gst/normalize';
import { runReconciliation } from '@/lib/gst/run';
import type { NormalizedRow } from '@/lib/gst/parse';

/**
 * Body: { gstinId, source: "BOOKS" | "GSTR2B", period (MMYYYY), fileName?, rows: NormalizedRow[] }
 * Rows are parsed client-side (lib/gst/parse.ts) so this route just persists them: it never edits
 * an existing GstInvoice row -- a new import for the same gstin+period+source marks the current
 * active rows inactive (kept for audit) and inserts the new ones, then re-runs reconciliation for
 * that period so the tracker reflects the fresh data immediately.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { gstinId, source, period, fileName } = body as { gstinId: string; source: string; period: string; fileName?: string };
  const rows = (body.rows ?? []) as NormalizedRow[];

  if (!gstinId || !['BOOKS', 'GSTR2B'].includes(source)) {
    return NextResponse.json({ error: 'gstinId and a valid source (BOOKS or GSTR2B) are required' }, { status: 400 });
  }
  if (!/^\d{6}$/.test(period ?? '')) {
    return NextResponse.json({ error: 'period must be MMYYYY, e.g. 072026' }, { status: 400 });
  }
  const gstin = await prisma.gstGstin.findUnique({ where: { id: gstinId } });
  if (!gstin) return NextResponse.json({ error: 'GSTIN not found' }, { status: 404 });

  const job = await prisma.$transaction(async (tx) => {
    const created = await tx.gstImportJob.create({
      data: {
        gstinId,
        period,
        source,
        fileName: fileName || null,
        totalRows: rows.length,
        importedRows: rows.length,
        errorRows: 0,
        createdById: (session.user as any).id,
      },
    });

    // Never overwrite: supersede, don't delete or edit, the rows this import replaces.
    await tx.gstInvoice.updateMany({
      where: { gstinId, period, source, active: true },
      data: { active: false },
    });

    if (rows.length) {
      await tx.gstInvoice.createMany({
        data: rows.map((r) => ({
          gstinId,
          importJobId: created.id,
          period,
          source,
          active: true,
          docType: r.docType,
          supplierGstin: r.supplierGstin,
          supplierName: r.supplierName || null,
          invoiceNumber: r.invoiceNumber,
          invoiceNumberNorm: normalizeInvoiceNumber(r.invoiceNumber),
          invoiceDate: new Date(r.invoiceDate),
          taxableValue: r.taxableValue,
          igst: r.igst,
          cgst: r.cgst,
          sgst: r.sgst,
          cess: r.cess,
          invoiceValue: r.invoiceValue,
          // r.itcAvailable comes from a generic "ITC" column that means "ITC-eligible" on the
          // books side and "ITC available" on the GSTR-2B side -- only the relevant field is
          // meaningful per source, the other stays at its default (true).
          itcEligible: source === 'BOOKS' ? r.itcAvailable : true,
          itcAvailable: source === 'GSTR2B' ? r.itcAvailable : true,
          itcReason: r.itcReason,
          raw: r.raw as unknown as object,
        })),
      });
    }
    return created;
  });

  const summary = await runReconciliation(gstinId, period);
  return NextResponse.json({ job, summary }, { status: 201 });
}
