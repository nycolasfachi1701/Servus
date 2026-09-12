/**
 * Texto da escala para enviar no WhatsApp.
 *
 * Compartilhado entre o site e o app: a formatação de data entra por
 * parâmetro, já que cada projeto tem as suas utilidades.
 */

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

export type Formatadores = {
  data: (data: string) => string;
  horario: (horario: string) => string;
};

/** O título aceita o marcador `{periodo}` (ex.: "Escala de {periodo}"). */
export function montarMensagem(
  {
    titulo,
    despedida,
    periodo,
    cultos,
  }: {
    titulo: string;
    despedida: string;
    periodo: string;
    cultos: CultoParaMensagem[];
  },
  formatar: Formatadores,
): string {
  const partes: string[] = [`*${titulo.replace("{periodo}", periodo)}*`, ""];

  for (const culto of cultos) {
    partes.push(
      `📅 *${culto.rotulo}* — ${formatar.data(culto.data)} às ${formatar.horario(culto.horario)}`,
    );
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
export function rotuloPeriodo(datas: string[], formatarData: (data: string) => string): string {
  if (datas.length === 0) return "";
  const ordenadas = [...datas].sort();
  const primeira = formatarData(ordenadas[0]);
  const ultima = formatarData(ordenadas[ordenadas.length - 1]);
  return primeira === ultima ? primeira : `${primeira} a ${ultima}`;
}
