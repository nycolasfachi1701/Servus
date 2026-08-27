/**
 * Rodízio justo — o coração do Servus.
 *
 * Para cada culto as vagas são ordenadas da mais escassa para a mais fácil
 * de preencher (menos candidatos primeiro). Em cada vaga, entre quem exerce
 * a função, está disponível e não estourou o limite do período, escolhe-se
 * quem tem a MENOR carga acumulada. Ao escalar alguém, a carga sobe — é isso
 * que distribui naturalmente ao longo do período.
 *
 * Módulo puro (sem Supabase, sem React) para poder ser testado isoladamente.
 */

export type CultoParaEscala = {
  id: string;
  /** `YYYY-MM-DD` */
  data: string;
  /** 0 = domingo … 6 = sábado */
  diaSemana: number;
};

export type VagaParaEscala = {
  cultoId: string;
  funcaoId: string;
  quantidade: number;
};

export type CandidatoParaEscala = {
  pessoaId: string;
  /** funções que a pessoa exerce */
  funcoes: string[];
};

export type CargaHistorica = {
  pessoaId: string;
  funcaoId: string;
  total: number;
  /** última data em que serviu nessa função (`YYYY-MM-DD`) */
  ultimaData?: string | null;
};

export type Pesos = {
  /** peso principal: distribuir quem serviu menos */
  rodizio: number;
  /** bônus para quem prefere aquele dia da semana */
  preferencia: number;
  /** bônus para duplas que servem bem juntas */
  dupla: number;
};

export type EntradaGeracao = {
  cultos: CultoParaEscala[];
  vagas: VagaParaEscala[];
  candidatos: CandidatoParaEscala[];
  carga: CargaHistorica[];
  /** pares pessoa/culto em que a pessoa avisou que NÃO pode */
  indisponibilidades: { pessoaId: string; cultoId: string }[];
  /** dias da semana preferidos por pessoa */
  preferencias?: { pessoaId: string; diaSemana: number }[];
  /** pessoas que servem bem juntas */
  duplas?: { a: string; b: string }[];
  /** vagas já preenchidas manualmente e que devem ser mantidas */
  fixos?: { cultoId: string; funcaoId: string; pessoaId: string }[];
  /** limite de escalas por pessoa dentro do período gerado */
  limitePorPessoa: number;
  pesos: Pesos;
};

export type ItemGerado = {
  cultoId: string;
  funcaoId: string;
  pessoaId: string | null;
  /** true quando veio de uma escolha manual preservada */
  fixo: boolean;
};

export type VagaEmAberto = {
  cultoId: string;
  funcaoId: string;
  motivo: "sem-candidatos" | "todos-indisponiveis" | "limite-atingido";
};

export type ResultadoGeracao = {
  itens: ItemGerado[];
  emAberto: VagaEmAberto[];
  /** quantas vezes cada pessoa ficou escalada no período */
  totalPorPessoa: Record<string, number>;
};

const chave = (pessoaId: string, funcaoId: string) => `${pessoaId}::${funcaoId}`;

export function gerarEscala(entrada: EntradaGeracao): ResultadoGeracao {
  const {
    cultos,
    vagas,
    candidatos,
    carga,
    indisponibilidades,
    preferencias = [],
    duplas = [],
    fixos = [],
    limitePorPessoa,
    pesos,
  } = entrada;

  const cultoPorId = new Map(cultos.map((c) => [c.id, c]));

  // quem exerce cada função
  const candidatosPorFuncao = new Map<string, string[]>();
  for (const candidato of candidatos) {
    for (const funcaoId of candidato.funcoes) {
      const lista = candidatosPorFuncao.get(funcaoId) ?? [];
      lista.push(candidato.pessoaId);
      candidatosPorFuncao.set(funcaoId, lista);
    }
  }

  const cargaPorFuncao = new Map<string, number>();
  const ultimaVez = new Map<string, string>();
  for (const registro of carga) {
    cargaPorFuncao.set(chave(registro.pessoaId, registro.funcaoId), registro.total);
    if (registro.ultimaData) ultimaVez.set(chave(registro.pessoaId, registro.funcaoId), registro.ultimaData);
  }

  const indisponivel = new Set(
    indisponibilidades.map((i) => `${i.pessoaId}::${i.cultoId}`),
  );

  const diasPreferidos = new Map<string, Set<number>>();
  for (const preferencia of preferencias) {
    const set = diasPreferidos.get(preferencia.pessoaId) ?? new Set<number>();
    set.add(preferencia.diaSemana);
    diasPreferidos.set(preferencia.pessoaId, set);
  }

  const parceiros = new Map<string, Set<string>>();
  for (const dupla of duplas) {
    for (const [x, y] of [
      [dupla.a, dupla.b],
      [dupla.b, dupla.a],
    ]) {
      const set = parceiros.get(x) ?? new Set<string>();
      set.add(y);
      parceiros.set(x, set);
    }
  }

  // estado durante a geração
  const escaladosNoCulto = new Map<string, Set<string>>();
  const totalPorPessoa: Record<string, number> = {};
  const itens: ItemGerado[] = [];
  const emAberto: VagaEmAberto[] = [];

  function registrar(cultoId: string, funcaoId: string, pessoaId: string, fixo: boolean) {
    itens.push({ cultoId, funcaoId, pessoaId, fixo });
    const doCulto = escaladosNoCulto.get(cultoId) ?? new Set<string>();
    doCulto.add(pessoaId);
    escaladosNoCulto.set(cultoId, doCulto);
    totalPorPessoa[pessoaId] = (totalPorPessoa[pessoaId] ?? 0) + 1;
    const k = chave(pessoaId, funcaoId);
    cargaPorFuncao.set(k, (cargaPorFuncao.get(k) ?? 0) + 1);
  }

  // 1. escolhas manuais entram primeiro e são respeitadas
  const vagasFixas = new Map<string, number>();
  for (const fixo of fixos) {
    registrar(fixo.cultoId, fixo.funcaoId, fixo.pessoaId, true);
    const k = `${fixo.cultoId}::${fixo.funcaoId}`;
    vagasFixas.set(k, (vagasFixas.get(k) ?? 0) + 1);
  }

  // 2. expande as vagas restantes em posições individuais
  type Posicao = { cultoId: string; funcaoId: string; elegiveis: number };
  const posicoes: Posicao[] = [];
  for (const vaga of vagas) {
    const jaFixas = vagasFixas.get(`${vaga.cultoId}::${vaga.funcaoId}`) ?? 0;
    const restantes = Math.max(0, vaga.quantidade - jaFixas);
    const elegiveis = (candidatosPorFuncao.get(vaga.funcaoId) ?? []).filter(
      (pessoaId) => !indisponivel.has(`${pessoaId}::${vaga.cultoId}`),
    ).length;
    for (let i = 0; i < restantes; i++) {
      posicoes.push({ cultoId: vaga.cultoId, funcaoId: vaga.funcaoId, elegiveis });
    }
  }

  // 3. da vaga mais escassa para a mais fácil (empate: data do culto, depois função)
  posicoes.sort((a, b) => {
    if (a.elegiveis !== b.elegiveis) return a.elegiveis - b.elegiveis;
    const dataA = cultoPorId.get(a.cultoId)?.data ?? "";
    const dataB = cultoPorId.get(b.cultoId)?.data ?? "";
    if (dataA !== dataB) return dataA.localeCompare(dataB);
    return a.funcaoId.localeCompare(b.funcaoId);
  });

  // 4. preenche cada posição com quem tem menor carga
  for (const posicao of posicoes) {
    const culto = cultoPorId.get(posicao.cultoId);
    const doCulto = escaladosNoCulto.get(posicao.cultoId) ?? new Set<string>();
    const todos = candidatosPorFuncao.get(posicao.funcaoId) ?? [];

    if (todos.length === 0) {
      itens.push({ cultoId: posicao.cultoId, funcaoId: posicao.funcaoId, pessoaId: null, fixo: false });
      emAberto.push({ cultoId: posicao.cultoId, funcaoId: posicao.funcaoId, motivo: "sem-candidatos" });
      continue;
    }

    const disponiveis = todos.filter(
      (pessoaId) =>
        !doCulto.has(pessoaId) && !indisponivel.has(`${pessoaId}::${posicao.cultoId}`),
    );

    if (disponiveis.length === 0) {
      itens.push({ cultoId: posicao.cultoId, funcaoId: posicao.funcaoId, pessoaId: null, fixo: false });
      emAberto.push({
        cultoId: posicao.cultoId,
        funcaoId: posicao.funcaoId,
        motivo: "todos-indisponiveis",
      });
      continue;
    }

    const dentroDoLimite = disponiveis.filter(
      (pessoaId) => (totalPorPessoa[pessoaId] ?? 0) < limitePorPessoa,
    );

    if (dentroDoLimite.length === 0) {
      itens.push({ cultoId: posicao.cultoId, funcaoId: posicao.funcaoId, pessoaId: null, fixo: false });
      emAberto.push({
        cultoId: posicao.cultoId,
        funcaoId: posicao.funcaoId,
        motivo: "limite-atingido",
      });
      continue;
    }

    let escolhido = dentroDoLimite[0];
    let melhorNota = Number.POSITIVE_INFINITY;
    let melhorUltima = "";

    for (const pessoaId of dentroDoLimite) {
      const cargaFuncao = cargaPorFuncao.get(chave(pessoaId, posicao.funcaoId)) ?? 0;
      let nota = pesos.rodizio * (cargaFuncao + (totalPorPessoa[pessoaId] ?? 0));

      if (culto && diasPreferidos.get(pessoaId)?.has(culto.diaSemana)) {
        nota -= pesos.preferencia;
      }

      const parceirosDaPessoa = parceiros.get(pessoaId);
      if (parceirosDaPessoa && [...doCulto].some((outro) => parceirosDaPessoa.has(outro))) {
        nota -= pesos.dupla;
      }

      const ultima = ultimaVez.get(chave(pessoaId, posicao.funcaoId)) ?? "";

      const melhor =
        nota < melhorNota ||
        // empate: quem serviu há mais tempo (ou nunca) entra primeiro
        (nota === melhorNota && ultima < melhorUltima) ||
        (nota === melhorNota && ultima === melhorUltima && pessoaId < escolhido);

      if (melhor) {
        escolhido = pessoaId;
        melhorNota = nota;
        melhorUltima = ultima;
      }
    }

    registrar(posicao.cultoId, posicao.funcaoId, escolhido, false);
  }

  // ordena a saída por culto e função para uma leitura estável
  itens.sort((a, b) => {
    const dataA = cultoPorId.get(a.cultoId)?.data ?? "";
    const dataB = cultoPorId.get(b.cultoId)?.data ?? "";
    if (dataA !== dataB) return dataA.localeCompare(dataB);
    if (a.cultoId !== b.cultoId) return a.cultoId.localeCompare(b.cultoId);
    return a.funcaoId.localeCompare(b.funcaoId);
  });

  return { itens, emAberto, totalPorPessoa };
}
