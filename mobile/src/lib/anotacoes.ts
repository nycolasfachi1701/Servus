import { supabase } from "@/lib/supabase";
import type { BibliaAnotacao } from "@/lib/tipos";

/**
 * Destaques e anotações da Bíblia. Ficam no Supabase (e não no aparelho)
 * para acompanharem a pessoa quando ela trocar de celular. São privadas:
 * o RLS só deixa cada um ver as suas.
 */
export type Anotacao = BibliaAnotacao;

export const CORES_DESTAQUE = [
  { nome: "Amarelo", valor: "#F2C94C" },
  { nome: "Verde", valor: "#6FCF97" },
  { nome: "Azul", valor: "#6FA9EC" },
  { nome: "Rosa", valor: "#EB92C0" },
] as const;

export async function anotacoesDoCapitulo(
  livro: number,
  capitulo: number,
): Promise<Map<number, Anotacao>> {
  const { data } = await supabase
    .from("biblia_anotacoes")
    .select("*")
    .eq("livro", livro)
    .eq("capitulo", capitulo);

  return new Map((data ?? []).map((a) => [a.versiculo, a]));
}

export async function listarAnotacoes(): Promise<Anotacao[]> {
  const { data } = await supabase
    .from("biblia_anotacoes")
    .select("*")
    .order("atualizado_em", { ascending: false });

  return data ?? [];
}

export async function salvarAnotacao(entrada: {
  livro: number;
  capitulo: number;
  versiculo: number;
  cor?: string | null;
  texto?: string | null;
  referencia: string;
  trecho: string;
}): Promise<void> {
  const { livro, capitulo, versiculo, cor = null, texto = null, referencia, trecho } = entrada;

  // sem destaque e sem texto não há o que guardar
  if (!cor && !texto?.trim()) {
    await apagarAnotacao(livro, capitulo, versiculo);
    return;
  }

  const { error } = await supabase.from("biblia_anotacoes").upsert(
    {
      livro,
      capitulo,
      versiculo,
      cor,
      texto: texto?.trim() ? texto.trim() : null,
      referencia,
      trecho,
    },
    { onConflict: "usuario_id,livro,capitulo,versiculo" },
  );

  if (error) throw error;
}

export async function apagarAnotacao(
  livro: number,
  capitulo: number,
  versiculo: number,
): Promise<void> {
  const { error } = await supabase
    .from("biblia_anotacoes")
    .delete()
    .eq("livro", livro)
    .eq("capitulo", capitulo)
    .eq("versiculo", versiculo);

  if (error) throw error;
}
