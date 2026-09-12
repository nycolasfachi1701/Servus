import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSessao } from "@/lib/sessao";
import { useConsulta } from "@/lib/consulta";
import { carregarPainel, rotuloCulto } from "@/lib/dados";
import { ESPACO, useCores } from "@/lib/tema";
import {
  Aviso,
  Carregando,
  Cartao,
  Corpo,
  Etiqueta,
  Mini,
  Subtitulo,
  Titulo,
  Vazio,
} from "@/componentes/ui";
import { Icone } from "@/componentes/icone";
import {
  formatarData,
  formatarDataExtenso,
  formatarHorario,
  primeiroNome,
  saudacao,
} from "@/lib/utils";

export default function Painel() {
  const cores = useCores();
  const router = useRouter();
  const { sessao } = useSessao();

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(
    () => carregarPainel(sessao?.pessoaId ?? null, sessao?.ehLideranca ?? false),
    [sessao?.pessoaId, sessao?.ehLideranca],
  );

  if (carregando) return <Carregando texto="Carregando o painel…" />;

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.lg }}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <View style={{ gap: 2 }}>
        <Mini>{saudacao()},</Mini>
        <Titulo>{primeiroNome(sessao?.nome ?? "")}</Titulo>
      </View>

      {sessao?.ehLideranca && dados && (dados.vagasAbertas > 0 || dados.semConfirmacao > 0) ? (
        <View style={{ flexDirection: "row", gap: ESPACO.md }}>
          <Cartao style={{ flex: 1, gap: 2 }}>
            <Titulo>{String(dados.vagasAbertas)}</Titulo>
            <Mini>vagas em aberto</Mini>
          </Cartao>
          <Cartao style={{ flex: 1, gap: 2 }}>
            <Titulo>{String(dados.semConfirmacao)}</Titulo>
            <Mini>confirmações pendentes</Mini>
          </Cartao>
        </View>
      ) : null}

      {/* ------------------------------------------- minhas escalas */}
      <View style={{ gap: ESPACO.md }}>
        <Subtitulo>Minhas próximas escalas</Subtitulo>
        {!dados || dados.minhas.length === 0 ? (
          <Vazio
            titulo="Você não está escalado(a)"
            descricao="Quando a liderança montar a escala, ela aparece aqui."
          />
        ) : (
          dados.minhas.slice(0, 4).map(({ item, culto }) => (
            <Cartao key={item.id} aoTocar={() => router.push("/escalas")} style={{ gap: 6 }}>
              <View
                style={{ flexDirection: "row", justifyContent: "space-between", gap: ESPACO.sm }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Corpo>
                    {rotuloCulto(culto, dados.tipos)} ·{" "}
                    {dados.funcoes.get(item.funcao_id)?.nome ?? "Função"}
                  </Corpo>
                  <Mini>
                    {formatarData(culto.data)} às {formatarHorario(culto.horario)}
                  </Mini>
                </View>
                <Etiqueta
                  texto={item.confirmado ? "Confirmado" : "A confirmar"}
                  tom={item.confirmado ? "sucesso" : "alerta"}
                />
              </View>
            </Cartao>
          ))
        )}
      </View>

      {/* -------------------------------------------- próximos cultos */}
      <View style={{ gap: ESPACO.md }}>
        <Subtitulo>Próximos cultos</Subtitulo>
        {!dados || dados.cultos.length === 0 ? (
          <Vazio titulo="Nenhum culto programado" />
        ) : (
          dados.cultos.slice(0, 4).map((culto) => {
            const doCulto = dados.itens.filter((i) => i.culto_id === culto.id);
            const abertas = doCulto.filter((i) => !i.pessoa_id).length;
            return (
              <Cartao key={culto.id} style={{ gap: 8 }}>
                <View style={{ gap: 2 }}>
                  <Corpo>{rotuloCulto(culto, dados.tipos)}</Corpo>
                  <Mini>
                    {formatarDataExtenso(culto.data)} · {formatarHorario(culto.horario)}
                  </Mini>
                </View>
                {doCulto.length === 0 ? (
                  <Etiqueta texto="Sem escala" />
                ) : (
                  <Etiqueta
                    texto={abertas > 0 ? `${abertas} vaga(s) em aberto` : "Escala completa"}
                    tom={abertas > 0 ? "alerta" : "sucesso"}
                  />
                )}
                {doCulto.length > 0 ? (
                  <Corpo suave numeroDeLinhas={2}>
                    {doCulto
                      .map(
                        (i) =>
                          `${dados.funcoes.get(i.funcao_id)?.nome ?? "Função"}: ${
                            i.pessoa_id
                              ? (dados.pessoas.get(i.pessoa_id)?.nome ?? "—")
                              : "em aberto"
                          }`,
                      )
                      .join(" · ")}
                  </Corpo>
                ) : null}
              </Cartao>
            );
          })
        )}
      </View>

      {/* ------------------------------------------- aniversariantes */}
      {dados && dados.aniversariantes.length > 0 ? (
        <View style={{ gap: ESPACO.md }}>
          <Subtitulo>Aniversariantes da semana</Subtitulo>
          <Cartao style={{ gap: ESPACO.md }}>
            {dados.aniversariantes.map((p) => (
              <View
                key={p.id}
                style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.md }}
              >
                <Icone nome="user" tamanho={18} cor={cores.primaria} />
                <View style={{ flex: 1 }}>
                  <Corpo>{p.nome}</Corpo>
                </View>
                <Mini>{formatarData(p.nascimento, "dd/MM")}</Mini>
              </View>
            ))}
          </Cartao>
        </View>
      ) : null}

      {/* ------------------------------------------- próximos eventos */}
      {dados && dados.eventos.length > 0 ? (
        <View style={{ gap: ESPACO.md }}>
          <Subtitulo>Próximos eventos</Subtitulo>
          {dados.eventos.map((evento) => (
            <Cartao key={evento.id} style={{ gap: 4 }}>
              <Corpo>{evento.titulo}</Corpo>
              <Mini>
                {formatarData(evento.inicio.slice(0, 10))}
                {evento.local ? ` · ${evento.local}` : ""}
              </Mini>
            </Cartao>
          ))}
        </View>
      ) : null}

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
