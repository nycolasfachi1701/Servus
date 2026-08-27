import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cake, Droplets, Mail, MapPin, MessageCircle, Pencil, Trash2 } from "lucide-react";
import { exigirLideranca } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { mapaFuncoes } from "@/lib/dados/ministerios";
import { mapaTiposCulto, rotuloCulto } from "@/lib/dados/cultos";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { Cartao, CartaoCabecalho, CartaoCorpo } from "@/components/ui/cartao";
import { Avatar } from "@/components/ui/avatar";
import { Etiqueta } from "@/components/ui/etiqueta";
import { BotaoLink } from "@/components/ui/botao";
import { ConfirmarAcao } from "@/components/confirmar-acao";
import { ROTULO_ESTADO_CIVIL, ROTULO_STATUS, type Culto, type Pessoa } from "@/lib/tipos";
import {
  formatarData,
  formatarHorario,
  formatarTelefone,
  hojeChave,
  idade,
  linkWhatsAppPessoa,
} from "@/lib/utils";
import { excluirMembro } from "../acoes";

export const metadata: Metadata = { title: "Membro" };

function Linha({
  icone: Icone,
  rotulo,
  valor,
}: {
  icone: React.ElementType;
  rotulo: string;
  valor: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icone className="mt-0.5 h-4 w-4 shrink-0 text-texto-suave" aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs text-texto-suave">{rotulo}</p>
        <p className="break-words text-sm">{valor}</p>
      </div>
    </div>
  );
}

export default async function PaginaMembro({ params }: { params: Promise<{ id: string }> }) {
  const sessao = await exigirLideranca();
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const { data } = await supabase.from("pessoas").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const membro = data as Pessoa;

  const [{ data: vinculos }, funcoes, tipos] = await Promise.all([
    supabase.from("pessoa_funcao").select("funcao_id").eq("pessoa_id", id),
    mapaFuncoes(),
    mapaTiposCulto(),
  ]);

  const { data: escalas } = await supabase
    .from("escala_itens")
    .select("*")
    .eq("pessoa_id", id)
    .order("criado_em", { ascending: false })
    .limit(30);

  const cultoIds = [...new Set((escalas ?? []).map((e) => e.culto_id))];
  const { data: cultosData } = cultoIds.length
    ? await supabase.from("cultos").select("*").in("id", cultoIds).gte("data", hojeChave())
    : { data: [] as Culto[] };

  const cultos = new Map((cultosData ?? []).map((c) => [c.id, c as Culto]));
  const proximas = (escalas ?? [])
    .filter((e) => cultos.has(e.culto_id))
    .sort((a, b) => cultos.get(a.culto_id)!.data.localeCompare(cultos.get(b.culto_id)!.data));

  return (
    <div>
      <CabecalhoPagina
        titulo={membro.nome}
        descricao={ROTULO_STATUS[membro.status]}
        acao={
          sessao.ehAdmin ? (
            <div className="flex gap-2">
              <BotaoLink href={`/membros/${membro.id}/editar`} variante="secundario" tamanho="sm">
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar
              </BotaoLink>
              <ConfirmarAcao
                acao={excluirMembro}
                campos={{ id: membro.id }}
                pergunta={`Excluir ${membro.nome}? Essa ação não pode ser desfeita.`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Excluir
              </ConfirmarAcao>
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <Cartao>
            <CartaoCorpo className="flex flex-col items-center text-center">
              <Avatar nome={membro.nome} fotoUrl={membro.foto_url} tamanho="lg" />
              <p className="mt-3 font-serif text-lg font-semibold">{membro.nome}</p>
              <p className="text-sm text-texto-suave">
                {ROTULO_ESTADO_CIVIL[membro.estado_civil]}
                {membro.nascimento ? ` · ${idade(membro.nascimento)} anos` : ""}
              </p>
              {membro.telefone ? (
                <a
                  href={linkWhatsAppPessoa(membro.telefone)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-sucesso px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  Chamar no WhatsApp
                </a>
              ) : null}
            </CartaoCorpo>
          </Cartao>

          <Cartao>
            <CartaoCabecalho titulo="Contato e dados" />
            <CartaoCorpo className="divide-y divide-borda pt-2">
              <Linha
                icone={MessageCircle}
                rotulo="Telefone"
                valor={membro.telefone ? formatarTelefone(membro.telefone) : "—"}
              />
              <Linha icone={Mail} rotulo="E-mail" valor={membro.email ?? "—"} />
              <Linha
                icone={Cake}
                rotulo="Nascimento"
                valor={membro.nascimento ? formatarData(membro.nascimento) : "—"}
              />
              <Linha
                icone={Droplets}
                rotulo="Batismo"
                valor={membro.batismo ? formatarData(membro.batismo) : "—"}
              />
              <Linha icone={MapPin} rotulo="Endereço" valor={membro.endereco ?? "—"} />
            </CartaoCorpo>
          </Cartao>
        </div>

        <div className="space-y-5">
          <Cartao>
            <CartaoCabecalho
              titulo="Funções"
              descricao="Define para quais vagas a pessoa pode ser escalada."
            />
            <CartaoCorpo className="pt-3">
              {(vinculos ?? []).length === 0 ? (
                <p className="text-sm text-texto-suave">Nenhuma função vinculada.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(vinculos ?? []).map((v) => {
                    const funcao = funcoes.get(v.funcao_id);
                    return (
                      <Etiqueta key={v.funcao_id} tom="vinho">
                        {funcao?.ministerio?.nome ? `${funcao.ministerio.nome} · ` : ""}
                        {funcao?.nome ?? "Função"}
                      </Etiqueta>
                    );
                  })}
                </div>
              )}
            </CartaoCorpo>
          </Cartao>

          <Cartao>
            <CartaoCabecalho titulo="Próximas escalas" />
            <CartaoCorpo className="pt-3">
              {proximas.length === 0 ? (
                <p className="text-sm text-texto-suave">Sem escalas futuras.</p>
              ) : (
                <ul className="divide-y divide-borda">
                  {proximas.map((item) => {
                    const culto = cultos.get(item.culto_id)!;
                    return (
                      <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <Link
                            href={`/escalas/${culto.id}`}
                            className="truncate text-sm font-medium hover:text-vinho"
                          >
                            {rotuloCulto(culto, tipos)}
                          </Link>
                          <p className="text-xs text-texto-suave">
                            {formatarData(culto.data)} às {formatarHorario(culto.horario)} ·{" "}
                            {funcoes.get(item.funcao_id)?.nome ?? "Função"}
                          </p>
                        </div>
                        <Etiqueta tom={item.confirmado ? "sucesso" : "alerta"}>
                          {item.confirmado ? "Confirmado" : "A confirmar"}
                        </Etiqueta>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CartaoCorpo>
          </Cartao>

          {membro.observacoes ? (
            <Cartao>
              <CartaoCabecalho titulo="Observações" descricao="Visível apenas para a liderança." />
              <CartaoCorpo className="whitespace-pre-wrap pt-3 text-sm text-texto-suave">
                {membro.observacoes}
              </CartaoCorpo>
            </Cartao>
          ) : null}
        </div>
      </div>
    </div>
  );
}
