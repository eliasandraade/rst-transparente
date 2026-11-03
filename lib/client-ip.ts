/**
 * IP do cliente para rate limit e registro. Nunca o primeiro valor de
 * `X-Forwarded-For`: quem chama escreve o que quiser ali. No Railway, o edge
 * sobrescreve `X-Real-IP` com o IP real da conexão; é ele que vale
 * (`CLIENT_IP_HEADER`, padrão `x-real-ip`). Sem o cabeçalho confiável, "unknown":
 * todos os pedidos sem IP dividem o mesmo limite, o que falha para o lado seguro.
 */
export function clientIp(request: Request): string {
  const header = (process.env.CLIENT_IP_HEADER ?? "x-real-ip").toLowerCase();
  const value = request.headers.get(header)?.split(",")[0]?.trim();
  if (!value || value.length > 64 || !/^[0-9a-fA-F:.]+$/.test(value)) return "unknown";
  return value;
}
