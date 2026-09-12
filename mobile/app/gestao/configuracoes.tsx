import { useEffect, useState } from "react";
import { Alert, RefreshControl, ScrollView, View } from "react-native";
import { useSessao } from "@/lib/sessao";
import { useConsulta } from "@/lib/consulta";
import {
  alterarPapel,
  carregarConfiguracoes,
  criarConvite,
  excluirConvite,
  salvarConfiguracoes,
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
import { CampoFoto } from "@/componentes/campo-foto";
import { Icone } from "@/componentes/icone";
import { ROTULO_PAPEL, type PapelUsuario } from "@/lib/tipos";
import { formatarData } from "@/lib/utils";

export default function Configuracoes() {
  const cores = useCores();
  const { sessao } = useSessao();

  const [nomeIgreja, setNomeIgreja] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [tituloMensagem, setTituloMensagem] = useState("");
  const [despedida, setDespedida] = useState("");
  const [limite, setLimite] = useState("6");
  const [salvando, setSalvando] = useState(false);

  const [emailConvite, setEmailConvite] = useState("");
  const [papelConvite, setPapelConvite] = useState<PapelUsuario>("membro");
  const [pessoaConvite, setPessoaConvite] = useState<string | null>(null);

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(
    carregarConfiguracoes,
    [],
  );

  useEffect(() => {
    if (!dados?.config) return;
    setNomeIgreja(dados.config.nome_igreja);
    setLogoUrl(dados.config.logo_url);
    setTituloMensagem(dados.config.mensagem_titulo);
    setDespedida(dados.config.mensagem_despedida);
    setLimite(String(dados.config.limite_escalas_mes));
  }, [dados?.config]);

  async function salvar() {
    setSalvando(true);
    try {
      await salvarConfiguracoes({
        nome_igreja: nomeIgreja.trim() || "Servus",
        logo_url: logoUrl,
        mensagem_titulo: tituloMensagem.trim() || "Escala de {periodo}",
        mensagem_despedida: despedida.trim(),
        limite_escalas_mes: Math.min(Math.max(Number(limite) || 6, 1), 31),
      });
      await recarregar();
      Alert.alert("Pronto", "Configurações salvas.");
    } catch {
      Alert.alert("Ops", "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function convidar() {
    if (!emailConvite.includes("@")) {
      Alert.alert("E-mail inválido", "Informe o e-mail da pessoa.");
      return;
    }
    try {
      await criarConvite(emailConvite, papelConvite, pessoaConvite);
      setEmailConvite("");
      setPessoaConvite(null);
      await recarregar();
      Alert.alert(
        "Convite criado",
        "Avise a pessoa para se cadastrar no app usando exatamente esse e-mail.",
      );
    } catch {
      Alert.alert("Ops", "Não foi possível criar o convite.");
    }
  }

  if (carregando) return <Carregando />;

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <Cartao style={{ gap: ESPACO.lg }}>
        <Subtitulo>Dados da igreja</Subtitulo>
        <Campo rotulo="Nome da igreja">
          <Entrada value={nomeIgreja} onChangeText={setNomeIgreja} />
        </Campo>
        <CampoFoto
          valor={logoUrl}
          aoMudar={setLogoUrl}
          pasta="igreja"
          rotulo="Logo"
          nomeParaIniciais={nomeIgreja || "?"}
        />
      </Cartao>

      <Cartao style={{ gap: ESPACO.lg }}>
        <View style={{ gap: 2 }}>
          <Subtitulo>Mensagem da escala</Subtitulo>
          <Mini>Usada no botão “Enviar pro WhatsApp”. Use {"{periodo}"} no título.</Mini>
        </View>
        <Campo rotulo="Título">
          <Entrada value={tituloMensagem} onChangeText={setTituloMensagem} />
        </Campo>
        <Campo rotulo="Despedida">
          <Entrada
            value={despedida}
            onChangeText={setDespedida}
            multiline
            style={{ height: 80, textAlignVertical: "top", paddingTop: 12 }}
          />
        </Campo>
        <Campo rotulo="Limite de escalas por pessoa" dica="Sugestão ao gerar uma escala.">
          <Entrada value={limite} onChangeText={setLimite} keyboardType="number-pad" />
        </Campo>
        <Botao titulo="Salvar configurações" aoTocar={salvar} carregando={salvando} />
      </Cartao>

      {/* -------------------------------------------------- usuários */}
      <Cartao style={{ gap: ESPACO.md }}>
        <Subtitulo>Usuários e papéis</Subtitulo>
        {(dados?.usuarios ?? []).map((usuario) => {
          const pessoa = dados?.pessoas.find((p) => p.id === usuario.pessoa_id);
          const ehVoce = usuario.id === sessao?.usuarioId;
          return (
            <View key={usuario.id} style={{ gap: ESPACO.sm }}>
              <View style={{ gap: 2 }}>
                <Corpo>
                  {pessoa?.nome ?? "Acesso sem membro vinculado"}
                  {ehVoce ? " (você)" : ""}
                </Corpo>
                <Mini>Desde {formatarData(usuario.criado_em.slice(0, 10))}</Mini>
              </View>
              {ehVoce ? (
                <Etiqueta texto={ROTULO_PAPEL[usuario.papel]} tom="primaria" />
              ) : (
                <Seletor
                  valor={usuario.papel}
                  opcoes={(Object.keys(ROTULO_PAPEL) as PapelUsuario[]).map((papel) => ({
                    valor: papel,
                    rotulo: ROTULO_PAPEL[papel],
                  }))}
                  titulo={`Papel de ${pessoa?.nome ?? "usuário"}`}
                  aoEscolher={async (papel) => {
                    if (!papel) return;
                    try {
                      await alterarPapel(usuario.id, papel as PapelUsuario);
                      await recarregar();
                    } catch {
                      Alert.alert("Ops", "Não foi possível alterar o papel.");
                    }
                  }}
                />
              )}
            </View>
          );
        })}
      </Cartao>

      {/* -------------------------------------------------- convites */}
      <Cartao style={{ gap: ESPACO.md }}>
        <View style={{ gap: 2 }}>
          <Subtitulo>Convites de acesso</Subtitulo>
          <Mini>
            Autorize um e-mail: ao se cadastrar, a pessoa já entra com o papel certo. O Servus não
            envia o convite — avise a pessoa.
          </Mini>
        </View>

        {(dados?.convites ?? []).map((convite) => (
          <View
            key={convite.id}
            style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.sm }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Corpo>{convite.email}</Corpo>
              <Mini>{ROTULO_PAPEL[convite.papel]}</Mini>
            </View>
            <Botao
              titulo=""
              variante="fantasma"
              aoTocar={async () => {
                await excluirConvite(convite.id);
                await recarregar();
              }}
              icone={<Icone nome="trash" tamanho={18} cor={cores.erro} />}
            />
          </View>
        ))}

        <Campo rotulo="E-mail">
          <Entrada
            value={emailConvite}
            onChangeText={setEmailConvite}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="pessoa@email.com"
          />
        </Campo>
        <Seletor
          rotulo="Papel"
          valor={papelConvite}
          opcoes={(Object.keys(ROTULO_PAPEL) as PapelUsuario[]).map((papel) => ({
            valor: papel,
            rotulo: ROTULO_PAPEL[papel],
          }))}
          aoEscolher={(valor) => setPapelConvite((valor as PapelUsuario) ?? "membro")}
        />
        <Seletor
          rotulo="Membro vinculado"
          valor={pessoaConvite}
          opcoes={(dados?.pessoas ?? []).map((p) => ({ valor: p.id, rotulo: p.nome }))}
          vazio="Vincular depois"
          permiteLimpar
          aoEscolher={setPessoaConvite}
        />
        <Botao
          titulo="Convidar"
          aoTocar={convidar}
          icone={<Icone nome="plus" tamanho={18} cor={cores.sobrePrimaria} />}
        />
      </Cartao>

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
