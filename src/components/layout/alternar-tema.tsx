"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const CHAVE = "servus-tema";

/** Alterna entre o tema escuro (padrão) e o claro, guardando a escolha. */
export function AlternarTema({ className }: { className?: string }) {
  const [escuro, setEscuro] = useState(true);

  useEffect(() => {
    setEscuro(document.documentElement.classList.contains("dark"));
  }, []);

  function alternar() {
    const proximo = !escuro;
    setEscuro(proximo);
    document.documentElement.classList.toggle("dark", proximo);
    try {
      localStorage.setItem(CHAVE, proximo ? "escuro" : "claro");
    } catch {
      // navegador sem storage: a preferência simplesmente não persiste
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={escuro}
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-borda bg-superficie text-texto-suave transition-colors hover:text-vinho",
        className,
      )}
    >
      {escuro ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">{escuro ? "Usar tema claro" : "Usar tema escuro"}</span>
    </button>
  );
}
