import { listarFuncoesComMinisterio } from "@/lib/dados/ministerios";
import type { FuncaoAgrupada } from "./formulario";

/** Funções agrupadas por ministério, no formato usado pelo formulário. */
export async function agruparFuncoes(): Promise<FuncaoAgrupada[]> {
  const funcoes = await listarFuncoesComMinisterio();
  const grupos = new Map<string, FuncaoAgrupada>();

  for (const funcao of funcoes) {
    const nome = funcao.ministerio?.nome ?? "Sem ministério";
    const grupo = grupos.get(nome) ?? {
      ministerio: nome,
      cor: funcao.ministerio?.cor ?? "#8A1C3B",
      funcoes: [],
    };
    grupo.funcoes.push({ id: funcao.id, nome: funcao.nome });
    grupos.set(nome, grupo);
  }

  return [...grupos.values()];
}
