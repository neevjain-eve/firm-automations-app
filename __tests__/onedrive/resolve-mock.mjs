// Tiny ESM loader hook used ONLY when running store.race-and-crud.test.ts
// standalone via `node --experimental-strip-types --import ./resolve-mock.mjs`.
// Redirects the one bare specifier lib/onedrive/store.ts's source imports
// (./graph-client) to this test's mock, and adds the .ts extension Node's
// native ESM resolver requires but Next.js's bundler doesn't. The shipped
// app never loads this file -- it's test-only plumbing, not part of the
// build.
import { pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === './graph-client' && context.parentURL?.endsWith('/lib/onedrive/store.ts')) {
    return nextResolve(new URL('../../__tests__/onedrive/mock-graph-client.ts', context.parentURL).href, context);
  }
  return nextResolve(specifier, context);
}
