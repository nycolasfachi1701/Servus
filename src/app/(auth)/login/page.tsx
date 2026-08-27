import type { Metadata } from "next";
import Link from "next/link";
import { FormularioLogin } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; erro?: string }>;
}) {
  const { redirect: destino, erro } = await searchParams;

  return (
    <div className="rounded-2xl border border-borda bg-superficie p-5 shadow-suave">
      <h1 className="font-serif text-xl font-semibold">Entrar</h1>
      <p className="mt-1 text-sm text-texto-suave">Acesse com seu e-mail cadastrado.</p>

      <FormularioLogin
        destino={destino}
        avisoInicial={erro === "link-invalido" ? "O link expirou ou já foi usado. Entre novamente." : undefined}
      />

      <p className="mt-5 text-center text-sm text-texto-suave">
        Ainda não tem acesso?{" "}
        <Link href="/cadastro" className="font-medium text-vinho hover:underline">
          Criar minha conta
        </Link>
      </p>
    </div>
  );
}
