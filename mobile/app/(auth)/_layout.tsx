import { Stack } from "expo-router";
import { useCores } from "@/lib/tema";

export default function LayoutAutenticacao() {
  const cores = useCores();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    />
  );
}
