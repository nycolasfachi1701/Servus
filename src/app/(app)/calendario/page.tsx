import type { Metadata } from "next";
import Link from "next/link";
import { Cake, Church, PartyPopper } from "lucide-react";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { listarCultosPeriodo, mapaTiposCulto, rotuloCulto } from "@/lib/dados/cultos";
import { listarFuncoesComMinisterio, listarMinisterios } from "@/lib/dados/ministerios";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCorpo } from "@/components/ui/cartao";
import { Selecao } from "@/components/ui/campo";
import { Botao } from "@/components/ui/botao";
import { DIAS_SEMANA, type Evento } from "@/lib/tipos";
import {
  chaveData,
  chaveDataIso,
  formatarDataExtenso,
  formatarHorario,
  hojeChave,
  horaIso,
} from "@/lib/utils";

export const metadata: Metadata = { title: "Calendário" };

type TipoItem = "culto" | "evento" | "aniversario";

type ItemCalendario = {
  tipo: TipoItem;
  titulo: string;
  hora?: string;
  cor: string;
  href?: string;
  detalhe?: string;
};

const CORES: Record<TipoItem, string> = {
  culto: "var(--primaria)",
  evento: "#4C6EF5",
  aniversario: "#E0A32E",
};

const ICONES = { culto: Church, evento: PartyPopper, aniversario: Cake };

function primeiroDiaDoMes(mes: string): Date {
  const [ano, m] = mes.split("-").map(Number);
  return new Date(ano, m - 1, 1);
}

export default async function PaginaCalendario({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; dia?: string; tipo?: string; ministerio?: string }>;
}) {
  const sessao = await obterSessao();
  const filtros = await searchParams;
  const supabase = await criarClienteServidor();

  const hoje = hojeChave();
  const mes = /^\d{4}-\d{2}$/.test(filtros.mes ?? "") ? filtros.mes! : hoje.slice(0, 7);
  const inicio = primeiroDiaDoMes(mes);
  const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);
  const chaveInicio = chaveData(inicio);
  const chaveFim = chaveData(fim);

  const filtroTipo = (filtros.tipo ?? "") as TipoItem | "";
  const filtroMinisterio = filtros.ministerio ?? "";

  const [cultos, tipos, ministerios, funcoes] = await Promise.all([
    listarCultosPeriodo(chaveInicio, chaveFim),
    mapaTiposCulto(),
    listarMinisterios(),
    listarFuncoesComMinisterio(),
  ]);

  const { data: eventosData } = await supabase
    .from("eventos")
    .select("*")
    .gte("inicio", new Date(inicio.getFullYear(), inicio.getMonth(), 1, 0, 0).toISOString())
    .lte("inicio", new Date(fim.getFullYear(), fim.getMonth(), fim.getDate(), 23, 59).toISOString())
    .order("inicio");

  const eventos = (eventosData ?? []) as Evento[];

  // Cultos do ministério filtrado: aqueles com alguma vaga de uma função dele.
  let cultosFiltrados = cultos;
  if (filtroMinisterio) {
    const funcoesDoMinisterio = new Set(
      funcoes.filter((f) => f.ministerio_id === filtroMinisterio).map((f) => f.id),
    );
    const { data: itens } = cultos.length
      ? await supabase
          .from("escala_itens")
          .select("culto_id, funcao_id")
          .in(
            "culto_id",
            cultos.map((c) => c.id),
          )
      : { data: [] as { culto_id: string; funcao_id: string }[] };
    const permitidos = new Set(
      (itens ?? []).filter((i) => funcoesDoMinisterio.has(i.funcao_id)).map((i) => i.culto_id),
    );
    cultosFiltrados = cultos.filter((c) => permitidos.has(c.id));
  }

  const eventosFiltrados = filtroMinisterio
    ? eventos.filter((e) => e.ministerio_id === filtroMinisterio)
    : eventos;

  // Aniversários: dados pessoais só são legíveis pela liderança (RLS).
  let aniversarios: { id: string; nome: string; nascimento: string }[] = [];
  if (sessao?.ehLideranca && !filtroMinisterio) {
    const { data } = await supabase
      .from("pessoas")
      .select("id, nome, nascimento")
      .not("nascimento", "is", null)
      .neq("status", "inativo");
    aniversarios = (data ?? []).filter(
      (p) => p.nascimento?.slice(5, 7) === mes.slice(5, 7),
    ) as { id: string; nome: string; nascimento: string }[];
  }

  // ------------------------------------------------ monta o mapa do mês
  const porDia = new Map<string, ItemCalendario[]>();
  const adicionar = (dia: string, item: ItemCalendario) => {
    if (filtroTipo && item.tipo !== filtroTipo) return;
    porDia.set(dia, [...(porDia.get(dia) ?? []), item]);
  };

  for (const culto of cultosFiltrados) {
    adicionar(culto.data, {
      tipo: "culto",
      titulo: rotuloCulto(culto, tipos),
      hora: formatarHorario(culto.horario),
      cor: CORES.culto,
      href: sessao?.ehLideranca ? `/escalas/${culto.id}` : undefined,
      detalhe: culto.finalizado_em ? "Finalizado" : undefined,
    });
  }

  for (const evento of eventosFiltrados) {
    const ministerio = ministerios.find((m) => m.id === evento.ministerio_id);
    adicionar(chaveDataIso(evento.inicio), {
      tipo: "evento",
      titulo: evento.titulo,
      hora: horaIso(evento.inicio),
      cor: ministerio?.cor ?? CORES.evento,
      detalhe: evento.local ?? undefined,
    });
  }

  for (const pessoa of aniversarios) {
    adicionar(`${mes}-${pessoa.nascimento.slice(8, 10)}`, {
      tipo: "aniversario",
      titulo: `Aniversário de ${pessoa.nome}`,
      cor: CORES.aniversario,
    });
  }

  // ------------------------------------------------------- grade do mês
  const diasNoMes = fim.getDate();
  const deslocamento = inicio.getDay();
  const celulas: (string | null)[] = [
    ...Array.from({ length: deslocamento }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => chaveData(new Date(inicio.getFullYear(), inicio.getMonth(), i + 1))),
  ];
  while (celulas.length % 7 !== 0) celulas.push(null);

  const diaSelecionado =
    filtros.dia && filtros.dia.startsWith(mes)
      ? filtros.dia
      : hoje.startsWith(mes)
        ? hoje
        : chaveInicio;

  const itensDoDia = porDia.get(diaSelecionado) ?? [];

  const anterior = chaveData(new Date(inicio.getFullYear(), inicio.getMonth() - 1, 1)).slice(0, 7);
  const proximo = chaveData(new Date(inicio.getFullYear(), inicio.getMonth() + 1, 1)).slice(0, 7);

  const paramsBase = (extra: Record<string, string>) => {
    const p = new URLSearchParams();
    if (filtroTipo) p.set("tipo", filtroTipo);
    if (filtroMinisterio) p.set("ministerio", filtroMinisterio);
    for (const [k, v] of Object.entries(extra)) if (v) p.set(k, v);
    return `?${p.toString()}`;
  };

  const nomeMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(inicio);

  return (
    <div className="space-y-5">
      <CabecalhoPagina
        titulo="Calendário"
        descricao="Cultos, eventos e aniversários em um só lugar."
      />

      {/* --------------------------------------------------- filtros */}
      <Cartao className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          {(["", "culto", "evento", "aniversario"] as const).map((tipo) => (
            <Link
              key={tipo || "todos"}
              href={`/calendario${paramsBase({ mes, dia: diaSelecionado, tipo: tipo || "" })}`.replace(
                /tipo=&?/,
                "",
              )}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                filtroTipo === tipo
                  ? "border-primaria bg-primaria-tenue text-primaria"
                  : "border-borda text-texto-suave hover:text-texto"
              }`}
            >
              {tipo === "" ? "Tudo" : tipo === "culto" ? "Cultos" : tipo === "evento" ? "Eventos" : "Aniversários"}
            </Link>
          ))}

          <form className="ml-auto flex gap-2">
            <input type="hidden" name="mes" value={mes} />
            {filtroTipo ? <input type="hidden" name="tipo" value={filtroTipo} /> : null}
            <Selecao name="ministerio" defaultValue={filtroMinisterio} aria-label="Ministério">
              <option value="">Todos os ministérios</option>
              {ministerios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </Selecao>
            <Botao type="submit" variante="secundario" tamanho="sm">
              Filtrar
            </Botao>
          </form>
        </div>
      </Cartao>

      {/* ----------------------------------------------------- grade */}
      <Cartao>
        <CartaoCorpo>
          <div className="mb-3 flex items-center justify-between gap-2">
            <Link
              href={`/calendario${paramsBase({ mes: anterior })}`}
              className="rounded-lg border border-borda px-2 py-1 text-sm text-texto-suave hover:text-primaria"
            >
              ‹
            </Link>
            <h2 className="font-serif text-lg font-semibold capitalize">{nomeMes}</h2>
            <Link
              href={`/calendario${paramsBase({ mes: proximo })}`}
              className="rounded-lg border border-borda px-2 py-1 text-sm text-texto-suave hover:text-primaria"
            >
              ›
            </Link>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-texto-suave">
            {DIAS_SEMANA.map((dia) => (
              <div key={dia} className="py-1">
                {dia.slice(0, 3)}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {celulas.map((dia, indice) => {
              if (!dia) return <div key={`vazio-${indice}`} />;
              const itens = porDia.get(dia) ?? [];
              const ehHoje = dia === hoje;
              const selecionado = dia === diaSelecionado;
              return (
                <Link
                  key={dia}
                  href={`/calendario${paramsBase({ mes, dia })}`}
                  aria-current={selecionado ? "date" : undefined}
                  className={`flex min-h-14 flex-col items-center rounded-xl border p-1 transition-colors ${
                    selecionado
                      ? "border-primaria bg-primaria-tenue"
                      : "border-transparent hover:border-borda"
                  }`}
                >
                  <span
                    className={`text-sm ${ehHoje ? "font-bold text-primaria" : selecionado ? "text-primaria" : ""}`}
                  >
                    {Number(dia.slice(8, 10))}
                  </span>
                  <span className="mt-1 flex flex-wrap justify-center gap-0.5">
                    {itens.slice(0, 4).map((item, i) => (
                      <span
                        key={i}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: item.cor }}
                        aria-hidden="true"
                      />
                    ))}
                  </span>
                </Link>
              );
            })}
          </div>
        </CartaoCorpo>
      </Cartao>

      {/* --------------------------------------------- dia escolhido */}
      <Cartao>
        <CartaoCorpo>
          <h2 className="font-serif text-lg font-semibold capitalize">
            {formatarDataExtenso(diaSelecionado)}
          </h2>
          {itensDoDia.length === 0 ? (
            <p className="mt-2 text-sm text-texto-suave">Nada programado para este dia.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {itensDoDia.map((item, indice) => {
                const Icone = ICONES[item.tipo];
                const conteudo = (
                  <div className="flex items-start gap-3 rounded-xl border border-borda p-3">
                    <span
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: `${item.cor}22`, color: item.cor }}
                    >
                      <Icone className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.titulo}</p>
                      <p className="text-xs text-texto-suave">
                        {[item.hora, item.detalhe].filter(Boolean).join(" · ") || "Dia todo"}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={`${item.titulo}-${indice}`}>
                    {item.href ? (
                      <Link href={item.href} className="block transition-opacity hover:opacity-80">
                        {conteudo}
                      </Link>
                    ) : (
                      conteudo
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CartaoCorpo>
      </Cartao>

      {/* -------------------------------------------------- legenda */}
      <div className="flex flex-wrap gap-4 text-xs text-texto-suave">
        {(Object.keys(CORES) as TipoItem[]).map((tipo) => (
          <span key={tipo} className="inline-flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: CORES[tipo] }}
              aria-hidden="true"
            />
            {tipo === "culto" ? "Cultos" : tipo === "evento" ? "Eventos" : "Aniversários"}
          </span>
        ))}
      </div>
    </div>
  );
}
