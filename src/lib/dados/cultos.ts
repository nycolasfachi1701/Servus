import { cache } from "react";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Culto, EscalaItem, TipoCulto } from "@/lib/tipos";
import { formatarHorario } from "@/lib/utils";

export const listarTiposCulto = cache(async (): Promise<TipoCulto[]> => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("tipos_culto")
    .select("*")
    .order("dia_semana")
    .order("horario");
  return data ?? [];
});

export async function mapaTiposCulto(): Promise<Map<string, TipoCulto>> {
  return new Map((await listarTiposCulto()).map((t) => [t.id, t]));
}

/** Nome exibido de uma ocorrência de culto. */
export function rotuloCulto(culto: Culto, tipos: Map<string, TipoCulto>): string {
  if (culto.titulo) return culto.titulo;
  const tipo = culto.tipo_culto_id ? tipos.get(culto.tipo_culto_id) : undefined;
  return tipo ? tipo.nome : `Culto ${formatarHorario(culto.horario)}`;
}

export async function listarCultosPeriodo(de: string, ate: string): Promise<Culto[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("cultos")
    .select("*")
    .gte("data", de)
    .lte("data", ate)
    .order("data")
    .order("horario");
  return data ?? [];
}

export async function listarEscalaDosCultos(cultoIds: string[]): Promise<EscalaItem[]> {
  if (cultoIds.length === 0) return [];
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("escala_itens")
    .select("*")
    .in("culto_id", cultoIds)
    .order("criado_em");
  return data ?? [];
}

export function agruparPorCulto<T extends { culto_id: string }>(itens: T[]): Map<string, T[]> {
  const mapa = new Map<string, T[]>();
  for (const item of itens) {
    const lista = mapa.get(item.culto_id);
    if (lista) lista.push(item);
    else mapa.set(item.culto_id, [item]);
  }
  return mapa;
}
