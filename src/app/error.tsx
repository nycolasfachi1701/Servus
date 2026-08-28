"use client";

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-serif text-xl font-semibold">Algo deu errado</h1>
      <p className="max-w-sm text-sm text-texto-suave">
        Não conseguimos carregar esta tela. Verifique sua conexão e tente de novo — se persistir,
        confira as chaves do Supabase no <code>.env.local</code>.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 inline-flex h-10 items-center rounded-xl bg-primaria px-4 text-sm font-medium text-white hover:bg-primaria-clara"
      >
        Tentar novamente
      </button>
    </div>
  );
}
