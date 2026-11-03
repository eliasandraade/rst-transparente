import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { clientIp } from "@/lib/client-ip";
import { RATE_LIMITS, rateLimit } from "@/lib/rate-limit";
import { findActiveOrganization, scopedClient } from "@/lib/tenant";

/** bcrypt (custo 12) de um valor aleatório descartado: conta inexistente custa o mesmo que senha errada. */
const DUMMY_PASSWORD_HASH = "$2a$12$oC7qH4I5pMqlirmEAvkpD.xeYDZfcqwz2wVQi8eYPJ6Wh.wrNzsNi";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
        // Slug do condomínio da página de login: a conta é procurada só nele.
        organization: { label: "Condomínio", type: "text" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;
        // Tentativas por IP confiável; acima do limite (ou sem Redis em produção), recusa.
        const limited = await rateLimit(RATE_LIMITS.login, clientIp(request as Request));
        if (!limited.allowed) return null;

        // Teclado do celular costuma pôr maiúscula ou espaço no fim do e-mail
        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        const org = await findActiveOrganization(String(credentials.organization ?? ""));
        const user = org ? await scopedClient(org.id).user.findFirst({ where: { email } }) : null;

        const senhaValida = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
        if (!org || !user || !user.ativo || !senhaValida) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: org.id,
          organizationSlug: org.slug,
        };
      },
    }),
  ],
});
