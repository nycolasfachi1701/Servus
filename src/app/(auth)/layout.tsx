import { Marca } from "@/components/layout/marca";
import { AlternarTema } from "@/components/layout/alternar-tema";

export default function LayoutAutenticacao({ children }: { children: React.ReactNode }) {
  return (
    <div className="brilho-vinho flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <AlternarTema />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Marca tamanho="lg" />
          <p className="text-sm text-texto-suave">
            Gestão da igreja: membros, escalas, eventos e calendário.
          </p>
        </div>
        {children}
      </div>
      <p className="mt-10 text-xs text-texto-suave">
        Servus · feito para servir com ordem e cuidado
      </p>
    </div>
  );
}
