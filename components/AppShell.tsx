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
  ShieldCheck,
  ChevronDown,
  LogOut,
  WifiOff,
  type LucideIcon
} from 'lucide-react';
import { hasTrackerAccess } from '@/lib/permissions';

const MotionLink = motion(Link);

type NavItem = { href: string; label: string; Icon: LucideIcon; trackerKey: string | null };

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [{ href: '/', label: 'Dashboard', Icon: LayoutGrid, trackerKey: null }]
  },
  {
    label: 'Trackers',
    items: [
      { href: '/status-tracker', label: 'Status Tracker', Icon: ListChecks, trackerKey: 'status-tracker' },
      { href: '/el-tracker', label: 'EL Tracker', Icon: FileClock, trackerKey: 'el-tracker' },
      { href: '/gst-reconciliation', label: 'GST Reconciliation', Icon: Receipt, trackerKey: 'gst-reconciliation' },
      { href: '/lease-agreement', label: 'Lease Agreement', Icon: Building2, trackerKey: 'lease-agreement' },
      { href: '/todo-list', label: 'To-Do List', Icon: CheckSquare2, trackerKey: 'todo-list' },
      { href: '/e-signature', label: 'e-Signature', Icon: PenTool, trackerKey: 'e-signature' }
    ]
  },
  {
    label: 'Workspace',
    items: [{ href: '/settings', label: 'Settings', Icon: SettingsIcon, trackerKey: null }]
  }
];

export default function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null; role?: string; allowedTrackers?: string[] };
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const initial = (user.name || user.email || '?').charAt(0).toUpperCase();

  const groups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.trackerKey || hasTrackerAccess(user, item.trackerKey))
  })).filter((group) => group.items.length > 0);

  if (user.role === 'admin') {
    const workspace = groups.find((g) => g.label === 'Workspace');
    const adminItem: NavItem = { href: '/admin', label: 'User Access', Icon: ShieldCheck, trackerKey: null };
    if (workspace) {
      workspace.items.push(adminItem);
    } else {
      groups.push({ label: 'Workspace', items: [adminItem] });
    }
  }

  const currentPage = groups.flatMap((g) => g.items).find((item) => item.href === pathname);

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
    <div className="flex min-h-screen bg-ink-950">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-white/[0.06] bg-ink-900">
        <div className="flex items-center justify-center border-b border-black/10 bg-white px-3 py-3.5">
          <img src="/pdka-logo.png" alt="P. Dilip Kumar & Associates" className="w-full max-w-[168px]" />
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {groups.map((group, gi) => (
            <div key={group.label ?? `group-${gi}`} className="space-y-0.5">
              {group.label && (
                <p className="px-3 pb-1.5 text-label font-medium uppercase text-ink-500">{group.label}</p>
              )}
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.Icon;
                return (
                  <MotionLink
                    key={item.href}
                    href={item.href}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative flex items-center gap-3 rounded-lg px-3 py-2 text-body font-medium transition-colors ${
                      active ? 'text-white' : 'text-ink-400 hover:bg-white/[0.03] hover:text-ink-100'
                    }`}
                  >
                    {active && (
                      <>
                        <motion.span
                          layoutId="nav-active-bg"
                          className="absolute inset-0 rounded-lg bg-accent-500/[0.14] ring-1 ring-inset ring-accent-500/20"
                          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                        />
                        <motion.span
                          layoutId="nav-active-bar"
                          className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-full bg-accent-500 shadow-[0_0_10px_0_rgb(248_160_6_/_0.6)]"
                          transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                        />
                      </>
                    )}
                    <Icon
                      strokeWidth={2}
                      className={`relative z-10 h-4 w-4 shrink-0 transition-colors ${
                        active ? 'text-accent-400' : 'text-ink-500 group-hover:text-ink-300'
                      }`}
                    />
                    <span className="relative z-10">{item.label}</span>
                  </MotionLink>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/[0.06] px-5 py-4">
          <p className="truncate text-caption text-ink-500">Signed in as</p>
          <p className="truncate text-body-sm font-medium text-ink-200">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-warning/10 px-6 py-2 text-center text-body-sm font-medium text-warning">
            <WifiOff className="h-3.5 w-3.5" />
            You&apos;re offline -- showing the last saved data. Changes will sync once you&apos;re
            back online.
          </div>
        )}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/[0.06] bg-ink-950/70 px-8 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-body-sm text-ink-500">
            <span>PDKA APP</span>
            {currentPage && currentPage.href !== '/' && (
              <>
                <span className="text-ink-700">/</span>
                <span className="text-title-sm font-semibold text-ink-50">{currentPage.label}</span>
              </>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-white/5"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-ink-700 to-ink-900 text-body-sm font-semibold text-white ring-1 ring-white/10 transition-shadow hover:ring-accent-500/40">
                {initial}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-ink-500 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                  className="absolute right-0 z-10 mt-2 w-56 rounded-xl border border-white/10 bg-ink-900 p-1 shadow-card"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <div className="px-3 py-2">
                    <p className="text-title-sm font-medium text-white">{user.name}</p>
                    <p className="text-body-sm text-ink-500">{user.email}</p>
                    {user.role && (
                      <span className="mt-1.5 inline-block rounded-full bg-accent-500/[0.18] px-2 py-0.5 text-caption font-medium uppercase tracking-wide text-accent-300">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-body-sm text-ink-200 hover:bg-white/5"
                    onClick={() => setMenuOpen(false)}
                  >
                    <SettingsIcon className="h-3.5 w-3.5" />
                    Settings
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-body-sm text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-5xl px-8 py-10"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
