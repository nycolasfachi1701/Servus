"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { exigirLideranca, exigirSessao, type Sessao } from "@/lib/sessao";
import { obterConfiguracoes } from "@/lib/dados/configuracoes";
import { gerarEscala, type EntradaGeracao } from "@/lib/escala/rodizio";
import { dataLocal } from "@/lib/utils";
import type { Culto } from "@/lib/tipos";

export type EstadoEscala = { erro?: string; ok?: string };

/** Funções que o usuário pode escalar (admin: todas; líder: as do seu ministério). */
async function funcoesPermitidas(sessao: Sessao): Promise<Set<string> | null> {
  if (sessao.ehAdmin) return null; // null = sem restrição
  const supabase = await criarClienteServidor();
  if (sessao.ministeriosLiderados.length === 0) return new Set();
  const { data } = await supabase
    .from("funcoes")
    .select("id")
    .in("ministerio_id", sessao.ministeriosLiderados);
  return new Set((data ?? []).map((f) => f.id));
}

export async function gerarEscalas(
  _estado: EstadoEscala,
  formData: FormData,
): Promise<EstadoEscala> {
  const sessao = await exigirLideranca();

  const de = String(formData.get("de") ?? "");
  const ate = String(formData.get("ate") ?? "");
  const substituir = formData.get("substituir") !== null;
  if (!de || !ate) return { erro: "Informe o período." };
  if (de > ate) return { erro: "A data inicial precisa ser anterior à final." };

  const supabase = await criarClienteServidor();
  const config = await obterConfiguracoes();
  const limite = Math.max(1, Number(formData.get("limite") ?? config.limite_escalas_mes));

  const { data: cultosData } = await supabase
    .from("cultos")
    .select("*")
    .gte("data", de)
    .lte("data", ate)
    .is("finalizado_em", null)
    .order("data");

  const cultos = (cultosData ?? []) as Culto[];
  if (cultos.length === 0) return { erro: "Nenhum culto em aberto nesse período." };

  const cultoIds = cultos.map((c) => c.id);
  const permitidas = await funcoesPermitidas(sessao);

  const [
    { data: vagasTipo },
    { data: itensExistentes },
    { data: pessoas },
    { data: vinculos },
    { data: cargas },
    { data: indisponiveis },
  ] = await Promise.all([
    supabase.from("tipo_culto_vaga").select("*"),
    supabase.from("escala_itens").select("*").in("culto_id", cultoIds),
    supabase.from("pessoas").select("id, status"),
    supabase.from("pessoa_funcao").select("pessoa_id, funcao_id"),
    supabase.from("rodizio_carga").select("*"),
    supabase
      .from("disponibilidade")
      .select("pessoa_id, culto_id")
      .in("culto_id", cultoIds)
      .eq("disponivel", false),
  ]);

  const comItens = new Set((itensExistentes ?? []).map((i) => i.culto_id));
  const alvo = substituir ? cultos : cultos.filter((c) => !comItens.has(c.id));
  if (alvo.length === 0) {
    return { erro: "Todos os cultos do período já têm escala. Marque “refazer” para regerar." };
  }
  const alvoIds = new Set(alvo.map((c) => c.id));

  // Vagas de cada culto vêm do seu tipo de culto.
  const vagas = alvo.flatMap((culto) =>
    (vagasTipo ?? [])
      .filter((v) => v.tipo_culto_id === culto.tipo_culto_id)
      .filter((v) => !permitidas || permitidas.has(v.funcao_id))
      .map((v) => ({ cultoId: culto.id, funcaoId: v.funcao_id, quantidade: v.quantidade })),
  );

  if (vagas.length === 0) {
    return {
      erro: "Nenhuma vaga a preencher: defina as vagas por função nos tipos de culto.",
    };
  }

  // Ao refazer, quem já confirmou presença é preservado.
  const fixos = (itensExistentes ?? [])
    .filter((i) => alvoIds.has(i.culto_id) && i.pessoa_id && i.confirmado)
    .filter((i) => !permitidas || permitidas.has(i.funcao_id))
    .map((i) => ({ cultoId: i.culto_id, funcaoId: i.funcao_id, pessoaId: i.pessoa_id! }));

  const idsFixos = new Set(fixos.map((f) => `${f.cultoId}::${f.funcaoId}::${f.pessoaId}`));

  // Limpa a escala anterior dos cultos alvo (menos os fixos preservados).
  const paraApagar = (itensExistentes ?? [])
    .filter((i) => alvoIds.has(i.culto_id))
    .filter((i) => !permitidas || permitidas.has(i.funcao_id))
    .filter((i) => !idsFixos.has(`${i.culto_id}::${i.funcao_id}::${i.pessoa_id}`))
    .map((i) => i.id);

  if (paraApagar.length > 0) {
    await supabase.from("escala_itens").delete().in("id", paraApagar);
  }

  const ativos = new Set(
    (pessoas ?? []).filter((p) => p.status === "ativo").map((p) => p.id),
  );

  const candidatosPorPessoa = new Map<string, string[]>();
  for (const vinculo of vinculos ?? []) {
    if (!ativos.has(vinculo.pessoa_id)) continue;
    candidatosPorPessoa.set(vinculo.pessoa_id, [
      ...(candidatosPorPessoa.get(vinculo.pessoa_id) ?? []),
      vinculo.funcao_id,
    ]);
  }

  const entrada: EntradaGeracao = {
    cultos: alvo.map((c) => ({
      id: c.id,
      data: c.data,
      diaSemana: dataLocal(c.data).getDay(),
    })),
    vagas,
    candidatos: [...candidatosPorPessoa.entries()].map(([pessoaId, funcoes]) => ({
      pessoaId,
      funcoes,
    })),
    carga: (cargas ?? []).map((c) => ({
      pessoaId: c.pessoa_id,
      funcaoId: c.funcao_id,
      total: c.total,
      ultimaData: c.ultima_data,
    })),
    indisponibilidades: (indisponiveis ?? []).map((i) => ({
      pessoaId: i.pessoa_id,
      cultoId: i.culto_id,
    })),
    fixos,
    limitePorPessoa: limite,
    pesos: {
      rodizio: config.peso_rodizio,
      preferencia: config.peso_preferencia,
      dupla: config.peso_dupla,
    },
  };

  const resultado = gerarEscala(entrada);

  const novos = resultado.itens
    .filter((item) => !item.fixo)
    .map((item) => ({
      culto_id: item.cultoId,
      funcao_id: item.funcaoId,
      pessoa_id: item.pessoaId,
    }));

  if (novos.length > 0) {
    const { error } = await supabase.from("escala_itens").insert(novos);
    if (error) {
      return { erro: "Não foi possível salvar a escala gerada. Confira suas permissões." };
    }
  }

  revalidatePath("/escalas");
  revalidatePath("/painel");
  redirect(
    `/escalas?gerados=${alvo.length}&abertas=${resultado.emAberto.length}&de=${de}&ate=${ate}`,
  );
}

export async function trocarPessoa(formData: FormData) {
  await exigirLideranca();

  const itemId = String(formData.get("item_id") ?? "");
  const pessoaId = String(formData.get("pessoa_id") ?? "");
  const cultoId = String(formData.get("culto_id") ?? "");
  if (!itemId) return;

  const supabase = await criarClienteServidor();
  await supabase
    .from("escala_itens")
    .update({ pessoa_id: pessoaId || null, confirmado: false, confirmado_em: null })
    .eq("id", itemId);

  revalidatePath(`/escalas/${cultoId}`);
  revalidatePath("/escalas");
}

export async function adicionarVagaNoCulto(formData: FormData) {
  await exigirLideranca();

  const cultoId = String(formData.get("culto_id") ?? "");
  const funcaoId = String(formData.get("funcao_id") ?? "");
  if (!cultoId || !funcaoId) return;

  const supabase = await criarClienteServidor();
  await supabase.from("escala_itens").insert({ culto_id: cultoId, funcao_id: funcaoId });

  revalidatePath(`/escalas/${cultoId}`);
}

export async function removerItem(formData: FormData) {
  await exigirLideranca();

  const itemId = String(formData.get("item_id") ?? "");
  const cultoId = String(formData.get("culto_id") ?? "");
  if (!itemId) return;

  const supabase = await criarClienteServidor();
  await supabase.from("escala_itens").delete().eq("id", itemId);

  revalidatePath(`/escalas/${cultoId}`);
}

/** Marca/desmarca o culto como finalizado — é isso que alimenta o rodízio. */
export async function alternarFinalizado(formData: FormData) {
  await exigirLideranca();

  const cultoId = String(formData.get("culto_id") ?? "");
  const desfazer = formData.get("desfazer") === "1";
  if (!cultoId) return;

  const supabase = await criarClienteServidor();
  await supabase
    .from("cultos")
    .update({ finalizado_em: desfazer ? null : new Date().toISOString() })
    .eq("id", cultoId);

  revalidatePath(`/escalas/${cultoId}`);
  revalidatePath("/escalas");
  revalidatePath("/painel");
}

/** O próprio escalado confirma (ou desmarca) a presença. */
export async function confirmarPresenca(formData: FormData) {
  await exigirSessao();

  const itemId = String(formData.get("item_id") ?? "");
  const confirmado = formData.get("confirmado") === "1";
  const destino = String(formData.get("destino") ?? "/minhas-escalas");
  if (!itemId) return;

  const supabase = await criarClienteServidor();
  await supabase
    .from("escala_itens")
    .update({ confirmado, confirmado_em: confirmado ? new Date().toISOString() : null })
    .eq("id", itemId);

  revalidatePath(destino);
  revalidatePath("/painel");
  revalidatePath("/escalas");
}
