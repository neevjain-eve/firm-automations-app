import Link from 'next/link';
import { Automation } from '@/lib/automations';

export default function AutomationCard({ automation }: { automation: Automation }) {
  const isLive = automation.status === 'live';

  return (
    <div className="group flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-card">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900">
            {automation.name}
          </h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              isLive ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
            }`}
          >
            {isLive ? 'Live' : 'Coming soon'}
          </span>
        </div>
        <p className="text-[13px] leading-relaxed text-zinc-500">{automation.description}</p>
      </div>
      {isLive ? (
        <Link
          href={automation.href ?? `/automations/${automation.id}`}
          className="mt-4 inline-flex items-center justify-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-center text-[13px] font-medium text-white transition-colors hover:bg-accent-600"
        >
          Open
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      ) : (
        <button
          disabled
          className="mt-4 cursor-not-allowed rounded-lg bg-zinc-50 px-3 py-1.5 text-[13px] font-medium text-zinc-400"
        >
          Open
        </button>
      )}
    </div>
  );
}
