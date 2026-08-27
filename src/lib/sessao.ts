import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { PapelUsuario } from "@/lib/tipos";

export type Sessao = {
  usuarioId: string;
  email: string;
  papel: PapelUsuario;
  pessoaId: string | null;
  nome: string;
  fotoUrl: string | null;
  ministeriosLiderados: string[];
  ehAdmin: boolean;
  ehLideranca: boolean;
};

/**
 * Sessão do Servus: usuário do Auth + papel + pessoa vinculada.
 * `cache` garante uma única ida ao banco por request.
 */
export const obterSessao = cache(async (): Promise<Sessao | null> => {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("pessoa_id, papel")
    .eq("id", user.id)
    .maybeSingle();

  const papel: PapelUsuario = usuario?.papel ?? "membro";
  const pessoaId = usuario?.pessoa_id ?? null;

  let nome = user.email?.split("@")[0] ?? "Usuário";
  let fotoUrl: string | null = null;
  let ministeriosLiderados: string[] = [];

  if (pessoaId) {
    const [{ data: pessoa }, { data: lideranca }] = await Promise.all([
      supabase.from("pessoas").select("nome, foto_url").eq("id", pessoaId).maybeSingle(),
      supabase.from("ministerio_lideres").select("ministerio_id").eq("pessoa_id", pessoaId),
    ]);
    if (pessoa) {
      nome = pessoa.nome;
      fotoUrl = pessoa.foto_url;
    }
    ministeriosLiderados = (lideranca ?? []).map((l) => l.ministerio_id);
  }

  return {
    usuarioId: user.id,
    email: user.email ?? "",
    papel,
    pessoaId,
    nome,
    fotoUrl,
    ministeriosLiderados,
    ehAdmin: papel === "admin",
    ehLideranca: papel === "admin" || papel === "lider",
  };
});

export async function exigirSessao(): Promise<Sessao> {
  const sessao = await obterSessao();
  if (!sessao) redirect("/login");
  return sessao;
}

export async function exigirLideranca(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (!sessao.ehLideranca) redirect("/painel?erro=sem-permissao");
  return sessao;
}

export async function exigirAdmin(): Promise<Sessao> {
  const sessao = await exigirSessao();
  if (!sessao.ehAdmin) redirect("/painel?erro=sem-permissao");
  return sessao;
}
