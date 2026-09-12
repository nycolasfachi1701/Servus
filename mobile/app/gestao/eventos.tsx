import { useState } from "react";
import { Alert, Image, RefreshControl, ScrollView, View } from "react-native";
import { useConsulta } from "@/lib/consulta";
import { carregarCatalogo } from "@/lib/dados";
import { excluirEvento, listarEventos, salvarEvento } from "@/lib/gestao";
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
  Subtitulo,
  Vazio,
} from "@/componentes/ui";
import { Folha, Seletor } from "@/componentes/seletor";
import { CampoFoto } from "@/componentes/campo-foto";
import { Icone } from "@/componentes/icone";
import { formatarData } from "@/lib/utils";

/** `2026-09-20 19:30` digitado pelo usuário → ISO no fuso do aparelho. */
function paraIso(data: string, hora: string): string | null {
  const [ano, mes, dia] = data.split("-").map(Number);
  const [h, m] = hora.split(":").map(Number);
  if (!ano || !mes || !dia || Number.isNaN(h) || Number.isNaN(m)) return null;
  return new Date(ano, mes - 1, dia, h, m).toISOString();
}

export default function Eventos() {
  const cores = useCores();

  const [painel, setPainel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("19:00");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState<string | null>(null);
  const [ministerioId, setMinisterioId] = useState<string | null>(null);

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(async () => {
    const [eventos, catalogo] = await Promise.all([listarEventos(), carregarCatalogo()]);
    return { eventos, catalogo };
  }, []);

  async function criar() {
    const inicio = paraIso(data, hora);
    if (titulo.trim().length < 3 || !inicio) {
      Alert.alert("Confira os dados", "Informe título, data (AAAA-MM-DD) e horário.");
      return;
    }

    setSalvando(true);
    try {
      await salvarEvento({
        titulo: titulo.trim(),
        inicio,
        local: local.trim() || null,
        descricao: descricao.trim() || null,
        imagem_url: imagem,
        ministerio_id: ministerioId,
      });
      setTitulo("");
      setData("");
      setLocal("");
      setDescricao("");
      setImagem(null);
      setMinisterioId(null);
      setPainel(false);
      await recarregar();
    } catch {
      Alert.alert("Ops", "Não foi possível salvar o evento.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Carregando />;

  const agora = new Date().toISOString();
  const proximos = (dados?.eventos ?? []).filter((e) => (e.fim ?? e.inicio) >= agora).reverse();
  const passados = (dados?.eventos ?? []).filter((e) => (e.fim ?? e.inicio) < agora);

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <Botao
        titulo="Novo evento"
        aoTocar={() => setPainel(true)}
        icone={<Icone nome="plus" tamanho={18} cor={cores.sobrePrimaria} />}
      />

      {proximos.length === 0 && passados.length === 0 ? (
        <Vazio
          titulo="Nenhum evento cadastrado"
          descricao="Congressos, ensaios, reuniões, batismos e células."
        />
      ) : null}

      {proximos.length > 0 ? <Subtitulo>Próximos</Subtitulo> : null}
      {proximos.map((evento) => (
        <Cartao key={evento.id} style={{ gap: ESPACO.md }}>
          {evento.imagem_url ? (
            <Image
              source={{ uri: evento.imagem_url }}
              style={{ width: "100%", height: 140, borderRadius: RAIO.md }}
              accessibilityIgnoresInvertColors
            />
          ) : null}
          <View style={{ gap: 3 }}>
            <Corpo>{evento.titulo}</Corpo>
            <Mini>
              {formatarData(evento.inicio.slice(0, 10))}
              {evento.local ? ` · ${evento.local}` : ""}
            </Mini>
          </View>
          {evento.ministerio_id ? (
            <Etiqueta
              tom="primaria"
              texto={dados?.catalogo.ministerios.get(evento.ministerio_id)?.nome ?? "Ministério"}
            />
          ) : null}
          {evento.descricao ? <Corpo suave>{evento.descricao}</Corpo> : null}
          <Botao
            titulo="Excluir"
            variante="fantasma"
            aoTocar={() =>
              Alert.alert("Excluir evento", `Excluir "${evento.titulo}"?`, [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "Excluir",
                  style: "destructive",
                  onPress: async () => {
                    await excluirEvento(evento.id);
                    await recarregar();
                  },
                },
              ])
            }
            icone={<Icone nome="trash" tamanho={16} cor={cores.erro} />}
          />
        </Cartao>
      ))}

      {passados.length > 0 ? <Subtitulo>Já aconteceram</Subtitulo> : null}
      {passados.slice(0, 10).map((evento) => (
        <Cartao key={evento.id} style={{ gap: 3, opacity: 0.75 }}>
          <Corpo>{evento.titulo}</Corpo>
          <Mini>{formatarData(evento.inicio.slice(0, 10))}</Mini>
        </Cartao>
      ))}

      <Folha visivel={painel} aoFechar={() => setPainel(false)} titulo="Novo evento">
        <ScrollView style={{ maxHeight: 460 }} contentContainerStyle={{ gap: ESPACO.lg }}>
          <Campo rotulo="Título">
            <Entrada value={titulo} onChangeText={setTitulo} placeholder="Ex.: Congresso de Jovens" />
          </Campo>
          <Campo rotulo="Data" dica="No formato AAAA-MM-DD.">
            <Entrada value={data} onChangeText={setData} placeholder="2026-10-15" />
          </Campo>
          <Campo rotulo="Horário">
            <Entrada value={hora} onChangeText={setHora} placeholder="19:00" />
          </Campo>
          <Campo rotulo="Local">
            <Entrada value={local} onChangeText={setLocal} placeholder="Templo sede" />
          </Campo>
          <Seletor
            rotulo="Ministério envolvido"
            valor={ministerioId}
            opcoes={[...(dados?.catalogo.ministerios.values() ?? [])].map((m) => ({
              valor: m.id,
              rotulo: m.nome,
            }))}
            vazio="Toda a igreja"
            permiteLimpar
            aoEscolher={setMinisterioId}
          />
          <Campo rotulo="Descrição">
            <Entrada
              value={descricao}
              onChangeText={setDescricao}
              multiline
              style={{ height: 90, textAlignVertical: "top", paddingTop: 12 }}
            />
          </Campo>
          <CampoFoto
            valor={imagem}
            aoMudar={setImagem}
            pasta="eventos"
            rotulo="Imagem do evento"
          />
        </ScrollView>
        <Botao titulo="Criar evento" aoTocar={criar} carregando={salvando} />
      </Folha>

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
