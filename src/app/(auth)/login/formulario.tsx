"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Botao } from "@/components/ui/botao";
import { Campo, Entrada } from "@/components/ui/campo";
import { Alerta } from "@/components/ui/alerta";
import { enviarLinkMagico, entrarComSenha, type EstadoFormulario } from "../acoes";

const VAZIO: EstadoFormulario = {};

function BotaoEnviar({ children }: { children: string }) {
  const { pending } = useFormStatus();
  return (
    <Botao type="submit" className="w-full justify-center" disabled={pending}>
      {pending ? "Aguarde…" : children}
    </Botao>
  );
}

export function FormularioLogin({
  destino,
  avisoInicial,
}: {
  destino?: string;
  avisoInicial?: string;
}) {
  const [modoLink, setModoLink] = useState(false);
  const [estadoSenha, acaoSenha] = useActionState(entrarComSenha, VAZIO);
  const [estadoLink, acaoLink] = useActionState(enviarLinkMagico, VAZIO);

  const estado = modoLink ? estadoLink : estadoSenha;

  return (
    <div className="mt-5">
      {avisoInicial && !estado.erro ? (
        <Alerta tom="alerta" className="mb-4">
          {avisoInicial}
        </Alerta>
      ) : null}
      {estado.erro ? (
        <Alerta tom="erro" className="mb-4">
          {estado.erro}
        </Alerta>
      ) : null}
      {estado.ok ? (
        <Alerta tom="sucesso" className="mb-4">
          {estado.ok}
        </Alerta>
      ) : null}

      {modoLink ? (
        <form action={acaoLink} className="space-y-4">
          <Campo rotulo="E-mail" htmlFor="email-link" obrigatorio>
            <Entrada
              id="email-link"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@email.com"
            />
          </Campo>
          <BotaoEnviar>Enviar link de acesso</BotaoEnviar>
        </form>
      ) : (
        <form action={acaoSenha} className="space-y-4">
          <input type="hidden" name="redirect" value={destino ?? "/painel"} />
          <Campo rotulo="E-mail" htmlFor="email" obrigatorio>
            <Entrada
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@email.com"
            />
          </Campo>
          <Campo rotulo="Senha" htmlFor="senha" obrigatorio>
            <Entrada
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </Campo>
          <BotaoEnviar>Entrar</BotaoEnviar>
        </form>
      )}

      <button
        type="button"
        onClick={() => setModoLink((v) => !v)}
        className="mt-4 w-full text-center text-sm text-texto-suave underline-offset-4 hover:text-vinho hover:underline"
      >
        {modoLink ? "Entrar com e-mail e senha" : "Prefiro receber um link por e-mail"}
      </button>
    </div>
  );
}
