import * as React from "react";

export function Vazio({
  titulo,
  descricao,
  acao,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-borda px-6 py-10 text-center">
      <p className="font-medium text-texto">{titulo}</p>
      {descricao ? <p className="max-w-sm text-sm text-texto-suave">{descricao}</p> : null}
      {acao ? <div className="mt-2">{acao}</div> : null}
    </div>
  );
}
