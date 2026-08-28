import * as React from "react";
import { cn } from "@/lib/utils";

const CONTROLE =
  "w-full rounded-xl border border-borda bg-superficie px-3 py-2 text-sm text-texto placeholder:text-texto-suave/70 transition-colors focus:border-primaria focus:outline-none focus-visible:outline-none disabled:opacity-60";

export function Rotulo({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-texto-suave", className)}
      {...props}
    />
  );
}

export function Entrada({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROLE, "h-10", className)} {...props} />;
}

export function AreaTexto({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(CONTROLE, "min-h-24", className)} {...props} />;
}

export function Selecao({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(CONTROLE, "h-10 appearance-none bg-[length:0] pr-8", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23998' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.6rem center",
      }}
      {...props}
    />
  );
}

export function Campo({
  rotulo,
  htmlFor,
  dica,
  obrigatorio,
  children,
  className,
}: {
  rotulo: string;
  htmlFor?: string;
  dica?: string;
  obrigatorio?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Rotulo htmlFor={htmlFor}>
        {rotulo}
        {obrigatorio ? <span className="ml-0.5 text-primaria">*</span> : null}
      </Rotulo>
      {children}
      {dica ? <p className="mt-1 text-xs text-texto-suave">{dica}</p> : null}
    </div>
  );
}
