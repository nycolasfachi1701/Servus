import { useState } from "react";
import { Alert, Linking, RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useConsulta } from "@/lib/consulta";
import { rotuloCulto } from "@/lib/dados";
import {
  adicionarVaga,
  alternarFinalizado,
  carregarEscalaDoCulto,
  removerVaga,
  trocarPessoaNaVaga,
} from "@/lib/gestao";
import { supabase } from "@/lib/supabase";
import { montarMensagem } from "@/lib/escala/mensagem";
import { ESPACO, useCores } from "@/lib/tema";
import {
  Aviso,
  Botao,
  Carregando,
  Cartao,
  Corpo,
  Etiqueta,
  Mini,
  Subtitulo,
} from "@/componentes/ui";
import { Seletor, type Opcao } from "@/componentes/seletor";
import { Icone } from "@/componentes/icone";
import { formatarData, formatarDataExtenso, formatarHorario, linkWhatsAppTexto } from "@/lib/utils";

export default function EscalaDoCulto() {
  const cores = useCores();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [salvando, setSalvando] = useState(false);

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(
    () => carregarEscalaDoCulto(id),
    [id],
  );

  async function comSalvamento(acao: () => Promise<void>, mensagemErro: string) {
    setSalvando(true);
    try {
      await acao();
      await recarregar();
    } catch {
      Alert.alert("Ops", mensagemErro);
    } finally {
      setSalvando(false);
    }
  }

  async function enviar() {
    if (!dados?.culto) return;
    const { data: config } = await supabase
      .from("configuracoes")
      .select("mensagem_titulo, mensagem_despedida")
      .eq("id", 1)
      .maybeSingle();

    const porFuncao = new Map<string, string[]>();
    for (const item of dados.itens) {
      const nome = dados.funcoes.get(item.funcao_id)?.nome ?? "Função";
      porFuncao.set(nome, [
        ...(porFuncao.get(nome) ?? []),
        item.pessoa_id ? (dados.pessoas.get(item.pessoa_id)?.nome ?? "") : "",
      ]);
    }

    const texto = montarMensagem({
      titulo: config?.mensagem_titulo ?? "Escala de {periodo}",
      despedida: config?.mensagem_despedida ?? "",
      periodo: formatarData(dados.culto.data),
      cultos: [
        {
          rotulo: rotuloCulto(dados.culto, dados.tipos),
          data: dados.culto.data,
          horario: dados.culto.horario,
          linhas: [...porFuncao.entries()].map(([funcao, pessoas]) => ({ funcao, pessoas })),
        },
      ],
    });

    await Linking.openURL(linkWhatsAppTexto(texto));
  }

  if (carregando) return <Carregando />;
  if (!dados?.culto) return <Aviso texto="Culto não encontrado." tom="erro" />;

  const { culto } = dados;
  const funcoesDoCulto = [...new Set(dados.itens.map((i) => i.funcao_id))];
  const emAberto = dados.itens.filter((i) => !i.pessoa_id).length;
  const comPessoa = dados.itens.filter((i) => i.pessoa_id).length;
  const confirmados = dados.itens.filter((i) => i.confirmado).length;

  const ocupadosNoCulto = new Set(
    dados.itens.map((i) => i.pessoa_id).filter((p): p is string => Boolean(p)),
  );

  const opcoesDeFuncao: Opcao[] = [...dados.funcoes.values()].map((f) => ({
    valor: f.id,
    rotulo: f.nome,
    detalhe: f.ministerio?.nome,
  }));

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <View style={{ gap: 4 }}>
        <Subtitulo>{rotuloCulto(culto, dados.tipos)}</Subtitulo>
        <Mini>
          {formatarDataExtenso(culto.data)} · {formatarHorario(culto.horario)}
        </Mini>
      </View>

      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO.sm }}>
        <Etiqueta
          texto={emAberto > 0 ? `${emAberto} vaga(s) em aberto` : "Escala completa"}
          tom={emAberto > 0 ? "alerta" : "sucesso"}
        />
        <Etiqueta texto={`${confirmados}/${comPessoa} confirmados`} />
        {culto.finalizado_em ? <Etiqueta texto="Finalizado" tom="sucesso" /> : null}
      </View>

      <Aviso
        tom={culto.finalizado_em ? "sucesso" : "info"}
        texto={
          culto.finalizado_em
            ? "Culto finalizado — esta escala já conta no rodízio."
            : "Enquanto não for marcado como finalizado, este culto não conta no rodízio."
        }
      />

      {/* -------------------------------------------------- as vagas */}
      {funcoesDoCulto.length === 0 ? (
        <Aviso texto="Nenhuma vaga neste culto ainda. Gere a escala ou adicione vagas abaixo." />
      ) : (
        funcoesDoCulto.map((funcaoId) => {
          const funcao = dados.funcoes.get(funcaoId);
          const doGrupo = dados.itens.filter((i) => i.funcao_id === funcaoId);
          const candidatos = dados.candidatosPorFuncao.get(funcaoId) ?? [];

          return (
            <Cartao key={funcaoId} style={{ gap: ESPACO.md }}>
              <View style={{ gap: 2 }}>
                <Corpo>{funcao?.nome ?? "Função"}</Corpo>
                <Mini>{funcao?.ministerio?.nome}</Mini>
              </View>

              {doGrupo.map((item) => {
                const opcoes: Opcao[] = candidatos
                  .map((pessoaId) => {
                    const pessoa = dados.pessoas.get(pessoaId);
                    const indisponivel = dados.indisponiveis.has(pessoaId);
                    const jaEscalado = ocupadosNoCulto.has(pessoaId) && pessoaId !== item.pessoa_id;
                    return {
                      valor: pessoaId,
                      rotulo: pessoa?.nome ?? "Pessoa",
                      detalhe: indisponivel
                        ? "avisou que não pode"
                        : jaEscalado
                          ? "já está em outra vaga deste culto"
                          : undefined,
                    };
                  })
                  .sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"));

                return (
                  <View key={item.id} style={{ gap: ESPACO.sm }}>
                    <Seletor
                      valor={item.pessoa_id}
                      opcoes={opcoes}
                      permiteLimpar
                      vazio="— deixar em aberto —"
                      titulo={`Quem serve em ${funcao?.nome ?? "função"}`}
                      aoEscolher={(pessoaId) =>
                        comSalvamento(
                          () => trocarPessoaNaVaga(item.id, pessoaId),
                          "Não foi possível trocar agora.",
                        )
                      }
                    />
                    <View
                      style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.sm }}
                    >
                      {item.pessoa_id ? (
                        <Etiqueta
                          texto={item.confirmado ? "Confirmado" : "A confirmar"}
                          tom={item.confirmado ? "sucesso" : "alerta"}
                        />
                      ) : (
                        <Etiqueta texto="Em aberto" tom="alerta" />
                      )}
                      <View style={{ flex: 1 }} />
                      <Botao
                        titulo="Remover vaga"
                        variante="fantasma"
                        aoTocar={() =>
                          comSalvamento(() => removerVaga(item.id), "Não foi possível remover.")
                        }
                        icone={<Icone nome="trash" tamanho={16} cor={cores.erro} />}
                      />
                    </View>
                  </View>
                );
              })}

              <Botao
                titulo={`Mais uma vaga de ${funcao?.nome ?? "função"}`}
                variante="secundario"
                aoTocar={() =>
                  comSalvamento(
                    () => adicionarVaga(culto.id, funcaoId),
                    "Não foi possível adicionar.",
                  )
                }
                icone={<Icone nome="plus" tamanho={16} cor={cores.texto} />}
              />
            </Cartao>
          );
        })
      )}

      {/* ------------------------------------------ adicionar função */}
      <Cartao style={{ gap: ESPACO.md }}>
        <Corpo>Adicionar vaga de outra função</Corpo>
        <Seletor
          valor={null}
          opcoes={opcoesDeFuncao}
          vazio="Escolher função…"
          titulo="Adicionar vaga"
          aoEscolher={(funcaoId) =>
            funcaoId
              ? comSalvamento(
                  () => adicionarVaga(culto.id, funcaoId),
                  "Não foi possível adicionar.",
                )
              : undefined
          }
        />
      </Cartao>

      {/* ------------------------------------------------ avisos */}
      {dados.avisos.length > 0 ? (
        <Cartao style={{ gap: ESPACO.sm }}>
          <Corpo>Quem avisou que não pode</Corpo>
          {dados.avisos.map((aviso) => (
            <Mini key={aviso.pessoa_id}>
              {dados.pessoas.get(aviso.pessoa_id)?.nome ?? "Pessoa"}
              {aviso.observacao ? ` · ${aviso.observacao}` : ""}
            </Mini>
          ))}
        </Cartao>
      ) : null}

      {/* ------------------------------------------------- ações */}
      <Botao
        titulo="Enviar pro WhatsApp"
        variante="sucesso"
        aoTocar={enviar}
        icone={<Icone nome="send" tamanho={18} cor="#fff" />}
      />

      <Botao
        titulo={culto.finalizado_em ? "Desfazer finalização" : "Marcar como finalizado"}
        variante={culto.finalizado_em ? "secundario" : "primario"}
        carregando={salvando}
        aoTocar={() =>
          comSalvamento(
            () => alternarFinalizado(culto.id, !culto.finalizado_em),
            "Não foi possível salvar.",
          )
        }
        icone={
          <Icone
            nome={culto.finalizado_em ? "arrow-left" : "check"}
            tamanho={18}
            cor={culto.finalizado_em ? cores.texto : cores.sobrePrimaria}
          />
        }
      />

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
