'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Plug } from 'lucide-react';

type Status = {
  clientId: string;
  tenantId: string;
  clientSecretSet: boolean;
  source: 'database' | 'env' | 'none';
  encryptionKeyConfigured: boolean;
};

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-[12.5px] text-white transition-colors placeholder:text-zinc-600 focus:border-accent-500/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20';
const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-400';

export default function ConnectionsCard() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function load() {
    const res = await fetch('/api/admin/connections');
    if (res.status === 401) {
      // Not an admin -- the card just doesn't render.
      setStatus(null);
      setLoading(false);
      return;
    }
    const data: Status = await res.json();
    setStatus(data);
    setClientId(data.clientId);
    setTenantId(data.tenantId);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const res = await fetch('/api/admin/connections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, tenantId, clientSecret })
    });
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage({ type: 'error', text: body.error ?? 'Could not save.' });
      return;
    }
    setClientSecret('');
    setMessage({ type: 'success', text: 'Saved. Sign-in uses these straight away.' });
    load();
  }

  async function test() {
    setMessage(null);
    setTesting(true);
    const res = await fetch('/api/admin/connections/test', { method: 'POST' });
    const body = await res.json().catch(() => ({}));
    setTesting(false);
    setMessage(
      body.ok
        ? { type: 'success', text: body.message ?? 'Credentials work.' }
        : { type: 'error', text: body.error ?? 'Test failed.' }
    );
  }

  if (loading || !status) return null;

  return (
    <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-sm">
      <div className="mb-1 flex items-center gap-2">
        <Plug className="h-3.5 w-3.5 text-accent-400" />
        <h2 className="text-[13px] font-semibold text-white">Connections — Microsoft sign-in</h2>
      </div>
      <p className="mb-4 text-[12px] text-zinc-500">
        Azure AD app registration used for &quot;Sign in with Microsoft&quot;. Currently reading from{' '}
        <span className="font-medium text-zinc-300">
          {status.source === 'database'
            ? 'values saved here'
            : status.source === 'env'
              ? 'Vercel environment variables'
              : 'nothing — Microsoft sign-in is off'}
        </span>
        . Saving here overrides the environment variables.
      </p>

      {!status.encryptionKeyConfigured && (
        <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[12.5px] text-amber-300">
          <span className="font-medium">SETTINGS_ENCRYPTION_KEY isn&apos;t set in Vercel.</span> You
          can save the client ID and tenant ID, but not the client secret until that env var exists.
        </p>
      )}

      <form onSubmit={save} className="space-y-3">
        <div>
          <label className={labelClass}>Application (client) ID</label>
          <input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className={inputClass}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </div>
        <div>
          <label className={labelClass}>Directory (tenant) ID</label>
          <input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className={inputClass}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </div>
        <div>
          <label className={labelClass}>
            Client secret{' '}
            {status.clientSecretSet && (
              <span className="ml-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                configured
              </span>
            )}
          </label>
          <input
            type="password"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className={inputClass}
            placeholder={status.clientSecretSet ? 'Leave blank to keep current secret' : 'Paste the secret Value'}
          />
          <p className="mt-1 text-[11px] text-zinc-600">
            Stored encrypted. It&apos;s never shown again after saving.
          </p>
        </div>

        {message && (
          <p
            className={`flex items-center gap-1.5 text-[12.5px] ${
              message.type === 'error' ? 'text-red-400' : 'text-emerald-400'
            }`}
          >
            {message.type === 'error' ? (
              <XCircle className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            )}
            {message.text}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-gradient-to-r from-accent-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            onClick={test}
            disabled={testing}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            {testing ? 'Testing…' : 'Test connection'}
          </button>
        </div>
      </form>
    </div>
  );
}
