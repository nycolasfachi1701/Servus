import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { listarLivros, type Livro } from "@/lib/biblia";
import { lerUltimaLeitura, type UltimaLeitura } from "@/lib/leitura";
import { useSessao } from "@/lib/sessao";
import { ESPACO, RAIO, useCores } from "@/lib/tema";
import { Cartao, Corpo, Mini, Subtitulo, Titulo } from "@/componentes/ui";
import { Icone } from "@/componentes/icone";

export default function IndiceBiblia() {
  const cores = useCores();
  const router = useRouter();
  const db = useSQLiteContext();
  const { sessao } = useSessao();

  const [livros, setLivros] = useState<Livro[]>([]);
  const [testamento, setTestamento] = useState<1 | 2>(1);
  const [ultima, setUltima] = useState<UltimaLeitura | null>(null);

  useEffect(() => {
    void listarLivros(db).then(setLivros);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void lerUltimaLeitura(sessao?.usuarioId ?? null).then(setUltima);
    }, [sessao?.usuarioId]),
  );

  const doTestamento = livros.filter((l) => l.testamento === testamento);

  return (
    <ScrollView contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}>
      <View style={{ gap: 4 }}>
        <Titulo>Bíblia</Titulo>
        <Mini>Almeida Revisada (1914) · funciona sem internet</Mini>
      </View>

      <Pressable
        onPress={() => router.push("/biblia/busca")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: ESPACO.md,
          height: 46,
          paddingHorizontal: ESPACO.md,
          borderRadius: RAIO.md,
          backgroundColor: cores.superficie,
          borderWidth: 1,
          borderColor: cores.borda,
        }}
      >
        <Icone nome="search" tamanho={18} cor={cores.textoSuave} />
        <Text style={{ color: cores.textoSuave, fontSize: 15 }}>
          Buscar palavra ou versículo
        </Text>
      </Pressable>

      {ultima ? (
        <Cartao
          aoTocar={() =>
            router.push({
              pathname: "/biblia/[livro]",
              params: { livro: String(ultima.livro), capitulo: String(ultima.capitulo) },
            })
          }
          style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.md }}
        >
          <Icone nome="book-open" cor={cores.primaria} />
          <View style={{ flex: 1, gap: 2 }}>
            <Mini>Continuar lendo</Mini>
            <Corpo>
              {ultima.nome} {ultima.capitulo}
            </Corpo>
          </View>
          <Icone nome="chevron-right" tamanho={18} cor={cores.textoSuave} />
        </Cartao>
      ) : null}

      <View style={{ flexDirection: "row", gap: ESPACO.sm }}>
        {([1, 2] as const).map((t) => {
          const ativo = testamento === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTestamento(t)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 10,
                borderRadius: RAIO.md,
                backgroundColor: ativo ? cores.primariaTenue : cores.superficie,
                borderWidth: 1,
                borderColor: ativo ? cores.primaria : cores.borda,
              }}
            >
              <Text
                style={{
                  color: ativo ? cores.primaria : cores.textoSuave,
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                {t === 1 ? "Antigo Testamento" : "Novo Testamento"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: ESPACO.md }}>
        <Subtitulo>Livros</Subtitulo>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO.sm }}>
          {doTestamento.map((livro) => (
            <Pressable
              key={livro.id}
              onPress={() =>
                router.push({
                  pathname: "/biblia/[livro]",
                  params: { livro: String(livro.id), capitulo: "1" },
                })
              }
              style={({ pressed }) => ({
                minWidth: "31%",
                flexGrow: 1,
                paddingVertical: 12,
                paddingHorizontal: ESPACO.md,
                borderRadius: RAIO.md,
                backgroundColor: cores.superficie,
                borderWidth: 1,
                borderColor: cores.borda,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ color: cores.texto, fontWeight: "600", fontSize: 14 }}>
                {livro.nome}
              </Text>
              <Text style={{ color: cores.textoSuave, fontSize: 11.5, marginTop: 2 }}>
                {livro.capitulos} capítulos
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
