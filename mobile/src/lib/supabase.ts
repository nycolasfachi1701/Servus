import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import type { Database } from "@/lib/tipos";

/**
 * As variáveis vêm do arquivo `.env` (prefixo EXPO_PUBLIC_).
 * O `trim` protege contra o BOM que o PowerShell grava no começo do arquivo.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const chave = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * Sem as chaves o app não fala com o servidor — mas em vez de estourar no
 * carregamento (tela branca, sem explicação), avisamos numa tela decente.
 * Quem checa é o layout raiz, através deste sinalizador.
 */
export const configuracaoOk = Boolean(url && chave && url.startsWith("http"));

export const supabase = createClient<Database>(
  url && url.startsWith("http") ? url : "https://servus.invalido",
  chave || "sem-chave",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // no app não existe callback de URL como no navegador
      detectSessionInUrl: false,
    },
  },
);

/**
 * Renova o token enquanto o app está em primeiro plano e para quando vai
 * para segundo plano — recomendação oficial do Supabase para React Native.
 */
AppState.addEventListener("change", (estado) => {
  if (!configuracaoOk) return;
  if (estado === "active") {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
