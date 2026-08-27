"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { exigirAdmin, exigirLideranca } from "@/lib/sessao";

export type EstadoMinisterio = { erro?: string; ok?: string };

export async function salvarMinisterio(
  _estado: EstadoMinisterio,
  formData: FormData,
): Promise<EstadoMinisterio> {
  await exigirAdmin();

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const cor = String(formData.get("cor") ?? "#8A1C3B");
  const descricao = String(formData.get("descricao") ?? "").trim() || null;

  if (nome.length < 2) return { erro: "Informe o nome do ministério." };

  const supabase = await criarClienteServidor();
  const { error } = id
    ? await supabase.from("ministerios").update({ nome, cor, descricao }).eq("id", id)
    : await supabase.from("ministerios").insert({ nome, cor, descricao });

  if (error) {
    return {
      erro: error.message.includes("duplicate")
        ? "Já existe um ministério com esse nome."
        : "Não foi possível salvar o ministério.",
    };
  }

  revalidatePath("/ministerios");
  if (id) revalidatePath(`/ministerios/${id}`);
  return { ok: "Ministério salvo." };
}

export async function excluirMinisterio(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("ministerios").delete().eq("id", id);

  revalidatePath("/ministerios");
  redirect("/ministerios");
}

export async function criarFuncao(formData: FormData) {
  await exigirLideranca();

  const ministerioId = String(formData.get("ministerio_id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  if (!ministerioId || nome.length < 2) return;

  const supabase = await criarClienteServidor();
  await supabase.from("funcoes").insert({ ministerio_id: ministerioId, nome });

  revalidatePath(`/ministerios/${ministerioId}`);
}

export async function excluirFuncao(formData: FormData) {
  await exigirLideranca();

  const id = String(formData.get("id") ?? "");
  const ministerioId = String(formData.get("ministerio_id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("funcoes").delete().eq("id", id);

  revalidatePath(`/ministerios/${ministerioId}`);
}

export async function definirLider(formData: FormData) {
  await exigirAdmin();

  const ministerioId = String(formData.get("ministerio_id") ?? "");
  const pessoaId = String(formData.get("pessoa_id") ?? "");
  const remover = formData.get("remover") === "1";
  if (!ministerioId || !pessoaId) return;

  const supabase = await criarClienteServidor();
  if (remover) {
    await supabase
      .from("ministerio_lideres")
      .delete()
      .eq("ministerio_id", ministerioId)
      .eq("pessoa_id", pessoaId);
  } else {
    await supabase
      .from("ministerio_lideres")
      .insert({ ministerio_id: ministerioId, pessoa_id: pessoaId });
  }

  revalidatePath(`/ministerios/${ministerioId}`);
}

/** Vincula/desvincula uma pessoa de uma função (equipe do ministério). */
export async function definirPessoaNaFuncao(formData: FormData) {
  await exigirLideranca();

  const funcaoId = String(formData.get("funcao_id") ?? "");
  const pessoaId = String(formData.get("pessoa_id") ?? "");
  const ministerioId = String(formData.get("ministerio_id") ?? "");
  const remover = formData.get("remover") === "1";
  if (!funcaoId || !pessoaId) return;

  const supabase = await criarClienteServidor();
  if (remover) {
    await supabase
      .from("pessoa_funcao")
      .delete()
      .eq("funcao_id", funcaoId)
      .eq("pessoa_id", pessoaId);
  } else {
    await supabase.from("pessoa_funcao").insert({ funcao_id: funcaoId, pessoa_id: pessoaId });
  }

  revalidatePath(`/ministerios/${ministerioId}`);
}
