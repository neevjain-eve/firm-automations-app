// Small join helper: User accounts stay on Postgres (auth is out of scope
// for the OneDrive cutover -- see lib/auth.ts), but every OneDrive-backed
// collection stores only a userId string (createdById, userId, etc.), the
// same "no enforced relations, join in app code" pattern used everywhere
// else in lib/onedrive/store.ts. Routes that used to get `createdBy: {
// select: { name, email } }` for free from Prisma's `include` now fetch the
// user list once per request and look names up from this map instead.
import { prisma } from '@/lib/prisma';

export type UserLite = { id: string; name: string; email: string };

export async function getUserLiteMap(): Promise<Map<string, UserLite>> {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
  return new Map(users.map((u) => [u.id, u]));
}

// Shape-compatible with what Prisma's `createdBy: { select: { name, email } }`
// used to return, so callers/response shapes barely change.
export function userRef(map: Map<string, UserLite>, userId: string | null | undefined) {
  if (!userId) return null;
  const u = map.get(userId);
  return u ? { name: u.name, email: u.email } : null;
}
