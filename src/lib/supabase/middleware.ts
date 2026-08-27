import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/tipos";
import { chaveAnonima, urlSupabase } from "./config";

const ROTAS_PUBLICAS = ["/login", "/cadastro", "/auth", "/recuperar-senha"];

/** Renova a sessão a cada request e protege as rotas internas. */
export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  const supabase = createServerClient<Database>(urlSupabase(), chaveAnonima(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaDefinir) {
        for (const { name, value } of cookiesParaDefinir) {
          request.cookies.set(name, value);
        }
        resposta = NextResponse.next({ request });
        for (const { name, value, options } of cookiesParaDefinir) {
          resposta.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const ehPublica = ROTAS_PUBLICAS.some((rota) => caminho.startsWith(rota));

  if (!user && !ehPublica) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/login";
    destino.searchParams.set("redirect", caminho);
    return NextResponse.redirect(destino);
  }

  if (user && (caminho === "/login" || caminho === "/cadastro")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/painel";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return resposta;
}
