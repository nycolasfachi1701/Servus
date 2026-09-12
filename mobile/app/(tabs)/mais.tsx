import { Alert, Pressable, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSessao } from "@/lib/sessao";
import { ESPACO, useCores } from "@/lib/tema";
import { Avatar, Botao, Cartao, Corpo, Mini, Separador, Subtitulo } from "@/componentes/ui";
import { Icone, type NomeIcone } from "@/componentes/icone";
import { ROTULO_PAPEL } from "@/lib/tipos";

type Atalho = {
  icone: NomeIcone;
  titulo: string;
  descricao: string;
  rota: string;
  somenteAdmin?: boolean;
};

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

const DA_LIDERANCA: Atalho[] = [
  {
    icone: "clipboard-list",
    titulo: "Escalas da igreja",
    descricao: "Gerar, ajustar e enviar no WhatsApp",
    rota: "/gestao/escalas",
  },
  {
    icone: "users",
    titulo: "Membros",
    descricao: "Cadastro, contatos e funções",
    rota: "/gestao/membros",
  },
  {
    icone: "hand-heart",
    titulo: "Ministérios",
    descricao: "Funções, equipe e liderança",
    rota: "/gestao/ministerios",
  },
  {
    icone: "church",
    titulo: "Cultos",
    descricao: "Tipos, vagas e ocorrências",
    rota: "/gestao/cultos",
  },
  {
    icone: "calendar-check",
    titulo: "Eventos",
    descricao: "Programação da igreja",
    rota: "/gestao/eventos",
  },
  {
    icone: "settings",
    titulo: "Configurações",
    descricao: "Igreja, mensagem, usuários e convites",
    rota: "/gestao/configuracoes",
    somenteAdmin: true,
  },
];

function ListaDeAtalhos({ atalhos }: { atalhos: Atalho[] }) {
  const cores = useCores();
  const router = useRouter();

  return (
    <Cartao style={{ gap: ESPACO.lg }}>
      {atalhos.map((atalho, indice) => (
        <View key={atalho.rota} style={{ gap: ESPACO.lg }}>
          {indice > 0 ? <Separador /> : null}
          <Pressable
            onPress={() => router.push(atalho.rota as never)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: ESPACO.md,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Icone nome={atalho.icone} cor={cores.primaria} />
            <View style={{ flex: 1, gap: 2 }}>
              <Corpo>{atalho.titulo}</Corpo>
              <Mini>{atalho.descricao}</Mini>
            </View>
            <Icone nome="chevron-right" tamanho={18} cor={cores.textoSuave} />
          </Pressable>
        </View>
      ))}
    </Cartao>
  );
}

export default function Mais() {
  const cores = useCores();
  const { sessao, sair } = useSessao();

  function confirmarSaida() {
    Alert.alert("Sair do Servus", "Você precisará entrar de novo depois.", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: () => void sair() },
    ]);
  }

  const daLideranca = DA_LIDERANCA.filter((a) => !a.somenteAdmin || sessao?.ehAdmin);

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
        <ListaDeAtalhos atalhos={DO_MEMBRO} />
      </View>

      {sessao?.ehLideranca ? (
        <View style={{ gap: ESPACO.md }}>
          <Subtitulo>Liderança</Subtitulo>
          <ListaDeAtalhos atalhos={daLideranca} />
        </View>
      ) : null}

      <Botao
        titulo="Sair"
        variante="secundario"
        aoTocar={confirmarSaida}
        icone={<Icone nome="log-out" tamanho={18} cor={cores.texto} />}
      />

      <Mini>Servus · versão 1.0.0</Mini>
      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
