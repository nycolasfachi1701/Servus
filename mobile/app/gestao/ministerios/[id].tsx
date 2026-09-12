import { useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSessao } from "@/lib/sessao";
import { useConsulta } from "@/lib/consulta";
import { supabase } from "@/lib/supabase";
import {
  carregarMinisterios,
  criarFuncao,
  definirLider,
  definirPessoaNaFuncao,
  excluirFuncao,
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
import { Seletor } from "@/componentes/seletor";
import { Icone } from "@/componentes/icone";

export default function DetalheMinisterio() {
  const cores = useCores();
  const { sessao } = useSessao();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [novaFuncao, setNovaFuncao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(async () => {
    const base = await carregarMinisterios();
    const { data: pessoas } = await supabase
      .from("pessoas_publicas")
      .select("id, nome, foto_url, status")
      .order("nome");
    return { ...base, todasPessoas: pessoas ?? [] };
  }, [id]);

  async function comSalvamento(acao: () => Promise<void>) {
    setSalvando(true);
    try {
      await acao();
      await recarregar();
    } catch {
      Alert.alert("Ops", "Não foi possível salvar. Confira suas permissões.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Carregando />;
  if (!dados) return <Aviso texto="Não foi possível carregar." tom="erro" />;

  const ministerio = dados.ministerios.find((m) => m.id === id);
  if (!ministerio) return <Aviso texto="Ministério não encontrado." tom="erro" />;

  const podeEditar = sessao?.ehAdmin || sessao?.ministeriosLiderados.includes(id);
  const funcoes = dados.funcoes.filter((f) => f.ministerio_id === id);
  const lideres = dados.lideres.filter((l) => l.ministerio_id === id);
  const nomePessoa = (pessoaId: string) =>
    dados.todasPessoas.find((p) => p.id === pessoaId)?.nome ?? "Pessoa";

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <View style={{ gap: 4 }}>
        <Subtitulo>{ministerio.nome}</Subtitulo>
        {ministerio.descricao ? <Mini>{ministerio.descricao}</Mini> : null}
      </View>

      {!podeEditar ? (
        <Aviso
          tom="alerta"
          texto="Você pode consultar, mas só a liderança deste ministério (ou um administrador) altera."
        />
      ) : null}

      {/* --------------------------------------- funções e equipe */}
      {funcoes.map((funcao) => {
        const equipe = dados.vinculos
          .filter((v) => v.funcao_id === funcao.id)
          .map((v) => v.pessoa_id);
        const disponiveis = dados.todasPessoas.filter((p) => !equipe.includes(p.id));

        return (
          <Cartao key={funcao.id} style={{ gap: ESPACO.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.sm }}>
              <Corpo>{funcao.nome}</Corpo>
              <View style={{ flex: 1 }} />
              {podeEditar ? (
                <Botao
                  titulo=""
                  variante="fantasma"
                  aoTocar={() =>
                    Alert.alert("Excluir função", `Excluir ${funcao.nome}?`, [
                      { text: "Cancelar", style: "cancel" },
                      {
                        text: "Excluir",
                        style: "destructive",
                        onPress: () => comSalvamento(() => excluirFuncao(funcao.id)),
                      },
                    ])
                  }
                  icone={<Icone nome="trash" tamanho={18} cor={cores.erro} />}
                />
              ) : null}
            </View>

            {equipe.length === 0 ? (
              <Mini>Ninguém nesta função.</Mini>
            ) : (
              <View style={{ gap: ESPACO.sm }}>
                {equipe.map((pessoaId) => (
                  <View
                    key={pessoaId}
                    style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.sm }}
                  >
                    <Etiqueta texto={nomePessoa(pessoaId)} tom="primaria" />
                    <View style={{ flex: 1 }} />
                    {podeEditar ? (
                      <Botao
                        titulo=""
                        variante="fantasma"
                        aoTocar={() =>
                          comSalvamento(() => definirPessoaNaFuncao(funcao.id, pessoaId, false))
                        }
                        icone={<Icone nome="x" tamanho={16} cor={cores.textoSuave} />}
                      />
                    ) : null}
                  </View>
                ))}
              </View>
            )}

            {podeEditar && disponiveis.length > 0 ? (
              <Seletor
                valor={null}
                opcoes={disponiveis.map((p) => ({ valor: p.id, rotulo: p.nome }))}
                vazio="Adicionar pessoa…"
                titulo={`Quem exerce ${funcao.nome}`}
                aoEscolher={(pessoaId) =>
                  pessoaId
                    ? comSalvamento(() => definirPessoaNaFuncao(funcao.id, pessoaId, true))
                    : undefined
                }
              />
            ) : null}
          </Cartao>
        );
      })}

      {podeEditar ? (
        <Cartao style={{ gap: ESPACO.md }}>
          <Campo rotulo="Nova função">
            <Entrada
              value={novaFuncao}
              onChangeText={setNovaFuncao}
              placeholder="Ex.: Violão"
            />
          </Campo>
          <Botao
            titulo="Criar função"
            carregando={salvando}
            aoTocar={() => {
              if (novaFuncao.trim().length < 2) return;
              void comSalvamento(async () => {
                await criarFuncao(id, novaFuncao.trim());
                setNovaFuncao("");
              });
            }}
            icone={<Icone nome="plus" tamanho={18} cor={cores.sobrePrimaria} />}
          />
        </Cartao>
      ) : null}

      {/* ------------------------------------------------ liderança */}
      <Cartao style={{ gap: ESPACO.md }}>
        <View style={{ gap: 2 }}>
          <Corpo>Liderança</Corpo>
          <Mini>Líderes gerenciam as escalas e a equipe deste ministério.</Mini>
        </View>

        {lideres.length === 0 ? (
          <Mini>Nenhum líder definido.</Mini>
        ) : (
          lideres.map((lider) => (
            <View
              key={lider.pessoa_id}
              style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.sm }}
            >
              <Etiqueta texto={nomePessoa(lider.pessoa_id)} tom="primaria" />
              <View style={{ flex: 1 }} />
              {sessao?.ehAdmin ? (
                <Botao
                  titulo=""
                  variante="fantasma"
                  aoTocar={() => comSalvamento(() => definirLider(id, lider.pessoa_id, false))}
                  icone={<Icone nome="x" tamanho={16} cor={cores.textoSuave} />}
                />
              ) : null}
            </View>
          ))
        )}

        {sessao?.ehAdmin ? (
          <Seletor
            valor={null}
            opcoes={dados.todasPessoas
              .filter((p) => !lideres.some((l) => l.pessoa_id === p.id))
              .map((p) => ({ valor: p.id, rotulo: p.nome }))}
            vazio="Definir líder…"
            titulo="Definir líder"
            aoEscolher={(pessoaId) =>
              pessoaId ? comSalvamento(() => definirLider(id, pessoaId, true)) : undefined
            }
          />
        ) : null}
      </Cartao>

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
