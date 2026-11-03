/**
 * O que cada papel local faz DENTRO do condomínio (docs/orken-cond/arquitetura.md,
 * seção 5). A Orken Platform decide se a pessoa pode acessar o COND daquela
 * organização; esta matriz decide o resto, sempre no backend.
 *
 * É a matriz de antes da migração, sem mudança de efeito: os quatro papéis editam
 * todo o conteúdo; usuários só MASTER e SINDICO; configurações só MASTER. Mudar
 * isso (por exemplo, o Conselho Fiscal só ler o financeiro) é decisão de produto:
 * muda aqui, num lugar só. MASTER é local ao condomínio; nunca administrador da
 * Platform.
 */

export const ROLES = ["MASTER", "SINDICO", "GESTAO", "CONSELHO"] as const;
export type Role = (typeof ROLES)[number];

const TODOS: readonly Role[] = ROLES;

export const PERMISSIONS = {
  "financeiro.editar": TODOS,
  "importacao.executar": TODOS,
  "pareceres.editar": TODOS,
  "planilhas.editar": TODOS,
  "avisos.editar": TODOS,
  "obras.editar": TODOS,
  "enquetes.editar": TODOS,
  "membros.editar": TODOS,
  "propostas.responder": TODOS,
  "demandas.atender": TODOS,
  "juridico.editar": TODOS,
  "arquivos.enviar": TODOS,
  "usuarios.gerenciar": ["MASTER", "SINDICO"],
  "configuracoes.editar": ["MASTER"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string | undefined | null, permission: Permission): boolean {
  return !!role && (PERMISSIONS[permission] as readonly string[]).includes(role);
}
