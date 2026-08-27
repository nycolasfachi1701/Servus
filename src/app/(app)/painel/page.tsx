import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, Cake, CircleAlert, PartyPopper, Sparkles } from "lucide-react";
import { exigirSessao } from "@/lib/sessao";
import { obterConfiguracoes } from "@/lib/dados/configuracoes";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import {
  agruparPorCulto,
  listarCultosPeriodo,
  listarEscalaDosCultos,
  mapaTiposCulto,
  rotuloCulto,
} from "@/lib/dados/cultos";
import { mapaFuncoes } from "@/lib/dados/ministerios";
import { mapaPessoasPublicas, nomeDe } from "@/lib/dados/pessoas";
import { Cartao, CartaoCabecalho, CartaoCorpo } from "@/components/ui/cartao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Alerta } from "@/components/ui/alerta";
import { Avatar } from "@/components/ui/avatar";
import { BotaoLink } from "@/components/ui/botao";
import { Vazio } from "@/components/ui/vazio";
import {
  formatarData,
  formatarDataExtenso,
  formatarHorario,
  hojeChave,
  primeiroNome,
  somarDias,
} from "@/lib/utils";
import type { Evento, Pessoa } from "@/lib/tipos";

export const metadata: Metadata = { title: "Painel" };

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** Aniversariantes dos próximos 7 dias (compara dia/mês, ignora o ano). */
function aniversariantesDaSemana(pessoas: Pick<Pessoa, "id" | "nome" | "nascimento" | "foto_url">[]) {
  const hoje = new Date();
  const janela: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    janela.push(`${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`);
  }
  return pessoas
    .filter((p) => p.nascimento && janela.includes(p.nascimento.slice(5, 10)))
    .sort(
      (a, b) =>
        janela.indexOf(a.nascimento!.slice(5, 10)) - janela.indexOf(b.nascimento!.slice(5, 10)),
    );
}

export default async function PaginaPainel({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const sessao = await exigirSessao();
  const config = await obterConfiguracoes();
  const supabase = await criarClienteServidor();

  const hoje = hojeChave();
  const limite = somarDias(hoje, 30);

  const [cultos, tipos, funcoes, { data: eventos }] = await Promise.all([
    listarCultosPeriodo(hoje, limite),
    mapaTiposCulto(),
    mapaFuncoes(),
    supabase
      .from("eventos")
      .select("*")
      .gte("inicio", new Date().toISOString())
      .order("inicio")
      .limit(4),
  ]);

  const proximosCultos = cultos.slice(0, 4);
  const itens = await listarEscalaDosCultos(cultos.map((c) => c.id));
  const porCulto = agruparPorCulto(itens);
  const pessoas = await mapaPessoasPublicas(itens.map((i) => i.pessoa_id));

  const minhasEscalas = sessao.pessoaId
    ? itens
        .filter((i) => i.pessoa_id === sessao.pessoaId)
        .map((i) => ({ item: i, culto: cultos.find((c) => c.id === i.culto_id)! }))
        .filter((x) => Boolean(x.culto))
        .sort((a, b) => a.culto.data.localeCompare(b.culto.data))
        .slice(0, 5)
    : [];

  const vagasAbertas = itens.filter((i) => !i.pessoa_id).length;
  const semConfirmacao = itens.filter((i) => i.pessoa_id && !i.confirmado).length;

  let aniversariantes: Awaited<ReturnType<typeof aniversariantesDaSemana>> = [];
  if (sessao.ehLideranca) {
    const { data } = await supabase
      .from("pessoas")
      .select("id, nome, nascimento, foto_url")
      .not("nascimento", "is", null)
      .neq("status", "inativo");
    aniversariantes = aniversariantesDaSemana(data ?? []);
  }

  return (
    <div className="space-y-5">
      {erro === "sem-permissao" ? (
        <Alerta tom="alerta">Essa área é restrita à liderança da igreja.</Alerta>
      ) : null}

      <header className="brilho-vinho rounded-2xl border border-borda bg-superficie p-5">
        <p className="text-sm text-texto-suave">
          {saudacao()}, {primeiroNome(sessao.nome)}
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">
          {config.nome_igreja}
        </h1>
        <p className="mt-2 text-sm text-texto-suave">
          {cultos.length > 0
            ? `${cultos.length} culto(s) programado(s) nos próximos 30 dias.`
            : "Nenhum culto programado nos próximos 30 dias."}
        </p>
      </header>

      {sessao.ehLideranca && (vagasAbertas > 0 || semConfirmacao > 0) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Cartao className="p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-alerta/10 text-alerta">
                <CircleAlert className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold">{vagasAbertas}</p>
                <p className="text-sm text-texto-suave">vaga(s) em aberto</p>
              </div>
            </div>
          </Cartao>
          <Cartao className="p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-vinho-tenue text-vinho">
                <Sparkles className="h-5 w-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold">{semConfirmacao}</p>
                <p className="text-sm text-texto-suave">confirmação(ões) pendente(s)</p>
              </div>
            </div>
          </Cartao>
        </div>
      ) : null}

      {/* --------------------------------------------- minhas escalas */}
      <Cartao>
        <CartaoCabecalho
          titulo="Minhas próximas escalas"
          descricao="Onde você foi escalado(a) nos próximos dias."
          acao={
            <BotaoLink href="/minhas-escalas" variante="secundario" tamanho="sm">
              Ver todas
            </BotaoLink>
          }
        />
        <CartaoCorpo className="pt-3">
          {minhasEscalas.length === 0 ? (
            <p className="text-sm text-texto-suave">
              Você não está escalado(a) nos próximos 30 dias.
            </p>
          ) : (
            <ul className="divide-y divide-borda">
              {minhasEscalas.map(({ item, culto }) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {rotuloCulto(culto, tipos)} · {funcoes.get(item.funcao_id)?.nome ?? "Função"}
                    </p>
                    <p className="text-xs text-texto-suave">
                      {formatarData(culto.data)} às {formatarHorario(culto.horario)}
                    </p>
                  </div>
                  <Etiqueta tom={item.confirmado ? "sucesso" : "alerta"}>
                    {item.confirmado ? "Confirmado" : "A confirmar"}
                  </Etiqueta>
                </li>
              ))}
            </ul>
          )}
        </CartaoCorpo>
      </Cartao>

      {/* --------------------------------------------- próximos cultos */}
      <Cartao>
        <CartaoCabecalho
          titulo="Próximos cultos"
          acao={
            sessao.ehLideranca ? (
              <BotaoLink href="/escalas" variante="secundario" tamanho="sm">
                Escalas
              </BotaoLink>
            ) : undefined
          }
        />
        <CartaoCorpo className="pt-3">
          {proximosCultos.length === 0 ? (
            <Vazio
              titulo="Nenhum culto programado"
              descricao="Cadastre os tipos de culto e gere as ocorrências para começar."
              acao={
                sessao.ehLideranca ? (
                  <BotaoLink href="/cultos" tamanho="sm">
                    Cadastrar cultos
                  </BotaoLink>
                ) : undefined
              }
            />
          ) : (
            <ul className="space-y-3">
              {proximosCultos.map((culto) => {
                const daEscala = porCulto.get(culto.id) ?? [];
                const abertas = daEscala.filter((i) => !i.pessoa_id).length;
                return (
                  <li key={culto.id} className="rounded-xl border border-borda p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{rotuloCulto(culto, tipos)}</p>
                        <p className="text-xs capitalize text-texto-suave">
                          {formatarDataExtenso(culto.data)} · {formatarHorario(culto.horario)}
                        </p>
                      </div>
                      {daEscala.length === 0 ? (
                        <Etiqueta tom="neutro">Sem escala</Etiqueta>
                      ) : abertas > 0 ? (
                        <Etiqueta tom="alerta">{abertas} em aberto</Etiqueta>
                      ) : (
                        <Etiqueta tom="sucesso">Escala completa</Etiqueta>
                      )}
                    </div>
                    {daEscala.length > 0 ? (
                      <p className="mt-2 line-clamp-2 text-xs text-texto-suave">
                        {daEscala
                          .map(
                            (i) =>
                              `${funcoes.get(i.funcao_id)?.nome ?? "Função"}: ${nomeDe(pessoas, i.pessoa_id)}`,
                          )
                          .join(" · ")}
                      </p>
                    ) : null}
                    {sessao.ehLideranca ? (
                      <Link
                        href={`/escalas/${culto.id}`}
                        className="mt-2 inline-block text-xs font-medium text-vinho hover:underline"
                      >
                        Abrir escala
                      </Link>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CartaoCorpo>
      </Cartao>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ------------------------------------------ aniversariantes */}
        {sessao.ehLideranca ? (
          <Cartao>
            <CartaoCabecalho
              titulo={
                <span className="flex items-center gap-2">
                  <Cake className="h-4 w-4 text-vinho" aria-hidden="true" /> Aniversariantes da semana
                </span>
              }
            />
            <CartaoCorpo className="pt-3">
              {aniversariantes.length === 0 ? (
                <p className="text-sm text-texto-suave">Nenhum aniversário nos próximos 7 dias.</p>
              ) : (
                <ul className="space-y-2">
                  {aniversariantes.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <Avatar nome={p.nome} fotoUrl={p.foto_url} tamanho="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{p.nome}</p>
                        <p className="text-xs text-texto-suave">
                          {formatarData(p.nascimento!, "dd/MM")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CartaoCorpo>
          </Cartao>
        ) : null}

        {/* ------------------------------------------ próximos eventos */}
        <Cartao>
          <CartaoCabecalho
            titulo={
              <span className="flex items-center gap-2">
                <PartyPopper className="h-4 w-4 text-vinho" aria-hidden="true" /> Próximos eventos
              </span>
            }
            acao={
              <BotaoLink href="/calendario" variante="secundario" tamanho="sm">
                Calendário
              </BotaoLink>
            }
          />
          <CartaoCorpo className="pt-3">
            {(eventos ?? []).length === 0 ? (
              <p className="text-sm text-texto-suave">Nenhum evento programado.</p>
            ) : (
              <ul className="space-y-2">
                {(eventos as Evento[]).map((evento) => (
                  <li key={evento.id} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-superficie-2 text-vinho">
                      <CalendarClock className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{evento.titulo}</p>
                      <p className="text-xs text-texto-suave">
                        {formatarData(evento.inicio.slice(0, 10))}
                        {evento.local ? ` · ${evento.local}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CartaoCorpo>
        </Cartao>
      </div>
    </div>
  );
}
