import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Trash2, UserPlus, X } from "lucide-react";
import { exigirLideranca } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { listarPessoasPublicas } from "@/lib/dados/pessoas";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCabecalho, CartaoCorpo } from "@/components/ui/cartao";
import { Botao } from "@/components/ui/botao";
import { Entrada, Selecao } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Avatar } from "@/components/ui/avatar";
import { Alerta } from "@/components/ui/alerta";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import { FormularioMinisterio } from "../formulario";
import {
  criarFuncao,
  definirLider,
  definirPessoaNaFuncao,
  excluirFuncao,
  excluirMinisterio,
} from "../acoes";
import type { Funcao, Ministerio } from "@/lib/tipos";

export const metadata: Metadata = { title: "Ministério" };

export default async function PaginaMinisterio({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessao = await exigirLideranca();
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data } = await supabase.from("ministerios").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const ministerio = data as Ministerio;

  const podeEditar = sessao.ehAdmin || sessao.ministeriosLiderados.includes(id);

  const [{ data: funcoesData }, { data: lideres }, pessoas] = await Promise.all([
    supabase.from("funcoes").select("*").eq("ministerio_id", id).order("nome"),
    supabase.from("ministerio_lideres").select("pessoa_id").eq("ministerio_id", id),
    listarPessoasPublicas(),
  ]);

  const funcoes = (funcoesData ?? []) as Funcao[];
  const funcaoIds = funcoes.map((f) => f.id);

  const { data: vinculos } = funcaoIds.length
    ? await supabase.from("pessoa_funcao").select("pessoa_id, funcao_id").in("funcao_id", funcaoIds)
    : { data: [] as { pessoa_id: string; funcao_id: string }[] };

  const mapaPessoas = new Map(pessoas.map((p) => [p.id, p]));
  const porFuncao = new Map<string, string[]>();
  for (const vinculo of vinculos ?? []) {
    porFuncao.set(vinculo.funcao_id, [
      ...(porFuncao.get(vinculo.funcao_id) ?? []),
      vinculo.pessoa_id,
    ]);
  }

  const idsLideres = new Set((lideres ?? []).map((l) => l.pessoa_id));

  return (
    <div>
      <CabecalhoPagina
        titulo={ministerio.nome}
        descricao={ministerio.descricao ?? "Funções, equipe e liderança do ministério."}
        acao={
          sessao.ehAdmin ? (
            <ConfirmarAcao
              acao={excluirMinisterio}
              campos={{ id: ministerio.id }}
              pergunta={`Excluir o ministério ${ministerio.nome}? As funções e vínculos serão removidos.`}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Excluir
            </ConfirmarAcao>
          ) : undefined
        }
      />

      {!podeEditar ? (
        <Alerta tom="alerta" className="mb-4">
          Você pode consultar este ministério, mas só a liderança dele (ou um administrador) faz
          alterações.
        </Alerta>
      ) : null}

      <div className="space-y-5">
        {/* ------------------------------------------------- funções */}
        <Cartao>
          <CartaoCabecalho
            titulo="Funções e equipe"
            descricao="Quem exerce cada função pode ser escalado para ela."
          />
          <CartaoCorpo className="space-y-4 pt-3">
            {funcoes.length === 0 ? (
              <p className="text-sm text-texto-suave">Nenhuma função cadastrada ainda.</p>
            ) : (
              funcoes.map((funcao) => {
                const daFuncao = porFuncao.get(funcao.id) ?? [];
                const disponiveis = pessoas.filter((p) => !daFuncao.includes(p.id));
                return (
                  <div key={funcao.id} className="rounded-xl border border-borda p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium">{funcao.nome}</h3>
                      {podeEditar ? (
                        <ConfirmarAcao
                          acao={excluirFuncao}
                          campos={{ id: funcao.id, ministerio_id: ministerio.id }}
                          pergunta={`Excluir a função ${funcao.nome}? Ela sairá das escalas futuras.`}
                          variante="fantasma"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only">Excluir função</span>
                        </ConfirmarAcao>
                      ) : null}
                    </div>

                    {daFuncao.length === 0 ? (
                      <p className="mt-2 text-sm text-texto-suave">Ninguém nesta função.</p>
                    ) : (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {daFuncao.map((pessoaId) => {
                          const pessoa = mapaPessoas.get(pessoaId);
                          return (
                            <li
                              key={pessoaId}
                              className="flex items-center gap-2 rounded-full border border-borda py-1 pl-1 pr-2 text-sm"
                            >
                              <Avatar
                                nome={pessoa?.nome ?? "?"}
                                fotoUrl={pessoa?.foto_url}
                                tamanho="sm"
                                className="h-6 w-6 text-[10px]"
                              />
                              {pessoa?.nome ?? "Pessoa"}
                              {podeEditar ? (
                                <form action={definirPessoaNaFuncao}>
                                  <input type="hidden" name="funcao_id" value={funcao.id} />
                                  <input type="hidden" name="pessoa_id" value={pessoaId} />
                                  <input type="hidden" name="ministerio_id" value={ministerio.id} />
                                  <input type="hidden" name="remover" value="1" />
                                  <button
                                    type="submit"
                                    className="text-texto-suave transition-colors hover:text-erro"
                                    aria-label={`Remover ${pessoa?.nome ?? "pessoa"} de ${funcao.nome}`}
                                  >
                                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </form>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    {podeEditar && disponiveis.length > 0 ? (
                      <form action={definirPessoaNaFuncao} className="mt-3 flex gap-2">
                        <input type="hidden" name="funcao_id" value={funcao.id} />
                        <input type="hidden" name="ministerio_id" value={ministerio.id} />
                        <Selecao
                          name="pessoa_id"
                          required
                          aria-label={`Adicionar pessoa em ${funcao.nome}`}
                          defaultValue=""
                        >
                          <option value="" disabled>
                            Adicionar pessoa…
                          </option>
                          {disponiveis.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome}
                            </option>
                          ))}
                        </Selecao>
                        <Botao type="submit" variante="secundario" tamanho="md">
                          <UserPlus className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only sm:not-sr-only">Adicionar</span>
                        </Botao>
                      </form>
                    ) : null}
                  </div>
                );
              })
            )}

            {podeEditar ? (
              <form action={criarFuncao} className="flex gap-2 border-t border-borda pt-4">
                <input type="hidden" name="ministerio_id" value={ministerio.id} />
                <Entrada
                  name="nome"
                  required
                  minLength={2}
                  placeholder="Nova função (ex.: Violão)"
                  aria-label="Nome da nova função"
                />
                <Botao type="submit">Criar</Botao>
              </form>
            ) : null}
          </CartaoCorpo>
        </Cartao>

        {/* ------------------------------------------------- líderes */}
        <Cartao>
          <CartaoCabecalho
            titulo="Liderança"
            descricao="Líderes gerenciam as escalas e a equipe deste ministério."
          />
          <CartaoCorpo className="space-y-3 pt-3">
            {idsLideres.size === 0 ? (
              <p className="text-sm text-texto-suave">Nenhum líder definido.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {[...idsLideres].map((pessoaId) => (
                  <li key={pessoaId} className="flex items-center gap-2">
                    <Etiqueta tom="vinho">{mapaPessoas.get(pessoaId)?.nome ?? "Pessoa"}</Etiqueta>
                    {sessao.ehAdmin ? (
                      <form action={definirLider}>
                        <input type="hidden" name="ministerio_id" value={ministerio.id} />
                        <input type="hidden" name="pessoa_id" value={pessoaId} />
                        <input type="hidden" name="remover" value="1" />
                        <button
                          type="submit"
                          className="text-texto-suave transition-colors hover:text-erro"
                          aria-label="Remover liderança"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </form>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}

            {sessao.ehAdmin ? (
              <form action={definirLider} className="flex gap-2">
                <input type="hidden" name="ministerio_id" value={ministerio.id} />
                <Selecao name="pessoa_id" required defaultValue="" aria-label="Definir líder">
                  <option value="" disabled>
                    Definir líder…
                  </option>
                  {pessoas
                    .filter((p) => !idsLideres.has(p.id))
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                </Selecao>
                <Botao type="submit" variante="secundario">
                  Adicionar
                </Botao>
              </form>
            ) : null}
          </CartaoCorpo>
        </Cartao>

        {/* -------------------------------------------------- edição */}
        {sessao.ehAdmin ? (
          <Cartao>
            <CartaoCabecalho titulo="Dados do ministério" />
            <CartaoCorpo className="pt-3">
              <FormularioMinisterio ministerio={ministerio} comoCartao={false} />
            </CartaoCorpo>
          </Cartao>
        ) : null}
      </div>
    </div>
  );
}
