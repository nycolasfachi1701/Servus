import { useEffect } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { configuracaoOk } from "@/lib/supabase";
import { ProvedorSessao, useSessao } from "@/lib/sessao";
import { useCores, useEhEscuro } from "@/lib/tema";
import { Carregando } from "@/componentes/ui";
import { SemConfiguracao } from "@/componentes/sem-configuracao";

/** Manda para o login quem não está autenticado e para o app quem está. */
function Guardiao() {
  const { sessao, carregando } = useSessao();
  const segmentos = useSegments();
  const router = useRouter();
  const cores = useCores();

  useEffect(() => {
    if (carregando) return;
    const naAutenticacao = segmentos[0] === "(auth)";

    if (!sessao && !naAutenticacao) {
      router.replace("/login");
    } else if (sessao && naAutenticacao) {
      router.replace("/");
    }
  }, [sessao, carregando, segmentos, router]);

  if (carregando) {
    return (
      <View style={{ flex: 1, backgroundColor: cores.fundo, justifyContent: "center" }}>
        <Carregando texto="Abrindo o Servus…" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: cores.superficie },
        headerTitleStyle: { color: cores.texto },
        headerTintColor: cores.primaria,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="disponibilidade" options={{ title: "Minha disponibilidade" }} />
      <Stack.Screen name="anotacoes" options={{ title: "Minhas anotações" }} />
    </Stack>
  );
}

export default function LayoutRaiz() {
  const escuro = useEhEscuro();

  if (!configuracaoOk) {
    return (
      <SafeAreaProvider>
        <StatusBar style={escuro ? "light" : "dark"} />
        <SemConfiguracao />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ProvedorSessao>
        <StatusBar style={escuro ? "light" : "dark"} />
        <Guardiao />
      </ProvedorSessao>
    </SafeAreaProvider>
  );
}
