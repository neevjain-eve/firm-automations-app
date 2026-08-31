'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/', label: 'Dashboard', icon: '▦' },
  { href: '/status-tracker', label: 'Status Tracker', icon: '☑' },
  { href: '/el-tracker', label: 'EL Tracker', icon: '📄' },
  { href: '/gst-reconciliation', label: 'GST Reconciliation', icon: '🧾' },
  { href: '/lease-agreement', label: 'Lease Agreement', icon: '🏢' },
  { href: '/todo-list', label: 'To-Do List', icon: '✓' },
  { href: '/e-signature', label: 'e-Signature', icon: '✍' },
  { href: '/settings', label: 'Settings', icon: '⚙' }
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
      <aside className="flex w-60 shrink-0 flex-col border-r border-zinc-100 bg-white">
        <div className="flex items-center gap-2.5 px-5 py-6">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-xs font-bold text-white">
            FA
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-900">
            Firm Automations
          </span>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  active
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              >
                <span
                  className={`w-4 text-center text-[13px] ${
                    active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-100 px-5 py-4">
          <p className="truncate text-xs text-zinc-400">Signed in as</p>
          <p className="truncate text-xs font-medium text-zinc-600">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {!online && (
          <div className="bg-amber-50 px-6 py-2 text-center text-xs font-medium text-amber-800">
            You&apos;re offline -- showing the last saved data. Changes will sync once you&apos;re
            back online.
          </div>
        )}
        <header className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-white/80 px-8 py-4 backdrop-blur">
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
              className="flex items-center gap-2 rounded-full pr-1 transition-colors hover:bg-zinc-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-semibold text-white">
                {initial}
              </span>
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-zinc-200 bg-white p-1 shadow-card"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="px-3 py-2 text-xs text-zinc-400">
                  <p className="text-sm font-medium text-zinc-900">{user.name}</p>
                  <p>{user.email}</p>
                  {user.role && (
                    <span className="mt-1.5 inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                      {user.role}
                    </span>
                  )}
                </div>
                <Link
                  href="/settings"
                  className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-8 py-10">{children}</main>
      </div>
    </div>
  );
}
