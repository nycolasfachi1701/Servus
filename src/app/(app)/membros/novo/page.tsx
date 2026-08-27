import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/sessao";
import { CabecalhoPagina } from "@/components/ui/cabecalho-pagina";
import { FormularioMembro } from "../formulario";
import { agruparFuncoes } from "../agrupar";

export const metadata: Metadata = { title: "Novo membro" };

export default async function PaginaNovoMembro() {
  await exigirAdmin();
  const grupos = await agruparFuncoes();

  return (
    <div>
      <CabecalhoPagina
        titulo="Novo membro"
        descricao="Dados pessoais ficam visíveis apenas para a liderança (LGPD)."
      />
      <FormularioMembro funcoesSelecionadas={[]} grupos={grupos} />
    </div>
  );
}
