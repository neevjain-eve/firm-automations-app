'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ListChecks,
  FileClock,
  Receipt,
  Building2,
  CheckSquare2,
  PenTool,
  ArrowUpRight,
  Sparkles,
  type LucideIcon
} from 'lucide-react';
import { Automation } from '@/lib/automations';

const ICONS: Record<string, LucideIcon> = {
  'status-tracker': ListChecks,
  'el-tracker': FileClock,
  'gst-reconciliation': Receipt,
  'lease-agreement': Building2,
  'todo-list': CheckSquare2,
  'e-signature': PenTool
};

const GRADIENTS: Record<string, string> = {
  'status-tracker': 'from-sky-500 to-blue-600',
  'el-tracker': 'from-amber-500 to-orange-600',
  'gst-reconciliation': 'from-emerald-500 to-teal-600',
  'lease-agreement': 'from-fuchsia-500 to-purple-600',
  'todo-list': 'from-rose-500 to-pink-600',
  'e-signature': 'from-indigo-500 to-violet-600'
};

export default function AutomationCard({
  automation,
  index = 0
}: {
  automation: Automation;
  index?: number;
}) {
  const isLive = automation.status === 'live';
  const Icon = ICONS[automation.id] ?? Sparkles;
  const gradient = GRADIENTS[automation.id] ?? 'from-zinc-500 to-zinc-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: 'easeOut' }}
      whileHover={isLive ? { y: -3 } : undefined}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-card"
    >
      {/* subtle gradient glow on hover */}
      <div
        className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20`}
      />

      <div className="relative">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.35)]`}
          >
            <Icon className="h-[17px] w-[17px]" strokeWidth={2.25} />
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            {isLive ? 'Live' : 'Coming soon'}
          </span>
        </div>
        <h3 className="mb-1 text-[15px] font-semibold tracking-tight text-zinc-900">
          {automation.name}
        </h3>
        <p className="text-[13px] leading-relaxed text-zinc-500">{automation.description}</p>
      </div>

      {isLive ? (
        <Link
          href={automation.href ?? `/automations/${automation.id}`}
          className="relative mt-4 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-zinc-900 transition-colors group-hover:text-accent-600"
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      ) : (
        <span className="relative mt-4 inline-flex w-fit text-[13px] font-medium text-zinc-300">
          Open
        </span>
      )}
    </motion.div>
  );
}
