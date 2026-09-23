'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatReturnPeriod, returnPeriodString } from '@/lib/gst/dates';
import { formatINR } from '@/lib/gst/money';

type Gstin = { id: string; gstin: string; label: string | null };
type Client = { id: string; name: string; gstins: Gstin[] };
type Decision = {
  id: string;
  status: string;
  matchMethod: string;
  confidence: number;
  explanation: string | null;
  supplierGstin: string;
  supplierName: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  booksTaxable: number | null;
  booksTax: number | null;
  gstr2bTaxable: number | null;
  gstr2bTax: number | null;
  taxableVariance: number;
  taxVariance: number;
  booksItc: number;
  gstr2bItc: number;
  matchedItc: number;
  reviewStatus: string;
  reviewNote: string | null;
  reviewedBy: { name: string; email: string } | null;
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  MATCHED: { label: 'Matched', color: 'bg-emerald-500/10 text-emerald-400' },
  MATCHED_WITH_VARIANCE: { label: 'Matched (variance)', color: 'bg-amber-500/10 text-amber-400' },
  NEEDS_REVIEW: { label: 'Needs review', color: 'bg-amber-500/10 text-amber-400' },
  MISSING_IN_GSTR2B: { label: 'Missing in GSTR-2B', color: 'bg-red-500/10 text-red-400' },
  MISSING_IN_BOOKS: { label: 'Missing in books', color: 'bg-blue-500/10 text-blue-400' },
  DUPLICATE_INVOICE: { label: 'Duplicate', color: 'bg-red-500/10 text-red-400' },
  GSTIN_MISMATCH: { label: 'GSTIN mismatch', color: 'bg-red-500/10 text-red-400' },
  INVOICE_NUMBER_MISMATCH: { label: 'Invoice # mismatch', color: 'bg-red-500/10 text-red-400' },
  TAX_MISMATCH: { label: 'Tax mismatch', color: 'bg-red-500/10 text-red-400' }
};

const REVIEW_META: Record<string, string> = {
  OPEN: 'text-zinc-500',
  ACCEPTED: 'text-emerald-400',
  FLAGGED: 'text-red-400',
  IGNORED: 'text-zinc-600'
};

const inputClass =
  'rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent-500/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20';

function TrackerInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [clients, setClients] = useState<Client[]>([]);
  const [gstinId, setGstinId] = useState(params.get('gstinId') ?? '');
  const now = new Date();
  const [period, setPeriod] = useState(params.get('period') ?? returnPeriodString(now.getFullYear(), now.getMonth() + 1));
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/gst-reconciliation/clients')
      .then((r) => (r.ok ? r.json() : []))
      .then(setClients);
  }, []);

  async function load() {
    if (!gstinId || !period) return;
    setLoading(true);
    const res = await fetch(`/api/gst-reconciliation/decisions?gstinId=${gstinId}&period=${period}`);
    if (res.ok) setDecisions(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gstinId, period]);

  function updateUrl(next: { gstinId?: string; period?: string }) {
    const g = next.gstinId ?? gstinId;
    const p = next.period ?? period;
    router.replace(`/gst-reconciliation/workspace/tracker?gstinId=${g}&period=${p}`);
  }

  async function rerun() {
    setRerunning(true);
    await fetch('/api/gst-reconciliation/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gstinId, period })
    });
    setRerunning(false);
    load();
  }

  async function review(id: string, reviewStatus: string) {
    await fetch(`/api/gst-reconciliation/decisions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewStatus })
    });
    load();
  }

  async function saveNote(id: string, reviewNote: string) {
    await fetch(`/api/gst-reconciliation/decisions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewNote })
    });
    load();
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of decisions) c[d.status] = (c[d.status] ?? 0) + 1;
    return c;
  }, [decisions]);

  const itcAtRisk = useMemo(() => decisions.filter((d) => d.status === 'MISSING_IN_GSTR2B').reduce((s, d) => s + Math.abs(d.booksItc), 0), [decisions]);

  const filtered = statusFilter === 'all' ? decisions : decisions.filter((d) => d.status === statusFilter);
  const gstins = clients.flatMap((c) => c.gstins.map((g) => ({ ...g, clientName: c.name })));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Client / GSTIN</label>
          <select
            value={gstinId}
            onChange={(e) => {
              setGstinId(e.target.value);
              updateUrl({ gstinId: e.target.value });
            }}
            className={inputClass}
          >
            <option value="">Choose a GSTIN…</option>
            {gstins.map((g) => (
              <option key={g.id} value={g.id}>
                {g.clientName} — {g.gstin}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Period</label>
          <input
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              updateUrl({ period: e.target.value });
            }}
            placeholder="MMYYYY"
            className={`${inputClass} w-28 font-mono`}
          />
          <span className="ml-2 text-xs text-zinc-600">{/^\d{6}$/.test(period) ? formatReturnPeriod(period) : ''}</span>
        </div>
        <button onClick={rerun} disabled={!gstinId || rerunning} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50">
          {rerunning ? 'Re-running…' : 'Re-run reconciliation'}
        </button>
      </div>

      {gstinId && period && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-soft backdrop-blur-sm">
              <p className="text-xs text-zinc-500">Total</p>
              <p className="text-xl font-semibold text-white">{decisions.length}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-soft backdrop-blur-sm">
              <p className="text-xs text-zinc-500">Matched</p>
              <p className="text-xl font-semibold text-white">{(counts.MATCHED ?? 0) + (counts.MATCHED_WITH_VARIANCE ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-soft backdrop-blur-sm">
              <p className="text-xs text-zinc-500">Needs attention</p>
              <p className="text-xl font-semibold text-white">
                {(counts.NEEDS_REVIEW ?? 0) + (counts.MISSING_IN_GSTR2B ?? 0) + (counts.MISSING_IN_BOOKS ?? 0) + (counts.TAX_MISMATCH ?? 0) + (counts.GSTIN_MISMATCH ?? 0) + (counts.INVOICE_NUMBER_MISMATCH ?? 0) + (counts.DUPLICATE_INVOICE ?? 0)}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-soft backdrop-blur-sm">
              <p className="text-xs text-zinc-500">ITC at risk</p>
              <p className="text-xl font-semibold text-white">{formatINR(itcAtRisk, { decimals: 0 })}</p>
            </div>
          </div>

          <div className="mb-4">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={inputClass}>
              <option value="all">All statuses ({decisions.length})</option>
              {Object.entries(STATUS_META).map(([k, m]) => (counts[k] ? <option key={k} value={k}>{m.label} ({counts[k]})</option> : null))}
            </select>
          </div>

          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}</div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-zinc-500">
              {decisions.length === 0 ? 'No reconciliation results yet for this GSTIN + period — upload books and GSTR-2B data first.' : 'Nothing matches this filter.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((d) => {
                const meta = STATUS_META[d.status] ?? { label: d.status, color: 'bg-white/5 text-zinc-400' };
                return (
                  <div key={d.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-soft backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="cursor-pointer" onClick={() => setExpanded(expanded === d.id ? null : d.id)}>
                        <p className="font-medium text-white">
                          {d.invoiceNumber ?? '(no number)'} <span className="text-zinc-500">· {d.supplierGstin}</span>
                        </p>
                        <p className="text-xs text-zinc-500">
                          {d.supplierName ?? ''} {d.invoiceDate ? `· ${new Date(d.invoiceDate).toLocaleDateString('en-IN')}` : ''}
                          {d.booksTaxable !== null ? ` · Books: ${formatINR(d.booksTaxable)}` : ''}
                          {d.gstr2bTaxable !== null ? ` · 2B: ${formatINR(d.gstr2bTaxable)}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>
                        <span className={`text-xs font-medium ${REVIEW_META[d.reviewStatus]}`}>{d.reviewStatus.toLowerCase()}</span>
                      </div>
                    </div>

                    {expanded === d.id && (
                      <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
                        {d.explanation && <p className="text-sm text-zinc-400">{d.explanation}</p>}
                        <div className="flex flex-wrap gap-2">
                          {['ACCEPTED', 'FLAGGED', 'IGNORED', 'OPEN'].map((s) => (
                            <button
                              key={s}
                              onClick={() => review(d.id, s)}
                              className={`rounded-lg border px-2.5 py-1 text-xs ${d.reviewStatus === s ? 'border-accent-500/50 bg-accent-500/10 text-accent-400' : 'border-white/10 hover:bg-white/5'}`}
                            >
                              {s === 'OPEN' ? 'Reset to open' : s.charAt(0) + s.slice(1).toLowerCase()}
                            </button>
                          ))}
                        </div>
                        <textarea
                          defaultValue={d.reviewNote ?? ''}
                          placeholder="Add a note (e.g. follow-up with supplier)…"
                          rows={2}
                          className={`${inputClass} w-full`}
                          onBlur={(e) => {
                            if (e.target.value !== (d.reviewNote ?? '')) saveNote(d.id, e.target.value);
                          }}
                        />
                        {d.reviewedBy && (
                          <p className="text-xs text-zinc-600">Last reviewed by {d.reviewedBy.name ?? d.reviewedBy.email}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TrackerPage() {
  return (
    <Suspense fallback={<div className="h-16 animate-pulse rounded-xl bg-white/5" />}>
      <TrackerInner />
    </Suspense>
  );
}
