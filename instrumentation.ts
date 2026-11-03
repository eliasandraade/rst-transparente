/**
 * Início do servidor Node: valida a configuração do Orken ID (pela metade, o boot
 * falha dizendo o que falta) e agenda o consumidor do feed de eventos da Platform.
 * O import fica dentro do `if`: assim o bundle do runtime Edge não leva node:crypto.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startOrkenServices } = await import("@/lib/orken/boot");
    startOrkenServices();
  }
}
