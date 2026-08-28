import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="brilho-vinho flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="font-serif text-5xl font-semibold text-vinho">404</p>
      <h1 className="font-serif text-xl font-semibold">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-texto-suave">
        O endereço não existe ou o registro foi removido.
      </p>
      <Link
        href="/painel"
        className="mt-2 inline-flex h-10 items-center rounded-xl bg-vinho px-4 text-sm font-medium text-white hover:bg-vinho-claro"
      >
        Voltar ao painel
      </Link>
    </div>
  );
}
