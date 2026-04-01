import type { TipoLancamento, StatusPublicacao, Role } from "@prisma/client";

export type { TipoLancamento, StatusPublicacao, Role };

export interface LancamentoComCategoria {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: string; // Decimal serialized as string
  data: string;
  fornecedor: string | null;
  observacoes: string | null;
  periodo: string;
  status: StatusPublicacao;
  categoria: {
    id: string;
    nome: string;
    cor: string;
  };
}

export interface ParecerPublico {
  id: string;
  periodoRef: string;
  titulo: string;
  texto: string | null;
  arquivoUrl: string | null;
  arquivoNome: string | null;
  dataEmissao: string;
  membrosConselho: string | null;
}

export interface MetricasPeriodo {
  periodo: string;
  receitaTotal: number;
  despesaTotal: number;
  saldo: number;
  despesasPorCategoria: {
    categoriaId: string;
    categoriaNome: string;
    categoriaCor: string;
    total: number;
    percentual: number;
  }[];
  evolucaoMensal: {
    periodo: string;
    receita: number;
    despesa: number;
    saldo: number;
  }[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}
