// ID generator for OneDrive-backed rows, replacing Prisma's
// `@default(cuid())`. Just needs to be unique and URL-safe -- format
// doesn't matter since these ids are opaque strings to every caller
// (including comments/attachments, which reference them as entityId).
import { randomUUID } from 'crypto';

export function newId(): string {
  return randomUUID();
}
