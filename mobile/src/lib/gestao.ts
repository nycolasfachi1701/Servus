import { gerarEscala, type EntradaGeracao } from "@compartilhado/escala/rodizio";
import { supabase } from "@/lib/supabase";
import { carregarCatalogo, pessoasPublicas } from "@/lib/dados";
import { dataLocal, chaveData, hojeChave, somarDias } from "@/lib/utils";
import type {
  Configuracoes,
  Convite,
  Culto,
  Disponibilidade,
  EscalaItem,
  Evento,
  Funcao,
  Ministerio,
  PapelUsuario,
  Pessoa,
  TipoCulto,
  TipoCultoVaga,
  Usuario,
} from "@/lib/tipos";

/* ===================================================================
 * Membros
 * ================================================================= */

export async function listarMembros(filtro?: { busca?: string; status?: string }) {
  let consulta = supabase.from("pessoas").select("*").order("nome");
  if (filtro?.busca) consulta = consulta.ilike("nome", `%${filtro.busca}%`);
  if (filtro?.status) consulta = consulta.eq("status", filtro.status as Pessoa["status"]);

  const { data, error } = await consulta;
  if (error) throw error;
  return (data ?? []) as Pessoa[];
}

export async function obterMembro(id: string) {
  const [{ data: pessoa }, { data: vinculos }] = await Promise.all([
    supabase.from("pessoas").select("*").eq("id", id).maybeSingle(),
    supabase.from("pessoa_funcao").select("funcao_id").eq("pessoa_id", id),
  ]);

  return {
    pessoa: (pessoa ?? null) as Pessoa | null,
    funcoes: (vinculos ?? []).map((v) => v.funcao_id),
  };
}

export async function salvarMembro(
  dados: Partial<Pessoa> & { nome: string },
  funcoes: string[],
  id?: string,
): Promise<string> {
  let pessoaId = id;

  if (pessoaId) {
    const { error } = await supabase.from("pessoas").update(dados).eq("id", pessoaId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase.from("pessoas").insert(dados).select("id").single();
    if (error || !data) throw error ?? new Error("Falha ao criar o membro");
    pessoaId = data.id;
  }

  const { data: atuais } = await supabase
    .from("pessoa_funcao")
    .select("funcao_id")
    .eq("pessoa_id", pessoaId);

  const antigas = new Set((atuais ?? []).map((f) => f.funcao_id));
  const novas = new Set(funcoes);

  const remover = [...antigas].filter((f) => !novas.has(f));
  const adicionar = [...novas].filter((f) => !antigas.has(f));

  if (remover.length > 0) {
    await supabase.from("pessoa_funcao").delete().eq("pessoa_id", pessoaId).in("funcao_id", remover);
  }
  if (adicionar.length > 0) {
    await supabase
      .from("pessoa_funcao")
      .insert(adicionar.map((funcao_id) => ({ pessoa_id: pessoaId!, funcao_id })));
  }

  return pessoaId;
}

export async function excluirMembro(id: string) {
  const { error } = await supabase.from("pessoas").delete().eq("id", id);
  if (error) throw error;
}

/* ===================================================================
 * Ministérios e funções
 * ================================================================= */

export async function carregarMinisterios() {
  const [{ data: ministerios }, { data: funcoes }, { data: vinculos }, { data: lideres }] =
    await Promise.all([
      supabase.from("ministerios").select("*").order("nome"),
      supabase.from("funcoes").select("*").order("nome"),
      supabase.from("pessoa_funcao").select("pessoa_id, funcao_id"),
      supabase.from("ministerio_lideres").select("ministerio_id, pessoa_id"),
    ]);

  return {
    ministerios: (ministerios ?? []) as Ministerio[],
    funcoes: (funcoes ?? []) as Funcao[],
    vinculos: (vinculos ?? []) as { pessoa_id: string; funcao_id: string }[],
    lideres: (lideres ?? []) as { ministerio_id: string; pessoa_id: string }[],
  };
}

export async function salvarMinisterio(
  dados: { nome: string; cor: string; descricao: string | null },
  id?: string,
) {
  const { error } = id
    ? await supabase.from("ministerios").update(dados).eq("id", id)
    : await supabase.from("ministerios").insert(dados);
  if (error) throw error;
}

export async function excluirMinisterio(id: string) {
  const { error } = await supabase.from("ministerios").delete().eq("id", id);
  if (error) throw error;
}

export async function criarFuncao(ministerioId: string, nome: string) {
  const { error } = await supabase
    .from("funcoes")
    .insert({ ministerio_id: ministerioId, nome });
  if (error) throw error;
}

export async function excluirFuncao(id: string) {
  const { error } = await supabase.from("funcoes").delete().eq("id", id);
  if (error) throw error;
}

export async function definirPessoaNaFuncao(
  funcaoId: string,
  pessoaId: string,
  vincular: boolean,
) {
  const { error } = vincular
    ? await supabase.from("pessoa_funcao").insert({ funcao_id: funcaoId, pessoa_id: pessoaId })
    : await supabase
        .from("pessoa_funcao")
        .delete()
        .eq("funcao_id", funcaoId)
        .eq("pessoa_id", pessoaId);
  if (error) throw error;
}

export async function definirLider(ministerioId: string, pessoaId: string, tornarLider: boolean) {
  const { error } = tornarLider
    ? await supabase
        .from("ministerio_lideres")
        .insert({ ministerio_id: ministerioId, pessoa_id: pessoaId })
    : await supabase
        .from("ministerio_lideres")
        .delete()
        .eq("ministerio_id", ministerioId)
        .eq("pessoa_id", pessoaId);
  if (error) throw error;
}

/* ===================================================================
 * Tipos de culto, vagas e ocorrências
 * ================================================================= */

export async function carregarCultos() {
  const hoje = hojeChave();
  const [{ data: tipos }, { data: vagas }, { data: proximos }] = await Promise.all([
    supabase.from("tipos_culto").select("*").order("dia_semana").order("horario"),
    supabase.from("tipo_culto_vaga").select("*"),
    supabase.from("cultos").select("*").gte("data", hoje).order("data").order("horario").limit(30),
  ]);

  const catalogo = await carregarCatalogo();

  return {
    ...catalogo,
    tiposLista: (tipos ?? []) as TipoCulto[],
    vagas: (vagas ?? []) as TipoCultoVaga[],
    proximos: (proximos ?? []) as Culto[],
  };
}

export async function salvarTipoCulto(
  dados: { nome: string; dia_semana: number; horario: string; ativo: boolean },
  id?: string,
) {
  const { error } = id
    ? await supabase.from("tipos_culto").update(dados).eq("id", id)
    : await supabase.from("tipos_culto").insert(dados);
  if (error) throw error;
}

export async function excluirTipoCulto(id: string) {
  const { error } = await supabase.from("tipos_culto").delete().eq("id", id);
  if (error) throw error;
}

export async function definirVaga(tipoCultoId: string, funcaoId: string, quantidade: number) {
  if (quantidade <= 0) {
    const { error } = await supabase
      .from("tipo_culto_vaga")
      .delete()
      .eq("tipo_culto_id", tipoCultoId)
      .eq("funcao_id", funcaoId);
    if (error) throw error;
    return;
  }

  const { data: existente } = await supabase
    .from("tipo_culto_vaga")
    .select("id")
    .eq("tipo_culto_id", tipoCultoId)
    .eq("funcao_id", funcaoId)
    .maybeSingle();

  const { error } = existente
    ? await supabase
        .from("tipo_culto_vaga")
        .update({ quantidade: Math.min(quantidade, 20) })
        .eq("id", existente.id)
    : await supabase.from("tipo_culto_vaga").insert({
        tipo_culto_id: tipoCultoId,
        funcao_id: funcaoId,
        quantidade: Math.min(quantidade, 20),
      });

  if (error) throw error;
}

/** Cria as ocorrências dos cultos recorrentes nas próximas semanas. */
export async function gerarOcorrencias(semanas: number): Promise<number> {
  const { data: tipos } = await supabase.from("tipos_culto").select("*").eq("ativo", true);
  if (!tipos || tipos.length === 0) return 0;

  const inicio = hojeChave();
  const fim = somarDias(inicio, semanas * 7);

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

  if (novos.length > 0) {
    const { error } = await supabase.from("cultos").insert(novos);
    if (error) throw error;
  }

  return novos.length;
}

export async function criarCultoAvulso(dados: {
  titulo: string;
  data: string;
  horario: string;
  observacao: string | null;
}) {
  const { error } = await supabase.from("cultos").insert(dados);
  if (error) throw error;
}

export async function excluirCulto(id: string) {
  const { error } = await supabase.from("cultos").delete().eq("id", id);
  if (error) throw error;
}

/* ===================================================================
 * Escalas
 * ================================================================= */

export async function carregarEscalas(historico = false) {
  const hoje = hojeChave();
  const catalogo = await carregarCatalogo();

  const { data: cultosData } = historico
    ? await supabase
        .from("cultos")
        .select("*")
        .not("finalizado_em", "is", null)
        .order("data", { ascending: false })
        .limit(20)
    : await supabase
        .from("cultos")
        .select("*")
        .gte("data", hoje)
        .lte("data", somarDias(hoje, 60))
        .order("data")
        .order("horario");

  const cultos = (cultosData ?? []) as Culto[];
  const { data: itensData } = cultos.length
    ? await supabase
        .from("escala_itens")
        .select("*")
        .in(
          "culto_id",
          cultos.map((c) => c.id),
        )
    : { data: [] as EscalaItem[] };

  const itens = (itensData ?? []) as EscalaItem[];

  return {
    ...catalogo,
    cultos,
    itens,
    pessoas: await pessoasPublicas(itens.map((i) => i.pessoa_id)),
  };
}

export async function carregarEscalaDoCulto(cultoId: string) {
  const catalogo = await carregarCatalogo();

  const [{ data: culto }, { data: itens }, { data: vinculos }, { data: indisponiveis }] =
    await Promise.all([
      supabase.from("cultos").select("*").eq("id", cultoId).maybeSingle(),
      supabase.from("escala_itens").select("*").eq("culto_id", cultoId).order("criado_em"),
      supabase.from("pessoa_funcao").select("pessoa_id, funcao_id"),
      supabase
        .from("disponibilidade")
        .select("pessoa_id, disponivel, observacao")
        .eq("culto_id", cultoId),
    ]);

  const candidatosPorFuncao = new Map<string, string[]>();
  for (const vinculo of vinculos ?? []) {
    candidatosPorFuncao.set(vinculo.funcao_id, [
      ...(candidatosPorFuncao.get(vinculo.funcao_id) ?? []),
      vinculo.pessoa_id,
    ]);
  }

  const { data: todasPessoas } = await supabase
    .from("pessoas_publicas")
    .select("id, nome, foto_url, status")
    .order("nome");

  return {
    ...catalogo,
    culto: (culto ?? null) as Culto | null,
    itens: (itens ?? []) as EscalaItem[],
    candidatosPorFuncao,
    pessoas: new Map((todasPessoas ?? []).map((p) => [p.id, p])),
    indisponiveis: new Set(
      ((indisponiveis ?? []) as Disponibilidade[])
        .filter((d) => !d.disponivel)
        .map((d) => d.pessoa_id),
    ),
    avisos: ((indisponiveis ?? []) as Disponibilidade[]).filter((d) => !d.disponivel),
  };
}

/**
 * Gera a escala de um período com o rodízio justo — a mesma regra do site,
 * vinda de `compartilhado/escala/rodizio.ts`.
 */
export async function gerarEscalaDoPeriodo(opcoes: {
  de: string;
  ate: string;
  substituir: boolean;
  limite: number;
  funcoesPermitidas: Set<string> | null;
  pesos: { rodizio: number; preferencia: number; dupla: number };
}): Promise<{ cultos: number; emAberto: number }> {
  const { de, ate, substituir, limite, funcoesPermitidas, pesos } = opcoes;

  const { data: cultosData } = await supabase
    .from("cultos")
    .select("*")
    .gte("data", de)
    .lte("data", ate)
    .is("finalizado_em", null)
    .order("data");

  const cultos = (cultosData ?? []) as Culto[];
  if (cultos.length === 0) throw new Error("Nenhum culto em aberto nesse período.");

  const cultoIds = cultos.map((c) => c.id);

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
    throw new Error(
      "Todos os cultos do período já têm escala. Marque “refazer” para montar de novo.",
    );
  }

  const alvoIds = new Set(alvo.map((c) => c.id));
  const permitida = (funcaoId: string) => !funcoesPermitidas || funcoesPermitidas.has(funcaoId);

  const vagas = alvo.flatMap((culto) =>
    (vagasTipo ?? [])
      .filter((v) => v.tipo_culto_id === culto.tipo_culto_id && permitida(v.funcao_id))
      .map((v) => ({ cultoId: culto.id, funcaoId: v.funcao_id, quantidade: v.quantidade })),
  );

  if (vagas.length === 0) {
    throw new Error("Nenhuma vaga a preencher: defina as vagas por função nos tipos de culto.");
  }

  // Ao refazer, quem já confirmou presença é mantido.
  const fixos = (itensExistentes ?? [])
    .filter((i) => alvoIds.has(i.culto_id) && i.pessoa_id && i.confirmado && permitida(i.funcao_id))
    .map((i) => ({ cultoId: i.culto_id, funcaoId: i.funcao_id, pessoaId: i.pessoa_id! }));

  const chavesFixas = new Set(fixos.map((f) => `${f.cultoId}::${f.funcaoId}::${f.pessoaId}`));

  const paraApagar = (itensExistentes ?? [])
    .filter((i) => alvoIds.has(i.culto_id) && permitida(i.funcao_id))
    .filter((i) => !chavesFixas.has(`${i.culto_id}::${i.funcao_id}::${i.pessoa_id}`))
    .map((i) => i.id);

  if (paraApagar.length > 0) {
    await supabase.from("escala_itens").delete().in("id", paraApagar);
  }

  const ativos = new Set((pessoas ?? []).filter((p) => p.status === "ativo").map((p) => p.id));
  const funcoesPorPessoa = new Map<string, string[]>();
  for (const vinculo of vinculos ?? []) {
    if (!ativos.has(vinculo.pessoa_id)) continue;
    funcoesPorPessoa.set(vinculo.pessoa_id, [
      ...(funcoesPorPessoa.get(vinculo.pessoa_id) ?? []),
      vinculo.funcao_id,
    ]);
  }

  const entrada: EntradaGeracao = {
    cultos: alvo.map((c) => ({ id: c.id, data: c.data, diaSemana: dataLocal(c.data).getDay() })),
    vagas,
    candidatos: [...funcoesPorPessoa.entries()].map(([pessoaId, funcoes]) => ({
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
    pesos,
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
    if (error) throw error;
  }

  return { cultos: alvo.length, emAberto: resultado.emAberto.length };
}

export async function trocarPessoaNaVaga(itemId: string, pessoaId: string | null) {
  const { error } = await supabase
    .from("escala_itens")
    .update({ pessoa_id: pessoaId, confirmado: false, confirmado_em: null })
    .eq("id", itemId);
  if (error) throw error;
}

export async function adicionarVaga(cultoId: string, funcaoId: string) {
  const { error } = await supabase
    .from("escala_itens")
    .insert({ culto_id: cultoId, funcao_id: funcaoId });
  if (error) throw error;
}

export async function removerVaga(itemId: string) {
  const { error } = await supabase.from("escala_itens").delete().eq("id", itemId);
  if (error) throw error;
}

export async function alternarFinalizado(cultoId: string, finalizar: boolean) {
  const { error } = await supabase
    .from("cultos")
    .update({ finalizado_em: finalizar ? new Date().toISOString() : null })
    .eq("id", cultoId);
  if (error) throw error;
}

/** Funções que a pessoa pode escalar (admin: todas; líder: as do seu ministério). */
export async function funcoesQuePodeEscalar(
  ehAdmin: boolean,
  ministeriosLiderados: string[],
): Promise<Set<string> | null> {
  if (ehAdmin) return null;
  if (ministeriosLiderados.length === 0) return new Set();

  const { data } = await supabase
    .from("funcoes")
    .select("id")
    .in("ministerio_id", ministeriosLiderados);

  return new Set((data ?? []).map((f) => f.id));
}

/* ===================================================================
 * Eventos
 * ================================================================= */

export async function listarEventos() {
  const { data } = await supabase
    .from("eventos")
    .select("*")
    .order("inicio", { ascending: false })
    .limit(60);
  return (data ?? []) as Evento[];
}

export async function salvarEvento(dados: Partial<Evento> & { titulo: string; inicio: string }, id?: string) {
  const { error } = id
    ? await supabase.from("eventos").update(dados).eq("id", id)
    : await supabase.from("eventos").insert(dados);
  if (error) throw error;
}

export async function excluirEvento(id: string) {
  const { error } = await supabase.from("eventos").delete().eq("id", id);
  if (error) throw error;
}

/* ===================================================================
 * Configurações, usuários e convites
 * ================================================================= */

export async function carregarConfiguracoes() {
  const [{ data: config }, { data: usuarios }, { data: convites }, { data: pessoas }] =
    await Promise.all([
      supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle(),
      supabase.from("usuarios").select("*").order("criado_em"),
      supabase.from("convites").select("*").is("usado_em", null).order("criado_em"),
      supabase.from("pessoas_publicas").select("id, nome, foto_url, status").order("nome"),
    ]);

  return {
    config: (config ?? null) as Configuracoes | null,
    usuarios: (usuarios ?? []) as Usuario[],
    convites: (convites ?? []) as Convite[],
    pessoas: pessoas ?? [],
  };
}

export async function salvarConfiguracoes(dados: Partial<Configuracoes>) {
  const { error } = await supabase.from("configuracoes").update(dados).eq("id", 1);
  if (error) throw error;
}

export async function alterarPapel(usuarioId: string, papel: PapelUsuario) {
  const { error } = await supabase.from("usuarios").update({ papel }).eq("id", usuarioId);
  if (error) throw error;
}

export async function criarConvite(email: string, papel: PapelUsuario, pessoaId: string | null) {
  const { error } = await supabase
    .from("convites")
    .insert({ email: email.trim().toLowerCase(), papel, pessoa_id: pessoaId });
  if (error) throw error;
}

export async function excluirConvite(id: string) {
  const { error } = await supabase.from("convites").delete().eq("id", id);
  if (error) throw error;
}
