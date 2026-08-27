"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { exigirAdmin, exigirLideranca } from "@/lib/sessao";
import { chaveData, dataLocal, hojeChave } from "@/lib/utils";

export type EstadoCulto = { erro?: string; ok?: string };

export async function salvarTipoCulto(
  _estado: EstadoCulto,
  formData: FormData,
): Promise<EstadoCulto> {
  await exigirAdmin();

  const id = String(formData.get("id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const diaSemana = Number(formData.get("dia_semana"));
  const horario = String(formData.get("horario") ?? "");
  const ativo = formData.get("ativo") !== null;

  if (nome.length < 2) return { erro: "Informe o nome do culto." };
  if (Number.isNaN(diaSemana) || diaSemana < 0 || diaSemana > 6) {
    return { erro: "Escolha o dia da semana." };
  }
  if (!horario) return { erro: "Informe o horário." };

  const supabase = await criarClienteServidor();
  const dados = { nome, dia_semana: diaSemana, horario, ativo };
  const { error } = id
    ? await supabase.from("tipos_culto").update(dados).eq("id", id)
    : await supabase.from("tipos_culto").insert(dados);

  if (error) return { erro: "Não foi possível salvar o tipo de culto." };

  revalidatePath("/cultos");
  return { ok: "Tipo de culto salvo." };
}

export async function excluirTipoCulto(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("tipos_culto").delete().eq("id", id);
  revalidatePath("/cultos");
}

/** Define quantas pessoas cada função precisa num tipo de culto (0 remove). */
export async function definirVaga(formData: FormData) {
  await exigirAdmin();

  const tipoCultoId = String(formData.get("tipo_culto_id") ?? "");
  const funcaoId = String(formData.get("funcao_id") ?? "");
  const quantidade = Number(formData.get("quantidade") ?? 0);
  if (!tipoCultoId || !funcaoId) return;

  const supabase = await criarClienteServidor();

  if (!quantidade || quantidade <= 0) {
    await supabase
      .from("tipo_culto_vaga")
      .delete()
      .eq("tipo_culto_id", tipoCultoId)
      .eq("funcao_id", funcaoId);
  } else {
    const { data: existente } = await supabase
      .from("tipo_culto_vaga")
      .select("id")
      .eq("tipo_culto_id", tipoCultoId)
      .eq("funcao_id", funcaoId)
      .maybeSingle();

    if (existente) {
      await supabase
        .from("tipo_culto_vaga")
        .update({ quantidade: Math.min(quantidade, 20) })
        .eq("id", existente.id);
    } else {
      await supabase.from("tipo_culto_vaga").insert({
        tipo_culto_id: tipoCultoId,
        funcao_id: funcaoId,
        quantidade: Math.min(quantidade, 20),
      });
    }
  }

  revalidatePath("/cultos");
}

/** Cria as ocorrências dos cultos recorrentes para as próximas semanas. */
export async function gerarOcorrencias(formData: FormData): Promise<void> {
  await exigirLideranca();

  const semanas = Math.min(Math.max(Number(formData.get("semanas") ?? 4), 1), 26);
  const supabase = await criarClienteServidor();

  const { data: tipos } = await supabase.from("tipos_culto").select("*").eq("ativo", true);
  if (!tipos || tipos.length === 0) return;

  const inicio = hojeChave();
  const fim = chaveData(
    (() => {
      const d = dataLocal(inicio);
      d.setDate(d.getDate() + semanas * 7);
      return d;
    })(),
  );

  const { data: existentes } = await supabase
    .from("cultos")
    .select("tipo_culto_id, data")
    .gte("data", inicio)
    .lte("data", fim);

  const jaExiste = new Set((existentes ?? []).map((c) => `${c.tipo_culto_id}::${c.data}`));

  const novos: { tipo_culto_id: string; data: string; horario: string }[] = [];
  for (let i = 0; i <= semanas * 7; i++) {
    const dia = dataLocal(inicio);
    dia.setDate(dia.getDate() + i);
    const chave = chaveData(dia);
    for (const tipo of tipos) {
      if (tipo.dia_semana !== dia.getDay()) continue;
      if (jaExiste.has(`${tipo.id}::${chave}`)) continue;
      novos.push({ tipo_culto_id: tipo.id, data: chave, horario: tipo.horario });
    }
  }

  if (novos.length > 0) await supabase.from("cultos").insert(novos);

  revalidatePath("/cultos");
  revalidatePath("/escalas");
  revalidatePath("/calendario");
}

export async function criarCultoAvulso(
  _estado: EstadoCulto,
  formData: FormData,
): Promise<EstadoCulto> {
  await exigirLideranca();

  const titulo = String(formData.get("titulo") ?? "").trim();
  const data = String(formData.get("data") ?? "");
  const horario = String(formData.get("horario") ?? "");
  const observacao = String(formData.get("observacao") ?? "").trim() || null;

  if (titulo.length < 2) return { erro: "Informe o nome do culto." };
  if (!data || !horario) return { erro: "Informe data e horário." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("cultos").insert({ titulo, data, horario, observacao });
  if (error) return { erro: "Não foi possível criar o culto." };

  revalidatePath("/cultos");
  revalidatePath("/escalas");
  revalidatePath("/calendario");
  return { ok: "Culto criado." };
}

export async function excluirCulto(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await criarClienteServidor();
  await supabase.from("cultos").delete().eq("id", id);

  revalidatePath("/cultos");
  revalidatePath("/escalas");
  revalidatePath("/calendario");
}
