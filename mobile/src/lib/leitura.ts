import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Última leitura da Bíblia, guardada no próprio aparelho.
 *
 * A chave leva o id do usuário: o mesmo celular pode ser usado por mais de
 * uma pessoa (o do púlpito, o da secretaria), e a marcação de cada um não
 * pode vazar para o outro.
 */
export type UltimaLeitura = { livro: number; capitulo: number; nome: string };

const PREFIXO = "servus-biblia-ultima";
/** chave antiga, de quando a marcação era só do aparelho */
const CHAVE_ANTIGA = PREFIXO;

function chave(usuarioId: string): string {
  return `${PREFIXO}:${usuarioId}`;
}

export async function lerUltimaLeitura(usuarioId: string | null): Promise<UltimaLeitura | null> {
  if (!usuarioId) return null;
  try {
    // limpa a marcação global antiga, que era compartilhada entre usuários
    await AsyncStorage.removeItem(CHAVE_ANTIGA);
    const valor = await AsyncStorage.getItem(chave(usuarioId));
    return valor ? (JSON.parse(valor) as UltimaLeitura) : null;
  } catch {
    return null;
  }
}

export async function salvarUltimaLeitura(
  usuarioId: string | null,
  leitura: UltimaLeitura,
): Promise<void> {
  if (!usuarioId) return;
  try {
    await AsyncStorage.setItem(chave(usuarioId), JSON.stringify(leitura));
  } catch {
    // sem storage a marcação simplesmente não persiste
  }
}
