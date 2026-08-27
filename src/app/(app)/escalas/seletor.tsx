"use client";

import { useRef, useTransition } from "react";
import { Selecao } from "@/components/ui/campo";
import { trocarPessoa } from "./acoes";

export type OpcaoPessoa = {
  id: string;
  nome: string;
  indisponivel: boolean;
  jaNoCulto: boolean;
};

/**
 * Troca manual do escalado: envia assim que a pessoa é escolhida.
 * Só aparecem os elegíveis (quem exerce a função); indisponíveis e quem já
 * está em outra vaga do mesmo culto ficam sinalizados.
 */
export function SeletorEscalado({
  itemId,
  cultoId,
  pessoaId,
  opcoes,
  rotulo,
}: {
  itemId: string;
  cultoId: string;
  pessoaId: string | null;
  opcoes: OpcaoPessoa[];
  rotulo: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pendente, iniciar] = useTransition();

  return (
    <form ref={formRef} action={trocarPessoa}>
      <input type="hidden" name="item_id" value={itemId} />
      <input type="hidden" name="culto_id" value={cultoId} />
      <Selecao
        name="pessoa_id"
        aria-label={`Quem serve em ${rotulo}`}
        defaultValue={pessoaId ?? ""}
        disabled={pendente}
        onChange={() => iniciar(() => formRef.current?.requestSubmit())}
        className={pessoaId ? undefined : "border-alerta/50 text-alerta"}
      >
        <option value="">— deixar em aberto —</option>
        {opcoes.map((opcao) => (
          <option key={opcao.id} value={opcao.id}>
            {opcao.nome}
            {opcao.indisponivel ? " (indisponível)" : ""}
            {opcao.jaNoCulto && opcao.id !== pessoaId ? " (já escalado neste culto)" : ""}
          </option>
        ))}
      </Selecao>
    </form>
  );
}
