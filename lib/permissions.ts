// Single source of truth for which trackers exist and which URL prefixes
// (both the page and its API routes) belong to each one. Used by:
//  - middleware.ts, to block a page/API route a user isn't permitted for
//  - components/AppShell.tsx, to only show nav links a user can open
//  - app/(dashboard)/admin/page.tsx, to render the permission checkboxes
export const TRACKERS = [
  { key: 'status-tracker', label: 'Status Tracker', paths: ['/status-tracker', '/api/status-tracker'] },
  { key: 'el-tracker', label: 'EL Tracker', paths: ['/el-tracker', '/api/el-tracker'] },
  { key: 'gst-reconciliation', label: 'GST Reconciliation', paths: ['/gst-reconciliation', '/api/gst-reconciliation'] },
  { key: 'lease-agreement', label: 'Lease Agreement', paths: ['/lease-agreement', '/api/lease-agreement'] },
  { key: 'todo-list', label: 'To-Do List', paths: ['/todo-list', '/api/todo-list'] },
  { key: 'e-signature', label: 'e-Signature', paths: ['/e-signature', '/api/e-signature'] }
] as const;

export type TrackerKey = (typeof TRACKERS)[number]['key'];

export const TRACKER_KEYS: TrackerKey[] = TRACKERS.map((t) => t.key);

export function isTrackerKey(value: string): value is TrackerKey {
  return (TRACKER_KEYS as string[]).includes(value);
}

// Admins implicitly have every tracker; everyone else is limited to their
// allowedTrackers list (set by an admin in /admin).
export function hasTrackerAccess(
  user: { role?: string; allowedTrackers?: string[] } | null | undefined,
  trackerKey: string
): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return (user.allowedTrackers ?? []).includes(trackerKey);
}

// Given a request pathname, find which tracker (if any) it belongs to.
// Returns null for routes that aren't tracker-gated (dashboard, settings,
// admin, auth, legacy tools with their own login, etc).
export function trackerForPath(pathname: string): TrackerKey | null {
  for (const tracker of TRACKERS) {
    if (tracker.paths.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
      return tracker.key;
    }
  }
  return null;
}
