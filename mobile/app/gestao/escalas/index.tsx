import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSessao } from "@/lib/sessao";
import { useConsulta } from "@/lib/consulta";
import { rotuloCulto } from "@/lib/dados";
import {
  carregarEscalas,
  funcoesQuePodeEscalar,
  gerarEscalaDoPeriodo,
} from "@/lib/gestao";
import { supabase } from "@/lib/supabase";
import { montarMensagem, rotuloPeriodo } from "@/lib/escala/mensagem";
import { ESPACO, RAIO, useCores } from "@/lib/tema";
import {
  Aviso,
  Botao,
  Campo,
  Carregando,
  Cartao,
  Corpo,
  Entrada,
  Etiqueta,
  Mini,
  Vazio,
} from "@/componentes/ui";
import { Folha } from "@/componentes/seletor";
import { Icone } from "@/componentes/icone";
import {
  formatarDataExtenso,
  formatarHorario,
  hojeChave,
  linkWhatsAppTexto,
  somarDias,
} from "@/lib/utils";
import { Linking } from "react-native";

export default function Escalas() {
  const cores = useCores();
  const router = useRouter();
  const { sessao } = useSessao();

  const [historico, setHistorico] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [painelGerar, setPainelGerar] = useState(false);
  const [de, setDe] = useState(hojeChave());
  const [ate, setAte] = useState(somarDias(hojeChave(), 28));
  const [limite, setLimite] = useState("6");
  const [refazer, setRefazer] = useState(false);

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(
    () => carregarEscalas(historico),
    [historico],
  );

  async function gerar() {
    if (!sessao) return;
    setGerando(true);
    try {
      const { data: config } = await supabase
        .from("configuracoes")
        .select("peso_rodizio, peso_preferencia, peso_dupla")
        .eq("id", 1)
        .maybeSingle();

      const resultado = await gerarEscalaDoPeriodo({
        de,
        ate,
        substituir: refazer,
        limite: Math.max(1, Number(limite) || 6),
        funcoesPermitidas: await funcoesQuePodeEscalar(
          sessao.ehAdmin,
          sessao.ministeriosLiderados,
        ),
        pesos: {
          rodizio: config?.peso_rodizio ?? 10,
          preferencia: config?.peso_preferencia ?? 3,
          dupla: config?.peso_dupla ?? 2,
        },
      });

      setPainelGerar(false);
      await recarregar();
      Alert.alert(
        "Escala gerada",
        `${resultado.cultos} culto(s) montado(s).` +
          (resultado.emAberto > 0
            ? `\n\n${resultado.emAberto} vaga(s) ficaram em aberto — ajuste manualmente onde precisar.`
            : "\n\nTodas as vagas foram preenchidas."),
      );
    } catch (falha) {
      Alert.alert("Não deu para gerar", (falha as Error).message ?? "Tente novamente.");
    } finally {
      setGerando(false);
    }
  }

  async function enviarNoWhatsApp() {
    if (!dados) return;
    const comEscala = dados.cultos
      .filter((c) => dados.itens.some((i) => i.culto_id === c.id))
      .slice(0, 6);

    if (comEscala.length === 0) {
      Alert.alert("Sem escala", "Gere a escala antes de enviar.");
      return;
    }

    const { data: config } = await supabase
      .from("configuracoes")
      .select("mensagem_titulo, mensagem_despedida")
      .eq("id", 1)
      .maybeSingle();

    const texto = montarMensagem({
      titulo: config?.mensagem_titulo ?? "Escala de {periodo}",
      despedida: config?.mensagem_despedida ?? "",
      periodo: rotuloPeriodo(comEscala.map((c) => c.data)),
      cultos: comEscala.map((culto) => {
        const porFuncao = new Map<string, string[]>();
        for (const item of dados.itens.filter((i) => i.culto_id === culto.id)) {
          const nome = dados.funcoes.get(item.funcao_id)?.nome ?? "Função";
          porFuncao.set(nome, [
            ...(porFuncao.get(nome) ?? []),
            item.pessoa_id ? (dados.pessoas.get(item.pessoa_id)?.nome ?? "") : "",
          ]);
        }
        return {
          rotulo: rotuloCulto(culto, dados.tipos),
          data: culto.data,
          horario: culto.horario,
          linhas: [...porFuncao.entries()].map(([funcao, pessoas]) => ({ funcao, pessoas })),
        };
      }),
    });

    await Linking.openURL(linkWhatsAppTexto(texto));
  }

  if (carregando) return <Carregando />;

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <View style={{ flexDirection: "row", gap: ESPACO.md }}>
        <Botao
          titulo="Gerar escala"
          style={{ flex: 1 }}
          aoTocar={() => setPainelGerar(true)}
          icone={<Icone nome="highlighter" tamanho={18} cor={cores.sobrePrimaria} />}
        />
        <Botao
          titulo="WhatsApp"
          variante="sucesso"
          style={{ flex: 1 }}
          aoTocar={enviarNoWhatsApp}
          icone={<Icone nome="send" tamanho={18} cor="#fff" />}
        />
      </View>

      <View style={{ flexDirection: "row", gap: ESPACO.sm }}>
        {[false, true].map((valor) => {
          const ativo = historico === valor;
          return (
            <Pressable
              key={String(valor)}
              onPress={() => setHistorico(valor)}
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
                style={{ color: ativo ? cores.primaria : cores.textoSuave, fontWeight: "600" }}
              >
                {valor ? "Histórico" : "Próximos"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!dados || dados.cultos.length === 0 ? (
        <Vazio
          titulo={historico ? "Nenhum culto finalizado" : "Nenhum culto programado"}
          descricao={
            historico
              ? "Ao marcar um culto como finalizado, ele entra no histórico e passa a contar no rodízio."
              : "Cadastre os cultos em Mais › Cultos e gere as ocorrências."
          }
        />
      ) : (
        dados.cultos.map((culto) => {
          const doCulto = dados.itens.filter((i) => i.culto_id === culto.id);
          const abertas = doCulto.filter((i) => !i.pessoa_id).length;
          const confirmados = doCulto.filter((i) => i.confirmado).length;
          const comPessoa = doCulto.filter((i) => i.pessoa_id).length;

          return (
            <Cartao
              key={culto.id}
              style={{ gap: ESPACO.md }}
              aoTocar={() =>
                router.push({ pathname: "/gestao/escalas/[id]", params: { id: culto.id } })
              }
            >
              <View style={{ gap: 3 }}>
                <Corpo>{rotuloCulto(culto, dados.tipos)}</Corpo>
                <Mini>
                  {formatarDataExtenso(culto.data)} · {formatarHorario(culto.horario)}
                </Mini>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO.sm }}>
                {culto.finalizado_em ? (
                  <Etiqueta texto="Finalizado" tom="sucesso" />
                ) : null}
                {doCulto.length === 0 ? (
                  <Etiqueta texto="Sem escala" />
                ) : (
                  <>
                    <Etiqueta
                      texto={abertas > 0 ? `${abertas} em aberto` : "Escala completa"}
                      tom={abertas > 0 ? "alerta" : "sucesso"}
                    />
                    <Etiqueta texto={`${confirmados}/${comPessoa} confirmados`} />
                  </>
                )}
              </View>
            </Cartao>
          );
        })
      )}

      {/* ----------------------------------------- painel de geração */}
      <Folha visivel={painelGerar} aoFechar={() => setPainelGerar(false)} titulo="Gerar escala">
        <Mini>
          O rodízio prioriza quem serviu menos, respeita a disponibilidade e sinaliza as vagas
          que ficarem em aberto.
        </Mini>

        <View style={{ flexDirection: "row", gap: ESPACO.md }}>
          <View style={{ flex: 1 }}>
            <Campo rotulo="De">
              <Entrada value={de} onChangeText={setDe} placeholder="AAAA-MM-DD" />
            </Campo>
          </View>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Até">
              <Entrada value={ate} onChangeText={setAte} placeholder="AAAA-MM-DD" />
            </Campo>
          </View>
        </View>

        <Campo rotulo="Limite por pessoa" dica="Máximo de escalas de cada um no período.">
          <Entrada value={limite} onChangeText={setLimite} keyboardType="number-pad" />
        </Campo>

        <Pressable
          onPress={() => setRefazer((v) => !v)}
          style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.md }}
        >
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 6,
              borderWidth: 2,
              borderColor: refazer ? cores.primaria : cores.borda,
              backgroundColor: refazer ? cores.primaria : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {refazer ? <Icone nome="check" tamanho={16} cor={cores.sobrePrimaria} /> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Corpo>Refazer escalas já montadas</Corpo>
            <Mini>Quem já confirmou presença é mantido.</Mini>
          </View>
        </Pressable>

        <Botao titulo="Gerar" aoTocar={gerar} carregando={gerando} />
      </Folha>
    </ScrollView>
  );
}
