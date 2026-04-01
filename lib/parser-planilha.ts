import * as XLSX from "xlsx";

const MESES: Record<string, string> = {
  JANEIRO: "01", JAN: "01",
  FEVEREIRO: "02", FEV: "02",
  MARÇO: "03", MARCO: "03", MAR: "03",
  ABRIL: "04", ABR: "04",
  MAIO: "05", MAI: "05",
  JUNHO: "06", JUN: "06",
  JULHO: "07", JUL: "07",
  AGOSTO: "08", AGO: "08",
  SETEMBRO: "09", SET: "09",
  OUTUBRO: "10", OUT: "10",
  NOVEMBRO: "11", NOV: "11",
  DEZEMBRO: "12", DEZ: "12",
};

// Palavras-chave que indicam linha de resumo/saldo — não são lançamentos
const PALAVRAS_RESUMO = [
  "saldo", "total das", "caixa", "conta bancaria", "conta bancária",
  "taxas condominiais a receber", "resumo das", "disponibilidades",
  "fundo de reserva", // quando aparece no lado das receitas como saldo
];

export interface ItemPlanilha {
  tipo: "RECEITA" | "DESPESA";
  descricao: string;
  valor: number;
  /** true = provável cabeçalho de grupo (soma dos filhos), default unchecked no UI */
  ehCabecalho: boolean;
}

export interface AbaParsed {
  nomAba: string;
  periodo: string; // "YYYY-MM"
  itens: ItemPlanilha[];
}

function parsePeriodo(texto: string, nomeAba: string): string {
  // Tenta extrair de "JANEIRO / 2024" ou "FEVEREIRO.24" ou do nome da aba
  const fontes = [texto, nomeAba];
  for (const fonte of fontes) {
    const normalizado = fonte
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[^A-Z0-9\s]/g, " ");
    const partes = normalizado.split(/\s+/).filter(Boolean);

    for (const parte of partes) {
      if (MESES[parte]) {
        const mes = MESES[parte];
        const anoParte = partes.find((p) => /^\d{2,4}$/.test(p));
        if (!anoParte) continue;
        const ano = anoParte.length === 2 ? "20" + anoParte : anoParte;
        return `${ano}-${mes}`;
      }
    }
  }
  return "";
}

function isLinhaResumo(desc: string): boolean {
  const lower = desc.toLowerCase();
  return PALAVRAS_RESUMO.some((p) => lower.includes(p));
}

function isLinhaAssinatura(desc: string): boolean {
  // Detecta padrões de nome + cargo (linhas de assinatura — dados pessoais LGPD)
  const lower = desc.toLowerCase();
  return (
    lower.includes("síndico") ||
    lower.includes("sindico") ||
    lower.includes("contador") ||
    lower.includes("crc-") ||
    lower.includes("crc ")
  );
}

function detectaCabecalho(desc: string): boolean {
  const stripped = desc.trim();
  // Detecta grupos de despesas que são somas de subcategorias
  const padroesCabecalho = [
    "pessoal",
    "energia",
    "água",
    "agua",
    "telefone",
    "serviços contratados",
    "despesas operacionais",
    "despesas financeiras",
    "despesas tributária",
    "despesas tributaria",
    "despesas a reconhecer",
    "receita - cotas",
    "receitas financeiras",
    "ajustes de contas",
    "condominio",
  ];
  const lower = stripped.toLowerCase();
  if (padroesCabecalho.some((p) => lower.includes(p))) return true;
  // Texto em caixa alta com mais de 15 chars (categorias da planilha, não empresas)
  if (
    stripped === stripped.toUpperCase() &&
    stripped.length > 15 &&
    !/^\d/.test(stripped)
  )
    return true;
  return false;
}

export function parsePlanilha(buffer: Buffer): AbaParsed[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const resultado: AbaParsed[] = [];

  for (const nomAba of wb.SheetNames) {
    const ws = wb.Sheets[nomAba];
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, {
      header: 1,
      defval: null,
    });

    if (rows.length < 8) continue; // aba vazia ou inválida

    // Extrai período
    const textoLinha5 = String(rows[5]?.[0] ?? "");
    const periodo = parsePeriodo(textoLinha5, nomAba);
    if (!periodo) continue;

    const itens: ItemPlanilha[] = [];

    // Processa linhas 8 até penúltimas (ignora últimas 6 = assinaturas + espaços)
    const limiteInferior = Math.max(0, rows.length - 6);

    for (let i = 8; i < limiteInferior; i++) {
      const row = rows[i];

      // --- Lado esquerdo: Despesas (col 0 = desc, col 1 = valor) ---
      const descDesp = String(row?.[0] ?? "").trim();
      const valDesp = Number(row?.[1] ?? 0);
      if (descDesp && valDesp > 0 && !isLinhaAssinatura(descDesp)) {
        itens.push({
          tipo: "DESPESA",
          descricao: descDesp,
          valor: valDesp,
          ehCabecalho: detectaCabecalho(descDesp),
        });
      }

      // --- Lado direito: Receitas (col 3 = desc, col 4 = valor) ---
      const descRec = String(row?.[3] ?? "").trim();
      const valRec = Number(row?.[4] ?? 0);
      if (
        descRec &&
        valRec > 0 &&
        !isLinhaResumo(descRec) &&
        !isLinhaAssinatura(descRec)
      ) {
        itens.push({
          tipo: "RECEITA",
          descricao: descRec,
          valor: valRec,
          ehCabecalho: detectaCabecalho(descRec),
        });
      }
    }

    if (itens.length > 0) {
      resultado.push({ nomAba, periodo, itens });
    }
  }

  return resultado;
}
