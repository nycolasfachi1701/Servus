"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { exigirSessao } from "@/lib/sessao";

/** O próprio membro informa se pode (ou não) servir em um culto. */
export async function definirDisponibilidade(formData: FormData) {
  const sessao = await exigirSessao();
  if (!sessao.pessoaId) return;

  const cultoId = String(formData.get("culto_id") ?? "");
  const disponivel = formData.get("disponivel") === "1";
  const observacao = String(formData.get("observacao") ?? "").trim() || null;
  if (!cultoId) return;

  const supabase = await criarClienteServidor();
  const { data: existente } = await supabase
    .from("disponibilidade")
    .select("pessoa_id")
    .eq("pessoa_id", sessao.pessoaId)
    .eq("culto_id", cultoId)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("disponibilidade")
      .update({ disponivel, observacao })
      .eq("pessoa_id", sessao.pessoaId)
      .eq("culto_id", cultoId);
  } else {
    await supabase.from("disponibilidade").insert({
      pessoa_id: sessao.pessoaId,
      culto_id: cultoId,
      disponivel,
      observacao,
    });
  }

  revalidatePath("/disponibilidade");
  revalidatePath("/painel");
}
