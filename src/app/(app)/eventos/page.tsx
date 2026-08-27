import type { Metadata } from "next";
/* eslint-disable @next/next/no-img-element */
import { CalendarClock, MapPin, Plus, Trash2, User } from "lucide-react";
import { exigirLideranca } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { listarMinisterios } from "@/lib/dados/ministerios";
import { listarPessoasPublicas } from "@/lib/dados/pessoas";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCorpo } from "@/components/ui/cartao";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Vazio } from "@/components/ui/vazio";
import { Revelar } from "@/components/revelar";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import type { Evento } from "@/lib/tipos";
import { chaveDataIso, formatarData, horaIso } from "@/lib/utils";
import { FormularioEvento } from "./formulario";
import { excluirEvento } from "./acoes";

export const metadata: Metadata = { title: "Eventos" };

export default async function PaginaEventos() {
  await exigirLideranca();
  const supabase = await criarClienteServidor();

  const [{ data: eventosData }, ministerios, pessoas] = await Promise.all([
    supabase.from("eventos").select("*").order("inicio", { ascending: false }).limit(60),
    listarMinisterios(),
    listarPessoasPublicas(),
  ]);

  const eventos = (eventosData ?? []) as Evento[];
  const agora = new Date().toISOString();
  const proximos = eventos.filter((e) => (e.fim ?? e.inicio) >= agora).reverse();
  const passados = eventos.filter((e) => (e.fim ?? e.inicio) < agora);

  const mapaMinisterios = new Map(ministerios.map((m) => [m.id, m]));
  const mapaPessoas = new Map(pessoas.map((p) => [p.id, p]));

  function CartaoEvento({ evento, passado }: { evento: Evento; passado?: boolean }) {
    const ministerio = evento.ministerio_id ? mapaMinisterios.get(evento.ministerio_id) : undefined;
    const responsavel = evento.responsavel_id
      ? mapaPessoas.get(evento.responsavel_id)
      : undefined;

    return (
      <Cartao className={passado ? "opacity-70" : undefined}>
        {evento.imagem_url ? (
          <img
            src={evento.imagem_url}
            alt=""
            className="h-36 w-full rounded-t-2xl object-cover"
          />
        ) : null}
        <CartaoCorpo className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h2 className="font-semibold">{evento.titulo}</h2>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-texto-suave">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatarData(chaveDataIso(evento.inicio))} às {horaIso(evento.inicio)}
                  {evento.fim
                    ? ` — ${formatarData(chaveDataIso(evento.fim))} ${horaIso(evento.fim)}`
                    : ""}
                </span>
                {evento.local ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {evento.local}
                  </span>
                ) : null}
                {responsavel ? (
                  <span className="inline-flex items-center gap-1">
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                    {responsavel.nome}
                  </span>
                ) : null}
              </p>
            </div>
            {ministerio ? (
              <Etiqueta tom="vinho">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: ministerio.cor }}
                  aria-hidden="true"
                />
                {ministerio.nome}
              </Etiqueta>
            ) : null}
          </div>

          {evento.descricao ? (
            <p className="whitespace-pre-wrap text-sm text-texto-suave">{evento.descricao}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Revelar rotulo="Editar">
              <FormularioEvento evento={evento} ministerios={ministerios} pessoas={pessoas} />
            </Revelar>
            <ConfirmarAcao
              acao={excluirEvento}
              campos={{ id: evento.id }}
              pergunta={`Excluir o evento "${evento.titulo}"?`}
              variante="fantasma"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Excluir
            </ConfirmarAcao>
          </div>
        </CartaoCorpo>
      </Cartao>
    );
  }

  return (
    <div className="space-y-5">
      <CabecalhoPagina
        titulo="Programação e eventos"
        descricao="Congressos, ensaios, reuniões, batismos e células."
        acao={
          <Revelar rotulo="Novo evento" icone={<Plus className="h-4 w-4" />}>
            <Cartao>
              <CartaoCorpo>
                <FormularioEvento ministerios={ministerios} pessoas={pessoas} />
              </CartaoCorpo>
            </Cartao>
          </Revelar>
        }
      />

      {proximos.length === 0 && passados.length === 0 ? (
        <Vazio
          titulo="Nenhum evento cadastrado"
          descricao="Cadastre o próximo congresso, ensaio ou reunião da igreja."
        />
      ) : null}

      {proximos.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-semibold">Próximos</h2>
          {proximos.map((evento) => (
            <CartaoEvento key={evento.id} evento={evento} />
          ))}
        </section>
      ) : null}

      {passados.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-semibold">Já aconteceram</h2>
          {passados.slice(0, 10).map((evento) => (
            <CartaoEvento key={evento.id} evento={evento} passado />
          ))}
        </section>
      ) : null}
    </div>
  );
}
