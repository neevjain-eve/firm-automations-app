import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { automations } from '@/lib/automations';
import { hasTrackerAccess } from '@/lib/permissions';
import AutomationCard from '@/components/AutomationCard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const firstName = (session?.user?.name ?? session?.user?.email ?? 'there').split(' ')[0];
  const visibleAutomations = automations.filter((a) => hasTrackerAccess(session?.user as any, a.id));
  const liveCount = visibleAutomations.filter((a) => a.status === 'live').length;

  return (
    <div>
      <header className="relative mb-12 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/40 px-8 py-12">
        <div className="pointer-events-none absolute inset-0 bg-radial-spotlight" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-16 -top-20 h-64 w-64 animate-blob rounded-full bg-accent-500/20 blur-3xl" />
          <div className="absolute -right-10 top-0 h-64 w-64 animate-blob rounded-full bg-fuchsia-500/10 blur-3xl [animation-delay:4s]" />
          <div className="absolute inset-0 bg-grid-pattern bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        </div>

        <div className="relative">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-accent-500/20 bg-accent-500/10 px-3 py-1 text-[12px] font-medium text-accent-300">
            Dashboard
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Welcome back,
            <br />
            <span className="bg-gradient-to-r from-white via-accent-200 to-accent-400 bg-clip-text text-transparent">
              {firstName}.
            </span>
          </h1>
          <p className="mt-3 text-[14px] text-zinc-400">
            {liveCount} automation{liveCount === 1 ? '' : 's'} ready to use.
          </p>
        </div>
      </header>

      {visibleAutomations.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center text-[13px] text-zinc-500">
          You don't have access to any trackers yet. Ask an admin to grant you access.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleAutomations.map((automation, index) => (
            <AutomationCard key={automation.id} automation={automation} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
