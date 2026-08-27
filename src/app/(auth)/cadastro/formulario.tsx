"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada } from "@/components/ui/campo";
import { Alerta } from "@/components/ui/alerta";
import { cadastrar, type EstadoFormulario } from "../acoes";

const VAZIO: EstadoFormulario = {};

function BotaoEnviar() {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" className="w-full justify-center" disabled={pending}>
      {pending ? "Criando…" : "Criar acesso"}
    </Botao>
  );
}

export function FormularioCadastro() {
  const [estado, acao] = useActionState(cadastrar, VAZIO);

  return (
    <form action={acao} className="mt-5 space-y-4">
      {estado.erro ? <Alerta tom="erro">{estado.erro}</Alerta> : null}
      {estado.ok ? <Alerta tom="sucesso">{estado.ok}</Alerta> : null}

      <Campo rotulo="Nome completo" htmlFor="nome" obrigatorio>
        <Entrada id="nome" name="nome" required autoComplete="name" placeholder="Seu nome" />
      </Campo>
      <Campo rotulo="E-mail" htmlFor="email-cadastro" obrigatorio>
        <Entrada
          id="email-cadastro"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="voce@email.com"
        />
      </Campo>
      <Campo rotulo="Senha" htmlFor="senha-cadastro" obrigatorio dica="Mínimo de 8 caracteres.">
        <Entrada
          id="senha-cadastro"
          name="senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
        />
      </Campo>
      <BotaoEnviar />
    </form>
  );
}
