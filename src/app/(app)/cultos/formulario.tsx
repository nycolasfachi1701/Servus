"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Botao } from "@/components/ui/botao";
import { AreaTexto, Campo, Entrada, Selecao } from "@/components/ui/campo";
import { Alerta } from "@/components/ui/alerta";
import { DIAS_SEMANA, type TipoCulto } from "@/lib/tipos";
import { criarCultoAvulso, salvarTipoCulto, type EstadoCulto } from "./acoes";

const VAZIO: EstadoCulto = {};

function BotaoSalvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? "Salvando…" : rotulo}
    </Botao>
  );
}

export function FormularioTipoCulto({ tipo }: { tipo?: TipoCulto }) {
  const [estado, acao] = useActionState(salvarTipoCulto, VAZIO);
  const sufixo = tipo?.id ?? "novo";

  return (
    <form action={acao} className="space-y-4">
      {tipo ? <input type="hidden" name="id" value={tipo.id} /> : null}
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
      {estado.ok ? <Alerta tom="sucesso">{estado.ok}</Alerta> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo rotulo="Nome" htmlFor={`nome-${sufixo}`} obrigatorio className="sm:col-span-3">
          <Entrada
            id={`nome-${sufixo}`}
            name="nome"
            required
            defaultValue={tipo?.nome}
            placeholder="Ex.: Domingo Manhã"
          />
        </Campo>
        <Campo rotulo="Dia da semana" htmlFor={`dia-${sufixo}`}>
          <Selecao id={`dia-${sufixo}`} name="dia_semana" defaultValue={tipo?.dia_semana ?? 0}>
            {DIAS_SEMANA.map((dia, indice) => (
              <option key={dia} value={indice}>
                {dia}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo rotulo="Horário" htmlFor={`hora-${sufixo}`}>
          <Entrada
            id={`hora-${sufixo}`}
            name="horario"
            type="time"
            required
            defaultValue={tipo?.horario?.slice(0, 5) ?? "19:00"}
          />
        </Campo>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={tipo?.ativo ?? true}
            className="h-4 w-4 accent-[var(--primaria)]"
          />
          Ativo
        </label>
      </div>

      <BotaoSalvar rotulo={tipo ? "Salvar alterações" : "Criar tipo de culto"} />
    </form>
  );
}

export function FormularioCultoAvulso() {
  const [estado, acao] = useActionState(criarCultoAvulso, VAZIO);

  return (
    <form action={acao} className="space-y-4">
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
      {estado.ok ? <Alerta tom="sucesso">{estado.ok}</Alerta> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo rotulo="Nome do culto" htmlFor="titulo-avulso" obrigatorio className="sm:col-span-2">
          <Entrada
            id="titulo-avulso"
            name="titulo"
            required
            placeholder="Ex.: Culto de Ação de Graças"
          />
        </Campo>
        <Campo rotulo="Data" htmlFor="data-avulso" obrigatorio>
          <Entrada id="data-avulso" name="data" type="date" required />
        </Campo>
        <Campo rotulo="Horário" htmlFor="hora-avulso" obrigatorio>
          <Entrada id="hora-avulso" name="horario" type="time" required defaultValue="19:00" />
        </Campo>
        <Campo rotulo="Observação" htmlFor="obs-avulso" className="sm:col-span-2">
          <AreaTexto id="obs-avulso" name="observacao" className="min-h-16" />
        </Campo>
      </div>

      <BotaoSalvar rotulo="Criar culto" />
    </form>
  );
}
