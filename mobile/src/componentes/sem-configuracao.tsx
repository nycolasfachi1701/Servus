import { ScrollView, Text, View } from "react-native";
import { ESPACO, RAIO, useCores } from "@/lib/tema";
import { Marca } from "@/componentes/marca";

/** Tela mostrada quando o arquivo `.env` não foi lido. */
export function SemConfiguracao() {
  const cores = useCores();

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: ESPACO.xl,
        gap: ESPACO.xl,
        backgroundColor: cores.fundo,
      }}
    >
      <Marca />

      <View
        style={{
          gap: ESPACO.md,
          padding: ESPACO.lg,
          borderRadius: RAIO.lg,
          borderWidth: 1,
          borderColor: cores.borda,
          backgroundColor: cores.superficie,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: cores.texto }}>
          Falta configurar o acesso ao servidor
        </Text>

        <Text style={{ color: cores.textoSuave, fontSize: 15, lineHeight: 22 }}>
          O app não encontrou as chaves do Supabase. Crie o arquivo{" "}
          <Text style={{ color: cores.texto, fontWeight: "600" }}>.env</Text> dentro da pasta{" "}
          <Text style={{ color: cores.texto, fontWeight: "600" }}>mobile</Text> com estas duas
          linhas:
        </Text>

        <View
          style={{
            backgroundColor: cores.superficie2,
            borderRadius: RAIO.md,
            padding: ESPACO.md,
          }}
        >
          <Text style={{ color: cores.texto, fontSize: 12.5, fontFamily: "monospace" }}>
            EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co{"\n"}
            EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
          </Text>
        </View>

        <Text style={{ color: cores.textoSuave, fontSize: 14, lineHeight: 21 }}>
          Depois pare o servidor e rode{" "}
          <Text style={{ color: cores.texto, fontWeight: "600" }}>npx expo start --clear</Text> — o
          Expo só lê o .env quando inicia.
        </Text>
      </View>
    </ScrollView>
  );
}
