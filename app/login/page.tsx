'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import AuthBackground from '@/components/AuthBackground';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 via-accent-600 to-violet-600 text-sm font-bold text-white shadow-[0_8px_24px_-6px_rgba(79,70,229,0.5)]"
          >
            FA
          </motion.div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Sign in to Firm Automations
          </h1>
          <p className="mt-1 text-[13px] text-zinc-500">Use your firm account to continue.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-white/60 bg-white/70 p-6 shadow-card backdrop-blur-xl"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
              placeholder="you@pdka.in"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-600">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-100"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-[13px] text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-zinc-900 to-zinc-800 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-accent-600 hover:to-violet-600 hover:shadow-[0_8px_20px_-6px_rgba(79,70,229,0.5)] disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="mt-5 text-center text-[13px] text-zinc-500">
          New here?{' '}
          <Link href="/signup" className="font-medium text-zinc-900 hover:text-accent-600">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
