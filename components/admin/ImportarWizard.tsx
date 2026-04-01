"use client";

import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { formatarMoeda, formatarPeriodo } from "@/lib/utils";

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
}

interface ItemParsed {
  tipo: "RECEITA" | "DESPESA";
  descricao: string;
  valor: number;
  ehCabecalho: boolean;
}

interface AbaParsed {
  nomAba: string;
  periodo: string;
  itens: ItemParsed[];
}

interface ItemImportar extends ItemParsed {
  uid: string;
  periodo: string;
  categoriaId: string;
  selecionado: boolean;
}

interface Props {
  categorias: Categoria[];
}

export default function ImportarWizard({ categorias }: Props) {
  const [step, setStep] = useState<"upload" | "preview" | "done">("upload");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [abas, setAbas] = useState<AbaParsed[]>([]);
  const [itens, setItens] = useState<ItemImportar[]>([]);
  const [abasSelecionadas, setAbasSelecionadas] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const categoriasDespesa = categorias.filter((c) => c.tipo === "DESPESA");
  const categoriasReceita = categorias.filter((c) => c.tipo === "RECEITA");

  function gerarUid() {
    return Math.random().toString(36).slice(2);
  }

  function sugerirCategoria(desc: string, tipo: "RECEITA" | "DESPESA"): string {
    const d = desc.toLowerCase();
    const lista = tipo === "RECEITA" ? categoriasReceita : categoriasDespesa;
    const encontrar = (termos: string[]) =>
      termos.some((t) => d.includes(t));

    if (tipo === "RECEITA") {
      if (encontrar(["cota", "condomin"])) return lista.find((c) => c.nome.toLowerCase().includes("taxa"))?.id ?? "";
      if (encontrar(["fundo"])) return lista.find((c) => c.nome.toLowerCase().includes("fundo"))?.id ?? "";
      if (encontrar(["multa", "juros", "encargo", "atraso"])) return lista.find((c) => c.nome.toLowerCase().includes("multa"))?.id ?? "";
      return lista.find((c) => c.nome.toLowerCase().includes("outras"))?.id ?? "";
    } else {
      if (encontrar(["cagece", "água", "agua", "esgoto"])) return lista.find((c) => c.nome.toLowerCase().includes("água"))?.id ?? "";
      if (encontrar(["coelce", "energia", "elétric", "eletric", "luz", "gvt", "internet", "telefone"])) return lista.find((c) => c.nome.toLowerCase().includes("energia"))?.id ?? "";
      if (encontrar(["limpeza", "faxina", "conserv"])) return lista.find((c) => c.nome.toLowerCase().includes("limpeza"))?.id ?? "";
      if (encontrar(["manutenc", "manutenç", "reparo", "pintura", "fachada", "construc", "construç", "materiais"])) return lista.find((c) => c.nome.toLowerCase().includes("manutenção"))?.id ?? "";
      if (encontrar(["vigilância", "vigilancia", "segurança", "seguranca", "vision", "monitec", "portaria"])) return lista.find((c) => c.nome.toLowerCase().includes("portaria"))?.id ?? "";
      if (encontrar(["contabil", "assessoria", "despachante", "administr", "suprema", "astemig", "d e s", "thyssen", "celbra", "gráfic", "grafic", "banc", "financ"])) return lista.find((c) => c.nome.toLowerCase().includes("administração"))?.id ?? "";
      if (encontrar(["seguro", "allianz"])) return lista.find((c) => c.nome.toLowerCase().includes("seguro"))?.id ?? "";
      return lista.find((c) => c.nome.toLowerCase().includes("outras"))?.id ?? "";
    }
  }

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    const arquivo = fileRef.current?.files?.[0];
    if (!arquivo) { setErro("Selecione um arquivo."); return; }

    setCarregando(true);
    const form = new FormData();
    form.append("arquivo", arquivo);

    try {
      const res = await fetch("/api/importar", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao processar arquivo."); return; }
      const abasList: AbaParsed[] = json;
      setAbas(abasList);
      const todas = new Set(abasList.map((a) => a.nomAba));
      setAbasSelecionadas(todas);
      setStep("preview");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  function toggleAba(nomAba: string) {
    setAbasSelecionadas((prev) => {
      const next = new Set(prev);
      next.has(nomAba) ? next.delete(nomAba) : next.add(nomAba);
      return next;
    });
  }

  function prepararItens() {
    const lista: ItemImportar[] = [];
    for (const aba of abas) {
      if (!abasSelecionadas.has(aba.nomAba)) continue;
      for (const item of aba.itens) {
        lista.push({
          ...item,
          uid: gerarUid(),
          periodo: aba.periodo,
          categoriaId: sugerirCategoria(item.descricao, item.tipo),
          selecionado: !item.ehCabecalho, // cabeçalhos desmarcados por padrão
        });
      }
    }
    setItens(lista);
  }

  function toggleItem(uid: string) {
    setItens((prev) => prev.map((i) => i.uid === uid ? { ...i, selecionado: !i.selecionado } : i));
  }

  function setCategoria(uid: string, categoriaId: string) {
    setItens((prev) => prev.map((i) => i.uid === uid ? { ...i, categoriaId } : i));
  }

  async function handleImportar() {
    const selecionados = itens.filter((i) => i.selecionado);
    const semCategoria = selecionados.filter((i) => !i.categoriaId);
    if (semCategoria.length > 0) {
      setErro(`Atribua uma categoria para todos os itens selecionados (${semCategoria.length} sem categoria).`);
      return;
    }

    setErro("");
    setCarregando(true);
    try {
      const res = await fetch("/api/importar/confirmar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: selecionados.map(({ tipo, descricao, valor, categoriaId, periodo }) => ({
            tipo, descricao, valor, categoriaId, periodo,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErro(json.error ?? "Erro ao importar."); return; }
      setResultado(json.importados);
      setStep("done");
    } catch {
      setErro("Erro de conexão. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }

  const itensSelecionados = itens.filter((i) => i.selecionado);

  // ── Step: Upload ──────────────────────────────────────────────────────────────
  if (step === "upload") {
    return (
      <form onSubmit={handleUpload} className="space-y-6">
        <div className="card border-2 border-dashed border-border hover:border-primary/50 transition-colors">
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <FileSpreadsheet className="w-12 h-12 text-primary/50" />
            <div>
              <p className="font-medium text-foreground">Planilha de Prestação de Contas</p>
              <p className="text-sm text-muted-foreground mt-1">Formatos aceitos: .xls ou .xlsx (máx. 10 MB)</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".xls,.xlsx"
              className="input max-w-xs"
              required
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex gap-3 text-sm text-blue-800">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            <strong>LGPD:</strong> Assinaturas e nomes de pessoas presentes na planilha são
            automaticamente ignorados. Apenas os dados financeiros são processados.
          </p>
        </div>

        {erro && (
          <div className="bg-danger-light border border-danger/30 text-red-700 rounded-md px-4 py-3 text-sm">
            {erro}
          </div>
        )}

        <button type="submit" disabled={carregando} className="btn-primary flex items-center gap-2">
          <Upload className="w-4 h-4" />
          {carregando ? "Processando..." : "Processar planilha"}
        </button>
      </form>
    );
  }

  // ── Step: Preview ─────────────────────────────────────────────────────────────
  if (step === "preview") {
    const mostrando = itens.length > 0;

    return (
      <div className="space-y-6">
        {/* Seleção de meses */}
        <div className="card">
          <h2 className="font-semibold mb-4">
            Meses detectados — selecione os que deseja importar
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {abas.map((aba) => (
              <label
                key={aba.nomAba}
                className={`flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer text-sm transition-colors ${
                  abasSelecionadas.has(aba.nomAba)
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border text-muted-foreground"
                }`}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={abasSelecionadas.has(aba.nomAba)}
                  onChange={() => toggleAba(aba.nomAba)}
                />
                <span className="truncate">
                  {formatarPeriodo(aba.periodo)}
                  <span className="block text-xs font-normal opacity-70">
                    {aba.itens.length} itens
                  </span>
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={prepararItens}
            className="btn-primary mt-4"
            disabled={abasSelecionadas.size === 0}
          >
            Revisar itens selecionados →
          </button>
        </div>

        {/* Tabela de itens */}
        {mostrando && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                <strong>{itensSelecionados.length}</strong> itens marcados para importar.
                Itens em <span className="text-yellow-700 font-medium">amarelo</span> são
                totalizadores — confira se deseja importá-los junto com os subcategorizados.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setItens((p) => p.map((i) => ({ ...i, selecionado: true })))} className="btn-secondary text-xs px-3 py-1.5">Marcar tudo</button>
                <button onClick={() => setItens((p) => p.map((i) => ({ ...i, selecionado: false })))} className="btn-secondary text-xs px-3 py-1.5">Desmarcar tudo</button>
              </div>
            </div>

            <div className="card p-0 overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="w-8 px-4 py-3" />
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Período</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Descrição</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tipo</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {itens.map((item) => (
                    <tr
                      key={item.uid}
                      className={`${item.ehCabecalho ? "bg-yellow-50" : ""} ${!item.selecionado ? "opacity-40" : ""}`}
                    >
                      <td className="px-4 py-2.5 text-center">
                        <input
                          type="checkbox"
                          checked={item.selecionado}
                          onChange={() => toggleItem(item.uid)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground whitespace-nowrap">
                        {formatarPeriodo(item.periodo)}
                      </td>
                      <td className="px-4 py-2.5">
                        {item.descricao}
                        {item.ehCabecalho && (
                          <span className="ml-2 text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded">total</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          item.tipo === "RECEITA" ? "badge-receita" : "badge-despesa"
                        }`}>
                          {item.tipo === "RECEITA" ? "Receita" : "Despesa"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                        {formatarMoeda(item.valor)}
                      </td>
                      <td className="px-4 py-2.5">
                        <select
                          value={item.categoriaId}
                          onChange={(e) => setCategoria(item.uid, e.target.value)}
                          className="input py-1 text-xs min-w-[160px]"
                          disabled={!item.selecionado}
                        >
                          <option value="">— Selecionar —</option>
                          {(item.tipo === "RECEITA" ? categoriasReceita : categoriasDespesa).map((c) => (
                            <option key={c.id} value={c.id}>{c.nome}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {erro && (
              <div className="bg-danger-light border border-danger/30 text-red-700 rounded-md px-4 py-3 text-sm flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {erro}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleImportar}
                disabled={carregando || itensSelecionados.length === 0}
                className="btn-primary"
              >
                {carregando ? "Importando..." : `Importar ${itensSelecionados.length} lançamentos como Rascunho`}
              </button>
              <button
                onClick={() => { setStep("upload"); setItens([]); setAbas([]); }}
                className="btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Step: Done ────────────────────────────────────────────────────────────────
  return (
    <div className="card text-center py-16">
      <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Importação concluída!</h2>
      <p className="text-muted-foreground mb-6">
        <strong>{resultado}</strong> lançamentos criados como{" "}
        <span className="font-semibold text-yellow-700">Rascunho</span>. Revise e publique
        na seção de Lançamentos.
      </p>
      <div className="flex gap-3 justify-center">
        <a href="/admin/lancamentos" className="btn-primary">
          Ir para Lançamentos
        </a>
        <button
          onClick={() => { setStep("upload"); setItens([]); setAbas([]); setResultado(null); }}
          className="btn-secondary"
        >
          Importar outro arquivo
        </button>
      </div>
    </div>
  );
}
