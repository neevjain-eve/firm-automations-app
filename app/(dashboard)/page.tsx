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
      <header className="mb-10">
        <p className="mb-1.5 text-[13px] font-medium text-accent-600">Dashboard</p>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Welcome back, {firstName}.
        </h1>
        <p className="mt-1.5 text-[13px] text-zinc-500">
          {liveCount} automation{liveCount === 1 ? '' : 's'} ready to use.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {automations.map((automation) => (
          <AutomationCard key={automation.id} automation={automation} />
        ))}
      </div>
    </div>
  );
}
