"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Botao } from "@/components/ui/botao";
import { AreaTexto, Campo, Entrada, Selecao } from "@/components/ui/campo";
import { Alerta } from "@/components/ui/alerta";
import { CampoFoto } from "@/components/campo-foto";
import type { Evento, Ministerio, PessoaPublica } from "@/lib/tipos";
import { isoParaCampoLocal } from "@/lib/utils";
import { salvarEvento, type EstadoEvento } from "./acoes";

const VAZIO: EstadoEvento = {};

function BotaoSalvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? "Salvando…" : rotulo}
    </Botao>
  );
}

export function FormularioEvento({
  evento,
  ministerios,
  pessoas,
}: {
  evento?: Evento;
  ministerios: Ministerio[];
  pessoas: PessoaPublica[];
}) {
  const [estado, acao] = useActionState(salvarEvento, VAZIO);
  const sufixo = evento?.id ?? "novo";

  return (
    <form action={acao} className="space-y-4">
      {evento ? <input type="hidden" name="id" value={evento.id} /> : null}
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
      {estado.ok ? <Alerta tom="sucesso">{estado.ok}</Alerta> : null}

      <Campo rotulo="Título" htmlFor={`titulo-${sufixo}`} obrigatorio>
        <Entrada
          id={`titulo-${sufixo}`}
          name="titulo"
          required
          defaultValue={evento?.titulo}
          placeholder="Ex.: Congresso de Jovens"
        />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Início" htmlFor={`inicio-${sufixo}`} obrigatorio>
          <Entrada
            id={`inicio-${sufixo}`}
            name="inicio"
            type="datetime-local"
            required
            defaultValue={evento ? isoParaCampoLocal(evento.inicio) : ""}
          />
        </Campo>
        <Campo rotulo="Término" htmlFor={`fim-${sufixo}`}>
          <Entrada
            id={`fim-${sufixo}`}
            name="fim"
            type="datetime-local"
            defaultValue={evento?.fim ? isoParaCampoLocal(evento.fim) : ""}
          />
        </Campo>
        <Campo rotulo="Local" htmlFor={`local-${sufixo}`}>
          <Entrada id={`local-${sufixo}`} name="local" defaultValue={evento?.local ?? ""} />
        </Campo>
        <Campo rotulo="Ministério envolvido" htmlFor={`ministerio-${sufixo}`}>
          <Selecao
            id={`ministerio-${sufixo}`}
            name="ministerio_id"
            defaultValue={evento?.ministerio_id ?? ""}
          >
            <option value="">Toda a igreja</option>
            {ministerios.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo rotulo="Responsável" htmlFor={`responsavel-${sufixo}`}>
          <Selecao
            id={`responsavel-${sufixo}`}
            name="responsavel_id"
            defaultValue={evento?.responsavel_id ?? ""}
          >
            <option value="">Sem responsável definido</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </Selecao>
        </Campo>
      </div>

      <Campo rotulo="Descrição" htmlFor={`descricao-${sufixo}`}>
        <AreaTexto id={`descricao-${sufixo}`} name="descricao" defaultValue={evento?.descricao ?? ""} />
      </Campo>

      <CampoFoto
        nome="imagem_url"
        valorInicial={evento?.imagem_url}
        pasta="eventos"
        rotulo="Imagem do evento"
      />

      <BotaoSalvar rotulo={evento ? "Salvar alterações" : "Criar evento"} />
    </form>
  );
}
