import type { Metadata } from "next";
import Link from "next/link";
import { Cake, Download, Plus, Search } from "lucide-react";
import { exigirLideranca } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { listarMinisterios } from "@/lib/dados/ministerios";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao } from "@/components/ui/cartao";
import { Avatar } from "@/components/ui/avatar";
import { Etiqueta } from "@/components/ui/etiqueta";
import { Vazio } from "@/components/ui/vazio";
import { BotaoLink, Botao } from "@/components/ui/botao";
import { Entrada, Selecao } from "@/components/ui/campo";
import { ROTULO_STATUS, type Pessoa, type StatusPessoa } from "@/lib/tipos";
import { formatarData, formatarTelefone } from "@/lib/utils";

export const metadata: Metadata = { title: "Membros" };

const TONS: Record<StatusPessoa, "sucesso" | "alerta" | "primaria" | "neutro"> = {
  ativo: "sucesso",
  afastado: "alerta",
  visitante: "primaria",
  inativo: "neutro",
};

type Filtros = { q?: string; status?: string; ministerio?: string; mes?: string };

export default async function PaginaMembros({
  searchParams,
}: {
  searchParams: Promise<Filtros>;
}) {
  const sessao = await exigirLideranca();
  const filtros = await searchParams;
  const supabase = await criarClienteServidor();
  const ministerios = await listarMinisterios();

  let idsDoMinisterio: string[] | null = null;
  if (filtros.ministerio) {
    const { data: funcoes } = await supabase
      .from("funcoes")
      .select("id")
      .eq("ministerio_id", filtros.ministerio);
    const funcaoIds = (funcoes ?? []).map((f) => f.id);
    if (funcaoIds.length === 0) {
      idsDoMinisterio = [];
    } else {
      const { data: vinculos } = await supabase
        .from("pessoa_funcao")
        .select("pessoa_id")
        .in("funcao_id", funcaoIds);
      idsDoMinisterio = [...new Set((vinculos ?? []).map((v) => v.pessoa_id))];
    }
  }

  // Ministério sem ninguém vinculado: nem vale ir ao banco.
  const semResultado = idsDoMinisterio?.length === 0;

  let consulta = supabase.from("pessoas").select("*").order("nome");
  if (filtros.q) consulta = consulta.ilike("nome", `%${filtros.q}%`);
  if (filtros.status) consulta = consulta.eq("status", filtros.status as StatusPessoa);
  if (idsDoMinisterio && idsDoMinisterio.length > 0) {
    consulta = consulta.in("id", idsDoMinisterio);
  }

  const { data } = semResultado ? { data: [] as Pessoa[] } : await consulta;
  let membros = (data ?? []) as Pessoa[];

  const mesAtual = `${new Date().getMonth() + 1}`.padStart(2, "0");
  if (filtros.mes === "1") {
    membros = membros
      .filter((m) => m.nascimento?.slice(5, 7) === mesAtual)
      .sort((a, b) => (a.nascimento ?? "").slice(8) .localeCompare((b.nascimento ?? "").slice(8)));
  }

  const parametros = new URLSearchParams(
    Object.entries(filtros).filter(([, v]) => Boolean(v)) as [string, string][],
  );

  return (
    <div>
      <CabecalhoPagina
        titulo="Membros"
        descricao={`${membros.length} pessoa(s) na lista`}
        acao={
          sessao.ehAdmin ? (
            <BotaoLink href="/membros/novo">
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo membro
            </BotaoLink>
          ) : undefined
        }
      />

      <Cartao className="mb-4 p-4">
        <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave"
              aria-hidden="true"
            />
            <Entrada
              name="q"
              defaultValue={filtros.q ?? ""}
              placeholder="Buscar por nome"
              aria-label="Buscar por nome"
              className="pl-9"
            />
          </div>
          <Selecao name="status" defaultValue={filtros.status ?? ""} aria-label="Status">
            <option value="">Todos os status</option>
            {Object.entries(ROTULO_STATUS).map(([valor, rotulo]) => (
              <option key={valor} value={valor}>
                {rotulo}
              </option>
            ))}
          </Selecao>
          <Selecao name="ministerio" defaultValue={filtros.ministerio ?? ""} aria-label="Ministério">
            <option value="">Todos os ministérios</option>
            {ministerios.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </Selecao>
          <Botao type="submit" variante="secundario">
            Filtrar
          </Botao>
          <label className="flex items-center gap-2 text-sm text-texto-suave sm:col-span-4">
            <input
              type="checkbox"
              name="mes"
              value="1"
              defaultChecked={filtros.mes === "1"}
              className="h-4 w-4 accent-[var(--primaria)]"
            />
            <Cake className="h-4 w-4" aria-hidden="true" />
            Só aniversariantes deste mês
          </label>
        </form>
      </Cartao>

      <div className="mb-3 flex justify-end">
        <BotaoLink
          href={`/membros/exportar?${parametros.toString()}`}
          variante="secundario"
          tamanho="sm"
          prefetch={false}
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Exportar CSV
        </BotaoLink>
      </div>

      {membros.length === 0 ? (
        <Vazio
          titulo="Nenhum membro encontrado"
          descricao="Ajuste os filtros ou cadastre o primeiro membro da igreja."
          acao={
            sessao.ehAdmin ? <BotaoLink href="/membros/novo">Cadastrar membro</BotaoLink> : undefined
          }
        />
      ) : (
        <Cartao className="divide-y divide-borda">
          {membros.map((membro) => (
            <Link
              key={membro.id}
              href={`/membros/${membro.id}`}
              className="flex items-center gap-3 p-3 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-superficie-2"
            >
              <Avatar nome={membro.nome} fotoUrl={membro.foto_url} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{membro.nome}</p>
                <p className="truncate text-xs text-texto-suave">
                  {membro.telefone ? formatarTelefone(membro.telefone) : "Sem telefone"}
                  {membro.nascimento ? ` · ${formatarData(membro.nascimento, "dd/MM")}` : ""}
                </p>
              </div>
              <Etiqueta tom={TONS[membro.status]}>{ROTULO_STATUS[membro.status]}</Etiqueta>
            </Link>
          ))}
        </Cartao>
      )}
    </div>
  );
}
