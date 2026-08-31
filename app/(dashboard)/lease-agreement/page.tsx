'use client';

import { useEffect, useMemo, useState } from 'react';
import CommentsSection from '@/components/CommentsSection';
import AttachmentsSection from '@/components/AttachmentsSection';

type Lease = {
  id: string;
  propertyName: string;
  lessorName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  startDate: string;
  endDate: string;
  rentAmount: number | null;
  notes: string | null;
  createdBy: { name: string; email: string };
};

function computeStatus(endDate: string) {
  const daysLeft = Math.ceil(
    (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (daysLeft < 0) return { key: 'expired', label: 'Expired', color: 'bg-red-100 text-red-700' };
  if (daysLeft <= 30)
    return { key: 'expiring', label: 'Expiring soon', color: 'bg-amber-100 text-amber-700' };
  return { key: 'active', label: 'Active', color: 'bg-emerald-50 text-emerald-700' };
}

export default function LeaseAgreementPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    propertyName: '',
    lessorName: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    notes: ''
  });

  async function load() {
    setLoading(true);
    const res = await fetch('/api/lease-agreement');
    setLeases(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addLease(e: React.FormEvent) {
    e.preventDefault();
    if (!form.propertyName || !form.lessorName || !form.startDate || !form.endDate) return;
    setSaving(true);
    await fetch('/api/lease-agreement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm({
      propertyName: '',
      lessorName: '',
      contactPerson: '',
      phone: '',
      email: '',
      city: '',
      startDate: '',
      endDate: '',
      rentAmount: '',
      notes: ''
    });
    setSaving(false);
    load();
  }

  async function removeLease(id: string) {
    await fetch(`/api/lease-agreement/${id}`, { method: 'DELETE' });
    load();
  }

  const withStatus = useMemo(
    () => leases.map((l) => ({ ...l, _status: computeStatus(l.endDate) })),
    [leases]
  );

  const filtered = useMemo(() => {
    return withStatus.filter((l) => {
      if (statusFilter !== 'all' && l._status.key !== statusFilter) return false;
      if (
        search &&
        !l.propertyName.toLowerCase().includes(search.toLowerCase()) &&
        !l.lessorName.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [withStatus, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      active: withStatus.filter((l) => l._status.key === 'active').length,
      expiring: withStatus.filter((l) => l._status.key === 'expiring').length,
      expired: withStatus.filter((l) => l._status.key === 'expired').length
    };
  }, [withStatus]);

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-accent-600">Automation</p>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900">Lease Agreement</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Track property/asset leases and see what&apos;s expiring soon. Prototype -- no billing or
        document storage yet.
      </p>

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-soft">
          <p className="text-xs text-zinc-500">Active</p>
          <p className="text-xl font-semibold text-zinc-900">{counts.active}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-soft">
          <p className="text-xs text-zinc-500">Expiring soon</p>
          <p className="text-xl font-semibold text-zinc-900">{counts.expiring}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-soft">
          <p className="text-xs text-zinc-500">Expired</p>
          <p className="text-xl font-semibold text-zinc-900">{counts.expired}</p>
        </div>
      </div>

      <form
        onSubmit={addLease}
        className="mb-8 space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-soft"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Property name
            </label>
            <input
              value={form.propertyName}
              onChange={(e) => setForm({ ...form, propertyName: e.target.value })}
              required
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
              placeholder="e.g. 3rd Floor Office, MG Road"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Lessor name</label>
            <input
              value={form.lessorName}
              onChange={(e) => setForm({ ...form, lessorName: e.target.value })}
              required
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Start date</label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">End date</label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Monthly rent (₹, optional)
            </label>
            <input
              type="number"
              value={form.rentAmount}
              onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Contact person (optional)
            </label>
            <input
              value={form.contactPerson}
              onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Phone (optional)
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Email (optional)
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">City (optional)</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Notes (optional)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={2}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add lease'}
        </button>
      </form>

      <div className="mb-4 flex gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by property or lessor…"
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => (<div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-100" />))}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {leases.length === 0 ? 'No leases yet -- add one above.' : 'No leases match your search.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => (
            <div key={l.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="font-medium text-zinc-900 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === l.id ? null : l.id)}
                  >
                    {l.propertyName}
                  </p>
                  <p className="text-sm text-zinc-600">
                    {l.lessorName}
                    {l.city ? ` · ${l.city}` : ''}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {new Date(l.startDate).toLocaleDateString()} –{' '}
                    {new Date(l.endDate).toLocaleDateString()}
                    {l.rentAmount ? ` · ₹${l.rentAmount.toLocaleString()}/mo` : ''}
                    {l.contactPerson ? ` · ${l.contactPerson}` : ''}
                    {l.phone ? ` · ${l.phone}` : ''}
                    {l.email ? ` · ${l.email}` : ''}
                  </p>
                  {l.notes && <p className="mt-1 text-sm text-zinc-600">{l.notes}</p>}
                  <p className="mt-1 text-xs text-zinc-400">
                    Added by {l.createdBy?.name ?? l.createdBy?.email}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${l._status.color}`}
                >
                  {l._status.label}
                </span>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => removeLease(l.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Delete
                </button>
              </div>
              {expandedId === l.id && (
                <div className="mt-3 space-y-4 border-t border-zinc-100 pt-3">
                  <AttachmentsSection entityType="lease" entityId={l.id} />
                  <CommentsSection entityType="lease" entityId={l.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
