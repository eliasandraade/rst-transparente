import type { NextAuthConfig } from "next-auth";

/**
 * Parte da configuração do NextAuth que roda no middleware (runtime Edge): só
 * sessão JWT e callbacks, sem provedor, banco ou Redis. O provedor de credenciais
 * (bcrypt, Prisma, rate limit no Redis) fica em lib/auth.ts, só nas rotas Node.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
