import { View, Text } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useCores } from "@/lib/tema";

/** Símbolo do Servus: uma cruz com a alça de uma bacia (servir). */
export function Simbolo({ tamanho = 56 }: { tamanho?: number }) {
  const cores = useCores();
  return (
    <Svg width={tamanho} height={tamanho} viewBox="0 0 64 64">
      <Rect width="64" height="64" rx="16" fill={cores.primaria} />
      <Path d="M32 12v40M22 24h20" stroke="#FFFFFF" strokeWidth={5} strokeLinecap="round" />
      <Path
        d="M42 40c0 6-4.6 10-10 10s-10-4-10-10"
        stroke="#9CC4F0"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

export function Marca({ nomeIgreja }: { nomeIgreja?: string }) {
  const cores = useCores();
  return (
    <View style={{ alignItems: "center", gap: 10 }}>
      <Simbolo />
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 26, fontWeight: "700", color: cores.texto }}>Servus</Text>
        {nomeIgreja ? (
          <Text style={{ fontSize: 13, color: cores.textoSuave }}>{nomeIgreja}</Text>
        ) : null}
      </View>
    </View>
  );
}
