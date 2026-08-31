'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    if (newPassword.length < 8) {
      setStatus({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setSaving(true);
    const res = await fetch('/api/account/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword })
    });
    setSaving(false);

    if (res.ok) {
      setStatus({ type: 'success', text: 'Password updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      const body = await res.json().catch(() => ({}));
      setStatus({ type: 'error', text: body.error ?? 'Something went wrong.' });
    }
  }

  const inputClass =
    'w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100';
  const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-600';

  return (
    <div className="max-w-md">
      <p className="mb-1.5 text-[13px] font-medium text-accent-600">Account</p>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-zinc-900">Settings</h1>
      <p className="mb-8 text-[13px] text-zinc-500">Manage your profile and password.</p>

      <div className="mb-6 rounded-xl border border-zinc-200 p-5 shadow-soft">
        <h2 className="mb-3 text-[13px] font-semibold text-zinc-900">Profile</h2>
        <dl className="space-y-2 text-[13px]">
          <div className="flex justify-between border-b border-zinc-50 pb-2">
            <dt className="text-zinc-500">Name</dt>
            <dd className="font-medium text-zinc-900">{session?.user?.name}</dd>
          </div>
          <div className="flex justify-between border-b border-zinc-50 pb-2">
            <dt className="text-zinc-500">Email</dt>
            <dd className="font-medium text-zinc-900">{session?.user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Role</dt>
            <dd>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium capitalize text-zinc-600">
                {(session?.user as any)?.role}
              </span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-zinc-200 p-5 shadow-soft">
        <h2 className="mb-3 text-[13px] font-semibold text-zinc-900">Change password</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>New password</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Confirm new password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          {status && (
            <p className={`text-[13px] ${status.type === 'error' ? 'text-red-600' : 'text-emerald-600'}`}>
              {status.text}
            </p>
          )}
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Update password'}
          </button>
        </form>
      </div>
    </div>
  );
}
