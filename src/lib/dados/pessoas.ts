import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { PessoaPublica } from "@/lib/tipos";

/**
 * Nomes e fotos vêm sempre da view `pessoas_publicas`: ela expõe só o
 * mínimo (id, nome, foto, status) e é legível por qualquer autenticado,
 * enquanto a tabela `pessoas` (telefone, endereço, datas) fica restrita à
 * liderança pelo RLS.
 */
export async function listarPessoasPublicas(): Promise<PessoaPublica[]> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("pessoas_publicas")
    .select("id, nome, foto_url, status")
    .order("nome");
  return data ?? [];
}

export async function mapaPessoasPublicas(
  ids: Array<string | null | undefined>,
): Promise<Map<string, PessoaPublica>> {
  const unicos = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unicos.length === 0) return new Map();

  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("pessoas_publicas")
    .select("id, nome, foto_url, status")
    .in("id", unicos);

  return new Map((data ?? []).map((p) => [p.id, p]));
}

export function nomeDe(mapa: Map<string, PessoaPublica>, id: string | null): string {
  if (!id) return "Em aberto";
  return mapa.get(id)?.nome ?? "Pessoa removida";
}
