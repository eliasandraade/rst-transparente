import type { NextAuthConfig } from "next-auth";

/**
 * Parte da configuração do NextAuth que roda no middleware (runtime Edge): só
 * sessão JWT e callbacks, sem provedor, banco ou Redis. O provedor de credenciais
 * (bcrypt, Prisma, rate limit no Redis) fica em lib/auth.ts, só nas rotas Node.
 *
 * O token guarda a organização em que a sessão foi aberta; papel e status da conta
 * são relidos do banco a cada requisição (lib/staff.ts), nunca confiados ao token.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  // Login e erro ficam no condomínio (/{slug}/admin/login); o middleware redireciona.
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const account = user as { id?: string; role?: string; organizationId?: string; organizationSlug?: string };
        token.id = account.id;
        token.role = account.role;
        token.organizationId = account.organizationId;
        token.organizationSlug = account.organizationSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.organizationId = token.organizationId as string;
        session.user.organizationSlug = token.organizationSlug as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
