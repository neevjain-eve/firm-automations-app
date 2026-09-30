'use client';

import { useSession } from 'next-auth/react';

// Literal copy of the original Status-Tracker GitHub app: this iframe loads
// its unmodified UI/business logic (public/legacy/status-tracker/index.html),
// with one deliberate change from the original -- the OneDrive/Microsoft
// Graph sync (which relied on a client-side GitHub write token to refresh a
// shared "master token" cached in a public repo file) has been replaced with
// a plain Postgres-backed API (/api/legacy-status-tracker/*), session-gated
// by this app's own login. That original token leaked publicly, so this port
// does not reproduce that pattern. Everything else -- task fields, filters,
// the in-app staff login screen, rendering -- is untouched.
//
// Single sign-on: since this page only ever loads for someone already
// signed into the main app, we pass their email/name/role into the iframe
// as query params, which its login screen reads (see the ssoEmail/ssoName
// useEffect added to the Login component) to match or auto-provision a
// local account and sign them straight in -- no second Microsoft popup.
// ssoRole matters for anyone the tracker's own user list doesn't already
// know about: without it, an unrecognized email used to silently default
// to "manager" even for this app's own admins.
export default function StatusTrackerPage() {
  const { data: session } = useSession();
  const email = session?.user?.email;
  const name = session?.user?.name;
  const role = (session?.user as any)?.role;
  const params = new URLSearchParams();
  if (email) params.set('ssoEmail', email);
  if (name) params.set('ssoName', name);
  if (role) params.set('ssoRole', role);
  const src = email
    ? `/legacy/status-tracker/index.html?${params.toString()}`
    : '/legacy/status-tracker/index.html';
  return (
    <iframe
      src={src}
      title="Status Tracker"
      style={{ width: '100%', height: '100vh', border: 'none', background: '#fff' }}
    />
  );
}
