import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { exigirSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { listarCultosPeriodo, mapaTiposCulto, rotuloCulto } from "@/lib/dados/cultos";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCorpo } from "@/components/ui/cartao";
import { Botao } from "@/components/ui/botao";
import { Entrada } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Alerta } from "@/components/ui/alerta";
import { Vazio } from "@/components/ui/vazio";
import { formatarDataExtenso, formatarHorario, hojeChave, somarDias } from "@/lib/utils";
import { definirDisponibilidade } from "./acoes";

export const metadata: Metadata = { title: "Disponibilidade" };

export default async function PaginaDisponibilidade() {
  const sessao = await exigirSessao();
  const supabase = await criarClienteServidor();

  const hoje = hojeChave();
  const [cultos, tipos] = await Promise.all([
    listarCultosPeriodo(hoje, somarDias(hoje, 60)),
    mapaTiposCulto(),
  ]);

  const { data: registros } = sessao.pessoaId
    ? await supabase
        .from("disponibilidade")
        .select("culto_id, disponivel, observacao")
        .eq("pessoa_id", sessao.pessoaId)
    : { data: [] };

  const mapa = new Map((registros ?? []).map((r) => [r.culto_id, r]));

  return (
    <div>
      <CabecalhoPagina
        titulo="Minha disponibilidade"
        descricao="Avise com antecedência quando não puder servir — quem marca “não posso” fica fora da geração automática."
      />

      {!sessao.pessoaId ? (
        <Alerta tom="alerta">
          Seu acesso ainda não está ligado a um cadastro de membro. Peça para a liderança vincular.
        </Alerta>
      ) : cultos.length === 0 ? (
        <Vazio titulo="Nenhum culto programado" descricao="Assim que houver cultos, eles aparecem aqui." />
      ) : (
        <ul className="space-y-3">
          {cultos.map((culto) => {
            const registro = mapa.get(culto.id);
            const indisponivel = registro && !registro.disponivel;
            return (
              <li key={culto.id}>
                <Cartao>
                  <CartaoCorpo className="space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{rotuloCulto(culto, tipos)}</p>
                        <p className="text-xs capitalize text-texto-suave">
                          {formatarDataExtenso(culto.data)} · {formatarHorario(culto.horario)}
                        </p>
                      </div>
                      {registro ? (
                        <Etiqueta tom={indisponivel ? "erro" : "sucesso"}>
                          {indisponivel ? "Não posso" : "Disponível"}
                        </Etiqueta>
                      ) : (
                        <Etiqueta tom="neutro">Sem resposta</Etiqueta>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <form action={definirDisponibilidade} className="flex flex-1 flex-wrap gap-2">
                        <input type="hidden" name="culto_id" value={culto.id} />
                        <input type="hidden" name="disponivel" value="0" />
                        <Entrada
                          name="observacao"
                          placeholder="Motivo (opcional)"
                          defaultValue={registro?.observacao ?? ""}
                          aria-label="Motivo"
                          className="min-w-40 flex-1"
                        />
                        <Botao type="submit" variante={indisponivel ? "perigo" : "secundario"}>
                          <X className="h-4 w-4" aria-hidden="true" />
                          Não posso
                        </Botao>
                      </form>

                      <form action={definirDisponibilidade}>
                        <input type="hidden" name="culto_id" value={culto.id} />
                        <input type="hidden" name="disponivel" value="1" />
                        <Botao
                          type="submit"
                          variante={registro && registro.disponivel ? "sucesso" : "secundario"}
                        >
                          <Check className="h-4 w-4" aria-hidden="true" />
                          Posso servir
                        </Botao>
                      </form>
                    </div>
                  </CartaoCorpo>
                </Cartao>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
