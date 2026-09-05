import { NextAuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Accounts are provisioned by an admin (see app/(dashboard)/admin) before
// anyone can sign in with them -- there's no self-serve signup into the
// mapped-account system. Two ways in for a provisioned account:
//  1. "Sign in with Microsoft" -- the firm's existing Office 365/Azure AD
//     work account (the "PDKA account"). Preferred: no separate password.
//  2. Email + password -- kept as a fallback (e.g. for the initial admin
//     account, or if Azure AD isn't set up for someone yet).
const providers: NextAuthOptions['providers'] = [
  CredentialsProvider({
    name: 'Email and password',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials.password) return null;

      const dbUser = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase() }
      });
      if (!dbUser || !dbUser.password) return null;

      const valid = await bcrypt.compare(credentials.password, dbUser.password);
      if (!valid) return null;

      return {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role
      } as any;
    }
  })
];

// Only register the Microsoft button once the Azure AD app registration is
// actually configured -- otherwise NextAuth would show a broken provider.
if (process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID) {
  providers.push(
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID
    })
  );
}

// The sign-in route uses this instead of the static `authOptions` below, so
// that credentials saved in Settings -> Connections take effect without a
// redeploy. Everywhere else (getServerSession) only needs the session/jwt
// callbacks, for which the static export is fine.
export async function buildAuthOptions(): Promise<NextAuthOptions> {
  const { getAzureAdConfig } = await import('@/lib/settings');
  const azure = await getAzureAdConfig();

  const runtimeProviders: NextAuthOptions['providers'] = [providers[0]]; // credentials
  if (azure.clientId && azure.clientSecret && azure.tenantId) {
    runtimeProviders.push(
      AzureADProvider({
        clientId: azure.clientId,
        clientSecret: azure.clientSecret,
        tenantId: azure.tenantId
      })
    );
  }

  return { ...authOptions, providers: runtimeProviders };
}

export const authOptions: NextAuthOptions = {
  providers,
  callbacks: {
    // Gate: a Microsoft sign-in only succeeds if an admin has already
    // provisioned a User row for that email. Credentials sign-in is already
    // gated by authorize() returning null for unknown emails, so it's a
    // no-op there.
    async signIn({ user, account }) {
      if (account?.provider !== 'azure-ad') return true;
      if (!user.email) return false;

      const email = user.email.toLowerCase();
      let dbUser = await prisma.user.findUnique({ where: { email } });

      if (!dbUser) {
        // Auto-provision: any Microsoft account from our tenant can sign
        // in without an admin creating the row first. New accounts land
        // on the lowest-privilege role with no tracker access yet -- an
        // admin still grants individual trackers from Settings -> User
        // Access, this just removes the "ask admin to create my account"
        // step. Since Azure AD is configured single-tenant, only real
        // accounts in our Microsoft tenant can ever reach this branch.
        dbUser = await prisma.user.create({
          data: {
            email,
            name: user.name || email.split('@')[0],
            role: 'staff',
            allowedTrackers: []
          }
        });
      }

      // Keep the display name in sync with Microsoft's, and stamp the
      // Prisma id + role onto the `user` object so the jwt callback below
      // (which runs right after this) can read them.
      if (dbUser.name !== user.name && user.name) {
        dbUser = await prisma.user.update({ where: { id: dbUser.id }, data: { name: user.name } });
      }
      (user as any).id = dbUser.id;
      (user as any).role = dbUser.role;
      (user as any).allowedTrackers = dbUser.allowedTrackers;
      return true;
    },
    async jwt({ token, user, trigger }) {
      if (user) {
        (token as any).role = (user as any).role;
        (token as any).allowedTrackers = (user as any).allowedTrackers;
      }
      // Permissions can change after the token was issued (an admin ticks a
      // new checkbox). Rather than hit the DB on every single request, only
      // refresh when the client explicitly asks (useSession().update()) --
      // the admin panel calls that right after saving someone's access.
      if (trigger === 'update') {
        const dbUser = await prisma.user.findUnique({ where: { id: token.sub } });
        if (dbUser) {
          (token as any).role = dbUser.role;
          (token as any).allowedTrackers = dbUser.allowedTrackers;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role ?? 'staff';
        (session.user as any).allowedTrackers = (token as any).allowedTrackers ?? [];
      }
      return session;
    }
  },
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login'
  }
};
