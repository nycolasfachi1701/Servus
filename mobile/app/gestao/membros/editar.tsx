import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { carregarCatalogo, type FuncaoComMinisterio } from "@/lib/dados";
import { obterMembro, salvarMembro } from "@/lib/gestao";
import { ESPACO, RAIO, useCores } from "@/lib/tema";
import {
  Aviso,
  Botao,
  Campo,
  Carregando,
  Cartao,
  Corpo,
  Entrada,
  Mini,
} from "@/componentes/ui";
import { Seletor } from "@/componentes/seletor";
import { CampoFoto } from "@/componentes/campo-foto";
import {
  ROTULO_ESTADO_CIVIL,
  ROTULO_STATUS,
  type EstadoCivil,
  type StatusPessoa,
} from "@/lib/tipos";

export default function EditarMembro() {
  const cores = useCores();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [carregando, setCarregando] = useState(true);
  const [salvandoAgora, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [batismo, setBatismo] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [estadoCivil, setEstadoCivil] = useState<EstadoCivil>("nao_informado");
  const [status, setStatus] = useState<StatusPessoa>("ativo");
  const [funcoes, setFuncoes] = useState<string[]>([]);
  const [catalogo, setCatalogo] = useState<FuncaoComMinisterio[]>([]);

  useEffect(() => {
    async function carregar() {
      const { funcoes: mapaFuncoes } = await carregarCatalogo();
      setCatalogo([...mapaFuncoes.values()]);

      if (id) {
        const { pessoa, funcoes: vinculadas } = await obterMembro(id);
        if (pessoa) {
          setNome(pessoa.nome);
          setTelefone(pessoa.telefone ?? "");
          setEmail(pessoa.email ?? "");
          setNascimento(pessoa.nascimento ?? "");
          setBatismo(pessoa.batismo ?? "");
          setEndereco(pessoa.endereco ?? "");
          setObservacoes(pessoa.observacoes ?? "");
          setFotoUrl(pessoa.foto_url);
          setEstadoCivil(pessoa.estado_civil);
          setStatus(pessoa.status);
        }
        setFuncoes(vinculadas);
      }
      setCarregando(false);
    }
    void carregar();
  }, [id]);

  function alternarFuncao(funcaoId: string) {
    setFuncoes((atuais) =>
      atuais.includes(funcaoId) ? atuais.filter((f) => f !== funcaoId) : [...atuais, funcaoId],
    );
  }

  async function salvar() {
    setErro(null);
    if (nome.trim().length < 3) {
      setErro("Informe o nome completo.");
      return;
    }

    setSalvando(true);
    try {
      const pessoaId = await salvarMembro(
        {
          nome: nome.trim(),
          telefone: telefone.trim() || null,
          email: email.trim() || null,
          nascimento: nascimento.trim() || null,
          batismo: batismo.trim() || null,
          endereco: endereco.trim() || null,
          observacoes: observacoes.trim() || null,
          foto_url: fotoUrl,
          estado_civil: estadoCivil,
          status,
        },
        funcoes,
        id,
      );
      router.replace({ pathname: "/gestao/membros/[id]", params: { id: pessoaId } });
    } catch (falha) {
      const mensagem = (falha as { message?: string }).message ?? "";
      setErro(
        mensagem.includes("pessoas_email_idx")
          ? "Já existe um membro com esse e-mail."
          : mensagem.includes("row-level security")
            ? "Você não tem permissão para essa alteração."
            : "Não foi possível salvar. Tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Carregando />;

  // agrupa as funções por ministério, como no site
  const grupos = new Map<string, FuncaoComMinisterio[]>();
  for (const funcao of catalogo) {
    const nomeMinisterio = funcao.ministerio?.nome ?? "Sem ministério";
    grupos.set(nomeMinisterio, [...(grupos.get(nomeMinisterio) ?? []), funcao]);
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}
      keyboardShouldPersistTaps="handled"
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <Cartao style={{ gap: ESPACO.lg }}>
        <CampoFoto
          valor={fotoUrl}
          aoMudar={setFotoUrl}
          nomeParaIniciais={nome || "?"}
        />

        <Campo rotulo="Nome completo">
          <Entrada value={nome} onChangeText={setNome} placeholder="Nome do membro" />
        </Campo>

        <Campo rotulo="Telefone / WhatsApp" dica="Ex.: (11) 99999-0000">
          <Entrada
            value={telefone}
            onChangeText={setTelefone}
            keyboardType="phone-pad"
            placeholder="(00) 00000-0000"
          />
        </Campo>

        <Campo rotulo="E-mail">
          <Entrada
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="pessoa@email.com"
          />
        </Campo>

        <Campo rotulo="Nascimento" dica="No formato AAAA-MM-DD.">
          <Entrada value={nascimento} onChangeText={setNascimento} placeholder="1990-05-20" />
        </Campo>

        <Campo rotulo="Batismo" dica="No formato AAAA-MM-DD.">
          <Entrada value={batismo} onChangeText={setBatismo} placeholder="2010-08-15" />
        </Campo>

        <Seletor
          rotulo="Estado civil"
          valor={estadoCivil}
          opcoes={Object.entries(ROTULO_ESTADO_CIVIL).map(([valor, rotulo]) => ({ valor, rotulo }))}
          aoEscolher={(valor) => setEstadoCivil((valor as EstadoCivil) ?? "nao_informado")}
        />

        <Seletor
          rotulo="Status"
          valor={status}
          opcoes={Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))}
          aoEscolher={(valor) => setStatus((valor as StatusPessoa) ?? "ativo")}
        />

        <Campo rotulo="Endereço">
          <Entrada value={endereco} onChangeText={setEndereco} />
        </Campo>

        <Campo rotulo="Observações" dica="Visível apenas para a liderança.">
          <Entrada
            value={observacoes}
            onChangeText={setObservacoes}
            multiline
            style={{ height: 100, textAlignVertical: "top", paddingTop: 12 }}
          />
        </Campo>
      </Cartao>

      <Cartao style={{ gap: ESPACO.md }}>
        <View style={{ gap: 2 }}>
          <Corpo>Funções nos ministérios</Corpo>
          <Mini>Só quem exerce a função entra no rodízio dela.</Mini>
        </View>

        {catalogo.length === 0 ? (
          <Mini>Nenhuma função cadastrada ainda.</Mini>
        ) : (
          [...grupos.entries()].map(([ministerio, doGrupo]) => (
            <View key={ministerio} style={{ gap: ESPACO.sm }}>
              <Mini>{ministerio}</Mini>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACO.sm }}>
                {doGrupo.map((funcao) => {
                  const marcada = funcoes.includes(funcao.id);
                  return (
                    <Pressable
                      key={funcao.id}
                      onPress={() => alternarFuncao(funcao.id)}
                      style={{
                        paddingVertical: 8,
                        paddingHorizontal: ESPACO.md,
                        borderRadius: RAIO.pill,
                        borderWidth: 1,
                        borderColor: marcada ? cores.primaria : cores.borda,
                        backgroundColor: marcada ? cores.primariaTenue : cores.superficie,
                      }}
                    >
                      <Text
                        style={{
                          color: marcada ? cores.primaria : cores.texto,
                          fontWeight: marcada ? "600" : "400",
                          fontSize: 14,
                        }}
                      >
                        {funcao.nome}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </Cartao>

      <Botao titulo="Salvar membro" aoTocar={salvar} carregando={salvandoAgora} />
      <Botao titulo="Cancelar" variante="fantasma" aoTocar={() => router.back()} />

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
