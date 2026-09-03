'use client';

import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';

const TRACKERS = [
  { key: 'status-tracker', label: 'Status Tracker' },
  { key: 'el-tracker', label: 'EL Tracker' },
  { key: 'gst-reconciliation', label: 'GST Reconciliation' },
  { key: 'lease-agreement', label: 'Lease Agreement' },
  { key: 'todo-list', label: 'To-Do List' },
  { key: 'e-signature', label: 'e-Signature' }
];

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'staff' | 'manager' | 'admin';
  allowedTrackers: string[];
  hasPassword: boolean;
};

const inputClass =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors placeholder:text-zinc-600 focus:border-accent-500/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20';

export default function AdminUsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'manager'>('staff');
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setCreating(true);
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role })
    });
    setCreating(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? 'Could not create account.');
      return;
    }
    setName('');
    setEmail('');
    setRole('staff');
    load();
  }

  async function toggleTracker(user: AdminUser, trackerKey: string) {
    const next = user.allowedTrackers.includes(trackerKey)
      ? user.allowedTrackers.filter((k) => k !== trackerKey)
      : [...user.allowedTrackers, trackerKey];

    // Optimistic update so checkboxes feel instant.
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, allowedTrackers: next } : u)));
    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowedTrackers: next })
    });
  }

  async function changeRole(user: AdminUser, nextRole: string) {
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole as any } : u)));
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: nextRole })
    });
    if (!res.ok) load(); // revert to server state if it was rejected
  }

  async function removeUser(user: AdminUser) {
    if (!confirm(`Remove ${user.name}'s account? They'll lose access immediately.`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? 'Could not remove this account.');
      return;
    }
    load();
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={addUser}
        className="rounded-xl border border-white/10 bg-white/[0.03] p-5 shadow-soft backdrop-blur-sm"
      >
        <h2 className="mb-3 text-[13px] font-semibold text-white">Add a Manager or Employee</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.5fr_1.5fr_1fr_auto]">
          <input
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
          <input
            required
            type="email"
            placeholder="name@pdka.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <select value={role} onChange={(e) => setRole(e.target.value as any)} className={inputClass}>
            <option value="staff">Employee</option>
            <option value="manager">Manager</option>
          </select>
          <button
            type="submit"
            disabled={creating}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-accent-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
        {error && <p className="mt-2 text-[13px] text-red-400">{error}</p>}
        <p className="mt-2 text-[12px] text-zinc-600">
          They'll sign in with this email via "Sign in with Microsoft" — no password to set up.
        </p>
      </form>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03] shadow-soft backdrop-blur-sm">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/5 text-[11px] uppercase tracking-wide text-zinc-600">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              {TRACKERS.map((t) => (
                <th key={t.key} className="px-3 py-3 text-center font-medium">
                  {t.label}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={TRACKERS.length + 3} className="px-4 py-6 text-center text-zinc-600">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={TRACKERS.length + 3} className="px-4 py-6 text-center text-zinc-600">
                  No accounts yet.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{user.name}</p>
                    <p className="text-[11px] text-zinc-600">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user, e.target.value)}
                      className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[12.5px] text-white"
                    >
                      <option value="staff">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  {TRACKERS.map((t) => (
                    <td key={t.key} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        disabled={user.role === 'admin'}
                        checked={user.role === 'admin' || user.allowedTrackers.includes(t.key)}
                        onChange={() => toggleTracker(user, t.key)}
                        className="h-4 w-4 accent-accent-500 disabled:opacity-40"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => removeUser(user)}
                      className="rounded-md p-1.5 text-zinc-600 hover:bg-red-500/10 hover:text-red-400"
                      title="Remove account"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[12px] text-zinc-600">
        Admins always have access to every tracker. Changing someone's access here takes effect
        the next time they sign in.
      </p>
    </div>
  );
}
