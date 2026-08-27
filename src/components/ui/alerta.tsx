import * as React from "react";
import { cn } from "@/lib/utils";

type Tom = "info" | "sucesso" | "alerta" | "erro";

const TONS: Record<Tom, string> = {
  info: "border-borda bg-superficie-2 text-texto-suave",
  sucesso: "border-sucesso/30 bg-sucesso/10 text-sucesso",
  alerta: "border-alerta/30 bg-alerta/10 text-alerta",
  erro: "border-erro/30 bg-erro/10 text-erro",
};

export function Alerta({
  tom = "info",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { tom?: Tom }) {
  return (
    <div
      role={tom === "erro" ? "alert" : "status"}
      className={cn("rounded-xl border px-3 py-2 text-sm", TONS[tom], className)}
      {...props}
    >
      {children}
    </div>
  );
}
