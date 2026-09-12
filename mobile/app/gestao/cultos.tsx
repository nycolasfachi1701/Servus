import { useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { useSessao } from "@/lib/sessao";
import { useConsulta } from "@/lib/consulta";
import { rotuloCulto } from "@/lib/dados";
import {
  carregarCultos,
  criarCultoAvulso,
  definirVaga,
  excluirCulto,
  excluirTipoCulto,
  gerarOcorrencias,
  salvarTipoCulto,
} from "@/lib/gestao";
import { ESPACO, useCores } from "@/lib/tema";
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
  Subtitulo,
} from "@/componentes/ui";
import { Folha, Seletor } from "@/componentes/seletor";
import { Icone } from "@/componentes/icone";
import { DIAS_SEMANA } from "@/lib/tipos";
import { formatarData, formatarHorario, hojeChave } from "@/lib/utils";

export default function Cultos() {
  const cores = useCores();
  const { sessao } = useSessao();

  const [salvando, setSalvando] = useState(false);
  const [painelTipo, setPainelTipo] = useState(false);
  const [painelAvulso, setPainelAvulso] = useState(false);
  const [painelVaga, setPainelVaga] = useState<string | null>(null);

  // novo tipo de culto
  const [nome, setNome] = useState("");
  const [diaSemana, setDiaSemana] = useState("0");
  const [horario, setHorario] = useState("19:00");

  // culto avulso
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState(hojeChave());
  const [horarioAvulso, setHorarioAvulso] = useState("19:00");

  // vaga
  const [funcaoEscolhida, setFuncaoEscolhida] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState("1");

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(carregarCultos, []);

  async function comSalvamento(acao: () => Promise<void>, erroMensagem = "Não foi possível salvar.") {
    setSalvando(true);
    try {
      await acao();
      await recarregar();
    } catch (falha) {
      Alert.alert("Ops", (falha as Error).message || erroMensagem);
    } finally {
      setSalvando(false);
    }
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

      <Mini>
        Cultos recorrentes definem as vagas por função. As ocorrências são os cultos concretos que
        recebem escala.
      </Mini>

      {/* ---------------------------------------- tipos recorrentes */}
      <Subtitulo>Cultos recorrentes</Subtitulo>

      {(dados?.tiposLista ?? []).map((tipo) => {
        const vagas = (dados?.vagas ?? []).filter((v) => v.tipo_culto_id === tipo.id);
        return (
          <Cartao key={tipo.id} style={{ gap: ESPACO.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.sm }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Corpo>{tipo.nome}</Corpo>
                <Mini>
                  {DIAS_SEMANA[tipo.dia_semana]} às {formatarHorario(tipo.horario)}
                </Mini>
              </View>
              {!tipo.ativo ? <Etiqueta texto="Inativo" /> : null}
              {sessao?.ehAdmin ? (
                <Botao
                  titulo=""
                  variante="fantasma"
                  aoTocar={() =>
                    Alert.alert("Excluir", `Excluir o tipo "${tipo.nome}"?`, [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Excluir",
                        style: "destructive",
                        onPress: () => comSalvamento(() => excluirTipoCulto(tipo.id)),
                      },
                    ])
                  }
                  icone={<Icone nome="trash" tamanho={18} cor={cores.erro} />}
                />
              ) : null}
            </View>

            {vagas.length === 0 ? (
              <Mini>Nenhuma vaga definida — a escala deste culto nasceria vazia.</Mini>
            ) : (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO.sm }}>
                {vagas.map((vaga) => {
                  const funcao = dados?.funcoes.get(vaga.funcao_id);
                  return (
                    <View
                      key={vaga.id}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                    >
                      <Etiqueta texto={`${funcao?.nome ?? "Função"} × ${vaga.quantidade}`} />
                      {sessao?.ehAdmin ? (
                        <Botao
                          titulo=""
                          variante="fantasma"
                          aoTocar={() =>
                            comSalvamento(() => definirVaga(tipo.id, vaga.funcao_id, 0))
                          }
                          icone={<Icone nome="x" tamanho={14} cor={cores.textoSuave} />}
                        />
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}

            {sessao?.ehAdmin ? (
              <Botao
                titulo="Adicionar vaga"
                variante="secundario"
                aoTocar={() => {
                  setFuncaoEscolhida(null);
                  setQuantidade("1");
                  setPainelVaga(tipo.id);
                }}
                icone={<Icone nome="plus" tamanho={16} cor={cores.texto} />}
              />
            ) : null}
          </Cartao>
        );
      })}

      {sessao?.ehAdmin ? (
        <Botao
          titulo="Novo tipo de culto"
          aoTocar={() => setPainelTipo(true)}
          icone={<Icone nome="plus" tamanho={18} cor={cores.sobrePrimaria} />}
        />
      ) : null}

      {/* ------------------------------------------- ocorrências */}
      <Subtitulo>Próximas ocorrências</Subtitulo>

      <Botao
        titulo="Gerar próximas 4 semanas"
        variante="secundario"
        carregando={salvando}
        aoTocar={() =>
          comSalvamento(async () => {
            const criados = await gerarOcorrencias(4);
            Alert.alert(
              "Pronto",
              criados > 0 ? `${criados} culto(s) criado(s).` : "Nada a criar: já estavam lá.",
            );
          })
        }
        icone={<Icone nome="calendar-days" tamanho={18} cor={cores.texto} />}
      />

      {(dados?.proximos ?? []).length === 0 ? (
        <Mini>Nenhuma ocorrência futura.</Mini>
      ) : (
        (dados?.proximos ?? []).map((culto) => (
          <Cartao
            key={culto.id}
            style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.sm }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Corpo>{rotuloCulto(culto, dados!.tipos)}</Corpo>
              <Mini>
                {formatarData(culto.data)} às {formatarHorario(culto.horario)}
                {culto.titulo ? " · avulso" : ""}
              </Mini>
            </View>
            {sessao?.ehAdmin ? (
              <Botao
                titulo=""
                variante="fantasma"
                aoTocar={() =>
                  Alert.alert("Excluir culto", "A escala dele será apagada. Continuar?", [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Excluir",
                      style: "destructive",
                      onPress: () => comSalvamento(() => excluirCulto(culto.id)),
                    },
                  ])
                }
                icone={<Icone nome="trash" tamanho={18} cor={cores.erro} />}
              />
            ) : null}
          </Cartao>
        ))
      )}

      <Botao
        titulo="Criar culto avulso"
        variante="secundario"
        aoTocar={() => setPainelAvulso(true)}
        icone={<Icone nome="plus" tamanho={16} cor={cores.texto} />}
      />

      {/* ------------------------------------------------ painéis */}
      <Folha visivel={painelTipo} aoFechar={() => setPainelTipo(false)} titulo="Novo tipo de culto">
        <Campo rotulo="Nome">
          <Entrada value={nome} onChangeText={setNome} placeholder="Ex.: Domingo Manhã" />
        </Campo>
        <Seletor
          rotulo="Dia da semana"
          valor={diaSemana}
          opcoes={DIAS_SEMANA.map((dia, indice) => ({ valor: String(indice), rotulo: dia }))}
          aoEscolher={(valor) => setDiaSemana(valor ?? "0")}
        />
        <Campo rotulo="Horário" dica="No formato 24h, ex.: 09:00">
          <Entrada value={horario} onChangeText={setHorario} placeholder="19:00" />
        </Campo>
        <Botao
          titulo="Criar"
          carregando={salvando}
          aoTocar={() => {
            if (nome.trim().length < 2) return;
            void comSalvamento(async () => {
              await salvarTipoCulto({
                nome: nome.trim(),
                dia_semana: Number(diaSemana),
                horario,
                ativo: true,
              });
              setNome("");
              setPainelTipo(false);
            });
          }}
        />
      </Folha>

      <Folha
        visivel={painelVaga !== null}
        aoFechar={() => setPainelVaga(null)}
        titulo="Adicionar vaga"
      >
        <Seletor
          rotulo="Função"
          valor={funcaoEscolhida}
          opcoes={[...(dados?.funcoes.values() ?? [])].map((f) => ({
            valor: f.id,
            rotulo: f.nome,
            detalhe: f.ministerio?.nome,
          }))}
          aoEscolher={setFuncaoEscolhida}
        />
        <Campo rotulo="Quantidade">
          <Entrada value={quantidade} onChangeText={setQuantidade} keyboardType="number-pad" />
        </Campo>
        <Botao
          titulo="Adicionar"
          carregando={salvando}
          aoTocar={() => {
            if (!painelVaga || !funcaoEscolhida) return;
            void comSalvamento(async () => {
              await definirVaga(painelVaga, funcaoEscolhida, Number(quantidade) || 1);
              setPainelVaga(null);
            });
          }}
        />
      </Folha>

      <Folha visivel={painelAvulso} aoFechar={() => setPainelAvulso(false)} titulo="Culto avulso">
        <Campo rotulo="Nome do culto">
          <Entrada value={titulo} onChangeText={setTitulo} placeholder="Ex.: Ação de Graças" />
        </Campo>
        <Campo rotulo="Data" dica="No formato AAAA-MM-DD.">
          <Entrada value={data} onChangeText={setData} />
        </Campo>
        <Campo rotulo="Horário">
          <Entrada value={horarioAvulso} onChangeText={setHorarioAvulso} />
        </Campo>
        <Botao
          titulo="Criar culto"
          carregando={salvando}
          aoTocar={() => {
            if (titulo.trim().length < 2) return;
            void comSalvamento(async () => {
              await criarCultoAvulso({
                titulo: titulo.trim(),
                data,
                horario: horarioAvulso,
                observacao: null,
              });
              setTitulo("");
              setPainelAvulso(false);
            });
          }}
        />
      </Folha>

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
