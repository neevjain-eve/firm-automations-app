'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import AuthBackground from '@/components/AuthBackground';

function MicrosoftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [msLoading, setMsLoading] = useState(false);

  const urlError = searchParams.get('error');
  const notProvisionedMessage =
    urlError === 'NotProvisioned'
      ? "That Microsoft account isn't set up here yet. Ask an admin to add you in Settings → User Access."
      : urlError
        ? 'Sign-in failed. Please try again.'
        : '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', {
      email,
      password,
      redirect: false
    });
    setLoading(false);
    if (res?.error) {
      setError('Incorrect email or password.');
      return;
    }
    router.push('/');
    router.refresh();
  }

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
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Sign in to Firm Automations
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500">Use your firm account to continue.</p>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl">
          {notProvisionedMessage && (
            <p className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-300">
              {notProvisionedMessage}
            </p>
          )}

          <button
            type="button"
            disabled={msLoading}
            onClick={() => {
              setMsLoading(true);
              signIn('azure-ad', { callbackUrl: '/' });
            }}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <MicrosoftIcon />
            {msLoading ? 'Redirecting…' : 'Sign in with Microsoft'}
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] uppercase tracking-wide text-zinc-600">or</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors placeholder:text-zinc-600 focus:border-accent-500/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                placeholder="you@pdka.in"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-zinc-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors placeholder:text-zinc-600 focus:border-accent-500/50 focus:outline-none focus:ring-2 focus:ring-accent-500/20"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-[13px] text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-accent-500 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-glow transition-all hover:shadow-glow-lg disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-[13px] text-zinc-500">
          Don't have access? Ask your admin to add your account.
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
