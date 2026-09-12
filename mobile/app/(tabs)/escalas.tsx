import { useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { useSessao } from "@/lib/sessao";
import { useConsulta } from "@/lib/consulta";
import { carregarMinhasEscalas, confirmarPresenca, rotuloCulto } from "@/lib/dados";
import { ESPACO, useCores } from "@/lib/tema";
import {
  Aviso,
  Botao,
  Carregando,
  Cartao,
  Corpo,
  Etiqueta,
  Mini,
  Separador,
  Subtitulo,
  Vazio,
} from "@/componentes/ui";
import { Icone } from "@/componentes/icone";
import { formatarDataExtenso, formatarHorario } from "@/lib/utils";

export default function MinhasEscalas() {
  const cores = useCores();
  const { sessao } = useSessao();
  const [salvando, setSalvando] = useState<string | null>(null);

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(
    async () => (sessao?.pessoaId ? carregarMinhasEscalas(sessao.pessoaId) : null),
    [sessao?.pessoaId],
  );

  async function alternar(itemId: string, confirmado: boolean) {
    setSalvando(itemId);
    try {
      await confirmarPresenca(itemId, confirmado);
      await recarregar();
    } catch {
      Alert.alert("Ops", "Não foi possível salvar sua confirmação. Tente de novo.");
    } finally {
      setSalvando(null);
    }
  }

  if (!sessao?.pessoaId) {
    return (
      <View style={{ padding: ESPACO.lg }}>
        <Aviso
          tom="alerta"
          texto="Seu acesso ainda não está ligado a um cadastro de membro. Peça para a liderança vincular."
        />
      </View>
    );
  }

  if (carregando) return <Carregando texto="Buscando suas escalas…" />;

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <Subtitulo>Próximas</Subtitulo>

      {!dados || dados.proximas.length === 0 ? (
        <Vazio
          titulo="Você não está escalado(a) por enquanto"
          descricao="Informe sua disponibilidade em Mais › Disponibilidade."
        />
      ) : (
        dados.proximas.map(({ item, culto }) => (
          <Cartao key={item.id} style={{ gap: ESPACO.md }}>
            <View style={{ gap: 3 }}>
              <Corpo>
                {rotuloCulto(culto, dados.tipos)} ·{" "}
                {dados.funcoes.get(item.funcao_id)?.nome ?? "Função"}
              </Corpo>
              <Mini>
                {formatarDataExtenso(culto.data)} · {formatarHorario(culto.horario)}
              </Mini>
            </View>

            <Etiqueta
              texto={item.confirmado ? "Presença confirmada" : "Aguardando confirmação"}
              tom={item.confirmado ? "sucesso" : "alerta"}
            />

            <Botao
              titulo={item.confirmado ? "Desmarcar presença" : "Confirmar presença"}
              variante={item.confirmado ? "secundario" : "sucesso"}
              carregando={salvando === item.id}
              icone={
                <Icone
                  nome={item.confirmado ? "x" : "check"}
                  tamanho={18}
                  cor={item.confirmado ? cores.texto : cores.sobrePrimaria}
                />
              }
              aoTocar={() => alternar(item.id, !item.confirmado)}
            />
          </Cartao>
        ))
      )}

      {dados && dados.passadas.length > 0 ? (
        <View style={{ gap: ESPACO.md }}>
          <Subtitulo>Já servi</Subtitulo>
          <Cartao style={{ gap: ESPACO.md }}>
            {dados.passadas.map(({ item, culto }, indice) => (
              <View key={item.id} style={{ gap: ESPACO.md }}>
                {indice > 0 ? <Separador /> : null}
                <View style={{ gap: 2 }}>
                  <Corpo>
                    {rotuloCulto(culto, dados.tipos)} ·{" "}
                    {dados.funcoes.get(item.funcao_id)?.nome ?? "Função"}
                  </Corpo>
                  <Mini>{formatarDataExtenso(culto.data)}</Mini>
                </View>
              </View>
            ))}
          </Cartao>
        </View>
      ) : null}

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
