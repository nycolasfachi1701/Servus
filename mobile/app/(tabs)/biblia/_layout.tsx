import { Suspense } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";
import { useCores } from "@/lib/tema";
import { Carregando } from "@/componentes/ui";

/**
 * A Bíblia vive num banco SQLite embutido no app. O provider copia o
 * arquivo do asset na primeira abertura e mantém a conexão para as telas.
 */
export default function LayoutBiblia() {
  const cores = useCores();

  return (
    <Suspense
      fallback={
        <View style={{ flex: 1, backgroundColor: cores.fundo, justifyContent: "center" }}>
          <Carregando texto="Preparando a Bíblia…" />
        </View>
      }
    >
      <SQLiteProvider
        databaseName="biblia.db"
        assetSource={{ assetId: require("../../../assets/db/biblia.db") }}
        useSuspense
      >
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: cores.superficie },
            headerTitleStyle: { color: cores.texto },
            headerTintColor: cores.primaria,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: cores.fundo },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="[livro]" options={{ title: "" }} />
          <Stack.Screen name="busca" options={{ title: "Buscar na Bíblia" }} />
        </Stack>
      </SQLiteProvider>
    </Suspense>
  );
}
