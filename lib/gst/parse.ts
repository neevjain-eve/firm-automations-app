import { parseDateInput, parseReturnPeriod } from "./dates";
import { hasValidGstinFormat, normalizeGstin } from "./gstin";
import { r2, parseAmount, validateAmounts } from "./money";
import { canonicalField, detectHeaderRow, REQUIRED_FIELDS, type CanonicalField } from "./columns";

export type DocTypeStr = "INVOICE" | "CREDIT_NOTE" | "DEBIT_NOTE";

export interface NormalizedRow {
  docType: DocTypeStr;
  supplierGstin: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string; // ISO yyyy-mm-dd
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  invoiceValue: number;
  itcAvailable: boolean;
  itcReason: string | null;
  raw: Record<string, unknown>;
}

export interface RowIssue {
  row: number;
  severity: "error" | "warning";
  message: string;
}

export interface ParseOutcome {
  docs: NormalizedRow[];
  issues: RowIssue[];
  totalRows: number;
  errorRows: number;
  period?: string | null;
  gstin?: string | null;
}

function docTypeFromLabel(raw: unknown): DocTypeStr {
  const s = String(raw ?? "").toLowerCase();
  if (s.includes("debit")) return "DEBIT_NOTE";
  if (s.includes("credit")) return "CREDIT_NOTE";
  return "INVOICE";
}

/**
 * Parses a raw spreadsheet matrix (rows of cells, as SheetJS's `sheet_to_json(sheet, {header:1})`
 * returns) for either a books export or the official GSTR-2B Excel. Auto-detects the header row
 * and maps columns by alias, so it tolerates the official portal export, Zoho/Tally exports, and
 * our own template equally.
 */
export function parseMatrixRows(matrix: unknown[][]): ParseOutcome {
  const issues: RowIssue[] = [];
  const docs: NormalizedRow[] = [];
  let totalRows = 0;
  let errorRows = 0;

  const header = detectHeaderRow(matrix);
  if (header.index === -1 || header.score < REQUIRED_FIELDS.length) {
    return {
      docs,
      issues: [{ row: 0, severity: "error", message: "Could not find a header row with recognisable columns (need at least GSTIN, invoice number, date and taxable value)." }],
      totalRows: 0,
      errorRows: 0,
    };
  }

  const headerRow = matrix[header.index] ?? [];
  const colOf = new Map<CanonicalField, number>();
  headerRow.forEach((cell, i) => {
    const f = canonicalField(cell);
    if (f && !colOf.has(f)) colOf.set(f, i);
  });

  const get = (row: unknown[], f: CanonicalField) => {
    const i = colOf.get(f);
    return i === undefined ? undefined : row[i];
  };

  for (let r = header.index + 1; r < matrix.length; r++) {
    const row = matrix[r] ?? [];
    if (row.every((c) => c === "" || c === null || c === undefined)) continue; // blank row
    totalRows++;

    const supplierGstin = normalizeGstin(get(row, "supplierGstin"));
    const invoiceNumber = String(get(row, "invoiceNumber") ?? "").trim();
    const invoiceDate = parseDateInput(get(row, "invoiceDate"));
    const taxableValue = parseAmount(get(row, "taxableValue")) ?? 0;
    const igst = parseAmount(get(row, "igst")) ?? 0;
    const cgst = parseAmount(get(row, "cgst")) ?? 0;
    const sgst = parseAmount(get(row, "sgst")) ?? 0;
    const cess = parseAmount(get(row, "cess")) ?? 0;

    const problems: string[] = [];
    if (!hasValidGstinFormat(supplierGstin)) problems.push(`invalid supplier GSTIN "${supplierGstin || "(blank)"}"`);
    if (!invoiceNumber) problems.push("missing invoice number");
    if (!invoiceDate) problems.push("invalid or missing invoice date");
    const amounts = { taxableValue, igst, cgst, sgst, cess };
    const check = validateAmounts(amounts);
    problems.push(...check.errors);
    if ([igst, cgst, sgst, cess].some((n) => Number.isNaN(n))) problems.push("a tax amount is not a number");

    if (problems.length) {
      errorRows++;
      issues.push({ row: r + 1, severity: "error", message: `Row ${r + 1}: ${problems.join("; ")}` });
      continue;
    }
    check.warnings.forEach((w: string) => issues.push({ row: r + 1, severity: "warning", message: `Row ${r + 1} (${invoiceNumber}): ${w}` }));

    const itcRaw = get(row, "itc");
    const itcAvailable = itcRaw === undefined ? true : !/^(n|no|not\s*available|ineligible)/i.test(String(itcRaw).trim());

    docs.push({
      docType: docTypeFromLabel(get(row, "docType")),
      supplierGstin,
      supplierName: String(get(row, "supplierName") ?? `Supplier ${supplierGstin}`).trim(),
      invoiceNumber,
      invoiceDate: invoiceDate!.toISOString().slice(0, 10),
      taxableValue: r2(taxableValue),
      igst: r2(igst),
      cgst: r2(cgst),
      sgst: r2(sgst),
      cess: r2(cess),
      invoiceValue: r2(parseAmount(get(row, "invoiceValue")) || taxableValue + igst + cgst + sgst + cess),
      itcAvailable,
      itcReason: get(row, "itcReason") ? String(get(row, "itcReason")) : null,
      raw: Object.fromEntries(headerRow.map((h, i) => [String(h ?? `col${i}`), row[i] ?? null])),
    });
  }

  if (!docs.length && !errorRows) issues.push({ row: 0, severity: "error", message: "No data rows found below the header." });
  return { docs, issues, totalRows, errorRows };
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const arr = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(isObj) : []);
const num = (v: unknown) => {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
};

/**
 * Parses the GSTR-2B JSON as downloaded from the GST portal (or returned by a GSP):
 *   { data: { gstin, rtnprd, docdata: { b2b: [{ ctin, trdnm, inv: [...] }], cdnr: [{ ctin, nt: [...] }] } } }
 * Amounts are read from `items[]` (summed) when present, otherwise from the document-level
 * txval / igst / cgst / sgst / cess fields. Sections other than B2B and CDNR are reported, not imported.
 */
export function parseGstr2bJson(input: unknown): ParseOutcome {
  const issues: RowIssue[] = [];
  const docs: NormalizedRow[] = [];
  let totalRows = 0;
  let errorRows = 0;

  const root = isObj(input) && isObj(input.data) ? input.data : isObj(input) ? input : null;
  if (!root) {
    return { docs, issues: [{ row: 0, severity: "error", message: "Not a valid GSTR-2B JSON document." }], totalRows: 0, errorRows: 0 };
  }
  const docdata = isObj(root.docdata) ? root.docdata : root;
  const gstin = root.gstin ? normalizeGstin(root.gstin) : null;
  const returnPeriod = typeof root.rtnprd === "string" ? parseReturnPeriod(root.rtnprd) : null;
  const period = typeof root.rtnprd === "string" ? String(root.rtnprd) : null;

  const build = (supplier: Obj, d: Obj, docType: DocTypeStr, numberKey: string, label: string, idx: number) => {
    totalRows++;
    const ctin = normalizeGstin(supplier.ctin);
    const number = String(d[numberKey] ?? d.inum ?? "").trim();
    const date = parseDateInput(d.dt);
    const items = arr(d.items);
    const src: Obj = items.length ? {} : d;
    const sum = (k: string) => (items.length ? items.reduce((s, it) => s + num(it[k]), 0) : num(src[k]));
    const amounts = { taxableValue: r2(sum("txval")), igst: r2(sum("igst")), cgst: r2(sum("cgst")), sgst: r2(sum("sgst")), cess: r2(sum("cess")) };

    const problems: string[] = [];
    if (!hasValidGstinFormat(ctin)) problems.push(`invalid supplier GSTIN "${ctin}"`);
    if (!number) problems.push("missing document number");
    if (!date) problems.push("invalid date");
    const check = validateAmounts(amounts);
    problems.push(...check.errors);
    if (problems.length) {
      errorRows++;
      issues.push({ row: idx + 1, severity: "error", message: `${label} #${idx + 1}: ${problems.join("; ")}` });
      return;
    }
    check.warnings.forEach((w: string) => issues.push({ row: idx + 1, severity: "warning", message: `${label} ${number}: ${w}` }));

    docs.push({
      docType,
      supplierGstin: ctin,
      supplierName: String(supplier.trdnm ?? `Supplier ${ctin}`).trim(),
      invoiceNumber: number,
      invoiceDate: date!.toISOString().slice(0, 10),
      ...amounts,
      invoiceValue: r2(num(d.val) || amounts.taxableValue + amounts.igst + amounts.cgst + amounts.sgst + amounts.cess),
      itcAvailable: String(d.itcavl ?? "Y").toUpperCase() === "Y",
      itcReason: d.rsn ? String(d.rsn) : null,
      raw: { section: label, supplier: { ctin: supplier.ctin, trdnm: supplier.trdnm }, document: d },
    });
  };

  let i = 0;
  for (const supplier of arr(docdata.b2b)) for (const inv of arr(supplier.inv)) build(supplier, inv, "INVOICE", "inum", "B2B", i++);
  for (const supplier of arr(docdata.cdnr)) {
    for (const note of arr(supplier.nt)) {
      const t = String(note.typ ?? note.ntty ?? "C").toUpperCase();
      build(supplier, note, t.startsWith("D") ? "DEBIT_NOTE" : "CREDIT_NOTE", "ntnum", "CDNR", i++);
    }
  }

  for (const skipped of ["b2ba", "cdnra", "isd", "impg", "impgsez"]) {
    const c = Array.isArray(docdata[skipped]) ? (docdata[skipped] as unknown[]).length : 0;
    if (c) issues.push({ row: 0, severity: "warning", message: `Section "${skipped.toUpperCase()}" (${c} entries) is not imported – only B2B and CDNR are reconciled.` });
  }
  if (!docs.length && !errorRows) issues.push({ row: 0, severity: "error", message: "No B2B or CDNR documents found in this GSTR-2B JSON." });

  return {
    docs,
    issues,
    totalRows,
    errorRows,
    period: returnPeriod ? `${String(returnPeriod.month).padStart(2, "0")}${returnPeriod.year}` : period,
    gstin,
  };
}
