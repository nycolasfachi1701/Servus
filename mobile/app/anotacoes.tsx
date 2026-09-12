import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useConsulta } from "@/lib/consulta";
import { listarAnotacoes, type Anotacao } from "@/lib/anotacoes";
import { ESPACO, RAIO, useCores } from "@/lib/tema";
import { Aviso, Carregando, Cartao, Corpo, Mini, Vazio } from "@/componentes/ui";
import { formatarData } from "@/lib/utils";

export default function Anotacoes() {
  const cores = useCores();
  const router = useRouter();
  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(listarAnotacoes, []);

  if (carregando) return <Carregando />;

  const anotacoes = (dados ?? []) as Anotacao[];

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.md }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      {anotacoes.length === 0 ? (
        <Vazio
          titulo="Nenhuma marcação ainda"
          descricao="Na Bíblia, toque em um versículo para destacar ou escrever uma anotação."
        />
      ) : (
        anotacoes.map((anotacao) => (
          <Cartao
            key={anotacao.id}
            style={{ gap: 8 }}
            aoTocar={() =>
              router.push({
                pathname: "/biblia/[livro]",
                params: {
                  livro: String(anotacao.livro),
                  capitulo: String(anotacao.capitulo),
                },
              })
            }
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.sm }}>
              {anotacao.cor ? (
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: anotacao.cor,
                  }}
                />
              ) : null}
              <Text style={{ color: cores.primaria, fontWeight: "700", fontSize: 13 }}>
                {anotacao.referencia}
              </Text>
            </View>

            {anotacao.trecho ? (
              <View
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: anotacao.cor ?? cores.borda,
                  paddingLeft: ESPACO.md,
                  borderRadius: RAIO.sm,
                }}
              >
                <Corpo suave numeroDeLinhas={3}>
                  {anotacao.trecho}
                </Corpo>
              </View>
            ) : null}

            {anotacao.texto ? <Corpo>{anotacao.texto}</Corpo> : null}

            <Mini>{formatarData(anotacao.atualizado_em.slice(0, 10))}</Mini>
          </Cartao>
        ))
      )}

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
