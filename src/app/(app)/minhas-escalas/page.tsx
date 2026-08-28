import type { Metadata } from "next";
import { CalendarCheck, Check, X } from "lucide-react";
import { exigirSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { mapaTiposCulto, rotuloCulto } from "@/lib/dados/cultos";
import { mapaFuncoes } from "@/lib/dados/ministerios";
import { mapaPessoasPublicas, nomeDe } from "@/lib/dados/pessoas";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCorpo } from "@/components/ui/cartao";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Alerta } from "@/components/ui/alerta";
import { Vazio } from "@/components/ui/vazio";
import { formatarDataExtenso, formatarHorario, hojeChave } from "@/lib/utils";
import type { Culto, EscalaItem } from "@/lib/tipos";
import { confirmarPresenca } from "../escalas/acoes";

export const metadata: Metadata = { title: "Minhas escalas" };

export default async function PaginaMinhasEscalas() {
  const sessao = await exigirSessao();
  const supabase = await criarClienteServidor();

  if (!sessao.pessoaId) {
    return (
      <div>
        <CabecalhoPagina titulo="Minhas escalas" />
        <Alerta tom="alerta">
          Seu acesso ainda não está ligado a um cadastro de membro. Peça para a liderança vincular
          para começar a receber escalas.
        </Alerta>
      </div>
    );
  }

  const { data: itensData } = await supabase
    .from("escala_itens")
    .select("*")
    .eq("pessoa_id", sessao.pessoaId);

  const itens = (itensData ?? []) as EscalaItem[];
  const cultoIds = [...new Set(itens.map((i) => i.culto_id))];

  const { data: cultosData } = cultoIds.length
    ? await supabase.from("cultos").select("*").in("id", cultoIds).order("data")
    : { data: [] as Culto[] };

  const cultos = new Map((cultosData ?? []).map((c) => [c.id, c as Culto]));
  const [tipos, funcoes] = await Promise.all([mapaTiposCulto(), mapaFuncoes()]);

  const hoje = hojeChave();
  const proximas = itens
    .filter((i) => (cultos.get(i.culto_id)?.data ?? "") >= hoje)
    .sort((a, b) => (cultos.get(a.culto_id)!.data ?? "").localeCompare(cultos.get(b.culto_id)!.data));
  const passadas = itens
    .filter((i) => (cultos.get(i.culto_id)?.data ?? "") < hoje)
    .sort((a, b) => (cultos.get(b.culto_id)!.data ?? "").localeCompare(cultos.get(a.culto_id)!.data))
    .slice(0, 10);

  // quem mais serve no mesmo culto (para a pessoa saber com quem vai servir)
  const { data: companheiros } = proximas.length
    ? await supabase
        .from("escala_itens")
        .select("culto_id, funcao_id, pessoa_id")
        .in(
          "culto_id",
          proximas.map((i) => i.culto_id),
        )
    : { data: [] as { culto_id: string; funcao_id: string; pessoa_id: string | null }[] };

  const pessoas = await mapaPessoasPublicas((companheiros ?? []).map((c) => c.pessoa_id));

  return (
    <div className="space-y-5">
      <CabecalhoPagina
        titulo="Minhas escalas"
        descricao="Confirme presença para a liderança saber com quem contar."
        acao={
          <BotaoLink href="/disponibilidade" variante="secundario" tamanho="sm">
            Informar disponibilidade
          </BotaoLink>
        }
      />

      {proximas.length === 0 ? (
        <Vazio
          titulo="Você não está escalado(a) por enquanto"
          descricao="Quando a liderança montar a escala, ela aparece aqui."
          acao={
            <BotaoLink href="/disponibilidade" variante="secundario">
              Informar disponibilidade
            </BotaoLink>
          }
        />
      ) : (
        <ul className="space-y-3">
          {proximas.map((item) => {
            const culto = cultos.get(item.culto_id)!;
            const equipe = (companheiros ?? []).filter(
              (c) => c.culto_id === item.culto_id && c.pessoa_id && c.pessoa_id !== sessao.pessoaId,
            );
            return (
              <li key={item.id}>
                <Cartao>
                  <CartaoCorpo className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">
                          {rotuloCulto(culto, tipos)} ·{" "}
                          <span className="text-primaria">
                            {funcoes.get(item.funcao_id)?.nome ?? "Função"}
                          </span>
                        </p>
                        <p className="text-xs capitalize text-texto-suave">
                          {formatarDataExtenso(culto.data)} · {formatarHorario(culto.horario)}
                        </p>
                      </div>
                      <Etiqueta tom={item.confirmado ? "sucesso" : "alerta"}>
                        {item.confirmado ? "Presença confirmada" : "Aguardando confirmação"}
                      </Etiqueta>
                    </div>

                    {equipe.length > 0 ? (
                      <p className="text-xs text-texto-suave">
                        Com você:{" "}
                        {equipe
                          .map(
                            (c) =>
                              `${nomeDe(pessoas, c.pessoa_id)} (${funcoes.get(c.funcao_id)?.nome ?? "função"})`,
                          )
                          .join(", ")}
                      </p>
                    ) : null}

                    <form action={confirmarPresenca} className="flex gap-2">
                      <input type="hidden" name="item_id" value={item.id} />
                      <input type="hidden" name="destino" value="/minhas-escalas" />
                      <input type="hidden" name="confirmado" value={item.confirmado ? "0" : "1"} />
                      <Botao type="submit" variante={item.confirmado ? "secundario" : "sucesso"}>
                        {item.confirmado ? (
                          <>
                            <X className="h-4 w-4" aria-hidden="true" />
                            Desmarcar presença
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" aria-hidden="true" />
                            Confirmar presença
                          </>
                        )}
                      </Botao>
                    </form>
                  </CartaoCorpo>
                </Cartao>
              </li>
            );
          })}
        </ul>
      )}

      {passadas.length > 0 ? (
        <Cartao>
          <CartaoCorpo>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <CalendarCheck className="h-4 w-4 text-primaria" aria-hidden="true" />
              Já servi recentemente
            </h2>
            <ul className="divide-y divide-borda text-sm">
              {passadas.map((item) => {
                const culto = cultos.get(item.culto_id)!;
                return (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="truncate">
                      {rotuloCulto(culto, tipos)} · {funcoes.get(item.funcao_id)?.nome ?? "Função"}
                    </span>
                    <span className="shrink-0 text-xs text-texto-suave">
                      {formatarDataExtenso(culto.data)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CartaoCorpo>
        </Cartao>
      ) : null}
    </div>
  );
}
