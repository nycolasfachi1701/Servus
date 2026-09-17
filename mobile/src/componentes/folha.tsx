import type { ReactNode } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from "react-native";
import { ESPACO, RAIO, useCores } from "@/lib/tema";

/**
 * Folha que sobe de baixo.
 *
 * O `KeyboardAvoidingView` é o ponto importante: sem ele o teclado cobre os
 * campos de texto no iOS (no Android o `adjustResize` já dá conta, por isso
 * o behavior só é definido no iOS).
 */
export function FolhaInferior({
  visivel,
  aoFechar,
  children,
  alturaMaxima,
}: {
  visivel: boolean;
  aoFechar: () => void;
  children: ReactNode;
  /** fração da tela, para folhas com listas longas */
  alturaMaxima?: `${number}%`;
}) {
  const cores = useCores();

  return (
    <Modal visible={visivel} animationType="slide" transparent onRequestClose={aoFechar}>
      <KeyboardAvoidingView
        style={{ flex: 1, justifyContent: "flex-end" }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={{ flex: 1, backgroundColor: "#0008" }} onPress={aoFechar} />
        <View
          style={{
            maxHeight: alturaMaxima ?? "85%",
            backgroundColor: cores.superficie,
            borderTopLeftRadius: RAIO.lg,
            borderTopRightRadius: RAIO.lg,
            padding: ESPACO.lg,
            paddingBottom: ESPACO.xl,
            gap: ESPACO.lg,
          }}
        >
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
