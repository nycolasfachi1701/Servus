import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { lerCapitulo, obterLivro, referencia, type Livro, type Versiculo } from "@/lib/biblia";
import {
  anotacoesDoCapitulo,
  apagarAnotacao,
  CORES_DESTAQUE,
  salvarAnotacao,
  type Anotacao,
} from "@/lib/anotacoes";
import { ESPACO, RAIO, useCores } from "@/lib/tema";
import { Botao, Carregando, Corpo, Mini, Separador } from "@/componentes/ui";
import { FolhaInferior } from "@/componentes/folha";
import { Icone } from "@/componentes/icone";
import { salvarUltimaLeitura } from "@/lib/leitura";
import { useSessao } from "@/lib/sessao";

export default function LeitorBiblia() {
  const cores = useCores();
  const db = useSQLiteContext();
  const navegacao = useNavigation();
  const { sessao } = useSessao();
  const params = useLocalSearchParams<{ livro: string; capitulo?: string }>();

  const livroId = Number(params.livro);
  const [capitulo, setCapitulo] = useState(Number(params.capitulo ?? 1) || 1);
  const [livro, setLivro] = useState<Livro | null>(null);
  const [versiculos, setVersiculos] = useState<Versiculo[]>([]);
  const [anotacoes, setAnotacoes] = useState<Map<number, Anotacao>>(new Map());
  const [carregando, setCarregando] = useState(true);

  const [selecionado, setSelecionado] = useState<Versiculo | null>(null);
  const [escrevendo, setEscrevendo] = useState(false);
  const [rascunho, setRascunho] = useState("");
  const [listaCapitulos, setListaCapitulos] = useState(false);

  const rolagem = useRef<ScrollView>(null);

  useEffect(() => {
    void obterLivro(db, livroId).then(setLivro);
  }, [db, livroId]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const [texto, marcacoes] = await Promise.all([
      lerCapitulo(db, livroId, capitulo),
      anotacoesDoCapitulo(livroId, capitulo).catch(() => new Map<number, Anotacao>()),
    ]);
    setVersiculos(texto);
    setAnotacoes(marcacoes);
    setCarregando(false);
    rolagem.current?.scrollTo({ y: 0, animated: false });
  }, [db, livroId, capitulo]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    if (!livro) return;
    navegacao.setOptions({ title: `${livro.nome} ${capitulo}` });
    void salvarUltimaLeitura(sessao?.usuarioId ?? null, {
      livro: livro.id,
      capitulo,
      nome: livro.nome,
    });
  }, [livro, capitulo, navegacao, sessao?.usuarioId]);

  const anotacaoSelecionada = useMemo(
    () => (selecionado ? anotacoes.get(selecionado.versiculo) : undefined),
    [selecionado, anotacoes],
  );

  function abrirVersiculo(versiculo: Versiculo) {
    setSelecionado(versiculo);
    setRascunho(anotacoes.get(versiculo.versiculo)?.texto ?? "");
    setEscrevendo(false);
  }

  function fechar() {
    setSelecionado(null);
    setEscrevendo(false);
  }

  async function marcar(cor: string | null) {
    if (!selecionado || !livro) return;
    const atual = anotacoes.get(selecionado.versiculo);
    try {
      await salvarAnotacao({
        livro: livroId,
        capitulo,
        versiculo: selecionado.versiculo,
        cor,
        texto: atual?.texto ?? null,
        referencia: referencia(livro.nome, capitulo, selecionado.versiculo),
        trecho: selecionado.texto,
      });
      await carregar();
      fechar();
    } catch {
      Alert.alert("Ops", "Não foi possível salvar o destaque. Verifique sua conexão.");
    }
  }

  async function guardarAnotacao() {
    if (!selecionado || !livro) return;
    try {
      await salvarAnotacao({
        livro: livroId,
        capitulo,
        versiculo: selecionado.versiculo,
        cor: anotacoes.get(selecionado.versiculo)?.cor ?? null,
        texto: rascunho,
        referencia: referencia(livro.nome, capitulo, selecionado.versiculo),
        trecho: selecionado.texto,
      });
      await carregar();
      fechar();
    } catch {
      Alert.alert("Ops", "Não foi possível salvar a anotação. Verifique sua conexão.");
    }
  }

  async function remover() {
    if (!selecionado) return;
    try {
      await apagarAnotacao(livroId, capitulo, selecionado.versiculo);
      await carregar();
      fechar();
    } catch {
      Alert.alert("Ops", "Não foi possível remover agora.");
    }
  }

  async function compartilhar() {
    if (!selecionado || !livro) return;
    await Share.share({
      message: `"${selecionado.texto}"\n\n${referencia(livro.nome, capitulo, selecionado.versiculo)} (Almeida Revisada)`,
    });
  }

  function irPara(novoCapitulo: number) {
    if (!livro) return;
    if (novoCapitulo < 1 || novoCapitulo > livro.capitulos) return;
    setCapitulo(novoCapitulo);
    setListaCapitulos(false);
  }

  if (carregando && versiculos.length === 0) return <Carregando texto="Abrindo o capítulo…" />;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={rolagem}
        contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.md, paddingBottom: 100 }}
      >
        <Pressable
          onPress={() => setListaCapitulos(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: ESPACO.sm,
            paddingVertical: ESPACO.sm,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: "700", color: cores.texto }}>
            {livro?.nome} {capitulo}
          </Text>
          <Icone nome="chevron-right" tamanho={18} cor={cores.textoSuave} />
        </Pressable>

        <Separador />

        <View style={{ gap: ESPACO.md, paddingTop: ESPACO.sm }}>
          {versiculos.map((versiculo) => {
            const marcacao = anotacoes.get(versiculo.versiculo);
            return (
              <Pressable
                key={versiculo.id}
                onPress={() => abrirVersiculo(versiculo)}
                style={{
                  flexDirection: "row",
                  gap: ESPACO.sm,
                  borderRadius: RAIO.sm,
                  paddingVertical: 2,
                  paddingHorizontal: marcacao?.cor ? 6 : 0,
                  backgroundColor: marcacao?.cor ? `${marcacao.cor}44` : "transparent",
                }}
              >
                <Text
                  style={{
                    color: cores.primaria,
                    fontSize: 12,
                    fontWeight: "700",
                    paddingTop: 4,
                    minWidth: 20,
                  }}
                >
                  {versiculo.versiculo}
                </Text>
                <Text style={{ flex: 1, color: cores.texto, fontSize: 17, lineHeight: 27 }}>
                  {versiculo.texto}
                  {marcacao?.texto ? "  " : ""}
                  {marcacao?.texto ? (
                    <Text style={{ color: cores.primaria, fontSize: 13 }}>✎</Text>
                  ) : null}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={{ flexDirection: "row", gap: ESPACO.md, marginTop: ESPACO.lg }}>
          <Botao
            titulo="Anterior"
            variante="secundario"
            style={{ flex: 1 }}
            aoTocar={() => irPara(capitulo - 1)}
            desabilitado={capitulo <= 1}
            icone={<Icone nome="chevron-left" tamanho={18} cor={cores.texto} />}
          />
          <Botao
            titulo="Próximo"
            variante="secundario"
            style={{ flex: 1 }}
            aoTocar={() => irPara(capitulo + 1)}
            desabilitado={!livro || capitulo >= livro.capitulos}
            icone={<Icone nome="chevron-right" tamanho={18} cor={cores.texto} />}
          />
        </View>
      </ScrollView>

      {/* ------------------------------------------ escolher capítulo */}
      <FolhaInferior
        visivel={listaCapitulos}
        aoFechar={() => setListaCapitulos(false)}
        alturaMaxima="70%"
      >
          <Text style={{ fontSize: 17, fontWeight: "700", color: cores.texto }}>
            {livro?.nome} — capítulos
          </Text>
          <ScrollView contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Array.from({ length: livro?.capitulos ?? 0 }, (_, i) => i + 1).map((numero) => (
              <Pressable
                key={numero}
                onPress={() => irPara(numero)}
                style={{
                  width: 48,
                  height: 44,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: RAIO.sm,
                  backgroundColor: numero === capitulo ? cores.primaria : cores.superficie2,
                }}
              >
                <Text
                  style={{
                    color: numero === capitulo ? cores.sobrePrimaria : cores.texto,
                    fontWeight: "600",
                  }}
                >
                  {numero}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
      </FolhaInferior>

      {/* --------------------------------------- ações do versículo */}
      <FolhaInferior visivel={Boolean(selecionado)} aoFechar={fechar}>
          <View style={{ gap: 4 }}>
            <Mini>
              {livro?.nome} {capitulo}:{selecionado?.versiculo}
            </Mini>
            <Corpo numeroDeLinhas={escrevendo ? 1 : 5}>{selecionado?.texto}</Corpo>
          </View>

          {escrevendo ? (
            <View style={{ gap: ESPACO.md }}>
              <TextInput
                value={rascunho}
                onChangeText={setRascunho}
                placeholder="Escreva sua anotação sobre este versículo…"
                placeholderTextColor={cores.textoSuave}
                multiline
                autoFocus
                style={{
                  minHeight: 96,
                  borderRadius: RAIO.md,
                  borderWidth: 1,
                  borderColor: cores.borda,
                  backgroundColor: cores.fundo,
                  padding: ESPACO.md,
                  color: cores.texto,
                  fontSize: 15,
                  textAlignVertical: "top",
                }}
              />
              <View style={{ flexDirection: "row", gap: ESPACO.md }}>
                <Botao
                  titulo="Cancelar"
                  variante="secundario"
                  style={{ flex: 1 }}
                  aoTocar={() => setEscrevendo(false)}
                />
                <Botao titulo="Salvar" style={{ flex: 1 }} aoTocar={guardarAnotacao} />
              </View>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: "row", gap: ESPACO.md, justifyContent: "center" }}>
                {CORES_DESTAQUE.map((cor) => (
                  <Pressable
                    key={cor.valor}
                    onPress={() => marcar(cor.valor)}
                    accessibilityLabel={`Destacar em ${cor.nome.toLowerCase()}`}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: cor.valor,
                      borderWidth: anotacaoSelecionada?.cor === cor.valor ? 3 : 0,
                      borderColor: cores.texto,
                    }}
                  />
                ))}
              </View>

              <Botao
                titulo={anotacaoSelecionada?.texto ? "Editar anotação" : "Anotar"}
                aoTocar={() => setEscrevendo(true)}
                icone={<Icone nome="notebook-pen" tamanho={18} cor={cores.sobrePrimaria} />}
              />
              <Botao
                titulo="Compartilhar"
                variante="secundario"
                aoTocar={compartilhar}
                icone={<Icone nome="share-2" tamanho={18} cor={cores.texto} />}
              />
              {anotacaoSelecionada ? (
                <Botao
                  titulo="Remover marcação"
                  variante="fantasma"
                  aoTocar={remover}
                  icone={<Icone nome="trash" tamanho={18} cor={cores.erro} />}
                />
              ) : null}
            </>
          )}
      </FolhaInferior>
    </View>
  );
}
