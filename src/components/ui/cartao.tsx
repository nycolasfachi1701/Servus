import * as React from "react";
import { cn } from "@/lib/utils";

export function Cartao({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-borda bg-superficie shadow-suave",
        className,
      )}
      {...props}
    />
  );
}

export function CartaoCabecalho({
  titulo,
  descricao,
  acao,
  className,
}: {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  acao?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 px-4 pt-4 sm:px-5", className)}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-texto sm:text-lg">{titulo}</h2>
        {descricao ? (
          <p className="mt-0.5 text-sm text-texto-suave">{descricao}</p>
        ) : null}
      </div>
      {acao}
    </div>
  );
}

export function CartaoCorpo({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-4 sm:p-5", className)} {...props} />;
}
