import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== 'admin') redirect('/');

  return (
    <div>
      <p className="mb-1.5 text-[13px] font-medium text-accent-400">Admin</p>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white">User Access</h1>
      <p className="mb-8 max-w-2xl text-[13px] text-zinc-500">
        Add Manager and Employee accounts here, then tick which trackers each one can open. Once
        an account exists, that person signs in with their Microsoft (PDKA) work account — no
        separate password needed.
      </p>
      <AdminUsersClient />
    </div>
  );
}
