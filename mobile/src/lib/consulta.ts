import { useCallback, useEffect, useState } from "react";

type Estado<T> = {
  dados: T | null;
  carregando: boolean;
  erro: string | null;
  atualizando: boolean;
  recarregar: () => Promise<void>;
};

/**
 * Busca dados no Supabase com estados de carregamento, erro e
 * "puxar para atualizar" — o padrão de todas as telas do app.
 */
export function useConsulta<T>(
  buscar: () => Promise<T>,
  dependencias: unknown[] = [],
): Estado<T> {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const executar = useCallback(
    async (ehAtualizacao: boolean) => {
      if (ehAtualizacao) setAtualizando(true);
      try {
        setDados(await buscar());
        setErro(null);
      } catch {
        setErro("Não foi possível carregar. Verifique sua conexão.");
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    dependencias,
  );

  useEffect(() => {
    void executar(false);
  }, [executar]);

  return {
    dados,
    carregando,
    erro,
    atualizando,
    recarregar: () => executar(true),
  };
}
