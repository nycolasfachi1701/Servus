"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Wand2 } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada } from "@/components/ui/campo";
import { Alerta } from "@/components/ui/alerta";
import { gerarEscalas, type EstadoEscala } from "./acoes";

const VAZIO: EstadoEscala = {};

function BotaoGerar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      <Wand2 className="h-4 w-4" aria-hidden="true" />
      {pending ? "Montando…" : "Gerar escala"}
    </Botao>
  );
}

export function FormularioGerar({
  de,
  ate,
  limitePadrao,
}: {
  de: string;
  ate: string;
  limitePadrao: number;
}) {
  const [estado, acao] = useActionState(gerarEscalas, VAZIO);

  return (
    <form action={acao} className="space-y-4">
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Campo rotulo="De" htmlFor="de" obrigatorio>
          <Entrada id="de" name="de" type="date" required defaultValue={de} />
        </Campo>
        <Campo rotulo="Até" htmlFor="ate" obrigatorio>
          <Entrada id="ate" name="ate" type="date" required defaultValue={ate} />
        </Campo>
        <Campo
          rotulo="Limite por pessoa"
          htmlFor="limite"
          dica="Máximo de escalas de cada pessoa no período."
        >
          <Entrada
            id="limite"
            name="limite"
            type="number"
            min={1}
            max={31}
            defaultValue={limitePadrao}
          />
        </Campo>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="substituir" className="mt-0.5 h-4 w-4 accent-[var(--vinho)]" />
        <span>
          Refazer as escalas já montadas do período
          <span className="block text-xs text-texto-suave">
            Quem já confirmou presença é mantido; o resto é redistribuído.
          </span>
        </span>
      </label>

      <BotaoGerar />
    </form>
  );
}
