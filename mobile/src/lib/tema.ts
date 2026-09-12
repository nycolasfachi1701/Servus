import { useColorScheme } from "react-native";

/**
 * Paleta do Servus: azul como cor de destaque, cinzas neutros e branco.
 * Os mesmos valores do sistema web, para app e site ficarem irmãos.
 */
export type Cores = {
  fundo: string;
  superficie: string;
  superficie2: string;
  borda: string;
  texto: string;
  textoSuave: string;
  primaria: string;
  primariaClara: string;
  primariaTenue: string;
  sucesso: string;
  alerta: string;
  erro: string;
  sobrePrimaria: string;
};

export const CLARO: Cores = {
  fundo: "#F5F7FA",
  superficie: "#FFFFFF",
  superficie2: "#EEF2F7",
  borda: "#DDE4ED",
  texto: "#111927",
  textoSuave: "#5A6B80",
  primaria: "#1E5AA8",
  primariaClara: "#2E74CC",
  primariaTenue: "#E8F0FA",
  sucesso: "#17845A",
  alerta: "#A5701A",
  erro: "#C53838",
  sobrePrimaria: "#FFFFFF",
};

export const ESCURO: Cores = {
  fundo: "#0B1220",
  superficie: "#121A2A",
  superficie2: "#1A2436",
  borda: "#26324A",
  texto: "#E8EEF7",
  textoSuave: "#A3B2C7",
  primaria: "#549AE8",
  primariaClara: "#7BB4EF",
  primariaTenue: "#16243B",
  sucesso: "#34B87C",
  alerta: "#E0A32E",
  erro: "#E86B6B",
  sobrePrimaria: "#07101E",
};

export const ESPACO = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const RAIO = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

export const TEXTO = {
  titulo: { fontSize: 24, fontWeight: "700" },
  subtitulo: { fontSize: 18, fontWeight: "600" },
  corpo: { fontSize: 15, fontWeight: "400" },
  rotulo: { fontSize: 13, fontWeight: "500" },
  mini: { fontSize: 12, fontWeight: "400" },
} as const;

/** Cores do tema atual (segue o tema do sistema operacional). */
export function useCores(): Cores {
  return useColorScheme() === "dark" ? ESCURO : CLARO;
}

export function useEhEscuro(): boolean {
  return useColorScheme() === "dark";
}
