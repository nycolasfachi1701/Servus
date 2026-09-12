import { useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSessao } from "@/lib/sessao";
import { useConsulta } from "@/lib/consulta";
import { carregarMinisterios, salvarMinisterio } from "@/lib/gestao";
import { ESPACO, useCores } from "@/lib/tema";
import {
  Aviso,
  Botao,
  Campo,
  Carregando,
  Cartao,
  Corpo,
  Entrada,
  Etiqueta,
  Mini,
  Vazio,
} from "@/componentes/ui";
import { Folha } from "@/componentes/seletor";
import { Icone } from "@/componentes/icone";

const CORES_SUGERIDAS = ["#1E5AA8", "#0E7C86", "#2E9E6B", "#A5701A", "#6B5BD2", "#C53838"];

export default function Ministerios() {
  const cores = useCores();
  const router = useRouter();
  const { sessao } = useSessao();

  const [novo, setNovo] = useState(false);
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES_SUGERIDAS[0]);
  const [salvando, setSalvando] = useState(false);

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(carregarMinisterios, []);

  async function criar() {
    if (nome.trim().length < 2) return;
    setSalvando(true);
    try {
      await salvarMinisterio({ nome: nome.trim(), cor, descricao: null });
      setNome("");
      setNovo(false);
      await recarregar();
    } catch {
      Alert.alert("Ops", "Não foi possível criar. Só administradores podem.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Carregando />;

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.md }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <Mini>Cada ministério tem funções; as funções definem quem pode ser escalado.</Mini>

      {sessao?.ehAdmin ? (
        <Botao
          titulo="Novo ministério"
          aoTocar={() => setNovo(true)}
          icone={<Icone nome="plus" tamanho={18} cor={cores.sobrePrimaria} />}
        />
      ) : null}

      {!dados || dados.ministerios.length === 0 ? (
        <Vazio titulo="Nenhum ministério cadastrado" descricao="Comece pelo Louvor, Som, Recepção…" />
      ) : (
        dados.ministerios.map((ministerio) => {
          const funcoesDoMinisterio = dados.funcoes.filter(
            (f) => f.ministerio_id === ministerio.id,
          );
          const idsDasFuncoes = new Set(funcoesDoMinisterio.map((f) => f.id));
          const pessoas = new Set(
            dados.vinculos.filter((v) => idsDasFuncoes.has(v.funcao_id)).map((v) => v.pessoa_id),
          );

          return (
            <Cartao
              key={ministerio.id}
              style={{ gap: ESPACO.md }}
              aoTocar={() =>
                router.push({
                  pathname: "/gestao/ministerios/[id]",
                  params: { id: ministerio.id },
                })
              }
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.sm }}>
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: ministerio.cor,
                  }}
                />
                <Corpo>{ministerio.nome}</Corpo>
              </View>
              {ministerio.descricao ? <Mini>{ministerio.descricao}</Mini> : null}
              <View style={{ flexDirection: "row", gap: ESPACO.sm }}>
                <Etiqueta texto={`${funcoesDoMinisterio.length} função(ões)`} />
                <Etiqueta texto={`${pessoas.size} pessoa(s)`} />
              </View>
            </Cartao>
          );
        })
      )}

      <Folha visivel={novo} aoFechar={() => setNovo(false)} titulo="Novo ministério">
        <Campo rotulo="Nome">
          <Entrada value={nome} onChangeText={setNome} placeholder="Ex.: Louvor" />
        </Campo>

        <View style={{ gap: 6 }}>
          <Mini>Cor</Mini>
          <View style={{ flexDirection: "row", gap: ESPACO.sm }}>
            {CORES_SUGERIDAS.map((opcao) => (
              <View
                key={opcao}
                onTouchEnd={() => setCor(opcao)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: opcao,
                  borderWidth: cor === opcao ? 3 : 0,
                  borderColor: cores.texto,
                }}
              />
            ))}
          </View>
        </View>

        <Botao titulo="Criar ministério" aoTocar={criar} carregando={salvando} />
      </Folha>

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
