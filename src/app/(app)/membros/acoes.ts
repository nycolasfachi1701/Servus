"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { exigirAdmin, exigirLideranca } from "@/lib/sessao";

export type EstadoMembro = { erro?: string; ok?: string };

const opcional = (v: FormDataEntryValue | null) => {
  const texto = typeof v === "string" ? v.trim() : "";
  return texto === "" ? null : texto;
};

const esquema = z.object({
  nome: z.string().trim().min(3, "Informe o nome completo."),
  telefone: z.string().nullable(),
  email: z.string().email("E-mail inválido.").nullable(),
  nascimento: z.string().nullable(),
  batismo: z.string().nullable(),
  endereco: z.string().nullable(),
  foto_url: z.string().nullable(),
  observacoes: z.string().nullable(),
  estado_civil: z.enum([
    "solteiro",
    "casado",
    "divorciado",
    "viuvo",
    "uniao_estavel",
    "nao_informado",
  ]),
  status: z.enum(["ativo", "afastado", "visitante", "inativo"]),
});

export async function salvarMembro(
  _estado: EstadoMembro,
  formData: FormData,
): Promise<EstadoMembro> {
  await exigirAdmin();

  const id = opcional(formData.get("id"));
  const dados = esquema.safeParse({
    nome: String(formData.get("nome") ?? ""),
    telefone: opcional(formData.get("telefone")),
    email: opcional(formData.get("email")),
    nascimento: opcional(formData.get("nascimento")),
    batismo: opcional(formData.get("batismo")),
    endereco: opcional(formData.get("endereco")),
    foto_url: opcional(formData.get("foto_url")),
    observacoes: opcional(formData.get("observacoes")),
    estado_civil: String(formData.get("estado_civil") ?? "nao_informado"),
    status: String(formData.get("status") ?? "ativo"),
  });

  if (!dados.success) {
    return { erro: dados.error.issues[0]?.message ?? "Confira os dados informados." };
  }

  const funcoes = formData.getAll("funcoes").map(String).filter(Boolean);
  const supabase = await criarClienteServidor();

  let pessoaId = id;
  if (pessoaId) {
    const { error } = await supabase.from("pessoas").update(dados.data).eq("id", pessoaId);
    if (error) return { erro: mensagemBanco(error.message) };
  } else {
    const { data, error } = await supabase
      .from("pessoas")
      .insert(dados.data)
      .select("id")
      .single();
    if (error || !data) return { erro: mensagemBanco(error?.message ?? "") };
    pessoaId = data.id;
  }

  // Sincroniza as funções (quem pode ser escalado para o quê).
  const { data: atuais } = await supabase
    .from("pessoa_funcao")
    .select("funcao_id")
    .eq("pessoa_id", pessoaId);

  const atuaisIds = new Set((atuais ?? []).map((f) => f.funcao_id));
  const novasIds = new Set(funcoes);

  const remover = [...atuaisIds].filter((f) => !novasIds.has(f));
  const adicionar = [...novasIds].filter((f) => !atuaisIds.has(f));

  if (remover.length > 0) {
    await supabase.from("pessoa_funcao").delete().eq("pessoa_id", pessoaId).in("funcao_id", remover);
  }
  if (adicionar.length > 0) {
    await supabase
      .from("pessoa_funcao")
      .insert(adicionar.map((funcao_id) => ({ pessoa_id: pessoaId!, funcao_id })));
  }

  revalidatePath("/membros");
  revalidatePath(`/membros/${pessoaId}`);
  redirect(`/membros/${pessoaId}`);
}

export async function excluirMembro(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("pessoas").delete().eq("id", id);

  revalidatePath("/membros");
  redirect("/membros");
}

/** Usado pela tela de ministérios para montar a equipe de uma função. */
export async function alternarFuncaoDaPessoa(formData: FormData) {
  await exigirLideranca();

  const pessoaId = String(formData.get("pessoa_id") ?? "");
  const funcaoId = String(formData.get("funcao_id") ?? "");
  const marcado = formData.get("marcado") === "1";
  if (!pessoaId || !funcaoId) return;

  const supabase = await criarClienteServidor();
  if (marcado) {
    await supabase.from("pessoa_funcao").insert({ pessoa_id: pessoaId, funcao_id: funcaoId });
  } else {
    await supabase
      .from("pessoa_funcao")
      .delete()
      .eq("pessoa_id", pessoaId)
      .eq("funcao_id", funcaoId);
  }

  revalidatePath("/ministerios");
}

function mensagemBanco(mensagem: string): string {
  if (mensagem.includes("pessoas_email_idx")) return "Já existe um membro com esse e-mail.";
  if (mensagem.includes("row-level security")) {
    return "Você não tem permissão para essa alteração.";
  }
  return "Não foi possível salvar. Tente novamente.";
}
