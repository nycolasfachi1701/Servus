"use client";

import { Botao } from "@/components/ui/botao";

/**
 * Formulário de ação destrutiva com confirmação do navegador.
 * (a permissão de verdade continua sendo checada no servidor + RLS)
 */
export function ConfirmarAcao({
  acao,
  campos,
  pergunta,
  children,
  variante = "perigo",
  tamanho = "sm",
}: {
  acao: (formData: FormData) => void | Promise<void>;
  campos?: Record<string, string>;
  pergunta: string;
  children: React.ReactNode;
  variante?: "perigo" | "secundario" | "fantasma" | "primario" | "sucesso";
  tamanho?: "sm" | "md" | "lg";
}) {
  return (
    <form
      action={acao}
      onSubmit={(evento) => {
        if (!window.confirm(pergunta)) evento.preventDefault();
      }}
    >
      {Object.entries(campos ?? {}).map(([nome, valor]) => (
        <input key={nome} type="hidden" name={nome} value={valor} />
      ))}
      <Botao type="submit" variante={variante} tamanho={tamanho}>
        {children}
      </Botao>
    </form>
  );
}
