import { cache } from "react";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Funcao, Ministerio } from "@/lib/tipos";

export const listarMinisterios = cache(async (): Promise<Ministerio[]> => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("ministerios").select("*").order("nome");
  return data ?? [];
});

export const listarFuncoes = cache(async (): Promise<Funcao[]> => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("funcoes").select("*").order("nome");
  return data ?? [];
});

export type FuncaoComMinisterio = Funcao & { ministerio: Ministerio | undefined };

export const listarFuncoesComMinisterio = cache(async (): Promise<FuncaoComMinisterio[]> => {
  const [funcoes, ministerios] = await Promise.all([listarFuncoes(), listarMinisterios()]);
  const mapa = new Map(ministerios.map((m) => [m.id, m]));
  return funcoes
    .map((f) => ({ ...f, ministerio: mapa.get(f.ministerio_id) }))
    .sort((a, b) => {
      const m = (a.ministerio?.nome ?? "").localeCompare(b.ministerio?.nome ?? "", "pt-BR");
      return m !== 0 ? m : a.nome.localeCompare(b.nome, "pt-BR");
    });
});

export async function mapaFuncoes(): Promise<Map<string, FuncaoComMinisterio>> {
  const funcoes = await listarFuncoesComMinisterio();
  return new Map(funcoes.map((f) => [f.id, f]));
}
