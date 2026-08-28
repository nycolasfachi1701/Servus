import * as React from "react";
import { cn } from "@/lib/utils";

type Tom = "primaria" | "neutro" | "sucesso" | "alerta" | "erro";

const TONS: Record<Tom, string> = {
  primaria: "bg-primaria-tenue text-primaria border-primaria/30",
  neutro: "bg-superficie-2 text-texto-suave border-borda",
  sucesso: "bg-sucesso/10 text-sucesso border-sucesso/30",
  alerta: "bg-alerta/10 text-alerta border-alerta/30",
  erro: "bg-erro/10 text-erro border-erro/30",
};

export function Etiqueta({
  tom = "neutro",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tom?: Tom }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        TONS[tom],
        className,
      )}
      {...props}
    />
  );
}
