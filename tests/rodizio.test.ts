import test from "node:test";
import assert from "node:assert/strict";
import { gerarEscala, type EntradaGeracao } from "../src/lib/escala/rodizio.ts";

const PESOS = { rodizio: 10, preferencia: 3, dupla: 2 };

function base(parcial: Partial<EntradaGeracao> = {}): EntradaGeracao {
  return {
    cultos: [{ id: "culto-1", data: "2026-09-06", diaSemana: 0 }],
    vagas: [{ cultoId: "culto-1", funcaoId: "violao", quantidade: 1 }],
    candidatos: [
      { pessoaId: "ana", funcoes: ["violao"] },
      { pessoaId: "bruno", funcoes: ["violao"] },
    ],
    carga: [],
    indisponibilidades: [],
    limitePorPessoa: 6,
    pesos: PESOS,
    ...parcial,
  };
}

test("escolhe quem tem menor carga acumulada", () => {
  const resultado = gerarEscala(
    base({
      carga: [
        { pessoaId: "ana", funcaoId: "violao", total: 5 },
        { pessoaId: "bruno", funcaoId: "violao", total: 1 },
      ],
    }),
  );

  assert.equal(resultado.itens.length, 1);
  assert.equal(resultado.itens[0].pessoaId, "bruno");
  assert.equal(resultado.emAberto.length, 0);
});

test("distribui ao longo do período em vez de repetir a mesma pessoa", () => {
  const resultado = gerarEscala(
    base({
      cultos: [
        { id: "c1", data: "2026-09-06", diaSemana: 0 },
        { id: "c2", data: "2026-09-13", diaSemana: 0 },
        { id: "c3", data: "2026-09-20", diaSemana: 0 },
        { id: "c4", data: "2026-09-27", diaSemana: 0 },
      ],
      vagas: [
        { cultoId: "c1", funcaoId: "violao", quantidade: 1 },
        { cultoId: "c2", funcaoId: "violao", quantidade: 1 },
        { cultoId: "c3", funcaoId: "violao", quantidade: 1 },
        { cultoId: "c4", funcaoId: "violao", quantidade: 1 },
      ],
    }),
  );

  assert.equal(resultado.totalPorPessoa["ana"], 2);
  assert.equal(resultado.totalPorPessoa["bruno"], 2);
});

test("respeita a indisponibilidade informada", () => {
  const resultado = gerarEscala(
    base({
      carga: [{ pessoaId: "bruno", funcaoId: "violao", total: 0 }],
      indisponibilidades: [{ pessoaId: "bruno", cultoId: "culto-1" }],
    }),
  );

  assert.equal(resultado.itens[0].pessoaId, "ana");
});

test("deixa a vaga em aberto quando ninguém exerce a função", () => {
  const resultado = gerarEscala(
    base({ vagas: [{ cultoId: "culto-1", funcaoId: "harpa", quantidade: 1 }] }),
  );

  assert.equal(resultado.itens[0].pessoaId, null);
  assert.deepEqual(resultado.emAberto, [
    { cultoId: "culto-1", funcaoId: "harpa", motivo: "sem-candidatos" },
  ]);
});

test("deixa em aberto quando todos estão indisponíveis", () => {
  const resultado = gerarEscala(
    base({
      indisponibilidades: [
        { pessoaId: "ana", cultoId: "culto-1" },
        { pessoaId: "bruno", cultoId: "culto-1" },
      ],
    }),
  );

  assert.equal(resultado.emAberto[0].motivo, "todos-indisponiveis");
});

test("respeita o limite de escalas por pessoa no período", () => {
  const resultado = gerarEscala(
    base({
      cultos: [
        { id: "c1", data: "2026-09-06", diaSemana: 0 },
        { id: "c2", data: "2026-09-13", diaSemana: 0 },
      ],
      vagas: [
        { cultoId: "c1", funcaoId: "violao", quantidade: 1 },
        { cultoId: "c2", funcaoId: "violao", quantidade: 1 },
      ],
      candidatos: [{ pessoaId: "ana", funcoes: ["violao"] }],
      limitePorPessoa: 1,
    }),
  );

  assert.equal(resultado.totalPorPessoa["ana"], 1);
  assert.equal(resultado.emAberto.length, 1);
  assert.equal(resultado.emAberto[0].motivo, "limite-atingido");
});

test("preenche primeiro a vaga mais escassa", () => {
  // Carlos é o único baixista; também toca violão. A vaga de baixo é mais
  // escassa, então ele precisa ficar com ela e o violão vai para outra pessoa.
  const resultado = gerarEscala(
    base({
      vagas: [
        { cultoId: "culto-1", funcaoId: "violao", quantidade: 1 },
        { cultoId: "culto-1", funcaoId: "baixo", quantidade: 1 },
      ],
      candidatos: [
        { pessoaId: "ana", funcoes: ["violao"] },
        { pessoaId: "carlos", funcoes: ["violao", "baixo"] },
      ],
    }),
  );

  const baixo = resultado.itens.find((i) => i.funcaoId === "baixo");
  const violao = resultado.itens.find((i) => i.funcaoId === "violao");
  assert.equal(baixo?.pessoaId, "carlos");
  assert.equal(violao?.pessoaId, "ana");
  assert.equal(resultado.emAberto.length, 0);
});

test("mantém as escolhas manuais e não repete a pessoa no mesmo culto", () => {
  const resultado = gerarEscala(
    base({
      vagas: [
        { cultoId: "culto-1", funcaoId: "violao", quantidade: 1 },
        { cultoId: "culto-1", funcaoId: "voz", quantidade: 1 },
      ],
      candidatos: [
        { pessoaId: "ana", funcoes: ["violao", "voz"] },
        { pessoaId: "bruno", funcoes: ["voz"] },
      ],
      fixos: [{ cultoId: "culto-1", funcaoId: "violao", pessoaId: "ana" }],
    }),
  );

  const violao = resultado.itens.find((i) => i.funcaoId === "violao");
  const voz = resultado.itens.find((i) => i.funcaoId === "voz");
  assert.equal(violao?.pessoaId, "ana");
  assert.equal(violao?.fixo, true);
  assert.equal(voz?.pessoaId, "bruno");
});

test("usa a preferência de dia como desempate", () => {
  const resultado = gerarEscala(
    base({
      preferencias: [{ pessoaId: "bruno", diaSemana: 0 }],
    }),
  );

  assert.equal(resultado.itens[0].pessoaId, "bruno");
});

test("quem serviu há mais tempo entra primeiro em caso de empate", () => {
  const resultado = gerarEscala(
    base({
      carga: [
        { pessoaId: "ana", funcaoId: "violao", total: 3, ultimaData: "2026-08-30" },
        { pessoaId: "bruno", funcaoId: "violao", total: 3, ultimaData: "2026-06-01" },
      ],
    }),
  );

  assert.equal(resultado.itens[0].pessoaId, "bruno");
});
