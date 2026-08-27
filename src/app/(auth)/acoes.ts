"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/servidor";

export type EstadoFormulario = { erro?: string; ok?: string };

async function origem(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocolo = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

function caminhoSeguro(valor: FormDataEntryValue | null): string {
  const destino = typeof valor === "string" ? valor : "";
  // só aceita caminho interno — evita open redirect
  return destino.startsWith("/") && !destino.startsWith("//") ? destino : "/painel";
}

export async function entrarComSenha(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const destino = caminhoSeguro(formData.get("redirect"));

  if (!email || !senha) return { erro: "Informe e-mail e senha." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    return {
      erro:
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : "Não foi possível entrar. Tente novamente.",
    };
  }

  redirect(destino);
}

export async function enviarLinkMagico(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { erro: "Informe o e-mail para receber o link." };

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${await origem()}/auth/confirmar?next=/painel` },
  });

  if (error) return { erro: "Não foi possível enviar o link agora. Tente novamente." };
  return { ok: "Link enviado! Confira sua caixa de entrada." };
}

export async function cadastrar(
  _estado: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");

  if (nome.length < 3) return { erro: "Informe seu nome completo." };
  if (senha.length < 8) return { erro: "A senha precisa ter ao menos 8 caracteres." };

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome },
      emailRedirectTo: `${await origem()}/auth/confirmar?next=/painel`,
    },
  });

  if (error) {
    return {
      erro:
        error.message.includes("already registered")
          ? "Este e-mail já tem cadastro. Faça login."
          : "Não foi possível criar o acesso. Tente novamente.",
    };
  }

  if (data.session) redirect("/painel");

  return { ok: "Cadastro criado! Confirme o e-mail que enviamos para ativar o acesso." };
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
