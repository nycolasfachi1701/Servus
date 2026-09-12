#!/usr/bin/env python3
"""
Gera o banco SQLite da Bíblia embutido no app.

Fonte: Almeida Revisada Imprensa Bíblica (1914) — domínio público.
    https://github.com/thiagobodruk/biblia (json/aa.json)

Uso:
    python3 app/scripts/gerar-biblia.py caminho/para/aa.json app/assets/db/biblia.db
"""
import json
import sqlite3
import sys
import unicodedata

TESTAMENTO_NOVO = 40  # a partir de Mateus (índice 40 em 1..66)


def sem_acento(texto: str) -> str:
    return "".join(
        c for c in unicodedata.normalize("NFD", texto) if unicodedata.category(c) != "Mn"
    ).lower()


def gerar(origem: str, destino: str) -> None:
    with open(origem, encoding="utf-8-sig") as arquivo:
        livros = json.load(arquivo)

    conexao = sqlite3.connect(destino)
    cur = conexao.cursor()
    cur.executescript(
        """
        drop table if exists livros;
        drop table if exists versiculos;
        drop table if exists busca;

        create table livros (
          id          integer primary key,
          abreviacao  text not null,
          nome        text not null,
          testamento  integer not null,   -- 1 = Antigo, 2 = Novo
          capitulos   integer not null
        );

        create table versiculos (
          id        integer primary key,
          livro     integer not null references livros (id),
          capitulo  integer not null,
          versiculo integer not null,
          texto     text not null
        );

        create index versiculos_ref_idx on versiculos (livro, capitulo, versiculo);
        """
    )

    # Índice de busca: sem acento e sem maiúsculas, para "coracao" achar "coração".
    cur.execute("create virtual table busca using fts5(texto, content='')")

    proximo_id = 1
    for indice, livro in enumerate(livros, start=1):
        cur.execute(
            "insert into livros (id, abreviacao, nome, testamento, capitulos) values (?, ?, ?, ?, ?)",
            (
                indice,
                livro["abbrev"],
                livro["name"],
                1 if indice < TESTAMENTO_NOVO else 2,
                len(livro["chapters"]),
            ),
        )
        for numero_capitulo, capitulo in enumerate(livro["chapters"], start=1):
            for numero_versiculo, texto in enumerate(capitulo, start=1):
                cur.execute(
                    "insert into versiculos (id, livro, capitulo, versiculo, texto) values (?, ?, ?, ?, ?)",
                    (proximo_id, indice, numero_capitulo, numero_versiculo, texto),
                )
                cur.execute(
                    "insert into busca (rowid, texto) values (?, ?)",
                    (proximo_id, sem_acento(texto)),
                )
                proximo_id += 1

    conexao.commit()
    cur.execute("vacuum")
    conexao.close()

    print(f"{proximo_id - 1} versículos gravados em {destino}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(__doc__)
        raise SystemExit(1)
    gerar(sys.argv[1], sys.argv[2])
