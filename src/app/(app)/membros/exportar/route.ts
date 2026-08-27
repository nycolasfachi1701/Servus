import { NextResponse, type NextRequest } from "next/server";
import { obterSessao } from "@/lib/sessao";
import { criarClienteServidor } from "@/lib/supabase/servidor";
import { ROTULO_ESTADO_CIVIL, ROTULO_STATUS, type Pessoa, type StatusPessoa } from "@/lib/tipos";
import { csvEscapar } from "@/lib/utils";

const COLUNAS = [
  "Nome",
  "Telefone",
  "E-mail",
  "Nascimento",
  "Batismo",
  "Estado civil",
  "Status",
  "Endereço",
];

/** Exporta a lista de membros em CSV (respeitando os filtros da tela). */
export async function GET(request: NextRequest) {
  const sessao = await obterSessao();
  if (!sessao?.ehLideranca) {
    return NextResponse.json({ erro: "Sem permissão." }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const supabase = await criarClienteServidor();

  let consulta = supabase.from("pessoas").select("*").order("nome");
  const q = searchParams.get("q");
  const status = searchParams.get("status");
  if (q) consulta = consulta.ilike("nome", `%${q}%`);
  if (status) consulta = consulta.eq("status", status as StatusPessoa);

  const { data } = await consulta;
  const membros = (data ?? []) as Pessoa[];

  const linhas = [
    COLUNAS.map(csvEscapar).join(";"),
    ...membros.map((m) =>
      [
        m.nome,
        m.telefone,
        m.email,
        m.nascimento,
        m.batismo,
        ROTULO_ESTADO_CIVIL[m.estado_civil],
        ROTULO_STATUS[m.status],
        m.endereco,
      ]
        .map(csvEscapar)
        .join(";"),
    ),
  ];

  // BOM para o Excel abrir os acentos corretamente
  const csv = `﻿${linhas.join("\r\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="membros-servus.csv"`,
    },
  });
}
