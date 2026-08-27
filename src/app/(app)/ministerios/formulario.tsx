"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { AreaTexto, Campo, Entrada } from "@/components/ui/campo";
import { Alerta } from "@/components/ui/alerta";
import { Cartao, CartaoCorpo } from "@/components/ui/cartao";
import type { Ministerio } from "@/lib/tipos";
import { salvarMinisterio, type EstadoMinisterio } from "./acoes";

const VAZIO: EstadoMinisterio = {};

function BotaoSalvar({ rotulo }: { rotulo: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" disabled={pending}>
      {pending ? "Salvando…" : rotulo}
    </Botao>
  );
}

export function FormularioMinisterio({
  ministerio,
  comoCartao = true,
}: {
  ministerio?: Ministerio;
  comoCartao?: boolean;
}) {
  const [estado, acao] = useActionState(salvarMinisterio, VAZIO);

  const conteudo = (
    <form action={acao} className="space-y-4">
      {ministerio ? <input type="hidden" name="id" value={ministerio.id} /> : null}
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
      {estado.ok ? <Alerta tom="sucesso">{estado.ok}</Alerta> : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <Campo rotulo="Nome" htmlFor={`nome-${ministerio?.id ?? "novo"}`} obrigatorio>
          <Entrada
            id={`nome-${ministerio?.id ?? "novo"}`}
            name="nome"
            required
            defaultValue={ministerio?.nome}
            placeholder="Ex.: Louvor"
          />
        </Campo>
        <Campo rotulo="Cor" htmlFor={`cor-${ministerio?.id ?? "novo"}`}>
          <input
            id={`cor-${ministerio?.id ?? "novo"}`}
            type="color"
            name="cor"
            defaultValue={ministerio?.cor ?? "#8A1C3B"}
            className="h-10 w-16 cursor-pointer rounded-xl border border-borda bg-superficie p-1"
          />
        </Campo>
      </div>

      <Campo rotulo="Descrição" htmlFor={`descricao-${ministerio?.id ?? "novo"}`}>
        <AreaTexto
          id={`descricao-${ministerio?.id ?? "novo"}`}
          name="descricao"
          defaultValue={ministerio?.descricao ?? ""}
          className="min-h-16"
        />
      </Campo>

      <BotaoSalvar rotulo={ministerio ? "Salvar alterações" : "Criar ministério"} />
    </form>
  );

  if (!comoCartao) return conteudo;

  return (
    <Cartao>
      <CartaoCorpo>{conteudo}</CartaoCorpo>
    </Cartao>
  );
}

/** Botão que revela o formulário de novo ministério. */
export function NovoMinisterio() {
  const [aberto, setAberto] = useState(false);

  if (!aberto) {
    return (
      <Botao onClick={() => setAberto(true)}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Novo ministério
      </Botao>
    );
  }

  return (
    <div className="w-full">
      <FormularioMinisterio />
    </div>
  );
}
