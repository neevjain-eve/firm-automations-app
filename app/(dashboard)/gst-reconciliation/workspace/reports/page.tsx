'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { exportToExcel } from '@/lib/excel';
import { formatReturnPeriod } from '@/lib/gst/dates';
import { formatINR } from '@/lib/gst/money';

type Gstin = { id: string; gstin: string; label: string | null };
type Client = { id: string; name: string; gstins: Gstin[] };
type PeriodSummary = {
  period: string;
  total: number;
  matched: number;
  needsReview: number;
  missingInGstr2b: number;
  missingInBooks: number;
  mismatches: number;
  open: number;
  itcAtRisk: number;
  itcClaimed: number;
};

const inputClass =
  'rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent-500/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20';

export default function ReportsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [gstinId, setGstinId] = useState('');
  const [periods, setPeriods] = useState<PeriodSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/gst-reconciliation/clients')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: Client[]) => {
        setClients(data);
        const first = data.find((c) => c.gstins.length)?.gstins[0];
        if (first) setGstinId(first.id);
      });
  }, []);

  useEffect(() => {
    if (!gstinId) return;
    setLoading(true);
    fetch(`/api/gst-reconciliation/summary?gstinId=${gstinId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setPeriods)
      .finally(() => setLoading(false));
  }, [gstinId]);

  const gstins = clients.flatMap((c) => c.gstins.map((g) => ({ ...g, clientName: c.name })));
  const selected = gstins.find((g) => g.id === gstinId);

  function exportRows() {
    exportToExcel(
      periods.map((p) => ({
        Period: formatReturnPeriod(p.period),
        'Total invoices': p.total,
        Matched: p.matched,
        'Needs review': p.needsReview,
        'Missing in GSTR-2B': p.missingInGstr2b,
        'Missing in books': p.missingInBooks,
        Mismatches: p.mismatches,
        'Still open': p.open,
        'ITC at risk (₹)': p.itcAtRisk.toFixed(2),
        'ITC matched (₹)': p.itcClaimed.toFixed(2)
      })),
      `gst-reconciliation-${selected?.gstin ?? 'report'}.xlsx`
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Client / GSTIN</label>
          <select value={gstinId} onChange={(e) => setGstinId(e.target.value)} className={inputClass}>
            <option value="">Choose a GSTIN…</option>
            {gstins.map((g) => (
              <option key={g.id} value={g.id}>
                {g.clientName} — {g.gstin}
              </option>
            ))}
          </select>
        </div>
        <button onClick={exportRows} disabled={!periods.length} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
          Export to Excel
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-white/5" />)}</div>
      ) : !gstinId ? (
        <p className="text-sm text-zinc-500">Choose a GSTIN to see its reconciliation history.</p>
      ) : periods.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No reconciliation data yet for this GSTIN. <Link href="/gst-reconciliation/workspace/upload" className="underline">Upload books and GSTR-2B data</Link> to get started.
        </p>
      ) : (
        <div className="overflow-auto rounded-xl border border-white/10 bg-white/[0.03] shadow-soft backdrop-blur-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs text-zinc-500">
                <th className="px-4 py-2 font-medium">Period</th>
                <th className="px-4 py-2 text-right font-medium">Total</th>
                <th className="px-4 py-2 text-right font-medium">Matched</th>
                <th className="px-4 py-2 text-right font-medium">Needs review</th>
                <th className="px-4 py-2 text-right font-medium">Missing in 2B</th>
                <th className="px-4 py-2 text-right font-medium">Missing in books</th>
                <th className="px-4 py-2 text-right font-medium">Mismatches</th>
                <th className="px-4 py-2 text-right font-medium">Still open</th>
                <th className="px-4 py-2 text-right font-medium">ITC at risk</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.period} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-2 text-white">
                    <Link href={`/gst-reconciliation/workspace/tracker?gstinId=${gstinId}&period=${p.period}`} className="hover:underline">
                      {formatReturnPeriod(p.period)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-300">{p.total}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-emerald-400">{p.matched}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-amber-400">{p.needsReview}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-red-400">{p.missingInGstr2b}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-blue-400">{p.missingInBooks}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-red-400">{p.mismatches}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-zinc-300">{p.open}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-white">{formatINR(p.itcAtRisk, { decimals: 0 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
