'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AuthBackground from '@/components/AuthBackground';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.');
      return;
    }

    // Account is created but "pending" -- an admin has to approve it before
    // this person can sign in, so there's nothing to auto-sign-in to yet.
    setSubmitted(true);
  }

  const inputClass =
    'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors placeholder:text-zinc-600 focus:border-accent-500/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20';
  const labelClass = 'mb-1.5 block text-xs font-medium text-zinc-400';

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <AuthBackground />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-[380px]"
      >
        <div className="mb-8 flex flex-col items-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 via-accent-500 to-violet-600 text-sm font-bold text-white shadow-glow-lg"
          >
            FA
          </motion.div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Create your account</h1>
          <p className="mt-1 text-[13px] text-zinc-500">Use your @pdka.in email. An admin approves new accounts.</p>
        </div>

        {submitted ? (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-card backdrop-blur-xl">
            <p className="text-sm font-medium text-white">Request sent</p>
            <p className="text-[13px] leading-relaxed text-zinc-400">
              An admin needs to approve your account before you can sign in. You'll be able to
              sign in as soon as that happens -- no need to sign up again.
            </p>
            <Link
              href="/login"
              className="mt-2 inline-block w-full rounded-lg bg-gradient-to-r from-accent-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleSubmit}
              className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl"
            >
              <div>
                <label className={labelClass}>Full name</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@pdka.in"
                />
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <label className={labelClass}>Confirm password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              {error && <p className="text-[13px] text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-accent-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg disabled:opacity-50"
              >
                {loading ? 'Sending request…' : 'Create account'}
              </button>
            </form>
            <p className="mt-5 text-center text-[13px] text-zinc-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-zinc-300 hover:text-accent-400">
                Sign in
              </Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
