import { useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { useSessao } from "@/lib/sessao";
import { useConsulta } from "@/lib/consulta";
import { carregarDisponibilidade, responderDisponibilidade, rotuloCulto } from "@/lib/dados";
import { ESPACO, useCores } from "@/lib/tema";
import {
  Aviso,
  Botao,
  Carregando,
  Cartao,
  Corpo,
  Etiqueta,
  Mini,
  Vazio,
} from "@/componentes/ui";
import { Icone } from "@/componentes/icone";
import { formatarDataExtenso, formatarHorario } from "@/lib/utils";

export default function Disponibilidade() {
  const cores = useCores();
  const { sessao } = useSessao();
  const [salvando, setSalvando] = useState<string | null>(null);

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(
    async () => (sessao?.pessoaId ? carregarDisponibilidade(sessao.pessoaId) : null),
    [sessao?.pessoaId],
  );

  async function responder(cultoId: string, disponivel: boolean) {
    if (!sessao?.pessoaId) return;
    setSalvando(cultoId);
    try {
      await responderDisponibilidade(sessao.pessoaId, cultoId, disponivel);
      await recarregar();
    } catch {
      Alert.alert("Ops", "Não foi possível salvar. Verifique sua conexão.");
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

  if (carregando) return <Carregando />;

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <Mini>
        Avise com antecedência quando não puder servir — quem marca “não posso” fica fora da
        geração automática da escala.
      </Mini>

      {!dados || dados.cultos.length === 0 ? (
        <Vazio titulo="Nenhum culto programado" />
      ) : (
        dados.cultos.map((culto) => {
          const resposta = dados.respostas.get(culto.id);
          const indisponivel = resposta && !resposta.disponivel;
          return (
            <Cartao key={culto.id} style={{ gap: ESPACO.md }}>
              <View style={{ gap: 3 }}>
                <Corpo>{rotuloCulto(culto, dados.tipos)}</Corpo>
                <Mini>
                  {formatarDataExtenso(culto.data)} · {formatarHorario(culto.horario)}
                </Mini>
              </View>

              <Etiqueta
                texto={
                  !resposta ? "Sem resposta" : indisponivel ? "Não posso" : "Disponível"
                }
                tom={!resposta ? "neutro" : indisponivel ? "erro" : "sucesso"}
              />

              <View style={{ flexDirection: "row", gap: ESPACO.md }}>
                <Botao
                  titulo="Não posso"
                  variante={indisponivel ? "perigo" : "secundario"}
                  style={{ flex: 1 }}
                  carregando={salvando === culto.id}
                  aoTocar={() => responder(culto.id, false)}
                  icone={
                    <Icone
                      nome="x"
                      tamanho={18}
                      cor={indisponivel ? cores.sobrePrimaria : cores.texto}
                    />
                  }
                />
                <Botao
                  titulo="Posso servir"
                  variante={resposta && resposta.disponivel ? "sucesso" : "secundario"}
                  style={{ flex: 1 }}
                  carregando={salvando === culto.id}
                  aoTocar={() => responder(culto.id, true)}
                  icone={
                    <Icone
                      nome="check"
                      tamanho={18}
                      cor={resposta && resposta.disponivel ? cores.sobrePrimaria : cores.texto}
                    />
                  }
                />
              </View>
            </Cartao>
          );
        })
      )}

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
