/** Leitura centralizada das variáveis de ambiente do Supabase. */
export function urlSupabase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL não configurada. Copie .env.example para .env.local e preencha as chaves do seu projeto Supabase.",
    );
  }
  return url;
}

export function chaveAnonima(): string {
  const chave =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!chave) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY não configurada. Copie .env.example para .env.local e preencha as chaves do seu projeto Supabase.",
    );
  }
  return chave;
}
