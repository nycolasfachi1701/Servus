import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
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

type Contexto = {
  sessao: Sessao | null;
  carregando: boolean;
  recarregar: () => Promise<void>;
  sair: () => Promise<void>;
};

const ContextoSessao = createContext<Contexto>({
  sessao: null,
  carregando: true,
  recarregar: async () => {},
  sair: async () => {},
});

async function montarSessao(sessaoAuth: Session | null): Promise<Sessao | null> {
  const usuario = sessaoAuth?.user;
  if (!usuario) return null;

  const { data: registro } = await supabase
    .from("usuarios")
    .select("pessoa_id, papel")
    .eq("id", usuario.id)
    .maybeSingle();

  const papel: PapelUsuario = registro?.papel ?? "membro";
  const pessoaId = registro?.pessoa_id ?? null;

  let nome = usuario.email?.split("@")[0] ?? "Usuário";
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
    usuarioId: usuario.id,
    email: usuario.email ?? "",
    papel,
    pessoaId,
    nome,
    fotoUrl,
    ministeriosLiderados,
    ehAdmin: papel === "admin",
    ehLideranca: papel === "admin" || papel === "lider",
  };
}

export function ProvedorSessao({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async (sessaoAuth: Session | null) => {
    try {
      setSessao(await montarSessao(sessaoAuth));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (ativo) void carregar(data.session);
    });

    const { data: inscricao } = supabase.auth.onAuthStateChange((_evento, nova) => {
      if (ativo) void carregar(nova);
    });

    return () => {
      ativo = false;
      inscricao.subscription.unsubscribe();
    };
  }, [carregar]);

  const valor = useMemo<Contexto>(
    () => ({
      sessao,
      carregando,
      recarregar: async () => {
        const { data } = await supabase.auth.getSession();
        await carregar(data.session);
      },
      sair: async () => {
        await supabase.auth.signOut();
        setSessao(null);
      },
    }),
    [sessao, carregando, carregar],
  );

  return <ContextoSessao.Provider value={valor}>{children}</ContextoSessao.Provider>;
}

export function useSessao(): Contexto {
  return useContext(ContextoSessao);
}
