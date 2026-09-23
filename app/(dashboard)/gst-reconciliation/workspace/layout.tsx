'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/gst-reconciliation/workspace/clients', label: 'Clients & GSTINs' },
  { href: '/gst-reconciliation/workspace/upload', label: 'Upload' },
  { href: '/gst-reconciliation/workspace/tracker', label: 'Tracker' },
  { href: '/gst-reconciliation/workspace/reports', label: 'Reports' },
  { href: '/gst-reconciliation/workspace/portal-helper', label: 'Portal helper' }
];

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/gst-reconciliation" className="text-xs text-zinc-500 hover:text-zinc-300">
            ← GST Reconciliation
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Invoice reconciliation</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Match purchase invoices against GSTR-2B, GSTIN by GSTIN and period by period.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-white/10">
        {TABS.map((t) => {
          const active = pathname === t.href || pathname?.startsWith(t.href + '/');
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                active ? 'border-b-2 border-accent-500 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}
