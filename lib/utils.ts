import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatarMoeda(valor: number | string): string {
  const num = typeof valor === "string" ? parseFloat(valor) : valor;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
}

export function formatarData(data: Date | string): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(d);
}

export function formatarPeriodo(periodo: string): string {
  // "2025-03" → "Março/2025"
  const [ano, mes] = periodo.split("-");
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${meses[parseInt(mes) - 1]}/${ano}`;
}

export function periodoAtual(): string {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

export function gerarPeriodos(quantidadeMeses: number = 12): string[] {
  const periodos: string[] = [];
  const agora = new Date();

  for (let i = 0; i < quantidadeMeses; i++) {
    const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    periodos.push(`${ano}-${mes}`);
  }

  return periodos;
}
