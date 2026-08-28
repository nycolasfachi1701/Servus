import type { Metadata } from "next";
import Link from "next/link";
import { FormularioCadastro } from "./formulario";

export const metadata: Metadata = { title: "Criar acesso" };

export default function PaginaCadastro() {
  return (
    <div className="rounded-2xl border border-borda bg-superficie p-5 shadow-suave">
      <h1 className="font-serif text-xl font-semibold">Criar acesso</h1>
      <p className="mt-1 text-sm text-texto-suave">
        Use o mesmo e-mail que a liderança cadastrou para você. O papel (membro, líder
        ou administrador) vem do convite.
      </p>

      <FormularioCadastro />

      <p className="mt-5 text-center text-sm text-texto-suave">
        Já tem acesso?{" "}
        <Link href="/login" className="font-medium text-primaria hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
