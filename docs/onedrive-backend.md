# OneDrive backend

Replaces Postgres/Prisma with the firm's own SharePoint/OneDrive as the data
store. Every tracker record, user account, comment, and attachment metadata
row becomes a JSON file in a SharePoint document library instead of a
database row.

**Status: infrastructure built, not yet switched on.** The app still reads
and writes Postgres today. This is a parallel implementation you can finish
wiring up and cut over to when ready -- see "What's left" below.

## Why this shape

OneDrive/SharePoint is not a database: no SQL, no transactions across files,
no row-level locking. The design works around that:

- **One JSON file per collection.** Roughly one file per Prisma model (see
  `lib/onedrive/schema.ts` for the full list), each holding a flat array of
  records -- e.g. `/PDKA Data/status-tasks.json` is an array of every Status
  Tracker task. The three legacy trackers' key-value stores
  (`LegacyTodoStore`, `LegacyStatusStore`, `LegacyElTrackerStore`) map to one
  JSON *object* file each instead, keyed the same way those Prisma tables
  were keyed.
- **No enforced relations.** `CommentRow.userId` is just a string that
  happens to match a `UserRow.id` -- nothing stops it from pointing nowhere.
  Joins happen in application code by reading both collections and matching
  in memory. Fine at a single firm's data volume; not fine at real scale,
  which is a large part of why this tradeoff is worth naming explicitly.
- **Optimistic concurrency, at the file level.** Every write is
  read-modify-write: read the whole array + its ETag, apply the change,
  `PUT .../content` with `If-Match: <etag>`. If someone else wrote the same
  file in between, Graph returns 412 and `mutateCollection()` retries (up to
  5 times, with jittered backoff) -- re-reading the now-current state each
  time rather than blindly reapplying a stale change. See
  `lib/onedrive/store.ts`.
- **First-write race, narrowed not eliminated.** When a file doesn't exist
  yet, there's no `If-Match` value to send, so two people creating the same
  collection for the first time at the same instant could both "win". Graph
  has no atomic create-only-if-absent for this endpoint, so
  `lib/onedrive/graph-client.ts`'s `writeJsonFile` does a fresh existence
  check immediately before that specific write and fails as a conflict if
  the file has appeared since -- this shrinks the race window to a few
  milliseconds instead of removing it. Once a file exists once, every
  subsequent write is fully protected by its real ETag.

## Auth: same app registration, one new permission

The OneDrive backend calls Microsoft Graph as the *app itself*
(client-credentials flow), not as whichever user is signed in -- so it works
from background scripts too, not just logged-in-user requests.

It reuses the exact same Azure AD app registration ("PDKA App",
`AZURE_AD_CLIENT_ID`/`AZURE_AD_CLIENT_SECRET`/`AZURE_AD_TENANT_ID`, already
configured for "Sign in with Microsoft") -- no new app, no new secret. That
app registration just needs one more thing added under **API permissions**:

- **Microsoft Graph -> Application permissions -> `Files.ReadWrite.All`**,
  with tenant admin consent granted.

This is tenant-wide at the Azure AD level (Graph has no narrower
"just this one SharePoint site" application permission) -- the app code is
what keeps it scoped, by only ever touching the configured root folder (see
below). Only a **Global Administrator** (or Privileged Role Administrator)
can click "Grant admin consent" -- as of this write-up, that's Dilip Kumar,
Sowmya N, Aadit Tech, or the Admin M365 account; `clients@pdka.in` and
`naveen@pdka.in` are not Global Admins and can't grant it.

## Configuration

Settings -> Connections -> "OneDrive backend" (new section, added alongside
the existing Azure AD fields):

- **SharePoint site ID** -- the Graph-format site id
  (`contoso.sharepoint.com,<site guid>,<web guid>`), not the site URL.
- **Drive ID** (optional) -- leave blank to use the site's default document
  library.
- **Root folder** -- defaults to `PDKA Data`. Everything the app ever reads
  or writes lives under this one folder, so the permission being tenant-wide
  doesn't mean the app actually touches anything outside its own sandbox.

Same precedence as the existing Azure AD settings: values saved here win;
`ONEDRIVE_SITE_ID` / `ONEDRIVE_DRIVE_ID` / `ONEDRIVE_ROOT_FOLDER` env vars
are the fallback. "Test OneDrive connection" on that page gets a Graph
token and creates the root folder if it doesn't exist yet -- the fastest way
to confirm the site id and permission are both right.

## What's left

1. **Grant admin consent.** A Global Admin opens PDKA App -> API permissions
   in Entra and clicks "Grant admin consent for P. DILIP KUMAR &
   ASSOCIATES". The `Files.ReadWrite.All` permission is already added and
   waiting.
2. **Pick or create the SharePoint site.** Decide where "PDKA Data" lives --
   an existing site, or a new one created for this purpose -- and get its
   Graph site id into Settings -> Connections.
3. **Run the migration script** (`scripts/migrate-to-onedrive.ts`) to dump
   current Postgres data into the OneDrive JSON files. Read-only against
   Postgres, safe to re-run, doesn't affect the live app.
   `npx tsx scripts/migrate-to-onedrive.ts --dry-run` first to sanity-check
   row counts, then without `--dry-run` to actually write.
4. **Switch the app's routes over.** Every `app/api/**/route.ts` that
   currently calls `prisma.<model>.findMany/create/update/delete` needs to
   call the equivalent `lib/onedrive/store.ts` function instead
   (`readCollection` / `insertRow` / `updateRow` / `deleteRow` /
   `mutateCollection` for anything more custom). This is the biggest
   remaining piece and the one most worth doing incrementally, tracker by
   tracker, verifying each one before moving to the next, rather than as one
   giant cutover.
5. **Decide what happens to Postgres.** Once every route is switched over
   and verified, Postgres (and `AppSetting`, which becomes unreachable
   without a database -- Azure AD credentials would need to move to env-vars
   only at that point, the same way `DATABASE_URL` always has been) can be
   retired. Keep it running in parallel for a while first; there's no rush.

## Files

- `lib/onedrive/graph-auth.ts` -- app-only Graph token, cached in memory.
- `lib/onedrive/graph-client.ts` -- low-level read/write one JSON file, by
  path, with ETag handling. Not meant to be called directly by app code.
- `lib/onedrive/store.ts` -- the collection API app code should actually
  use: `readCollection`, `insertRow`, `updateRow`, `deleteRow`,
  `mutateCollection`.
- `lib/onedrive/schema.ts` -- collection name -> file name map, plus a
  TypeScript type per row shape (Dates as ISO strings; JSON has no Date
  type).
- `scripts/migrate-to-onedrive.ts` -- one-time Postgres -> OneDrive export.
- `__tests__/onedrive/store.race-and-crud.test.ts` -- verifies the retry
  logic against a mock Graph client (see that file for how to run it; no
  test framework is installed in this project yet).
