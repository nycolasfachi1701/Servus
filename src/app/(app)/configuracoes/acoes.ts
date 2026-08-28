"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { exigirAdmin } from "@/lib/sessao";
import type { PapelUsuario } from "@/lib/tipos";

export type EstadoConfig = { erro?: string; ok?: string };

const PAPEIS: PapelUsuario[] = ["admin", "lider", "membro"];

export async function salvarConfiguracoes(
  _estado: EstadoConfig,
  formData: FormData,
): Promise<EstadoConfig> {
  await exigirAdmin();

  const nome = String(formData.get("nome_igreja") ?? "").trim();
  if (nome.length < 2) return { erro: "Informe o nome da igreja." };

  const numero = (campo: string, padrao: number, minimo: number, maximo: number) => {
    const valor = Number(formData.get(campo));
    if (Number.isNaN(valor)) return padrao;
    return Math.min(Math.max(valor, minimo), maximo);
  };

  const dados = {
    nome_igreja: nome,
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    cor_primaria: String(formData.get("cor_primaria") ?? "#8A1C3B"),
    mensagem_titulo: String(formData.get("mensagem_titulo") ?? "").trim() || "Escala de {periodo}",
    mensagem_despedida: String(formData.get("mensagem_despedida") ?? "").trim(),
    limite_escalas_mes: numero("limite_escalas_mes", 6, 1, 31),
    peso_rodizio: numero("peso_rodizio", 10, 0, 100),
    peso_preferencia: numero("peso_preferencia", 3, 0, 100),
    peso_dupla: numero("peso_dupla", 2, 0, 100),
  };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("configuracoes").update(dados).eq("id", 1);
  if (error) return { erro: "Não foi possível salvar as configurações." };

  revalidatePath("/", "layout");
  return { ok: "Configurações salvas." };
}

export async function alterarPapel(formData: FormData) {
  await exigirAdmin();

  const usuarioId = String(formData.get("usuario_id") ?? "");
  const papel = String(formData.get("papel") ?? "") as PapelUsuario;
  if (!usuarioId || !PAPEIS.includes(papel)) return;

  const supabase = await criarClienteServidor();
  await supabase.from("usuarios").update({ papel }).eq("id", usuarioId);

  revalidatePath("/configuracoes");
}

/**
 * Convite: o admin pré-autoriza um e-mail. Quando a pessoa se cadastra, o
 * gatilho `handle_new_user` já a liga ao membro certo com o papel definido.
 */
export async function criarConvite(formData: FormData) {
  await exigirAdmin();

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const papel = String(formData.get("papel") ?? "membro") as PapelUsuario;
  const pessoaId = String(formData.get("pessoa_id") ?? "") || null;
  if (!email || !PAPEIS.includes(papel)) return;

  const supabase = await criarClienteServidor();
  await supabase.from("convites").insert({ email, papel, pessoa_id: pessoaId });

  revalidatePath("/configuracoes");
}

export async function excluirConvite(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("convites").delete().eq("id", id);

  revalidatePath("/configuracoes");
}
