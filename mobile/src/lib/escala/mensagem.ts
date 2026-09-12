import { formatarData, formatarHorario } from "@/lib/utils";
import {
  montarMensagem as montar,
  rotuloPeriodo as rotulo,
  type CultoParaMensagem,
  type LinhaEscala,
} from "@compartilhado/escala/mensagem";

export type { CultoParaMensagem, LinhaEscala };

const FORMATADORES = { data: formatarData, horario: formatarHorario };

export function montarMensagem(entrada: Parameters<typeof montar>[0]): string {
  return montar(entrada, FORMATADORES);
}

export function rotuloPeriodo(datas: string[]): string {
  return rotulo(datas, formatarData);
}
