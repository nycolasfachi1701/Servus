import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { buscar, type Ocorrencia } from "@/lib/biblia";
import { ESPACO, RAIO, useCores } from "@/lib/tema";
import { Corpo, Entrada, Mini, Vazio } from "@/componentes/ui";
import { Icone } from "@/componentes/icone";

export default function BuscaBiblia() {
  const cores = useCores();
  const db = useSQLiteContext();
  const router = useRouter();

  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<Ocorrencia[] | null>(null);
  const [procurando, setProcurando] = useState(false);

  async function procurar() {
    if (termo.trim().length < 2) return;
    setProcurando(true);
    try {
      setResultados(await buscar(db, termo));
    } finally {
      setProcurando(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: ESPACO.lg, gap: ESPACO.sm }}>
        <View style={{ flexDirection: "row", gap: ESPACO.sm, alignItems: "center" }}>
          <Entrada
            value={termo}
            onChangeText={setTermo}
            placeholder="Ex.: coração alegre"
            autoFocus
            returnKeyType="search"
            onSubmitEditing={procurar}
            style={{ flex: 1 }}
          />
          <Pressable
            onPress={procurar}
            style={{
              width: 46,
              height: 46,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: RAIO.md,
              backgroundColor: cores.primaria,
            }}
          >
            {procurando ? (
              <ActivityIndicator color={cores.sobrePrimaria} />
            ) : (
              <Icone nome="search" tamanho={20} cor={cores.sobrePrimaria} />
            )}
          </Pressable>
        </View>
        <Mini>A busca ignora acentos e maiúsculas. Todas as palavras precisam aparecer.</Mini>
      </View>

      <ScrollView contentContainerStyle={{ padding: ESPACO.lg, paddingTop: 0, gap: ESPACO.md }}>
        {resultados === null ? null : resultados.length === 0 ? (
          <Vazio titulo="Nada encontrado" descricao="Tente outra palavra ou use menos termos." />
        ) : (
          <>
            <Mini>
              {resultados.length} resultado(s)
              {resultados.length >= 60 ? " — mostrando os primeiros" : ""}
            </Mini>
            {resultados.map((ocorrencia) => (
              <Pressable
                key={ocorrencia.id}
                onPress={() =>
                  router.push({
                    pathname: "/biblia/[livro]",
                    params: {
                      livro: String(ocorrencia.livro),
                      capitulo: String(ocorrencia.capitulo),
                    },
                  })
                }
                style={({ pressed }) => ({
                  gap: 4,
                  padding: ESPACO.md,
                  borderRadius: RAIO.md,
                  backgroundColor: cores.superficie,
                  borderWidth: 1,
                  borderColor: cores.borda,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: cores.primaria, fontWeight: "700", fontSize: 13 }}>
                  {ocorrencia.nomeLivro} {ocorrencia.capitulo}:{ocorrencia.versiculo}
                </Text>
                <Corpo numeroDeLinhas={3}>{ocorrencia.texto}</Corpo>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
