"use client";

import { useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import { Botao } from "@/components/ui/botao";
import { linkWhatsAppTexto } from "@/lib/utils";

/**
 * Abre o WhatsApp com a mensagem pronta (link wa.me, sem API paga — quem
 * envia escolhe o grupo) e permite copiar o texto.
 */
export function BotaoWhatsApp({
  texto,
  rotulo = "Enviar pro WhatsApp",
}: {
  texto: string;
  rotulo?: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={linkWhatsAppTexto(texto)}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-sucesso px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
        {rotulo}
      </a>
      <Botao type="button" variante="secundario" onClick={copiar}>
        {copiado ? (
          <Check className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
        {copiado ? "Copiado!" : "Copiar texto"}
      </Botao>
    </div>
  );
}
