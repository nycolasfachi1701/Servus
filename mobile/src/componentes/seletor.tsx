import { useMemo, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { ESPACO, RAIO, useCores } from "@/lib/tema";
import { Icone } from "@/componentes/icone";
import { Mini } from "@/componentes/ui";
import { FolhaInferior } from "@/componentes/folha";

export type Opcao = {
  valor: string;
  rotulo: string;
  detalhe?: string;
  desabilitada?: boolean;
};

/**
 * Campo de escolha: no celular não existe <select>, então abre uma lista
 * em tela cheia — com busca quando há muitas opções.
 */
export function Seletor({
  rotulo,
  valor,
  opcoes,
  aoEscolher,
  vazio = "Escolher…",
  permiteLimpar,
  titulo,
}: {
  rotulo?: string;
  valor: string | null;
  opcoes: Opcao[];
  aoEscolher: (valor: string | null) => void;
  vazio?: string;
  permiteLimpar?: boolean;
  titulo?: string;
}) {
  const cores = useCores();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  const escolhida = opcoes.find((o) => o.valor === valor);
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return opcoes;
    return opcoes.filter((o) => o.rotulo.toLowerCase().includes(termo));
  }, [opcoes, busca]);

  return (
    <View style={{ gap: 6 }}>
      {rotulo ? (
        <Text style={{ fontSize: 13, fontWeight: "600", color: cores.textoSuave }}>{rotulo}</Text>
      ) : null}

      <Pressable
        onPress={() => setAberto(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: ESPACO.sm,
          minHeight: 46,
          paddingHorizontal: ESPACO.md,
          paddingVertical: 10,
          borderRadius: RAIO.md,
          borderWidth: 1,
          borderColor: cores.borda,
          backgroundColor: cores.superficie,
        }}
      >
        <Text
          numberOfLines={1}
          style={{ flex: 1, color: escolhida ? cores.texto : cores.textoSuave, fontSize: 15 }}
        >
          {escolhida?.rotulo ?? vazio}
        </Text>
        <Icone nome="chevron-right" tamanho={18} cor={cores.textoSuave} />
      </Pressable>

      <FolhaInferior visivel={aberto} aoFechar={() => setAberto(false)} alturaMaxima="75%">
          <Text style={{ fontSize: 17, fontWeight: "700", color: cores.texto }}>
            {titulo ?? rotulo ?? "Escolher"}
          </Text>

          {opcoes.length > 8 ? (
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar…"
              placeholderTextColor={cores.textoSuave}
              style={{
                height: 44,
                borderRadius: RAIO.md,
                borderWidth: 1,
                borderColor: cores.borda,
                backgroundColor: cores.fundo,
                paddingHorizontal: ESPACO.md,
                color: cores.texto,
              }}
            />
          ) : null}

          <ScrollView contentContainerStyle={{ gap: 4 }}>
            {permiteLimpar ? (
              <Pressable
                onPress={() => {
                  aoEscolher(null);
                  setAberto(false);
                }}
                style={{ paddingVertical: 12, paddingHorizontal: ESPACO.md }}
              >
                <Text style={{ color: cores.textoSuave, fontSize: 15 }}>{vazio}</Text>
              </Pressable>
            ) : null}

            {filtradas.map((opcao) => {
              const ativa = opcao.valor === valor;
              return (
                <Pressable
                  key={opcao.valor}
                  disabled={opcao.desabilitada}
                  onPress={() => {
                    aoEscolher(opcao.valor);
                    setAberto(false);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: ESPACO.md,
                    paddingVertical: 12,
                    paddingHorizontal: ESPACO.md,
                    borderRadius: RAIO.md,
                    backgroundColor: ativa ? cores.primariaTenue : "transparent",
                    opacity: opcao.desabilitada ? 0.45 : 1,
                  }}
                >
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text
                      style={{
                        color: ativa ? cores.primaria : cores.texto,
                        fontSize: 15,
                        fontWeight: ativa ? "600" : "400",
                      }}
                    >
                      {opcao.rotulo}
                    </Text>
                    {opcao.detalhe ? <Mini>{opcao.detalhe}</Mini> : null}
                  </View>
                  {ativa ? <Icone nome="check" tamanho={18} cor={cores.primaria} /> : null}
                </Pressable>
              );
            })}

            {filtradas.length === 0 ? <Mini>Nada encontrado.</Mini> : null}
          </ScrollView>
      </FolhaInferior>
    </View>
  );
}

/** Folha de ações simples, usada em confirmações e menus curtos. */
export function Folha({
  visivel,
  aoFechar,
  titulo,
  children,
}: {
  visivel: boolean;
  aoFechar: () => void;
  titulo?: string;
  children: ReactNode;
}) {
  const cores = useCores();
  return (
    <FolhaInferior visivel={visivel} aoFechar={aoFechar}>
      {titulo ? (
        <Text style={{ fontSize: 17, fontWeight: "700", color: cores.texto }}>{titulo}</Text>
      ) : null}
      {children}
    </FolhaInferior>
  );
}
