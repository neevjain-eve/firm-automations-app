// Standalone tests for lib/onedrive/store.ts's optimistic-concurrency
// retry logic -- the part of the OneDrive backend most worth verifying
// before it holds real data, since a bug here means silently losing writes.
//
// No test framework dependency (the project has none installed yet): this
// runs directly under Node's native TypeScript support. Run from the repo
// root:
//   node --experimental-strip-types --import ./__tests__/onedrive/register-mock.mjs __tests__/onedrive/store.race-and-crud.test.ts
//
// It exercises the REAL lib/onedrive/store.ts against a mock
// (./mock-graph-client.ts) standing in for lib/onedrive/graph-client.ts --
// an in-memory fake with injectable conflicts, so the retry-on-412 path and
// the "two people write to a brand-new file at once" race (see
// mock-graph-client.ts's writeJsonFile) can be triggered deterministically
// without a live Microsoft Graph connection.

import { readCollection, mutateCollection, insertRow, updateRow, deleteRow } from '../../lib/onedrive/store.ts';
import { __reset, __seed, __forceConflicts, __writeCallCount } from './mock-graph-client.ts';

let failures = 0;
function assertEqual(actual: unknown, expected: unknown, label: string) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.error(`FAIL: ${label}\n  expected: ${e}\n  actual:   ${a}`);
  } else {
    console.log(`ok - ${label}`);
  }
}
async function assertThrows(fn: () => Promise<unknown>, label: string) {
  try {
    await fn();
    failures++;
    console.error(`FAIL: ${label} (expected throw, got none)`);
  } catch {
    console.log(`ok - ${label}`);
  }
}

async function main() {
  // 1. readCollection on a file that doesn't exist yet returns [].
  __reset();
  assertEqual(await readCollection('missing'), [], 'readCollection returns [] for a missing file');

  // 2. insertRow appends and persists.
  __reset();
  await insertRow('rows', { id: 'a', v: 1 });
  await insertRow('rows', { id: 'b', v: 2 });
  assertEqual(
    await readCollection('rows'),
    [{ id: 'a', v: 1 }, { id: 'b', v: 2 }],
    'insertRow appends rows in order'
  );

  // 3. updateRow patches only the matching row.
  __reset();
  __seed('rows.json', [{ id: 'a', v: 1 }, { id: 'b', v: 2 }]);
  await updateRow('rows', 'b', { v: 99 });
  assertEqual(
    await readCollection('rows'),
    [{ id: 'a', v: 1 }, { id: 'b', v: 99 }],
    'updateRow patches the matching row and leaves others untouched'
  );

  // 4. updateRow on a nonexistent id throws (mirrors Prisma .update() semantics).
  __reset();
  __seed('rows.json', [{ id: 'a', v: 1 }]);
  await assertThrows(() => updateRow('rows', 'nope', { v: 1 }), 'updateRow throws for an unknown id');

  // 5. deleteRow removes the row; deleting an already-gone id is a no-op (no throw).
  __reset();
  __seed('rows.json', [{ id: 'a' }, { id: 'b' }]);
  await deleteRow('rows', 'a');
  assertEqual(await readCollection('rows'), [{ id: 'b' }], 'deleteRow removes the matching row');
  await deleteRow('rows', 'a'); // already gone
  assertEqual(await readCollection('rows'), [{ id: 'b' }], 'deleteRow on an already-missing id is a no-op');

  // 6. THE IMPORTANT ONE: a write that hits a 412 conflict is retried, and the
  // retry re-reads the (now-changed) current state rather than blindly
  // reapplying the stale mutation -- this is what makes concurrent edits from
  // two people safe instead of one silently clobbering the other's write.
  __reset();
  __seed('rows.json', [{ id: 'a', v: 1 }]);
  __forceConflicts(2); // first two write attempts get 412, third succeeds
  const result = await mutateCollection('rows', (current) => [...current, { id: 'b', v: 2 }]);
  assertEqual(result, [{ id: 'a', v: 1 }, { id: 'b', v: 2 }], 'mutateCollection succeeds after retrying past conflicts');
  assertEqual(__writeCallCount(), 3, 'mutateCollection made exactly 3 write attempts (2 conflicts + 1 success)');

  // 7. Exhausting all retries surfaces the conflict as a real error rather
  // than silently giving up or corrupting data.
  __reset();
  __seed('rows.json', [{ id: 'a', v: 1 }]);
  __forceConflicts(999); // always conflicts
  await assertThrows(
    () => mutateCollection('rows', (current) => [...current, { id: 'z', v: 0 }]),
    'mutateCollection eventually throws instead of retrying forever'
  );

  // 8. Two "concurrent" mutations on a fresh collection both land (simulates
  // two users saving at nearly the same time without one clobbering the
  // other), proving the read-modify-write-retry loop actually serializes them.
  __reset();
  const [r1, r2] = await Promise.all([
    mutateCollection<{ id: string }>('concurrent', (current) => [...current, { id: 'x' }]),
    mutateCollection<{ id: string }>('concurrent', (current) => [...current, { id: 'y' }])
  ]);
  const finalIds = (await readCollection<{ id: string }>('concurrent')).map((r) => r.id).sort();
  assertEqual(finalIds, ['x', 'y'], 'two concurrent mutateCollection calls both land, neither is lost');

  console.log(failures === 0 ? `\nAll tests passed.` : `\n${failures} test(s) FAILED.`);
  process.exitCode = failures === 0 ? 0 : 1;
}

main();
