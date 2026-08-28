import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Wand2 } from "lucide-react";
import { exigirLideranca } from "@/lib/sessao";
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
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCabecalho, CartaoCorpo } from "@/components/ui/cartao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Alerta } from "@/components/ui/alerta";
import { Vazio } from "@/components/ui/vazio";
import { Revelar } from "@/components/revelar";
import { BotaoWhatsApp } from "@/components/botao-whatsapp";
import { montarMensagem, rotuloPeriodo, type CultoParaMensagem } from "@/lib/escala/mensagem";
import { formatarData, formatarDataExtenso, formatarHorario, hojeChave, somarDias } from "@/lib/utils";
import { FormularioGerar } from "./formulario-gerar";

export const metadata: Metadata = { title: "Escalas" };

export default async function PaginaEscalas({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; gerados?: string; abertas?: string }>;
}) {
  await exigirLideranca();
  const { aba, gerados, abertas } = await searchParams;
  const historico = aba === "historico";

  const config = await obterConfiguracoes();
  const supabase = await criarClienteServidor();

  const hoje = hojeChave();
  const cultos = historico
    ? ((
        await supabase
          .from("cultos")
          .select("*")
          .not("finalizado_em", "is", null)
          .order("data", { ascending: false })
          .limit(20)
      ).data ?? [])
    : await listarCultosPeriodo(hoje, somarDias(hoje, 60));

  const [tipos, funcoes] = await Promise.all([mapaTiposCulto(), mapaFuncoes()]);
  const itens = await listarEscalaDosCultos(cultos.map((c) => c.id));
  const porCulto = agruparPorCulto(itens);
  const pessoas = await mapaPessoasPublicas(itens.map((i) => i.pessoa_id));

  // Mensagem de WhatsApp com os próximos cultos que já têm escala.
  const paraMensagem: CultoParaMensagem[] = cultos
    .filter((c) => (porCulto.get(c.id) ?? []).length > 0)
    .slice(0, 6)
    .map((culto) => {
      const doCulto = porCulto.get(culto.id) ?? [];
      const porFuncao = new Map<string, string[]>();
      for (const item of doCulto) {
        const nome = funcoes.get(item.funcao_id)?.nome ?? "Função";
        porFuncao.set(nome, [
          ...(porFuncao.get(nome) ?? []),
          item.pessoa_id ? nomeDe(pessoas, item.pessoa_id) : "",
        ]);
      }
      return {
        rotulo: rotuloCulto(culto, tipos),
        data: culto.data,
        horario: culto.horario,
        linhas: [...porFuncao.entries()].map(([funcao, nomes]) => ({ funcao, pessoas: nomes })),
      };
    });

  const mensagem = montarMensagem({
    titulo: config.mensagem_titulo,
    despedida: config.mensagem_despedida,
    periodo: rotuloPeriodo(paraMensagem.map((c) => c.data)),
    cultos: paraMensagem,
  });

  return (
    <div className="space-y-5">
      <CabecalhoPagina
        titulo="Escalas"
        descricao="Gere a escala com rodízio justo e ajuste o que precisar."
        acao={
          <Revelar rotulo="Gerar escala" icone={<Wand2 className="h-4 w-4" />}>
            <Cartao>
              <CartaoCorpo>
                <FormularioGerar
                  de={hoje}
                  ate={somarDias(hoje, 28)}
                  limitePadrao={config.limite_escalas_mes}
                />
              </CartaoCorpo>
            </Cartao>
          </Revelar>
        }
      />

      {gerados ? (
        <Alerta tom={Number(abertas) > 0 ? "alerta" : "sucesso"}>
          Escala gerada para {gerados} culto(s).{" "}
          {Number(abertas) > 0
            ? `${abertas} vaga(s) ficaram em aberto — ajuste manualmente onde precisar.`
            : "Todas as vagas foram preenchidas."}
        </Alerta>
      ) : null}

      <div className="flex gap-2">
        <Link
          href="/escalas"
          className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
            historico ? "text-texto-suave hover:text-texto" : "bg-primaria-tenue text-primaria"
          }`}
        >
          Próximos cultos
        </Link>
        <Link
          href="/escalas?aba=historico"
          className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
            historico ? "bg-primaria-tenue text-primaria" : "text-texto-suave hover:text-texto"
          }`}
        >
          Histórico
        </Link>
      </div>

      {!historico && paraMensagem.length > 0 ? (
        <Cartao>
          <CartaoCabecalho
            titulo="Enviar a escala"
            descricao="Abre o WhatsApp com o texto pronto — você escolhe o grupo."
          />
          <CartaoCorpo className="space-y-3 pt-3">
            <BotaoWhatsApp texto={mensagem} rotulo="Enviar pro WhatsApp" />
            <pre className="max-h-56 overflow-auto whitespace-pre-wrap rounded-xl border border-borda bg-superficie-2 p-3 text-xs text-texto-suave">
              {mensagem}
            </pre>
          </CartaoCorpo>
        </Cartao>
      ) : null}

      {cultos.length === 0 ? (
        <Vazio
          titulo={historico ? "Nenhum culto finalizado ainda" : "Nenhum culto programado"}
          descricao={
            historico
              ? "Ao marcar um culto como finalizado, ele entra no histórico e passa a contar no rodízio."
              : "Gere as ocorrências dos cultos recorrentes na tela de Cultos."
          }
        />
      ) : (
        <ul className="space-y-3">
          {cultos.map((culto) => {
            const doCulto = porCulto.get(culto.id) ?? [];
            const emAberto = doCulto.filter((i) => !i.pessoa_id).length;
            const confirmados = doCulto.filter((i) => i.confirmado).length;
            return (
              <li key={culto.id}>
                <Link href={`/escalas/${culto.id}`}>
                  <Cartao className="transition-colors hover:border-primaria">
                    <CartaoCorpo>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium">{rotuloCulto(culto, tipos)}</p>
                          <p className="text-xs capitalize text-texto-suave">
                            {formatarDataExtenso(culto.data)} · {formatarHorario(culto.horario)}
                          </p>
                        </div>
                        <ChevronRight
                          className="h-4 w-4 shrink-0 text-texto-suave"
                          aria-hidden="true"
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {culto.finalizado_em ? (
                          <Etiqueta tom="sucesso">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            Finalizado em {formatarData(culto.finalizado_em.slice(0, 10))}
                          </Etiqueta>
                        ) : null}
                        {doCulto.length === 0 ? (
                          <Etiqueta tom="neutro">Sem escala</Etiqueta>
                        ) : (
                          <>
                            <Etiqueta tom={emAberto > 0 ? "alerta" : "sucesso"}>
                              {emAberto > 0 ? `${emAberto} vaga(s) em aberto` : "Escala completa"}
                            </Etiqueta>
                            <Etiqueta>
                              {confirmados}/{doCulto.filter((i) => i.pessoa_id).length} confirmados
                            </Etiqueta>
                          </>
                        )}
                      </div>
                    </CartaoCorpo>
                  </Cartao>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
