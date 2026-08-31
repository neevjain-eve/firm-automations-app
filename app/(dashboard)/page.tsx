import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { automations } from '@/lib/automations';
import AutomationCard from '@/components/AutomationCard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const firstName = (session?.user?.name ?? session?.user?.email ?? 'there').split(' ')[0];
  const liveCount = automations.filter((a) => a.status === 'live').length;

  return (
    <div>
      <header className="relative mb-12 overflow-hidden rounded-3xl border border-zinc-100 bg-gradient-to-br from-zinc-50 via-white to-accent-50/40 px-8 py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 -top-16 h-56 w-56 animate-blob rounded-full bg-accent-200/40 blur-3xl" />
          <div className="absolute -right-8 top-4 h-56 w-56 animate-blob rounded-full bg-fuchsia-200/30 blur-3xl [animation-delay:4s]" />
          <div className="absolute bottom-[-4rem] left-1/3 h-56 w-56 animate-blob rounded-full bg-sky-200/30 blur-3xl [animation-delay:8s]" />
          <div className="absolute inset-0 bg-grid-pattern bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_85%)]" />
        </div>

        <div className="relative">
          <p className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-[12px] font-medium text-accent-700 ring-1 ring-inset ring-accent-100 backdrop-blur">
            Dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Welcome back, {firstName}.
          </h1>
          <p className="mt-2 text-[14px] text-zinc-500">
            {liveCount} automation{liveCount === 1 ? '' : 's'} ready to use.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {automations.map((automation, index) => (
          <AutomationCard key={automation.id} automation={automation} index={index} />
        ))}
      </div>
    </div>
  );
}
