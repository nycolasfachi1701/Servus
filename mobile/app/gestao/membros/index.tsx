import { useState } from "react";
import { RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { useSessao } from "@/lib/sessao";
import { useConsulta } from "@/lib/consulta";
import { listarMembros } from "@/lib/gestao";
import { ESPACO, useCores } from "@/lib/tema";
import {
  Avatar,
  Aviso,
  Botao,
  Carregando,
  Cartao,
  Corpo,
  Entrada,
  Etiqueta,
  Mini,
  Vazio,
} from "@/componentes/ui";
import { Seletor } from "@/componentes/seletor";
import { Icone } from "@/componentes/icone";
import { ROTULO_STATUS, type StatusPessoa } from "@/lib/tipos";
import { formatarData, formatarTelefone } from "@/lib/utils";

const TONS: Record<StatusPessoa, "sucesso" | "alerta" | "primaria" | "neutro"> = {
  ativo: "sucesso",
  afastado: "alerta",
  visitante: "primaria",
  inativo: "neutro",
};

export default function Membros() {
  const cores = useCores();
  const router = useRouter();
  const { sessao } = useSessao();

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const { dados, carregando, erro, atualizando, recarregar } = useConsulta(
    () => listarMembros({ busca, status: status ?? undefined }),
    [busca, status],
  );

  return (
    <ScrollView
      contentContainerStyle={{ padding: ESPACO.lg, gap: ESPACO.md }}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={recarregar} tintColor={cores.primaria} />
      }
    >
      {erro ? <Aviso texto={erro} tom="erro" /> : null}

      <Entrada
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar por nome"
        autoCorrect={false}
      />

      <Seletor
        valor={status}
        opcoes={Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => ({ valor, rotulo }))}
        vazio="Todos os status"
        permiteLimpar
        titulo="Filtrar por status"
        aoEscolher={setStatus}
      />

      {sessao?.ehAdmin ? (
        <Botao
          titulo="Novo membro"
          aoTocar={() => router.push("/gestao/membros/editar")}
          icone={<Icone nome="plus" tamanho={18} cor={cores.sobrePrimaria} />}
        />
      ) : null}

      {carregando ? (
        <Carregando />
      ) : !dados || dados.length === 0 ? (
        <Vazio titulo="Nenhum membro encontrado" descricao="Ajuste a busca ou cadastre alguém." />
      ) : (
        <>
          <Mini>{dados.length} pessoa(s)</Mini>
          {dados.map((membro) => (
            <Cartao
              key={membro.id}
              style={{ flexDirection: "row", alignItems: "center", gap: ESPACO.md }}
              aoTocar={() =>
                router.push({ pathname: "/gestao/membros/[id]", params: { id: membro.id } })
              }
            >
              <Avatar nome={membro.nome} fotoUrl={membro.foto_url} />
              <View style={{ flex: 1, gap: 2 }}>
                <Corpo>{membro.nome}</Corpo>
                <Mini>
                  {membro.telefone ? formatarTelefone(membro.telefone) : "Sem telefone"}
                  {membro.nascimento ? ` · ${formatarData(membro.nascimento, "dd/MM")}` : ""}
                </Mini>
              </View>
              <Etiqueta texto={ROTULO_STATUS[membro.status]} tom={TONS[membro.status]} />
            </Cartao>
          ))}
        </>
      )}

      <View style={{ height: ESPACO.xl }} />
    </ScrollView>
  );
}
