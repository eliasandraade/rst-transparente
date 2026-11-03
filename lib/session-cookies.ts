/**
 * Nomes dos cookies da sessão da equipe, sem dependência de servidor (o middleware,
 * no runtime Edge, também lê). Em produção, prefixo `__Host-`: só HTTPS, só este
 * host, caminho `/`; nenhum subdomínio consegue gravar por cima.
 */
const secure = process.env.NODE_ENV === "production";

export const SESSION_COOKIE = secure ? "__Host-cond_session" : "cond_session";
export const CSRF_COOKIE = secure ? "__Host-cond_csrf" : "cond_csrf";
/** Cabeçalho que o site manda nas escritas, com o valor do cookie de CSRF. */
export const CSRF_HEADER = "x-cond-csrf";
/** Vínculo do navegador com a transação de login no Orken ID (state). */
export const ORKEN_TX_COOKIE = secure ? "__Host-cond_orken" : "cond_orken";
