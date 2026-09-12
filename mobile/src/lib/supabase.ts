import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { AppState } from "react-native";
import type { Database } from "@/lib/tipos";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const chave = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !chave) {
  throw new Error(
    "Faltam as variáveis EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY. " +
      "Copie .env.example para .env e preencha com as chaves do seu projeto Supabase.",
  );
}

export const supabase = createClient<Database>(url, chave, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // no app não existe callback de URL como no navegador
    detectSessionInUrl: false,
  },
});

/**
 * Renova o token enquanto o app está em primeiro plano e para quando vai
 * para segundo plano — recomendação oficial do Supabase para React Native.
 */
AppState.addEventListener("change", (estado) => {
  if (estado === "active") {
    void supabase.auth.startAutoRefresh();
  } else {
    void supabase.auth.stopAutoRefresh();
  }
});
