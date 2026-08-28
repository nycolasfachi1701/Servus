import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variante = "primario" | "secundario" | "fantasma" | "perigo" | "sucesso";
type Tamanho = "sm" | "md" | "lg" | "icone";

const VARIANTES: Record<Variante, string> = {
  primario:
    "bg-primaria text-white hover:bg-primaria-clara active:bg-primaria-profunda shadow-suave",
  secundario:
    "bg-superficie-2 text-texto border border-borda hover:border-primaria hover:text-primaria",
  fantasma: "text-texto-suave hover:bg-superficie-2 hover:text-texto",
  perigo: "bg-erro text-white hover:opacity-90",
  sucesso: "bg-sucesso text-white hover:opacity-90",
};

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icone: "h-10 w-10 justify-center",
};

const BASE =
  "inline-flex items-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

export function estiloBotao(variante: Variante = "primario", tamanho: Tamanho = "md") {
  return cn(BASE, VARIANTES[variante], TAMANHOS[tamanho]);
}

export type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  tamanho?: Tamanho;
};

export function Botao({ className, variante, tamanho, ...props }: BotaoProps) {
  return <button className={cn(estiloBotao(variante, tamanho), className)} {...props} />;
}

export type BotaoLinkProps = React.ComponentProps<typeof Link> & {
  variante?: Variante;
  tamanho?: Tamanho;
};

export function BotaoLink({ className, variante, tamanho, ...props }: BotaoLinkProps) {
  return <Link className={cn(estiloBotao(variante, tamanho), className)} {...props} />;
}
