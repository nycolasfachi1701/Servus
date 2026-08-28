import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { exigirLideranca } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { listarFuncoesComMinisterio, listarMinisterios } from "@/lib/dados/ministerios";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCorpo } from "@/components/ui/cartao";
import { Vazio } from "@/components/ui/vazio";
import { Etiqueta } from "@/components/ui/etiqueta";
import { NovoMinisterio } from "./formulario";

export const metadata: Metadata = { title: "Ministérios" };

export default async function PaginaMinisterios() {
  const sessao = await exigirLideranca();
  const supabase = await criarClienteServidor();

  const [ministerios, funcoes, { data: vinculos }] = await Promise.all([
    listarMinisterios(),
    listarFuncoesComMinisterio(),
    supabase.from("pessoa_funcao").select("pessoa_id, funcao_id"),
  ]);

  const pessoasPorMinisterio = new Map<string, Set<string>>();
  const funcaoParaMinisterio = new Map(funcoes.map((f) => [f.id, f.ministerio_id]));
  for (const vinculo of vinculos ?? []) {
    const ministerioId = funcaoParaMinisterio.get(vinculo.funcao_id);
    if (!ministerioId) continue;
    const set = pessoasPorMinisterio.get(ministerioId) ?? new Set<string>();
    set.add(vinculo.pessoa_id);
    pessoasPorMinisterio.set(ministerioId, set);
  }

  return (
    <div>
      <CabecalhoPagina
        titulo="Ministérios e equipes"
        descricao="Cada ministério tem funções; as funções definem quem pode ser escalado."
        acao={sessao.ehAdmin ? <NovoMinisterio /> : undefined}
      />

      {ministerios.length === 0 ? (
        <Vazio
          titulo="Nenhum ministério cadastrado"
          descricao="Comece criando o ministério de Louvor, Som, Recepção…"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {ministerios.map((ministerio) => {
            const doMinisterio = funcoes.filter((f) => f.ministerio_id === ministerio.id);
            const pessoas = pessoasPorMinisterio.get(ministerio.id)?.size ?? 0;
            return (
              <Link key={ministerio.id} href={`/ministerios/${ministerio.id}`}>
                <Cartao className="h-full transition-colors hover:border-primaria">
                  <CartaoCorpo>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: ministerio.cor }}
                          aria-hidden="true"
                        />
                        <h2 className="truncate font-semibold">{ministerio.nome}</h2>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-texto-suave" aria-hidden="true" />
                    </div>
                    {ministerio.descricao ? (
                      <p className="mt-1 line-clamp-2 text-sm text-texto-suave">
                        {ministerio.descricao}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Etiqueta>{doMinisterio.length} função(ões)</Etiqueta>
                      <Etiqueta>{pessoas} pessoa(s)</Etiqueta>
                    </div>
                  </CartaoCorpo>
                </Cartao>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
