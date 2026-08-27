import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigirAdmin } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { FormularioMembro } from "../../formulario";
import { agruparFuncoes } from "../../agrupar";
import type { Pessoa } from "@/lib/tipos";

export const metadata: Metadata = { title: "Editar membro" };

export default async function PaginaEditarMembro({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await exigirAdmin();
  const { id } = await params;
  const supabase = await criarClienteServidor();

  const [{ data: membro }, { data: vinculos }, grupos] = await Promise.all([
    supabase.from("pessoas").select("*").eq("id", id).maybeSingle(),
    supabase.from("pessoa_funcao").select("funcao_id").eq("pessoa_id", id),
    agruparFuncoes(),
  ]);

  if (!membro) notFound();

  return (
    <div>
      <CabecalhoPagina titulo="Editar membro" descricao={membro.nome} />
      <FormularioMembro
        membro={membro as Pessoa}
        funcoesSelecionadas={(vinculos ?? []).map((v) => v.funcao_id)}
        grupos={grupos}
      />
    </div>
  );
}
