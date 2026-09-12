import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageStyle,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { ESPACO, RAIO, useCores, type Cores } from "@/lib/tema";
import { iniciais } from "@/lib/utils";

/* ------------------------------------------------------------ textos */

export function Titulo({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useCores();
  return (
    <Text style={[{ fontSize: 24, fontWeight: "700", color: c.texto }, style]}>{children}</Text>
  );
}

export function Subtitulo({ children }: { children: ReactNode }) {
  const c = useCores();
  return <Text style={{ fontSize: 17, fontWeight: "600", color: c.texto }}>{children}</Text>;
}

export function Corpo({
  children,
  suave,
  numeroDeLinhas,
}: {
  children: ReactNode;
  suave?: boolean;
  numeroDeLinhas?: number;
}) {
  const c = useCores();
  return (
    <Text
      numberOfLines={numeroDeLinhas}
      style={{ fontSize: 15, color: suave ? c.textoSuave : c.texto, lineHeight: 21 }}
    >
      {children}
    </Text>
  );
}

export function Mini({ children, cor }: { children: ReactNode; cor?: string }) {
  const c = useCores();
  return <Text style={{ fontSize: 12.5, color: cor ?? c.textoSuave }}>{children}</Text>;
}

/* ------------------------------------------------------------ blocos */

export function Cartao({
  children,
  style,
  aoTocar,
}: {
  children: ReactNode;
  style?: ViewStyle;
  aoTocar?: () => void;
}) {
  const c = useCores();
  const base: ViewStyle = {
    backgroundColor: c.superficie,
    borderColor: c.borda,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: RAIO.lg,
    padding: ESPACO.lg,
  };

  if (!aoTocar) return <View style={[base, style]}>{children}</View>;

  return (
    <Pressable
      onPress={aoTocar}
      style={({ pressed }) => [base, style, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
    >
      {children}
    </Pressable>
  );
}

export function Etiqueta({
  texto,
  tom = "neutro",
}: {
  texto: string;
  tom?: "neutro" | "primaria" | "sucesso" | "alerta" | "erro";
}) {
  const c = useCores();
  const cor =
    tom === "sucesso" ? c.sucesso : tom === "alerta" ? c.alerta : tom === "erro" ? c.erro : tom === "primaria" ? c.primaria : c.textoSuave;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        borderRadius: RAIO.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: cor,
        backgroundColor: `${cor}1A`,
        paddingHorizontal: 9,
        paddingVertical: 3,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "600", color: cor }}>{texto}</Text>
    </View>
  );
}

export function Avatar({
  nome,
  fotoUrl,
  tamanho = 40,
}: {
  nome: string;
  fotoUrl?: string | null;
  tamanho?: number;
}) {
  const c = useCores();
  const estilo: ViewStyle & ImageStyle = {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primariaTenue,
    overflow: "hidden",
  };

  if (fotoUrl) {
    return <Image source={{ uri: fotoUrl }} style={estilo} accessibilityIgnoresInvertColors />;
  }

  return (
    <View style={estilo}>
      <Text style={{ color: c.primaria, fontWeight: "700", fontSize: tamanho * 0.36 }}>
        {iniciais(nome)}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------ botões */

export function Botao({
  titulo,
  aoTocar,
  variante = "primario",
  carregando,
  desabilitado,
  icone,
  style,
}: {
  titulo: string;
  aoTocar: () => void;
  variante?: "primario" | "secundario" | "fantasma" | "perigo" | "sucesso";
  carregando?: boolean;
  desabilitado?: boolean;
  icone?: ReactNode;
  style?: ViewStyle;
}) {
  const c = useCores();
  const fundo =
    variante === "primario"
      ? c.primaria
      : variante === "perigo"
        ? c.erro
        : variante === "sucesso"
          ? c.sucesso
          : variante === "secundario"
            ? c.superficie2
            : "transparent";
  const tinta =
    variante === "secundario" || variante === "fantasma" ? c.texto : c.sobrePrimaria;

  const inativo = desabilitado || carregando;

  return (
    <Pressable
      onPress={aoTocar}
      disabled={inativo}
      accessibilityRole="button"
      style={({ pressed }) => [
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: ESPACO.sm,
          height: 46,
          paddingHorizontal: ESPACO.lg,
          borderRadius: RAIO.md,
          backgroundColor: fundo,
          borderWidth: variante === "secundario" ? StyleSheet.hairlineWidth : 0,
          borderColor: c.borda,
          opacity: inativo ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {carregando ? <ActivityIndicator color={tinta} /> : icone}
      <Text style={{ color: tinta, fontWeight: "600", fontSize: 15 }}>{titulo}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------ campos */

export function Campo({
  rotulo,
  dica,
  children,
}: {
  rotulo: string;
  dica?: string;
  children: ReactNode;
}) {
  const c = useCores();
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: c.textoSuave }}>{rotulo}</Text>
      {children}
      {dica ? <Mini>{dica}</Mini> : null}
    </View>
  );
}

export function Entrada(props: TextInputProps) {
  const c = useCores();
  return (
    <TextInput
      placeholderTextColor={c.textoSuave}
      {...props}
      style={[
        {
          height: 46,
          borderRadius: RAIO.md,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.borda,
          backgroundColor: c.superficie,
          paddingHorizontal: ESPACO.md,
          color: c.texto,
          fontSize: 15,
        },
        props.style,
      ]}
    />
  );
}

/* ------------------------------------------------------------ estados */

export function Aviso({
  texto,
  tom = "info",
}: {
  texto: string;
  tom?: "info" | "sucesso" | "alerta" | "erro";
}) {
  const c = useCores();
  const cor = tom === "sucesso" ? c.sucesso : tom === "alerta" ? c.alerta : tom === "erro" ? c.erro : c.textoSuave;
  return (
    <View
      style={{
        borderRadius: RAIO.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: cor,
        backgroundColor: `${cor}14`,
        padding: ESPACO.md,
      }}
    >
      <Text style={{ color: cor, fontSize: 14 }}>{texto}</Text>
    </View>
  );
}

export function Carregando({ texto }: { texto?: string }) {
  const c = useCores();
  return (
    <View style={{ padding: ESPACO.xxl, alignItems: "center", gap: ESPACO.md }}>
      <ActivityIndicator color={c.primaria} />
      {texto ? <Mini>{texto}</Mini> : null}
    </View>
  );
}

export function Vazio({ titulo, descricao }: { titulo: string; descricao?: string }) {
  const c = useCores();
  return (
    <View
      style={{
        borderRadius: RAIO.lg,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: c.borda,
        padding: ESPACO.xl,
        alignItems: "center",
        gap: 6,
      }}
    >
      <Text style={{ fontWeight: "600", color: c.texto, textAlign: "center" }}>{titulo}</Text>
      {descricao ? (
        <Text style={{ color: c.textoSuave, fontSize: 13.5, textAlign: "center" }}>
          {descricao}
        </Text>
      ) : null}
    </View>
  );
}

export function Separador() {
  const c = useCores();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.borda }} />;
}

export type { Cores };
