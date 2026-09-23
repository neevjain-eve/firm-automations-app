'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

type Gstin = { id: string; gstin: string; label: string | null };
type Client = { id: string; name: string; notes: string | null; gstins: Gstin[]; createdBy: { name: string; email: string } };

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-accent-500/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', gstin: '', gstinLabel: '' });
  const [gstinDrafts, setGstinDrafts] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch('/api/gst-reconciliation/clients');
    if (res.ok) setClients(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    const res = await fetch('/api/gst-reconciliation/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not add the client.');
      setSaving(false);
      return;
    }
    setForm({ name: '', gstin: '', gstinLabel: '' });
    setSaving(false);
    load();
  }

  async function addGstin(clientId: string) {
    const gstin = (gstinDrafts[clientId] ?? '').trim();
    if (!gstin) return;
    setError('');
    const res = await fetch(`/api/gst-reconciliation/clients/${clientId}/gstins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gstin })
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Could not add that GSTIN.');
      return;
    }
    setGstinDrafts((d) => ({ ...d, [clientId]: '' }));
    load();
  }

  async function removeGstin(gstinId: string) {
    if (!confirm('Remove this GSTIN? All its imported invoices and reconciliation history will be deleted too.')) return;
    await fetch(`/api/gst-reconciliation/gstins/${gstinId}`, { method: 'DELETE' });
    load();
  }

  async function removeClient(clientId: string) {
    if (!confirm('Delete this client and all its GSTINs, imports and reconciliation history?')) return;
    await fetch(`/api/gst-reconciliation/clients/${clientId}`, { method: 'DELETE' });
    load();
  }

  return (
    <div>
      <form
        onSubmit={addClient}
        className="mb-6 grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-sm sm:grid-cols-[2fr_1.3fr_1fr_auto]"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Client name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputClass} placeholder="Acme Traders Pvt Ltd" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">First GSTIN (optional)</label>
          <input
            value={form.gstin}
            onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })}
            className={`${inputClass} font-mono`}
            placeholder="29ABCDE1234F1Z5"
            maxLength={15}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Label (optional)</label>
          <input value={form.gstinLabel} onChange={(e) => setForm({ ...form, gstinLabel: e.target.value })} className={inputClass} placeholder="Karnataka HO" />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg disabled:opacity-50"
          >
            <Plus className="size-4" /> {saving ? 'Adding…' : 'Add client'}
          </button>
        </div>
      </form>
      {error && <p className="mb-4 text-xs text-red-400">{error}</p>}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-white/5" />)}</div>
      ) : clients.length === 0 ? (
        <p className="text-sm text-zinc-500">No clients yet — add one above to start uploading data for them.</p>
      ) : (
        <div className="space-y-3">
          {clients.map((c) => (
            <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-soft backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{c.name}</p>
                  <p className="text-xs text-zinc-600">Added by {c.createdBy?.name ?? c.createdBy?.email}</p>
                </div>
                <button onClick={() => removeClient(c.id)} className="text-xs text-red-400 hover:text-red-300">
                  Delete client
                </button>
              </div>

              <div className="mt-3 space-y-1.5">
                {c.gstins.map((g) => (
                  <div key={g.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
                    <div>
                      <span className="font-mono text-sm text-white">{g.gstin}</span>
                      {g.label ? <span className="ml-2 text-xs text-zinc-500">{g.label}</span> : null}
                    </div>
                    <button onClick={() => removeGstin(g.id)} className="text-zinc-500 hover:text-red-400" title="Remove GSTIN">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                {c.gstins.length === 0 && <p className="text-xs text-zinc-600">No GSTINs yet.</p>}
              </div>

              <div className="mt-2 flex gap-2">
                <input
                  value={gstinDrafts[c.id] ?? ''}
                  onChange={(e) => setGstinDrafts((d) => ({ ...d, [c.id]: e.target.value.toUpperCase() }))}
                  placeholder="Add another GSTIN"
                  maxLength={15}
                  className={`${inputClass} max-w-xs font-mono`}
                />
                <button onClick={() => addGstin(c.id)} className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5">
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
