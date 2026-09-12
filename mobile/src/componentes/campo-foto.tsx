import { useState } from "react";
import { Alert, Image, Pressable, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { supabase } from "@/lib/supabase";
import { ESPACO, RAIO, useCores } from "@/lib/tema";
import { Avatar, Botao, Mini } from "@/componentes/ui";
import { Icone } from "@/componentes/icone";

const TAMANHO_MAXIMO = 3 * 1024 * 1024; // 3 MB

/**
 * Escolhe uma foto da galeria e envia direto para o Storage do Supabase,
 * devolvendo a URL pública.
 */
export function CampoFoto({
  valor,
  aoMudar,
  pasta = "membros",
  rotulo = "Foto",
  nomeParaIniciais = "?",
}: {
  valor: string | null;
  aoMudar: (url: string | null) => void;
  pasta?: string;
  rotulo?: string;
  nomeParaIniciais?: string;
}) {
  const cores = useCores();
  const [enviando, setEnviando] = useState(false);

  async function escolher() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Sem permissão", "Autorize o acesso às fotos para escolher uma imagem.");
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (resultado.canceled || !resultado.assets[0]) return;
    const imagem = resultado.assets[0];

    setEnviando(true);
    try {
      const arquivo = new File(imagem.uri);
      const conteudo = await arquivo.arrayBuffer();

      if (conteudo.byteLength > TAMANHO_MAXIMO) {
        Alert.alert("Imagem grande demais", "Escolha uma foto de até 3 MB.");
        return;
      }

      const extensao = (imagem.uri.split(".").pop() ?? "jpg").toLowerCase();
      const caminho = `${pasta}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extensao}`;

      const { error } = await supabase.storage
        .from("fotos")
        .upload(caminho, conteudo, {
          contentType: imagem.mimeType ?? `image/${extensao === "png" ? "png" : "jpeg"}`,
          upsert: false,
        });

      if (error) throw error;

      const { data } = supabase.storage.from("fotos").getPublicUrl(caminho);
      aoMudar(data.publicUrl);
    } catch {
      Alert.alert("Ops", "Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <View style={{ gap: 6 }}>
      <Mini>{rotulo}</Mini>
      <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.md }}>
        {valor ? (
          <Image
            source={{ uri: valor }}
            style={{ width: 64, height: 64, borderRadius: RAIO.pill }}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <Avatar nome={nomeParaIniciais} tamanho={64} />
        )}

        <View style={{ flex: 1, gap: ESPACO.sm }}>
          <Botao
            titulo={valor ? "Trocar foto" : "Escolher foto"}
            variante="secundario"
            carregando={enviando}
            aoTocar={escolher}
            icone={<Icone nome="user" tamanho={16} cor={cores.texto} />}
          />
          {valor ? (
            <Pressable onPress={() => aoMudar(null)}>
              <Mini cor={cores.erro}>Remover foto</Mini>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}
