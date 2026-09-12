import { Tabs } from "expo-router";
import { StyleSheet, type ColorValue } from "react-native";
import { Icone, type NomeIcone } from "@/componentes/icone";
import { useCores } from "@/lib/tema";

function aba(nome: NomeIcone) {
  return ({ color }: { color: ColorValue }) => (
    <Icone nome={nome} cor={String(color)} tamanho={22} />
  );
}

export default function LayoutAbas() {
  const cores = useCores();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: cores.superficie },
        headerTitleStyle: { color: cores.texto },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: cores.fundo },
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoSuave,
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.borda,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Início", tabBarIcon: aba("layout-dashboard") }}
      />
      <Tabs.Screen
        name="escalas"
        options={{ title: "Escalas", tabBarIcon: aba("calendar-check") }}
      />
      <Tabs.Screen name="biblia" options={{ title: "Bíblia", tabBarIcon: aba("book-open") }} />
      <Tabs.Screen name="mais" options={{ title: "Mais", tabBarIcon: aba("ellipsis") }} />
    </Tabs>
  );
}
