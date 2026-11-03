import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/client-ip";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;
        // Tentativas por IP confiável; acima do limite (ou sem Redis em produção), recusa.
        const limited = await rateLimit(RATE_LIMITS.login, clientIp(request as Request));
        if (!limited.allowed) return null;

        // Teclado do celular costuma pôr maiúscula ou espaço no fim do e-mail
        const email = (credentials.email as string).trim().toLowerCase();

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.ativo) return null;

        const senhaValida = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!senhaValida) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
});
