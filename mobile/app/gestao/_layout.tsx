import { useEffect } from "react";
import { Stack, useRouter } from "expo-router";
import { useSessao } from "@/lib/sessao";
import { useCores } from "@/lib/tema";

/** Área da liderança: quem não é admin nem líder volta para o início. */
export default function LayoutGestao() {
  const cores = useCores();
  const router = useRouter();
  const { sessao, carregando } = useSessao();

  useEffect(() => {
    if (!carregando && sessao && !sessao.ehLideranca) router.replace("/");
  }, [sessao, carregando, router]);

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
      <Stack.Screen name="escalas/index" options={{ title: "Escalas" }} />
      <Stack.Screen name="escalas/[id]" options={{ title: "Escala do culto" }} />
      <Stack.Screen name="membros/index" options={{ title: "Membros" }} />
      <Stack.Screen name="membros/[id]" options={{ title: "Membro" }} />
      <Stack.Screen name="membros/editar" options={{ title: "Cadastro" }} />
      <Stack.Screen name="ministerios/index" options={{ title: "Ministérios" }} />
      <Stack.Screen name="ministerios/[id]" options={{ title: "Ministério" }} />
      <Stack.Screen name="cultos" options={{ title: "Cultos" }} />
      <Stack.Screen name="eventos" options={{ title: "Eventos" }} />
      <Stack.Screen name="configuracoes" options={{ title: "Configurações" }} />
    </Stack>
  );
}
