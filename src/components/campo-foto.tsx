"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/cliente";
import { Botao } from "@/components/ui/botao";
import { Avatar } from "@/components/ui/avatar";

const TAMANHO_MAXIMO = 3 * 1024 * 1024; // 3 MB

/**
 * Envia a imagem direto do navegador para o Storage do Supabase e guarda a
 * URL pública num input escondido — o formulário continua sendo um POST
 * simples de Server Action.
 */
export function CampoFoto({
  nome,
  valorInicial,
  pasta = "membros",
  rotulo = "Foto",
}: {
  nome: string;
  valorInicial?: string | null;
  pasta?: string;
  rotulo?: string;
}) {
  const [url, setUrl] = useState(valorInicial ?? "");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function enviar(arquivo: File) {
    setErro(null);
    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro("Imagem muito grande (máximo 3 MB).");
      return;
    }
    setEnviando(true);
    try {
      const supabase = criarClienteNavegador();
      const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const caminho = `${pasta}/${crypto.randomUUID()}.${extensao}`;
      const { error } = await supabase.storage
        .from("fotos")
        .upload(caminho, arquivo, { upsert: false, contentType: arquivo.type });
      if (error) throw error;
      const { data } = supabase.storage.from("fotos").getPublicUrl(caminho);
      setUrl(data.publicUrl);
    } catch {
      setErro("Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <p className="mb-1.5 block text-sm font-medium text-texto-suave">{rotulo}</p>
      <input type="hidden" name={nome} value={url} />
      <div className="flex items-center gap-3">
        {url ? (
          <img
            src={url}
            alt="Prévia"
            className="h-16 w-16 rounded-full border border-borda object-cover"
          />
        ) : (
          <Avatar nome="?" tamanho="lg" />
        )}
        <div className="flex flex-wrap gap-2">
          <Botao
            type="button"
            variante="secundario"
            tamanho="sm"
            onClick={() => inputRef.current?.click()}
            disabled={enviando}
          >
            {enviando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <ImagePlus className="h-4 w-4" aria-hidden="true" />
            )}
            {url ? "Trocar imagem" : "Enviar imagem"}
          </Botao>
          {url ? (
            <Botao type="button" variante="fantasma" tamanho="sm" onClick={() => setUrl("")}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remover
            </Botao>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) void enviar(arquivo);
          e.target.value = "";
        }}
      />
      {erro ? <p className="mt-1 text-xs text-erro">{erro}</p> : null}
    </div>
  );
}
