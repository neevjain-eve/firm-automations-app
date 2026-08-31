'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  ListChecks,
  FileClock,
  Receipt,
  Building2,
  CheckSquare2,
  PenTool,
  Settings as SettingsIcon,
  ChevronDown,
  LogOut,
  WifiOff
} from 'lucide-react';

const NAV = [
  { href: '/', label: 'Dashboard', Icon: LayoutGrid },
  { href: '/status-tracker', label: 'Status Tracker', Icon: ListChecks },
  { href: '/el-tracker', label: 'EL Tracker', Icon: FileClock },
  { href: '/gst-reconciliation', label: 'GST Reconciliation', Icon: Receipt },
  { href: '/lease-agreement', label: 'Lease Agreement', Icon: Building2 },
  { href: '/todo-list', label: 'To-Do List', Icon: CheckSquare2 },
  { href: '/e-signature', label: 'e-Signature', Icon: PenTool },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon }
];

export default function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role?: string };
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();
  const currentPage = NAV.find((item) => item.href === pathname);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-100 bg-white">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-500 via-accent-600 to-violet-600 text-xs font-bold text-white shadow-[0_4px_14px_-4px_rgba(79,70,229,0.55)]">
            FA
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900">
            Firm Automations
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  active ? 'text-zinc-900' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-zinc-100"
                    transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                  />
                )}
                <Icon
                  className={`relative z-10 h-[15px] w-[15px] shrink-0 transition-colors ${
                    active ? 'text-accent-600' : 'text-zinc-400 group-hover:text-zinc-600'
                  }`}
                />
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-100 px-5 py-4">
          <p className="truncate text-[11px] text-zinc-400">Signed in as</p>
          <p className="truncate text-xs font-medium text-zinc-600">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 px-6 py-2 text-center text-xs font-medium text-amber-800">
            <WifiOff className="h-3.5 w-3.5" />
            You&apos;re offline -- showing the last saved data. Changes will sync once you&apos;re
            back online.
          </div>
        )}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-zinc-100 bg-white/70 px-8 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[13px] text-zinc-400">
            <span>Firm Automations</span>
            {currentPage && currentPage.href !== '/' && (
              <>
                <span className="text-zinc-300">/</span>
                <span className="font-medium text-zinc-900">{currentPage.label}</span>
              </>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-zinc-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 text-xs font-semibold text-white">
                {initial}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-1 shadow-card"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-3 py-2 text-xs text-zinc-400">
                    <p className="text-sm font-medium text-zinc-900">{user.name}</p>
                    <p>{user.email}</p>
                    {user.role && (
                      <span className="mt-1.5 inline-block rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-700">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <SettingsIcon className="h-3.5 w-3.5" />
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
