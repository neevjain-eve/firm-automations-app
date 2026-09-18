// See resolve-mock.mjs for what this loader does and why it's test-only.
import { register } from 'node:module';
register('./resolve-mock.mjs', import.meta.url);
