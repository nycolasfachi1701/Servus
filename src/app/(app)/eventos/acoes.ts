"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { exigirLideranca } from "@/lib/sessao";
import { campoLocalParaIso } from "@/lib/utils";

export type EstadoEvento = { erro?: string; ok?: string };

export async function salvarEvento(
  _estado: EstadoEvento,
  formData: FormData,
): Promise<EstadoEvento> {
  await exigirLideranca();

  const id = String(formData.get("id") ?? "");
  const titulo = String(formData.get("titulo") ?? "").trim();
  const inicio = String(formData.get("inicio") ?? "");
  const fim = String(formData.get("fim") ?? "");
  const local = String(formData.get("local") ?? "").trim() || null;
  const ministerioId = String(formData.get("ministerio_id") ?? "") || null;
  const responsavelId = String(formData.get("responsavel_id") ?? "") || null;
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const imagemUrl = String(formData.get("imagem_url") ?? "").trim() || null;

  if (titulo.length < 3) return { erro: "Informe o título do evento." };
  if (!inicio) return { erro: "Informe a data e hora de início." };
  if (fim && fim < inicio) return { erro: "O término precisa ser depois do início." };

  const dados = {
    titulo,
    inicio: campoLocalParaIso(inicio),
    fim: fim ? campoLocalParaIso(fim) : null,
    local,
    ministerio_id: ministerioId,
    responsavel_id: responsavelId,
    descricao,
    imagem_url: imagemUrl,
  };

  const supabase = await criarClienteServidor();
  const { error } = id
    ? await supabase.from("eventos").update(dados).eq("id", id)
    : await supabase.from("eventos").insert(dados);

  if (error) return { erro: "Não foi possível salvar o evento." };

  revalidatePath("/eventos");
  revalidatePath("/calendario");
  revalidatePath("/painel");
  return { ok: "Evento salvo." };
}

export async function excluirEvento(formData: FormData) {
  await exigirLideranca();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("eventos").delete().eq("id", id);

  revalidatePath("/eventos");
  revalidatePath("/calendario");
}
