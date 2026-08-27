import { cn } from "@/lib/utils";

/** Símbolo + nome do sistema. */
export function Marca({
  tamanho = "md",
  nomeIgreja,
  className,
}: {
  tamanho?: "sm" | "md" | "lg";
  nomeIgreja?: string;
  className?: string;
}) {
  const caixa =
    tamanho === "lg" ? "h-14 w-14" : tamanho === "sm" ? "h-8 w-8" : "h-10 w-10";
  const titulo =
    tamanho === "lg" ? "text-3xl" : tamanho === "sm" ? "text-base" : "text-xl";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={cn(
          "grid place-items-center rounded-2xl border border-vinho/40 bg-vinho-tenue",
          caixa,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className="h-2/3 w-2/3" fill="none" aria-hidden="true">
          <path d="M12 3v14M8 7h8" stroke="var(--vinho)" strokeWidth="2" strokeLinecap="round" />
          <path
            d="M17 14.5c0 2.8-2.2 4.5-5 4.5s-5-1.7-5-4.5"
            stroke="var(--vinho-claro)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="min-w-0">
        <span className={cn("block font-serif font-semibold leading-none text-texto", titulo)}>
          Servus
        </span>
        {nomeIgreja ? (
          <span className="mt-1 block truncate text-xs text-texto-suave">{nomeIgreja}</span>
        ) : null}
      </span>
    </div>
  );
}
