import { Alert, Linking, RefreshControl, ScrollView, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSessao } from "@/lib/sessao";
import { useConsulta } from "@/lib/consulta";
import { carregarCatalogo } from "@/lib/dados";
import { excluirMembro, obterMembro } from "@/lib/gestao";
import { ESPACO, useCores } from "@/lib/tema";
import {
  Avatar,
  Aviso,
  Botao,
  Carregando,
  Cartao,
  Corpo,
  Etiqueta,
  Mini,
  Separador,
  Subtitulo,
} from "@/componentes/ui";
import { Icone } from "@/componentes/icone";
import { ROTULO_ESTADO_CIVIL, ROTULO_STATUS } from "@/lib/tipos";
import { formatarData, formatarTelefone, linkWhatsAppPessoa } from "@/lib/utils";

export default function FichaDoMembro() {
  const cores = useCores();
  const router = useRouter();
  const { sessao } = useSessao();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(async () => {
    const [membro, catalogo] = await Promise.all([obterMembro(id), carregarCatalogo()]);
    return { ...membro, catalogo };
  }, [id]);

  function confirmarExclusao() {
    if (!dados?.pessoa) return;
    Alert.alert("Excluir membro", `Excluir ${dados.pessoa.nome}? Não dá para desfazer.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await excluirMembro(id);
            router.back();
          } catch {
            Alert.alert("Ops", "Não foi possível excluir.");
          }
        },
      },
    ]);
  }

  if (carregando) return <Carregando />;
  if (!dados?.pessoa) return <Aviso texto="Membro não encontrado." tom="erro" />;

  const membro = dados.pessoa;

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <Cartao style={{ alignItems: "center", gap: ESPACO.md }}>
        <Avatar nome={membro.nome} fotoUrl={membro.foto_url} tamanho={80} />
        <View style={{ alignItems: "center", gap: 4 }}>
          <Subtitulo>{membro.nome}</Subtitulo>
          <Mini>
            {ROTULO_ESTADO_CIVIL[membro.estado_civil]} · {ROTULO_STATUS[membro.status]}
          </Mini>
        </View>

        {membro.telefone ? (
          <Botao
            titulo="Chamar no WhatsApp"
            variante="sucesso"
            style={{ alignSelf: "stretch" }}
            aoTocar={() => Linking.openURL(linkWhatsAppPessoa(membro.telefone!))}
            icone={<Icone nome="send" tamanho={18} cor="#fff" />}
          />
        ) : null}
      </Cartao>

      <Cartao style={{ gap: ESPACO.md }}>
        <Corpo>Contato e dados</Corpo>
        <Separador />
        {[
          ["Telefone", membro.telefone ? formatarTelefone(membro.telefone) : "—"],
          ["E-mail", membro.email ?? "—"],
          ["Nascimento", membro.nascimento ? formatarData(membro.nascimento) : "—"],
          ["Batismo", membro.batismo ? formatarData(membro.batismo) : "—"],
          ["Endereço", membro.endereco ?? "—"],
        ].map(([rotulo, valor]) => (
          <View key={rotulo} style={{ gap: 2 }}>
            <Mini>{rotulo}</Mini>
            <Corpo>{valor}</Corpo>
          </View>
        ))}
      </Cartao>

      <Cartao style={{ gap: ESPACO.md }}>
        <Corpo>Funções</Corpo>
        {dados.funcoes.length === 0 ? (
          <Mini>Nenhuma função vinculada.</Mini>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO.sm }}>
            {dados.funcoes.map((funcaoId) => {
              const funcao = dados.catalogo.funcoes.get(funcaoId);
              return (
                <Etiqueta
                  key={funcaoId}
                  tom="primaria"
                  texto={`${funcao?.ministerio?.nome ? `${funcao.ministerio.nome} · ` : ""}${funcao?.nome ?? "Função"}`}
                />
              );
            })}
          </View>
        )}
      </Cartao>

      {membro.observacoes ? (
        <Cartao style={{ gap: ESPACO.sm }}>
          <Corpo>Observações</Corpo>
          <Mini>Visível apenas para a liderança.</Mini>
          <Corpo suave>{membro.observacoes}</Corpo>
        </Cartao>
      ) : null}

      {sessao?.ehAdmin ? (
        <>
          <Botao
            titulo="Editar cadastro"
            aoTocar={() =>
              router.push({ pathname: "/gestao/membros/editar", params: { id: membro.id } })
            }
            icone={<Icone nome="pencil" tamanho={18} cor={cores.sobrePrimaria} />}
          />
          <Botao
            titulo="Excluir membro"
            variante="fantasma"
            aoTocar={confirmarExclusao}
            icone={<Icone nome="trash" tamanho={18} cor={cores.erro} />}
          />
        </>
      ) : null}

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
