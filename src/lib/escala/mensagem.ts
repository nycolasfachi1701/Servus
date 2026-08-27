import { formatarData, formatarHorario } from "@/lib/utils";

export type LinhaEscala = {
  funcao: string;
  pessoas: string[];
};

export type CultoParaMensagem = {
  rotulo: string;
  data: string;
  horario: string;
  linhas: LinhaEscala[];
};

/**
 * Monta o texto da escala para enviar no WhatsApp.
 * O título aceita o marcador `{periodo}` (ex.: "Escala de {periodo}").
 */
export function montarMensagem({
  titulo,
  despedida,
  periodo,
  cultos,
}: {
  titulo: string;
  despedida: string;
  periodo: string;
  cultos: CultoParaMensagem[];
}): string {
  const partes: string[] = [`*${titulo.replace("{periodo}", periodo)}*`, ""];

  for (const culto of cultos) {
    partes.push(`📅 *${culto.rotulo}* — ${formatarData(culto.data)} às ${formatarHorario(culto.horario)}`);
    if (culto.linhas.length === 0) {
      partes.push("_Escala ainda não montada._");
    }
    for (const linha of culto.linhas) {
      const nomes = linha.pessoas.filter(Boolean);
      partes.push(
        nomes.length > 0
          ? `• ${linha.funcao}: ${nomes.join(", ")}`
          : `• ${linha.funcao}: ⚠️ em aberto`,
      );
    }
    partes.push("");
  }

  if (despedida.trim()) partes.push(despedida.trim());

  return partes.join("\n").trim();
}

/** Rótulo do período usado no título da mensagem. */
export function rotuloPeriodo(datas: string[]): string {
  if (datas.length === 0) return "";
  const ordenadas = [...datas].sort();
  const primeira = formatarData(ordenadas[0]);
  const ultima = formatarData(ordenadas[ordenadas.length - 1]);
  return primeira === ultima ? primeira : `${primeira} a ${ultima}`;
}
