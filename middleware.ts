import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { trackerForPath, hasTrackerAccess } from '@/lib/permissions';

// Every route except the login page, the public privacy policy, NextAuth's
// own API routes, the secret-protected admin bootstrap endpoint, and public
// static assets (PWA manifest/icons/service worker, Digital Asset Links for
// the Android app) requires an authenticated, firm-domain session. On top of
// that base auth check, tracker routes (both the page and its API) are
// gated per-user by the allowedTrackers set in /admin -- see lib/permissions.ts.
export default withAuth(
  function middleware(req) {
    const trackerKey = trackerForPath(req.nextUrl.pathname);
    if (trackerKey && !hasTrackerAccess(req.nextauth.token as any, trackerKey)) {
      if (req.nextUrl.pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'forbidden' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  },
  { pages: { signIn: '/login' } }
);

export const config = {
  matcher: [
    // api/login, api/employees, api/managers, api/personal-tasks, api/seed,
    // api/sync-calendar, api/tasks: root paths the literally-copied
    // TO-DO-LIST frontend calls directly (rewritten to api/legacy-todo/* in
    // next.config.mjs) -- that app has its own independent login, so these
    // must bypass this app's session gate too, same as api/legacy-todo/legacy.
    '/((?!api/auth|api/admin|api/legacy-todo|api/login|api/employees|api/managers|api/personal-tasks|api/seed|api/sync-calendar|api/tasks|legacy|login|signup|privacy|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-|\\.well-known).*)'
  ]
};
