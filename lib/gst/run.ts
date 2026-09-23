import { prisma } from "@/lib/prisma";
import { normalizeInvoiceNumber } from "./normalize";
import { reconcile } from "./engine";
import type { BooksDoc, GstrDoc } from "./types";

/**
 * Runs the matching engine for one GSTIN + return period, using the currently-active imported
 * rows on both sides, and upserts the results as GstDecision rows keyed by matchKey (stable
 * across re-imports) so a staff member's review survives a re-run. Decisions whose matchKey no
 * longer appears in this run's results (e.g. a corrected re-upload removed that invoice) are
 * deleted -- they were never reviewed-and-kept data, just the engine's own working state.
 */
export async function runReconciliation(gstinId: string, period: string) {
  const rows = await prisma.gstInvoice.findMany({
    where: { gstinId, period, active: true },
  });

  const books: BooksDoc[] = rows
    .filter((r) => r.source === "BOOKS")
    .map((r) => ({
      id: r.id,
      supplierGstin: r.supplierGstin,
      supplierName: r.supplierName ?? r.supplierGstin,
      invoiceNumber: r.invoiceNumber,
      invoiceNumberNorm: r.invoiceNumberNorm,
      invoiceDate: r.invoiceDate,
      docType: r.docType as BooksDoc["docType"],
      taxableValue: r.taxableValue,
      igst: r.igst,
      cgst: r.cgst,
      sgst: r.sgst,
      cess: r.cess,
      createdAt: r.createdAt.getTime(),
      itcEligible: r.itcEligible,
    }));

  const gstr2b: GstrDoc[] = rows
    .filter((r) => r.source === "GSTR2B")
    .map((r) => ({
      id: r.id,
      supplierGstin: r.supplierGstin,
      supplierName: r.supplierName ?? r.supplierGstin,
      invoiceNumber: r.invoiceNumber,
      invoiceNumberNorm: r.invoiceNumberNorm,
      invoiceDate: r.invoiceDate,
      docType: r.docType as GstrDoc["docType"],
      taxableValue: r.taxableValue,
      igst: r.igst,
      cgst: r.cgst,
      sgst: r.sgst,
      cess: r.cess,
      createdAt: r.createdAt.getTime(),
      itcAvailable: r.itcAvailable,
      itcReason: r.itcReason,
    }));

  const results = reconcile(books, gstr2b);

  const touchedKeys: string[] = [];
  for (const res of results) {
    touchedKeys.push(res.matchKey);
    await prisma.gstDecision.upsert({
      where: { gstinId_period_matchKey: { gstinId, period, matchKey: res.matchKey } },
      create: {
        gstinId,
        period,
        matchKey: res.matchKey,
        status: res.status,
        matchMethod: res.matchMethod,
        confidence: Math.round(res.confidence),
        explanation: res.explanation,
        supplierGstin: res.supplierGstin,
        supplierName: res.supplierName,
        invoiceNumber: res.invoiceNumber,
        invoiceDate: res.invoiceDate,
        booksTaxable: res.booksTaxable,
        booksTax: res.booksTax,
        gstr2bTaxable: res.gstr2bTaxable,
        gstr2bTax: res.gstr2bTax,
        taxableVariance: res.taxableVariance,
        taxVariance: res.taxVariance,
        booksItc: res.booksItc,
        gstr2bItc: res.gstr2bItc,
        matchedItc: res.matchedItc,
        bookInvoiceId: res.bookInvoiceId,
        gstr2bInvoiceId: res.gstr2bInvoiceId,
        differences: res.differences as unknown as object,
      },
      update: {
        // Re-run refreshes the engine's own classification and the current row links, but never
        // touches reviewStatus / reviewNote / reviewedById / reviewedAt -- that's the staff's call.
        status: res.status,
        matchMethod: res.matchMethod,
        confidence: Math.round(res.confidence),
        explanation: res.explanation,
        supplierGstin: res.supplierGstin,
        supplierName: res.supplierName,
        invoiceNumber: res.invoiceNumber,
        invoiceDate: res.invoiceDate,
        booksTaxable: res.booksTaxable,
        booksTax: res.booksTax,
        gstr2bTaxable: res.gstr2bTaxable,
        gstr2bTax: res.gstr2bTax,
        taxableVariance: res.taxableVariance,
        taxVariance: res.taxVariance,
        booksItc: res.booksItc,
        gstr2bItc: res.gstr2bItc,
        matchedItc: res.matchedItc,
        bookInvoiceId: res.bookInvoiceId,
        gstr2bInvoiceId: res.gstr2bInvoiceId,
        differences: res.differences as unknown as object,
      },
    });
  }

  await prisma.gstDecision.deleteMany({
    where: { gstinId, period, matchKey: { notIn: touchedKeys.length ? touchedKeys : ["__none__"] } },
  });

  const summary = {
    total: results.length,
    matched: results.filter((r) => r.status === "MATCHED").length,
    matchedWithVariance: results.filter((r) => r.status === "MATCHED_WITH_VARIANCE").length,
    needsReview: results.filter((r) => r.status === "NEEDS_REVIEW").length,
    missingInGstr2b: results.filter((r) => r.status === "MISSING_IN_GSTR2B").length,
    missingInBooks: results.filter((r) => r.status === "MISSING_IN_BOOKS").length,
    mismatches: results.filter((r) => ["TAX_MISMATCH", "GSTIN_MISMATCH", "INVOICE_NUMBER_MISMATCH", "DUPLICATE_INVOICE"].includes(r.status)).length,
    itcAtRisk: results.filter((r) => r.status === "MISSING_IN_GSTR2B").reduce((s, r) => s + Math.abs(r.booksItc), 0),
  };
  return summary;
}

export { normalizeInvoiceNumber };
