import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, CircleAlert, Plus, RotateCcw, X } from "lucide-react";
import { exigirLideranca } from "@/lib/sessao";
import { obterConfiguracoes } from "@/lib/dados/configuracoes";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { mapaTiposCulto, rotuloCulto } from "@/lib/dados/cultos";
import { listarFuncoesComMinisterio } from "@/lib/dados/ministerios";
import { listarPessoasPublicas } from "@/lib/dados/pessoas";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCabecalho, CartaoCorpo } from "@/components/ui/cartao";
import { Botao } from "@/components/ui/botao";
import { Selecao } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Alerta } from "@/components/ui/alerta";
import { BotaoWhatsApp } from "@/components/botao-whatsapp";
import { montarMensagem } from "@/lib/escala/mensagem";
import { formatarData, formatarDataExtenso, formatarHorario } from "@/lib/utils";
import type { Culto, EscalaItem } from "@/lib/tipos";
import { SeletorEscalado, type OpcaoPessoa } from "../seletor";
import { adicionarVagaNoCulto, alternarFinalizado, removerItem } from "../acoes";

export const metadata: Metadata = { title: "Escala do culto" };

export default async function PaginaEscalaCulto({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirLideranca();
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data } = await supabase.from("cultos").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const culto = data as Culto;

  const [tipos, funcoes, pessoas, config] = await Promise.all([
    mapaTiposCulto(),
    listarFuncoesComMinisterio(),
    listarPessoasPublicas(),
    obterConfiguracoes(),
  ]);

  const [{ data: itensData }, { data: vinculos }, { data: indisponibilidades }] = await Promise.all([
    supabase.from("escala_itens").select("*").eq("culto_id", id).order("criado_em"),
    supabase.from("pessoa_funcao").select("pessoa_id, funcao_id"),
    supabase.from("disponibilidade").select("pessoa_id, disponivel, observacao").eq("culto_id", id),
  ]);

  const itens = (itensData ?? []) as EscalaItem[];
  const mapaFuncoes = new Map(funcoes.map((f) => [f.id, f]));
  const mapaPessoas = new Map(pessoas.map((p) => [p.id, p]));

  const indisponiveis = new Set(
    (indisponibilidades ?? []).filter((d) => !d.disponivel).map((d) => d.pessoa_id),
  );
  const noCulto = new Set(itens.map((i) => i.pessoa_id).filter(Boolean) as string[]);

  const candidatosPorFuncao = new Map<string, string[]>();
  for (const vinculo of vinculos ?? []) {
    candidatosPorFuncao.set(vinculo.funcao_id, [
      ...(candidatosPorFuncao.get(vinculo.funcao_id) ?? []),
      vinculo.pessoa_id,
    ]);
  }

  // agrupa as vagas por função, na ordem ministério → função
  const ordem = new Map(funcoes.map((f, indice) => [f.id, indice]));
  const grupos = [...new Set(itens.map((i) => i.funcao_id))].sort(
    (a, b) => (ordem.get(a) ?? 99) - (ordem.get(b) ?? 99),
  );

  const emAberto = itens.filter((i) => !i.pessoa_id).length;
  const comPessoa = itens.filter((i) => i.pessoa_id);
  const confirmados = comPessoa.filter((i) => i.confirmado).length;

  const mensagem = montarMensagem({
    titulo: config.mensagem_titulo,
    despedida: config.mensagem_despedida,
    periodo: formatarData(culto.data),
    cultos: [
      {
        rotulo: rotuloCulto(culto, tipos),
        data: culto.data,
        horario: culto.horario,
        linhas: grupos.map((funcaoId) => ({
          funcao: mapaFuncoes.get(funcaoId)?.nome ?? "Função",
          pessoas: itens
            .filter((i) => i.funcao_id === funcaoId)
            .map((i) => (i.pessoa_id ? (mapaPessoas.get(i.pessoa_id)?.nome ?? "") : "")),
        })),
      },
    ],
  });

  return (
    <div className="space-y-5">
      <Link
        href="/escalas"
        className="inline-flex items-center gap-1 text-sm text-texto-suave hover:text-vinho"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar para escalas
      </Link>

      <CabecalhoPagina
        titulo={rotuloCulto(culto, tipos)}
        descricao={`${formatarDataExtenso(culto.data)} às ${formatarHorario(culto.horario)}`}
        acao={
          <form action={alternarFinalizado}>
            <input type="hidden" name="culto_id" value={culto.id} />
            <input type="hidden" name="desfazer" value={culto.finalizado_em ? "1" : "0"} />
            <Botao type="submit" variante={culto.finalizado_em ? "secundario" : "sucesso"}>
              {culto.finalizado_em ? (
                <>
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  Desfazer finalização
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Marcar como finalizado
                </>
              )}
            </Botao>
          </form>
        }
      />

      {culto.finalizado_em ? (
        <Alerta tom="sucesso">
          Culto finalizado em {formatarData(culto.finalizado_em.slice(0, 10))} — esta escala já
          conta no rodízio.
        </Alerta>
      ) : (
        <Alerta tom="info">
          Enquanto não for marcado como <strong>finalizado</strong>, este culto não conta no
          rodízio (contamos o que realmente aconteceu).
        </Alerta>
      )}

      {culto.observacao ? <Alerta tom="alerta">{culto.observacao}</Alerta> : null}

      <div className="flex flex-wrap gap-2">
        <Etiqueta tom={emAberto > 0 ? "alerta" : "sucesso"}>
          {emAberto > 0 ? `${emAberto} vaga(s) em aberto` : "Escala completa"}
        </Etiqueta>
        <Etiqueta>
          {confirmados}/{comPessoa.length} confirmados
        </Etiqueta>
      </div>

      {/* ------------------------------------------------------ vagas */}
      <Cartao>
        <CartaoCabecalho
          titulo="Escala"
          descricao="Troque qualquer pessoa manualmente ou deixe a vaga em aberto."
        />
        <CartaoCorpo className="space-y-4 pt-3">
          {itens.length === 0 ? (
            <p className="text-sm text-texto-suave">
              Nenhuma vaga neste culto ainda. Gere a escala ou adicione vagas abaixo.
            </p>
          ) : (
            grupos.map((funcaoId) => {
              const funcao = mapaFuncoes.get(funcaoId);
              const doGrupo = itens.filter((i) => i.funcao_id === funcaoId);
              const opcoes: OpcaoPessoa[] = (candidatosPorFuncao.get(funcaoId) ?? [])
                .map((pessoaId) => ({
                  id: pessoaId,
                  nome: mapaPessoas.get(pessoaId)?.nome ?? "Pessoa",
                  indisponivel: indisponiveis.has(pessoaId),
                  jaNoCulto: noCulto.has(pessoaId),
                }))
                .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

              return (
                <div key={funcaoId} className="rounded-xl border border-borda p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: funcao?.ministerio?.cor ?? "#8A1C3B" }}
                      aria-hidden="true"
                    />
                    <h2 className="text-sm font-semibold">
                      {funcao?.nome ?? "Função"}
                      <span className="ml-2 font-normal text-texto-suave">
                        {funcao?.ministerio?.nome}
                      </span>
                    </h2>
                  </div>

                  <ul className="space-y-2">
                    {doGrupo.map((item) => (
                      <li key={item.id} className="flex items-center gap-2">
                        <div className="min-w-0 flex-1">
                          <SeletorEscalado
                            itemId={item.id}
                            cultoId={culto.id}
                            pessoaId={item.pessoa_id}
                            opcoes={opcoes}
                            rotulo={funcao?.nome ?? "função"}
                          />
                        </div>
                        {item.pessoa_id ? (
                          <Etiqueta tom={item.confirmado ? "sucesso" : "alerta"}>
                            {item.confirmado ? "Confirmado" : "A confirmar"}
                          </Etiqueta>
                        ) : (
                          <Etiqueta tom="alerta">
                            <CircleAlert className="h-3 w-3" aria-hidden="true" />
                            Em aberto
                          </Etiqueta>
                        )}
                        <form action={removerItem}>
                          <input type="hidden" name="item_id" value={item.id} />
                          <input type="hidden" name="culto_id" value={culto.id} />
                          <button
                            type="submit"
                            className="text-texto-suave transition-colors hover:text-erro"
                            aria-label="Remover vaga"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </form>
                      </li>
                    ))}
                  </ul>

                  <form action={adicionarVagaNoCulto} className="mt-2">
                    <input type="hidden" name="culto_id" value={culto.id} />
                    <input type="hidden" name="funcao_id" value={funcaoId} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-xs font-medium text-vinho hover:underline"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      Mais uma vaga de {funcao?.nome ?? "função"}
                    </button>
                  </form>
                </div>
              );
            })
          )}

          <form action={adicionarVagaNoCulto} className="flex flex-wrap gap-2 border-t border-borda pt-4">
            <input type="hidden" name="culto_id" value={culto.id} />
            <Selecao name="funcao_id" required defaultValue="" aria-label="Função" className="max-w-64">
              <option value="" disabled>
                Adicionar vaga de…
              </option>
              {funcoes.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.ministerio?.nome} · {f.nome}
                </option>
              ))}
            </Selecao>
            <Botao type="submit" variante="secundario">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Adicionar
            </Botao>
          </form>
        </CartaoCorpo>
      </Cartao>

      {/* --------------------------------------------- indisponíveis */}
      {indisponiveis.size > 0 ? (
        <Cartao>
          <CartaoCabecalho
            titulo="Quem avisou que não pode"
            descricao="Essas pessoas ficam fora da geração automática deste culto."
          />
          <CartaoCorpo className="pt-3">
            <ul className="space-y-1 text-sm">
              {(indisponibilidades ?? [])
                .filter((d) => !d.disponivel)
                .map((d) => (
                  <li key={d.pessoa_id} className="flex flex-wrap gap-2 text-texto-suave">
                    <span className="font-medium text-texto">
                      {mapaPessoas.get(d.pessoa_id)?.nome ?? "Pessoa"}
                    </span>
                    {d.observacao ? <span>· {d.observacao}</span> : null}
                  </li>
                ))}
            </ul>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {/* ---------------------------------------------------- envio */}
      <Cartao>
        <CartaoCabecalho titulo="Enviar esta escala" />
        <CartaoCorpo className="space-y-3 pt-3">
          <BotaoWhatsApp texto={mensagem} />
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-borda bg-superficie-2 p-3 text-xs text-texto-suave">
            {mensagem}
          </pre>
        </CartaoCorpo>
      </Cartao>
    </div>
  );
}
