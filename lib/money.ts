import { Prisma } from "@prisma/client";
import { z } from "zod";

/**
 * Dinheiro sempre em decimal exato (Prisma.Decimal), nunca em ponto flutuante:
 * somar `Number(valor)` acumula erro binário (0,1 + 0,2 ≠ 0,3). O banco já guarda
 * `Decimal(12, 2)`; aqui ficam a entrada (texto ou número com no máximo 2 casas)
 * e as somas.
 */

export type Money = Prisma.Decimal;

const MONEY_TEXT = /^\d{1,10}([.,]\d{1,2})?$/;
const MAX = new Prisma.Decimal("9999999999.99");

/** Converte a entrada da API em Decimal; null se não for um valor monetário válido (até 2 casas, > 0 opcional). */
export function parseMoney(input: unknown): Money | null {
  let text: string;
  if (typeof input === "number") {
    if (!Number.isFinite(input)) return null;
    // Número com mais de 2 casas não é dinheiro: recusa em vez de arredondar escondido.
    text = String(input);
    if (/e/i.test(text)) return null;
  } else if (typeof input === "string") {
    text = input.trim().replace(/\s/g, "");
    // "1.234,56" (pt-BR com milhar) → "1234,56"
    if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(text)) text = text.replace(/\./g, "");
  } else {
    return null;
  }
  if (!MONEY_TEXT.test(text)) return null;
  const value = new Prisma.Decimal(text.replace(",", "."));
  return value.greaterThan(MAX) ? null : value;
}

/**
 * Número vindo de planilha (célula calculada pode ter mais de 2 casas): arredonda
 * meio-para-cima em centavos, o mesmo que o PostgreSQL faz ao gravar numeric(12,2).
 */
export function roundSpreadsheetMoney(input: unknown): Money | null {
  if (typeof input !== "number" || !Number.isFinite(input)) return parseMoney(input);
  const value = new Prisma.Decimal(input).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  return value.isNegative() || value.greaterThan(MAX) ? null : value;
}

/** Schema zod para valores monetários: aceita texto ou número, devolve Decimal. */
export const moneySchema = (options: { positive?: boolean; fromSpreadsheet?: boolean } = {}) =>
  z.union([z.string(), z.number()]).transform((input, ctx) => {
    const value = options.fromSpreadsheet ? roundSpreadsheetMoney(input) : parseMoney(input);
    if (!value || (options.positive && !value.greaterThan(0))) {
      ctx.addIssue({ code: "custom", message: "Valor inválido (use até 2 casas decimais)" });
      return z.NEVER;
    }
    return value;
  });

/** Soma exata. */
export function sumMoney(values: Iterable<Prisma.Decimal | number | string | null | undefined>): Money {
  let total = new Prisma.Decimal(0);
  for (const value of values) {
    if (value === null || value === undefined) continue;
    total = total.plus(new Prisma.Decimal(value));
  }
  return total;
}

/** Para exibir: o número só aparece na formatação final, já com o total exato. */
export function moneyToNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return new Prisma.Decimal(value).toNumber();
}
