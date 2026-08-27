"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/tipos";
import { chaveAnonima, urlSupabase } from "./config";

/** Cliente Supabase para componentes de cliente (browser). */
export function criarClienteNavegador() {
  return createBrowserClient<Database>(urlSupabase(), chaveAnonima());
}
