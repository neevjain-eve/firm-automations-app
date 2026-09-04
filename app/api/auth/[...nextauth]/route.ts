import NextAuth from 'next-auth';
import { buildAuthOptions } from '@/lib/auth';

// Options are built per-request (rather than once at import time) so that
// Azure AD credentials saved in Settings -> Connections take effect straight
// away, without waiting for a redeploy.
async function handler(req: Request, ctx: { params: { nextauth: string[] } }) {
  const options = await buildAuthOptions();
  return NextAuth(req as any, ctx as any, options) as any;
}

export { handler as GET, handler as POST };
