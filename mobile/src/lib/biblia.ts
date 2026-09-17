import type { SQLiteDatabase } from "expo-sqlite";

/**
 * Bíblia offline.
 *
 * Texto: Almeida Revisada Imprensa Bíblica (1914) — domínio público.
 * O banco é gerado por `scripts/gerar-biblia.py` e embarcado como asset;
 * na primeira abertura o app copia o arquivo para o diretório do SQLite.
 */

export type Livro = {
  id: number;
  abreviacao: string;
  nome: string;
  testamento: 1 | 2;
  capitulos: number;
};

export type Versiculo = {
  id: number;
  livro: number;
  capitulo: number;
  versiculo: number;
  texto: string;
};

export type Ocorrencia = Versiculo & { nomeLivro: string; abreviacao: string };

/** Tira acentos e caixa — a busca ignora as duas coisas. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export async function listarLivros(db: SQLiteDatabase): Promise<Livro[]> {
  return db.getAllAsync<Livro>(
    "select id, abreviacao, nome, testamento, capitulos from livros order by id",
  );
}

export async function obterLivro(db: SQLiteDatabase, id: number): Promise<Livro | null> {
  return db.getFirstAsync<Livro>(
    "select id, abreviacao, nome, testamento, capitulos from livros where id = ?",
    id,
  );
}

export async function lerCapitulo(
  db: SQLiteDatabase,
  livro: number,
  capitulo: number,
): Promise<Versiculo[]> {
  return db.getAllAsync<Versiculo>(
    "select id, livro, capitulo, versiculo, texto from versiculos where livro = ? and capitulo = ? order by versiculo",
    livro,
    capitulo,
  );
}

/**
 * Busca no texto inteiro. Aceita várias palavras (todas precisam aparecer)
 * e ignora acentos: "coracao" encontra "coração".
 */
export async function buscar(
  db: SQLiteDatabase,
  termo: string,
  limite = 60,
): Promise<Ocorrencia[]> {
  const palavras = normalizar(termo)
    .split(/\s+/)
    .filter((p) => p.length > 1)
    .map((p) => `"${p.replace(/"/g, "")}"`);

  if (palavras.length === 0) return [];

  return db.getAllAsync<Ocorrencia>(
    `select v.id, v.livro, v.capitulo, v.versiculo, v.texto,
            l.nome as nomeLivro, l.abreviacao as abreviacao
       from busca b
       join versiculos v on v.id = b.rowid
       join livros l on l.id = v.livro
      where busca match ?
      order by v.id
      limit ?`,
    palavras.join(" AND "),
    limite,
  );
}

export function referencia(livro: string, capitulo: number, versiculo?: number): string {
  return versiculo ? `${livro} ${capitulo}:${versiculo}` : `${livro} ${capitulo}`;
}

/* ------------------------------------------------- palavras no original */

export type PalavraOriginal = {
  ordem: number;
  palavra: string;
  translit: string | null;
  strongs: string | null;
  forma: string | null;
  gloss: string | null;
  espanhol: string | null;
  gramatica: string | null;
  definicao: string | null;
  derivacao: string | null;
};

/** `בְּ/רֵאשִׁ֖ית` → `בְּרֵאשִׁית` (o `/` marca prefixos no dado de origem). */
function limpar(texto: string | null): string {
  return (texto ?? "").replace(/\//g, "").replace(/\\׃/g, "").trim();
}

/**
 * Palavras hebraicas ou gregas de um versículo, com o verbete de Strong.
 *
 * Hebraico vem do TAHOT e grego do TAGNT (STEPBible, CC BY 4.0); as
 * definições são do Strong's Dictionary (Open Scriptures, CC BY-SA).
 */
export async function palavrasDoVersiculo(
  db: SQLiteDatabase,
  livro: number,
  capitulo: number,
  versiculo: number,
): Promise<PalavraOriginal[]> {
  const linhas = await db.getAllAsync<PalavraOriginal>(
    `select p.ordem, p.palavra, p.translit, p.strongs, p.forma, p.gloss,
            p.espanhol, p.gramatica, s.definicao, s.derivacao
       from palavras p
       left join strongs s on s.codigo = p.strongs
      where p.livro = ? and p.capitulo = ? and p.versiculo = ?
      order by p.ordem`,
    livro,
    capitulo,
    versiculo,
  );

  return linhas.map((linha) => ({
    ...linha,
    palavra: limpar(linha.palavra),
    translit: limpar(linha.translit),
  }));
}

/** O Antigo Testamento está em hebraico; o Novo, em grego. */
export function idiomaOriginal(livro: number): "hebraico" | "grego" {
  return livro <= 39 ? "hebraico" : "grego";
}
