/**
 * Configuração do Orken ID e da Platform (docs/orken-cond/identidade.md): todas as
 * variáveis ou nenhuma. Nenhuma: o COND segue só com o login local e o botão do
 * Orken ID não aparece. Metade: erro dizendo o que falta, sem ecoar valores.
 */

export interface OrkenConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  platformApiUrl: string;
  serviceClientId: string;
  serviceClientSecret: string;
  /** Origem pública do COND: callback e retorno do logout saem daqui, nunca da requisição. */
  appBaseUrl: string;
  eventsSync: boolean;
}

const REQUIRED = [
  "ORKEN_ISSUER",
  "ORKEN_CLIENT_ID",
  "ORKEN_CLIENT_SECRET",
  "PLATFORM_API_URL",
  "ORKEN_SERVICE_CLIENT_ID",
  "ORKEN_SERVICE_CLIENT_SECRET",
  "APP_BASE_URL",
] as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

function origin(name: string, value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} não é uma URL`);
  }
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(local && process.env.NODE_ENV !== "production")) {
    throw new Error(`${name} precisa ser HTTPS`);
  }
  return url.origin;
}

let cached: OrkenConfig | null | undefined;

/** null quando o Orken ID não está configurado; lança se a configuração estiver pela metade. */
export function orkenConfig(env: NodeJS.ProcessEnv = process.env): OrkenConfig | null {
  if (env === process.env && cached !== undefined) return cached;
  const present = REQUIRED.filter((name) => (env[name] ?? "").trim() !== "");
  let config: OrkenConfig | null = null;
  if (present.length > 0) {
    const missing = REQUIRED.filter((name) => !present.includes(name));
    if (missing.length > 0) throw new Error(`Orken ID configurado pela metade; falta: ${missing.join(", ")}`);
    const value = (name: (typeof REQUIRED)[number]) => env[name]!.trim();
    config = {
      issuer: origin("ORKEN_ISSUER", value("ORKEN_ISSUER")),
      clientId: value("ORKEN_CLIENT_ID"),
      clientSecret: value("ORKEN_CLIENT_SECRET"),
      platformApiUrl: origin("PLATFORM_API_URL", value("PLATFORM_API_URL")),
      serviceClientId: value("ORKEN_SERVICE_CLIENT_ID"),
      serviceClientSecret: value("ORKEN_SERVICE_CLIENT_SECRET"),
      appBaseUrl: origin("APP_BASE_URL", value("APP_BASE_URL")),
      eventsSync: (env.PLATFORM_EVENTS_SYNC ?? "on").trim().toLowerCase() !== "off",
    };
  }
  if (env === process.env) cached = config;
  return config;
}

/** Só para testes. */
export function resetOrkenConfig(): void {
  cached = undefined;
}

export const callbackUrl = (config: OrkenConfig) => `${config.appBaseUrl}/api/auth/orken/callback`;
export const postLogoutUrl = (config: OrkenConfig) => `${config.appBaseUrl}/`;
