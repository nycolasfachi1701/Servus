/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";
import { iniciais } from "@/lib/utils";

export function Avatar({
  nome,
  fotoUrl,
  tamanho = "md",
  className,
}: {
  nome: string;
  fotoUrl?: string | null;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dimensao =
    tamanho === "sm" ? "h-8 w-8 text-xs" : tamanho === "lg" ? "h-16 w-16 text-lg" : "h-10 w-10 text-sm";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-borda bg-vinho-tenue font-semibold text-vinho",
        dimensao,
        className,
      )}
      aria-hidden="true"
    >
      {fotoUrl ? (
        <img src={fotoUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        iniciais(nome)
      )}
    </span>
  );
}
