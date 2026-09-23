'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseMatrixRows, parseGstr2bJson, type ParseOutcome } from '@/lib/gst/parse';
import { returnPeriodString, formatReturnPeriod } from '@/lib/gst/dates';

type Gstin = { id: string; gstin: string; label: string | null };
type Client = { id: string; name: string; gstins: Gstin[] };

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent-500/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20';

const now = new Date();

export default function UploadPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [gstinId, setGstinId] = useState('');
  const [source, setSource] = useState<'BOOKS' | 'GSTR2B'>('BOOKS');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [outcome, setOutcome] = useState<ParseOutcome | null>(null);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ summary: Record<string, number> } | null>(null);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/gst-reconciliation/clients')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Client[]) => {
        setClients(data);
        const first = data.find((c) => c.gstins.length)?.gstins[0];
        if (first) setGstinId(first.id);
      });
  }, []);

  const period = returnPeriodString(year, month);

  async function onFile(file: File) {
    setError('');
    setResult(null);
    setFileName(file.name);
    setParsing(true);
    try {
      if (file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        setOutcome(parseGstr2bJson(JSON.parse(text)));
      } else {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
        setOutcome(parseMatrixRows(matrix));
      }
    } catch {
      setOutcome({ docs: [], issues: [{ row: 0, severity: 'error', message: 'Could not read that file — make sure it is a valid .xlsx, .csv or the portal’s GSTR-2B .json export.' }], totalRows: 0, errorRows: 0 });
    }
    setParsing(false);
  }

  const errorCount = outcome?.issues.filter((i) => i.severity === 'error').length ?? 0;
  const warningCount = outcome?.issues.filter((i) => i.severity === 'warning').length ?? 0;

  const effectivePeriod = useMemo(() => {
    if (outcome?.period && /^\d{6}$/.test(outcome.period)) return outcome.period;
    return period;
  }, [outcome, period]);

  async function confirmImport() {
    if (!outcome || !gstinId || !outcome.docs.length) return;
    setImporting(true);
    setError('');
    const res = await fetch('/api/gst-reconciliation/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gstinId, source, period: effectivePeriod, fileName, rows: outcome.docs })
    });
    setImporting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Import failed.');
      return;
    }
    const data = await res.json();
    setResult(data);
  }

  function goToTracker() {
    router.push(`/gst-reconciliation/workspace/tracker?gstinId=${gstinId}&period=${effectivePeriod}`);
  }

  const gstins = clients.flatMap((c) => c.gstins.map((g) => ({ ...g, clientName: c.name })));

  return (
    <div className="max-w-3xl">
      <div className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-sm sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Client / GSTIN</label>
          <select value={gstinId} onChange={(e) => setGstinId(e.target.value)} className={inputClass}>
            <option value="">Choose a GSTIN…</option>
            {gstins.map((g) => (
              <option key={g.id} value={g.id}>
                {g.clientName} — {g.gstin}
                {g.label ? ` (${g.label})` : ''}
              </option>
            ))}
          </select>
          {gstins.length === 0 && (
            <p className="mt-1 text-xs text-zinc-600">
              No GSTINs yet — add a client and GSTIN under <b>Clients &amp; GSTINs</b> first.
            </p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Source</label>
          <select value={source} onChange={(e) => setSource(e.target.value as 'BOOKS' | 'GSTR2B')} className={inputClass}>
            <option value="BOOKS">Books (purchase register)</option>
            <option value="GSTR2B">GSTR-2B</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Month</label>
          <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className={inputClass}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {formatReturnPeriod(returnPeriodString(year, m))}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Year</label>
          <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClass} />
        </div>
      </div>

      <div
        className="mb-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) onFile(file);
        }}
      >
        <UploadCloud className="size-6 text-zinc-500" />
        <p className="text-sm text-zinc-400">Drop a .xlsx, .csv, or the portal&rsquo;s GSTR-2B .json export here</p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.json" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        <button onClick={() => fileRef.current?.click()} className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">
          Choose file
        </button>
        {fileName && <p className="text-xs text-zinc-600">{fileName}</p>}
      </div>

      {parsing && <p className="text-sm text-zinc-500">Reading file…</p>}
      {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

      {outcome && !parsing && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-soft backdrop-blur-sm">
          <div className="mb-2 flex flex-wrap items-center gap-4 text-sm">
            <span className="text-white">{outcome.docs.length} row(s) ready to import</span>
            {errorCount > 0 && <span className="text-red-400">{errorCount} error row(s) skipped</span>}
            {warningCount > 0 && <span className="text-amber-400">{warningCount} warning(s)</span>}
            {outcome.period && <span className="text-zinc-500">Portal file reports period {formatReturnPeriod(outcome.period)}</span>}
          </div>
          {outcome.issues.length > 0 && (
            <ul className="mb-3 max-h-40 space-y-0.5 overflow-auto rounded-lg bg-black/20 p-2 text-xs">
              {outcome.issues.slice(0, 50).map((i, idx) => (
                <li key={idx} className={i.severity === 'error' ? 'text-red-400' : 'text-amber-400'}>
                  {i.message}
                </li>
              ))}
            </ul>
          )}
          {!result ? (
            <button
              onClick={confirmImport}
              disabled={importing || !gstinId || !outcome.docs.length}
              className="rounded-lg bg-gradient-to-r from-accent-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg disabled:opacity-50"
            >
              {importing ? 'Importing…' : `Import ${outcome.docs.length} row(s) for ${formatReturnPeriod(effectivePeriod)}`}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-emerald-400">
                Imported. Reconciliation for {formatReturnPeriod(effectivePeriod)}: {result.summary.matched} matched, {result.summary.needsReview} need review,{' '}
                {result.summary.missingInGstr2b} missing in GSTR-2B, {result.summary.missingInBooks} missing in books, {result.summary.mismatches} mismatched.
              </p>
              <button onClick={goToTracker} className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5">
                Open the tracker for this period →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
