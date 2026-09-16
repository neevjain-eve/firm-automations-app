'use client';

import { useSession } from 'next-auth/react';

// Literal copy of the original Agreement-Tracker-PDKA GitHub app: this
// iframe loads its unmodified UI/business logic (public/legacy/el-tracker/
// index.html), including its own IndexedDB-based offline merge/conflict
// handling. The one deliberate change from the original: OneDrive/Graph sync
// (which relied on a client-side GitHub write token to refresh a shared
// "master token" cached in a public repo file) has been replaced with a
// plain Postgres-backed API (/api/legacy-el-tracker/*), session-gated by
// this app's own login. That original token had leaked publicly, so this
// port does not reproduce that pattern. Everything else -- agreements,
// bills, client tasks, the in-app staff login screen, rendering -- is
// untouched. First-time setup uses a default admin login (admin / admin123)
// -- change it after first sign-in.
//
// Single sign-on: since this page only ever loads for someone already
// signed into the main app, we pass their email/name into the iframe as
// query params. The tracker's own login screen (ssoAutoLogin(), added
// inside index.html) matches or auto-provisions a local staff account for
// that email and signs them straight in -- no second Microsoft popup.
export default function ElTrackerPage() {
  const { data: session } = useSession();
  const email = session?.user?.email;
  const name = session?.user?.name;
  const src = email
    ? `/legacy/el-tracker/index.html?ssoEmail=${encodeURIComponent(email)}${name ? `&ssoName=${encodeURIComponent(name)}` : ''}`
    : '/legacy/el-tracker/index.html';
  return (
    <iframe
      src={src}
      title="EL Tracker"
      style={{ width: '100%', height: '100vh', border: 'none', background: '#fff' }}
    />
  );
}
