"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";

/**
 * Mostra/esconde um bloco (formulário) mantendo o conteúdo renderizado no
 * servidor — útil para editar sem precisar de uma página separada.
 */
export function Revelar({
  rotulo,
  rotuloAberto = "Fechar",
  variante = "secundario",
  tamanho = "sm",
  icone,
  children,
}: {
  rotulo: string;
  rotuloAberto?: string;
  variante?: "primario" | "secundario" | "fantasma";
  tamanho?: "sm" | "md" | "lg";
  icone?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className={aberto ? "w-full" : undefined}>
      <Botao
        type="button"
        variante={aberto ? "fantasma" : variante}
        tamanho={tamanho}
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
      >
        {!aberto ? icone : null}
        {aberto ? rotuloAberto : rotulo}
      </Botao>
      {aberto ? <div className="mt-3">{children}</div> : null}
    </div>
  );
}
