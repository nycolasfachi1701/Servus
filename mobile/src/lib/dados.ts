import { supabase } from "@/lib/supabase";
import { hojeChave, somarDias } from "@/lib/utils";
import type {
  Culto,
  EscalaItem,
  Evento,
  Funcao,
  Ministerio,
  PessoaPublica,
  TipoCulto,
} from "@/lib/tipos";

export type FuncaoComMinisterio = Funcao & { ministerio?: Ministerio };

export function rotuloCulto(culto: Culto, tipos: Map<string, TipoCulto>): string {
  if (culto.titulo) return culto.titulo;
  const tipo = culto.tipo_culto_id ? tipos.get(culto.tipo_culto_id) : undefined;
  return tipo ? tipo.nome : "Culto";
}

export async function carregarCatalogo() {
  const [{ data: tipos }, { data: funcoes }, { data: ministerios }] = await Promise.all([
    supabase.from("tipos_culto").select("*").order("dia_semana"),
    supabase.from("funcoes").select("*").order("nome"),
    supabase.from("ministerios").select("*").order("nome"),
  ]);

  const mapaMinisterios = new Map((ministerios ?? []).map((m) => [m.id, m as Ministerio]));

  return {
    tipos: new Map((tipos ?? []).map((t) => [t.id, t as TipoCulto])),
    ministerios: mapaMinisterios,
    funcoes: new Map(
      (funcoes ?? []).map((f) => [
        f.id,
        { ...(f as Funcao), ministerio: mapaMinisterios.get(f.ministerio_id) },
      ]),
    ),
  };
}

export async function pessoasPublicas(ids: Array<string | null>) {
  const unicos = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unicos.length === 0) return new Map<string, PessoaPublica>();

  const { data } = await supabase
    .from("pessoas_publicas")
    .select("id, nome, foto_url, status")
    .in("id", unicos);

  return new Map((data ?? []).map((p) => [p.id, p as PessoaPublica]));
}

/** Tudo o que o painel mostra. */
export async function carregarPainel(pessoaId: string | null, ehLideranca: boolean) {
  const hoje = hojeChave();
  const catalogo = await carregarCatalogo();

  const [{ data: cultosData }, { data: eventosData }] = await Promise.all([
    supabase
      .from("cultos")
      .select("*")
      .gte("data", hoje)
      .lte("data", somarDias(hoje, 30))
      .order("data")
      .order("horario"),
    supabase
      .from("eventos")
      .select("*")
      .gte("inicio", new Date().toISOString())
      .order("inicio")
      .limit(4),
  ]);

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
  const pessoas = await pessoasPublicas(itens.map((i) => i.pessoa_id));

  let aniversariantes: { id: string; nome: string; nascimento: string; foto_url: string | null }[] =
    [];
  if (ehLideranca) {
    const { data } = await supabase
      .from("pessoas")
      .select("id, nome, nascimento, foto_url")
      .not("nascimento", "is", null)
      .neq("status", "inativo");

    const janela: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      janela.push(
        `${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`,
      );
    }
    aniversariantes = ((data ?? []) as typeof aniversariantes)
      .filter((p) => p.nascimento && janela.includes(p.nascimento.slice(5, 10)))
      .sort(
        (a, b) => janela.indexOf(a.nascimento.slice(5, 10)) - janela.indexOf(b.nascimento.slice(5, 10)),
      );
  }

  const minhas = pessoaId
    ? itens
        .filter((i) => i.pessoa_id === pessoaId)
        .map((i) => ({ item: i, culto: cultos.find((c) => c.id === i.culto_id) }))
        .filter((x): x is { item: EscalaItem; culto: Culto } => Boolean(x.culto))
        .sort((a, b) => a.culto.data.localeCompare(b.culto.data))
    : [];

  return {
    ...catalogo,
    cultos,
    itens,
    pessoas,
    minhas,
    eventos: (eventosData ?? []) as Evento[],
    aniversariantes,
    vagasAbertas: itens.filter((i) => !i.pessoa_id).length,
    semConfirmacao: itens.filter((i) => i.pessoa_id && !i.confirmado).length,
  };
}

/** Escalas da pessoa logada, separadas entre futuras e passadas. */
export async function carregarMinhasEscalas(pessoaId: string) {
  const catalogo = await carregarCatalogo();

  const { data: itensData } = await supabase
    .from("escala_itens")
    .select("*")
    .eq("pessoa_id", pessoaId);

  const itens = (itensData ?? []) as EscalaItem[];
  const cultoIds = [...new Set(itens.map((i) => i.culto_id))];

  const { data: cultosData } = cultoIds.length
    ? await supabase.from("cultos").select("*").in("id", cultoIds)
    : { data: [] as Culto[] };

  const cultos = new Map((cultosData ?? []).map((c) => [c.id, c as Culto]));
  const hoje = hojeChave();

  const comCulto = itens
    .map((item) => ({ item, culto: cultos.get(item.culto_id) }))
    .filter((x): x is { item: EscalaItem; culto: Culto } => Boolean(x.culto));

  return {
    ...catalogo,
    proximas: comCulto
      .filter((x) => x.culto.data >= hoje)
      .sort((a, b) => a.culto.data.localeCompare(b.culto.data)),
    passadas: comCulto
      .filter((x) => x.culto.data < hoje)
      .sort((a, b) => b.culto.data.localeCompare(a.culto.data))
      .slice(0, 10),
  };
}

export async function confirmarPresenca(itemId: string, confirmado: boolean) {
  const { error } = await supabase
    .from("escala_itens")
    .update({ confirmado, confirmado_em: confirmado ? new Date().toISOString() : null })
    .eq("id", itemId);
  if (error) throw error;
}

/** Próximos cultos + a resposta de disponibilidade da pessoa. */
export async function carregarDisponibilidade(pessoaId: string) {
  const hoje = hojeChave();
  const catalogo = await carregarCatalogo();

  const [{ data: cultosData }, { data: registros }] = await Promise.all([
    supabase
      .from("cultos")
      .select("*")
      .gte("data", hoje)
      .lte("data", somarDias(hoje, 60))
      .order("data")
      .order("horario"),
    supabase
      .from("disponibilidade")
      .select("culto_id, disponivel, observacao")
      .eq("pessoa_id", pessoaId),
  ]);

  return {
    ...catalogo,
    cultos: (cultosData ?? []) as Culto[],
    respostas: new Map((registros ?? []).map((r) => [r.culto_id, r])),
  };
}

export async function responderDisponibilidade(
  pessoaId: string,
  cultoId: string,
  disponivel: boolean,
  observacao?: string | null,
) {
  const { data: existente } = await supabase
    .from("disponibilidade")
    .select("pessoa_id")
    .eq("pessoa_id", pessoaId)
    .eq("culto_id", cultoId)
    .maybeSingle();

  const { error } = existente
    ? await supabase
        .from("disponibilidade")
        .update({ disponivel, observacao: observacao ?? null })
        .eq("pessoa_id", pessoaId)
        .eq("culto_id", cultoId)
    : await supabase
        .from("disponibilidade")
        .insert({ pessoa_id: pessoaId, culto_id: cultoId, disponivel, observacao: observacao ?? null });

  if (error) throw error;
}
