import { Alert, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSessao } from "@/lib/sessao";
import { ESPACO, useCores } from "@/lib/tema";
import { Avatar, Botao, Cartao, Corpo, Mini, Separador, Subtitulo } from "@/componentes/ui";
import { Icone, type NomeIcone } from "@/componentes/icone";
import { ROTULO_PAPEL } from "@/lib/tipos";

type Atalho = { icone: NomeIcone; titulo: string; descricao: string; rota: string };

const DO_MEMBRO: Atalho[] = [
  {
    icone: "calendar-days",
    titulo: "Disponibilidade",
    descricao: "Avise quando não puder servir",
    rota: "/disponibilidade",
  },
  {
    icone: "bookmark",
    titulo: "Minhas anotações",
    descricao: "O que você marcou na Bíblia",
    rota: "/anotacoes",
  },
];

export default function Mais() {
  const cores = useCores();
  const router = useRouter();
  const { sessao, sair } = useSessao();

  function confirmarSaida() {
    Alert.alert("Sair do Servus", "Você precisará entrar de novo depois.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => void sair() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}>
      <Cartao style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.md }}>
        <Avatar nome={sessao?.nome ?? "?"} fotoUrl={sessao?.fotoUrl} tamanho={48} />
        <View style={{ flex: 1, gap: 2 }}>
          <Corpo>{sessao?.nome}</Corpo>
          <Mini>
            {sessao ? ROTULO_PAPEL[sessao.papel] : ""} · {sessao?.email}
          </Mini>
        </View>
      </Cartao>

      <View style={{ gap: ESPACO.md }}>
        <Subtitulo>Para você</Subtitulo>
        <Cartao style={{ gap: ESPACO.lg }}>
          {DO_MEMBRO.map((atalho, indice) => (
            <View key={atalho.rota} style={{ gap: ESPACO.lg }}>
              {indice > 0 ? <Separador /> : null}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.md }}
                onTouchEnd={() => router.push(atalho.rota as never)}
              >
                <Icone nome={atalho.icone} cor={cores.primaria} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Corpo>{atalho.titulo}</Corpo>
                  <Mini>{atalho.descricao}</Mini>
                </View>
                <Icone nome="chevron-right" tamanho={18} cor={cores.textoSuave} />
              </View>
            </View>
          ))}
        </Cartao>
      </View>

      {sessao?.ehLideranca ? (
        <View style={{ gap: ESPACO.md }}>
          <Subtitulo>Liderança</Subtitulo>
          <Cartao>
            <Mini>
              Cadastros, geração de escala e configurações chegam na próxima etapa do app. Por
              enquanto, use o sistema web para essas telas.
            </Mini>
          </Cartao>
        </View>
      ) : null}

      <Botao
        titulo="Sair"
        variante="secundario"
        aoTocar={confirmarSaida}
        icone={<Icone nome="log-out" tamanho={18} cor={cores.texto} />}
      />

      <Mini>Servus · versão 1.0.0</Mini>
    </ScrollView>
  );
}
