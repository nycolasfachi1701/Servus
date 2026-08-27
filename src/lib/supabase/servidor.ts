import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/tipos";
import { chaveAnonima, urlSupabase } from "./config";

/**
 * Cliente Supabase para Server Components, Server Actions e Route Handlers.
 * A sessão do usuário vai junto (via cookies), então o RLS do Postgres é
 * quem decide o que cada papel enxerga.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient<Database>(urlSupabase(), chaveAnonima(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaDefinir) {
        try {
          for (const { name, value, options } of cookiesParaDefinir) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components não podem escrever cookies: o middleware já
          // renova a sessão, então aqui podemos ignorar com segurança.
        }
      },
    },
  });
}
