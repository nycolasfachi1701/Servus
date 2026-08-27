import { cache } from "react";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import type { Configuracoes } from "@/lib/tipos";

const PADRAO: Configuracoes = {
  id: 1,
  nome_igreja: "Servus",
  logo_url: null,
  cor_primaria: "#8A1C3B",
  mensagem_titulo: "Escala de {periodo}",
  mensagem_despedida: "Deus abençoe!",
  limite_escalas_mes: 6,
  peso_rodizio: 10,
  peso_preferencia: 3,
  peso_dupla: 2,
  atualizado_em: new Date().toISOString(),
};

export const obterConfiguracoes = cache(async (): Promise<Configuracoes> => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("configuracoes").select("*").eq("id", 1).maybeSingle();
  return data ?? PADRAO;
});
