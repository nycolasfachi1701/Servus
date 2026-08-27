import type { Metadata } from "next";
import { CalendarPlus, Plus, Trash2, X } from "lucide-react";
import { exigirLideranca } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { listarFuncoesComMinisterio } from "@/lib/dados/ministerios";
import { listarTiposCulto } from "@/lib/dados/cultos";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCabecalho, CartaoCorpo } from "@/components/ui/cartao";
import { Botao } from "@/components/ui/botao";
import { Entrada, Selecao } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Vazio } from "@/components/ui/vazio";
import { Revelar } from "@/components/revelar";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import { DIAS_SEMANA, type Culto, type TipoCultoVaga } from "@/lib/tipos";
import { formatarData, formatarHorario, hojeChave } from "@/lib/utils";
import { FormularioCultoAvulso, FormularioTipoCulto } from "./formulario";
import { definirVaga, excluirCulto, excluirTipoCulto, gerarOcorrencias } from "./acoes";

export const metadata: Metadata = { title: "Cultos" };

export default async function PaginaCultos() {
  const sessao = await exigirLideranca();
  const supabase = await criarClienteServidor();

  const [tipos, funcoes, { data: vagasData }, { data: proximos }] = await Promise.all([
    listarTiposCulto(),
    listarFuncoesComMinisterio(),
    supabase.from("tipo_culto_vaga").select("*"),
    supabase
      .from("cultos")
      .select("*")
      .gte("data", hojeChave())
      .order("data")
      .order("horario")
      .limit(20),
  ]);

  const vagas = (vagasData ?? []) as TipoCultoVaga[];
  const mapaFuncoes = new Map(funcoes.map((f) => [f.id, f]));
  const nomeTipo = new Map(tipos.map((t) => [t.id, t.nome]));

  return (
    <div className="space-y-5">
      <CabecalhoPagina
        titulo="Dias e tipos de culto"
        descricao="Cultos recorrentes, vagas por função e as próximas ocorrências."
        acao={
          sessao.ehAdmin ? (
            <Revelar rotulo="Novo tipo de culto" icone={<Plus className="h-4 w-4" />}>
              <Cartao>
                <CartaoCorpo>
                  <FormularioTipoCulto />
                </CartaoCorpo>
              </Cartao>
            </Revelar>
          ) : undefined
        }
      />

      {/* ------------------------------------------ tipos recorrentes */}
      {tipos.length === 0 ? (
        <Vazio
          titulo="Nenhum culto recorrente cadastrado"
          descricao="Cadastre, por exemplo, Domingo Manhã 09h, Domingo Noite 19h e Quarta 20h."
        />
      ) : (
        <div className="space-y-4">
          {tipos.map((tipo) => {
            const doTipo = vagas.filter((v) => v.tipo_culto_id === tipo.id);
            const usadas = new Set(doTipo.map((v) => v.funcao_id));
            return (
              <Cartao key={tipo.id}>
                <CartaoCabecalho
                  titulo={
                    <span className="flex flex-wrap items-center gap-2">
                      {tipo.nome}
                      {!tipo.ativo ? <Etiqueta tom="neutro">Inativo</Etiqueta> : null}
                    </span>
                  }
                  descricao={`${DIAS_SEMANA[tipo.dia_semana]} às ${formatarHorario(tipo.horario)}`}
                  acao={
                    sessao.ehAdmin ? (
                      <div className="flex gap-2">
                        <Revelar rotulo="Editar">
                          <FormularioTipoCulto tipo={tipo} />
                        </Revelar>
                        <ConfirmarAcao
                          acao={excluirTipoCulto}
                          campos={{ id: tipo.id }}
                          pergunta={`Excluir o tipo "${tipo.nome}"? As ocorrências futuras continuam existindo.`}
                          variante="fantasma"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Excluir</span>
                        </ConfirmarAcao>
                      </div>
                    ) : undefined
                  }
                />
                <CartaoCorpo className="pt-3">
                  <p className="mb-2 text-sm font-medium text-texto-suave">Vagas por função</p>
                  {doTipo.length === 0 ? (
                    <p className="text-sm text-texto-suave">
                      Nenhuma vaga definida — a escala deste culto nascerá vazia.
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {doTipo.map((vaga) => {
                        const funcao = mapaFuncoes.get(vaga.funcao_id);
                        return (
                          <li key={vaga.id}>
                            <span className="inline-flex items-center gap-2 rounded-full border border-borda bg-superficie-2 px-3 py-1 text-sm">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: funcao?.ministerio?.cor ?? "#8A1C3B" }}
                                aria-hidden="true"
                              />
                              {funcao?.nome ?? "Função"} × {vaga.quantidade}
                              {sessao.ehAdmin ? (
                                <form action={definirVaga}>
                                  <input type="hidden" name="tipo_culto_id" value={tipo.id} />
                                  <input type="hidden" name="funcao_id" value={vaga.funcao_id} />
                                  <input type="hidden" name="quantidade" value="0" />
                                  <button
                                    type="submit"
                                    className="text-texto-suave transition-colors hover:text-erro"
                                    aria-label={`Remover vaga de ${funcao?.nome ?? "função"}`}
                                  >
                                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </form>
                              ) : null}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {sessao.ehAdmin && funcoes.length > 0 ? (
                    <form action={definirVaga} className="mt-3 flex flex-wrap gap-2">
                      <input type="hidden" name="tipo_culto_id" value={tipo.id} />
                      <Selecao
                        name="funcao_id"
                        required
                        defaultValue=""
                        aria-label="Função"
                        className="max-w-56"
                      >
                        <option value="" disabled>
                          Adicionar função…
                        </option>
                        {funcoes
                          .filter((f) => !usadas.has(f.id))
                          .map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.ministerio?.nome} · {f.nome}
                            </option>
                          ))}
                      </Selecao>
                      <Entrada
                        name="quantidade"
                        type="number"
                        min={1}
                        max={20}
                        defaultValue={1}
                        aria-label="Quantidade"
                        className="w-20"
                      />
                      <Botao type="submit" variante="secundario">
                        Adicionar
                      </Botao>
                    </form>
                  ) : null}
                </CartaoCorpo>
              </Cartao>
            );
          })}
        </div>
      )}

      {/* --------------------------------------------- ocorrências */}
      <Cartao>
        <CartaoCabecalho
          titulo="Próximas ocorrências"
          descricao="Cada ocorrência é um culto concreto que recebe escala."
          acao={
            <form action={gerarOcorrencias} className="flex gap-2">
              <Selecao name="semanas" defaultValue="4" aria-label="Semanas a gerar" className="w-28">
                <option value="2">2 semanas</option>
                <option value="4">4 semanas</option>
                <option value="8">8 semanas</option>
                <option value="12">12 semanas</option>
              </Selecao>
              <Botao type="submit">
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                Gerar
              </Botao>
            </form>
          }
        />
        <CartaoCorpo className="pt-3">
          {(proximos ?? []).length === 0 ? (
            <p className="text-sm text-texto-suave">
              Nenhuma ocorrência futura. Use o botão “Gerar” para criar os próximos cultos.
            </p>
          ) : (
            <ul className="divide-y divide-borda">
              {(proximos as Culto[]).map((culto) => (
                <li key={culto.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {culto.titulo ??
                        (culto.tipo_culto_id ? nomeTipo.get(culto.tipo_culto_id) : "Culto") ??
                        "Culto"}
                    </p>
                    <p className="text-xs text-texto-suave">
                      {formatarData(culto.data)} às {formatarHorario(culto.horario)}
                      {culto.titulo ? " · avulso" : ""}
                    </p>
                  </div>
                  {sessao.ehAdmin ? (
                    <ConfirmarAcao
                      acao={excluirCulto}
                      campos={{ id: culto.id }}
                      pergunta="Excluir este culto? A escala dele será apagada."
                      variante="fantasma"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Excluir culto</span>
                    </ConfirmarAcao>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-borda pt-4">
            <Revelar rotulo="Criar culto avulso" icone={<Plus className="h-4 w-4" />}>
              <FormularioCultoAvulso />
            </Revelar>
          </div>
        </CartaoCorpo>
      </Cartao>
    </div>
  );
}
