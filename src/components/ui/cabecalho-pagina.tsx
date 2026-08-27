import * as React from "react";

export function CabecalhoPagina({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-texto sm:text-3xl">{titulo}</h1>
        {descricao ? <p className="mt-1 text-sm text-texto-suave">{descricao}</p> : null}
      </div>
      {acao}
    </header>
  );
}
