#!/usr/bin/env python3
"""
Acrescenta ao banco da Bíblia as palavras no original e o léxico de Strong.

Fontes (ambas de uso livre, com crédito):
  • STEPBible-Data — TAHOT (hebraico) e TAGNT (grego), CC BY 4.0
    https://github.com/STEPBible/STEPBible-Data
    Texto original etiquetado palavra a palavra com número de Strong.
  • Strong's Dictionaries — Open Scriptures, CC BY-SA
    https://github.com/openscriptures/strongs
    Definições de cada verbete.

Uso:
    python3 scripts/gerar-originais.py <pasta-com-os-txt> <pasta-dos-dicionarios> assets/db/biblia.db
"""
import json
import os
import re
import sqlite3
import sys

# ------------------------------------------------------------ livros
LIVROS = {
    "Gen": 1, "Exo": 2, "Lev": 3, "Num": 4, "Deu": 5, "Jos": 6, "Jdg": 7, "Rut": 8,
    "1Sa": 9, "2Sa": 10, "1Ki": 11, "2Ki": 12, "1Ch": 13, "2Ch": 14, "Ezr": 15,
    "Neh": 16, "Est": 17, "Job": 18, "Psa": 19, "Pro": 20, "Ecc": 21, "Sng": 22,
    "Isa": 23, "Jer": 24, "Lam": 25, "Ezk": 26, "Dan": 27, "Hos": 28, "Jol": 29,
    "Amo": 30, "Oba": 31, "Jon": 32, "Mic": 33, "Nam": 34, "Hab": 35, "Zep": 36,
    "Hag": 37, "Zec": 38, "Mal": 39,
    "Mat": 40, "Mrk": 41, "Luk": 42, "Jhn": 43, "Act": 44, "Rom": 45, "1Co": 46,
    "2Co": 47, "Gal": 48, "Eph": 49, "Php": 50, "Col": 51, "1Th": 52, "2Th": 53,
    "1Ti": 54, "2Ti": 55, "Tit": 56, "Phm": 57, "Heb": 58, "Jas": 59, "1Pe": 60,
    "2Pe": 61, "1Jn": 62, "2Jn": 63, "3Jn": 64, "Jud": 65, "Rev": 66,
}

REFERENCIA = re.compile(r"^([1-3]?[A-Za-z]{2,3})\.(\d+)\.(\d+)#(\d+)")
GREGA_COM_TRANSLIT = re.compile(r"^(.+?)\s*\((.+?)\)\s*$")
CODIGO = re.compile(r"([GH])0*(\d+)")


def normalizar_strong(bruto: str, idioma: str) -> str | None:
    """`{H7225G}` → `H7225`; `G2424G` → `G2424`; ignora códigos de prefixo (H9xxx)."""
    if not bruto:
        return None
    # quando há chaves, o que está dentro é a palavra principal
    entre_chaves = re.findall(r"\{([^}]+)\}", bruto)
    candidatos = entre_chaves or [bruto]
    letra = "H" if idioma == "hebraico" else "G"

    for candidato in candidatos:
        for achado in CODIGO.finditer(candidato):
            if achado.group(1) != letra:
                continue
            numero = int(achado.group(2))
            # 9000+ são marcadores do STEPBible para prefixos e sufixos
            if numero >= 9000:
                continue
            return f"{letra}{numero}"
    return None


def limpar_gloss(texto: str) -> str:
    """`: beginning»first:1_beginning` → `beginning`."""
    texto = texto.split("»")[0]
    texto = texto.split("@")[0]
    return texto.strip(" :;,").strip()


def ler_grego(caminho: str):
    for linha in open(caminho, encoding="utf-8"):
        if not REFERENCIA.match(linha):
            continue
        colunas = linha.rstrip("\n").split("\t")
        if len(colunas) < 5:
            continue
        ref = REFERENCIA.match(colunas[0])
        livro = LIVROS.get(ref.group(1))
        if not livro or livro < 40:
            continue

        bruto = colunas[1].strip()
        achado = GREGA_COM_TRANSLIT.match(bruto)
        palavra, translit = (achado.group(1), achado.group(2)) if achado else (bruto, "")

        strongs = normalizar_strong(colunas[3].split("=")[0], "grego")
        gramatica = colunas[3].split("=")[1].strip() if "=" in colunas[3] else ""
        forma, _, gloss = colunas[4].partition("=")
        espanhol = colunas[8].strip() if len(colunas) > 8 else ""

        yield (
            livro, int(ref.group(2)), int(ref.group(3)), int(ref.group(4)),
            palavra.strip(), translit.strip(), strongs, forma.strip(),
            limpar_gloss(gloss), espanhol, gramatica,
        )


def ler_hebraico(caminho: str):
    for linha in open(caminho, encoding="utf-8"):
        if not REFERENCIA.match(linha):
            continue
        colunas = linha.rstrip("\n").split("\t")
        if len(colunas) < 6:
            continue
        ref = REFERENCIA.match(colunas[0])
        livro = LIVROS.get(ref.group(1))
        if not livro or livro > 39:
            continue

        strongs = normalizar_strong(colunas[4], "hebraico")

        # a coluna 11 traz `H7225G=רֵאשִׁית=: beginning»first` — dela saem forma e gloss
        forma, gloss = "", ""
        if len(colunas) > 11 and colunas[11]:
            for parte in re.findall(r"\{?([^{}/]+)\}?", colunas[11]):
                pedacos = parte.split("=")
                if len(pedacos) >= 3 and normalizar_strong(pedacos[0], "hebraico") == strongs:
                    forma, gloss = pedacos[1].strip(), limpar_gloss(pedacos[2])
                    break

        yield (
            livro, int(ref.group(2)), int(ref.group(3)), int(ref.group(4)),
            colunas[1].strip(), colunas[2].strip(), strongs, forma,
            gloss, "", colunas[5].strip(),
        )


def carregar_dicionario(caminho: str, idioma: str) -> dict:
    """Os arquivos do Open Scriptures são JS com um objeto JSON dentro."""
    texto = open(caminho, encoding="utf-8").read()
    inicio = texto.index("{", texto.index("=" if "=" in texto[:2000] else "{"))
    return json.loads(texto[inicio : texto.rindex("}") + 1])


def gerar(pasta_textos: str, pasta_dicionarios: str, banco: str) -> None:
    conexao = sqlite3.connect(banco)
    cur = conexao.cursor()
    cur.executescript(
        """
        drop table if exists strongs;
        drop table if exists palavras;

        create table strongs (
          codigo    text primary key,
          idioma    text not null,       -- 'hebraico' | 'grego'
          lema      text,
          translit  text,
          pronuncia text,
          definicao text,
          derivacao text
        );

        create table palavras (
          livro     integer not null,
          capitulo  integer not null,
          versiculo integer not null,
          ordem     integer not null,
          palavra   text not null,
          translit  text,
          strongs   text,
          forma     text,
          gloss     text,
          espanhol  text,
          gramatica text,
          primary key (livro, capitulo, versiculo, ordem)
        ) without rowid;
        """
    )

    # ------------------------------------------------------- léxico
    total_verbetes = 0
    for arquivo, idioma, prefixo in [
        ("strongs-hebrew-dictionary.js", "hebraico", "H"),
        ("strongs-greek-dictionary.js", "grego", "G"),
    ]:
        dados = carregar_dicionario(os.path.join(pasta_dicionarios, arquivo), idioma)
        for codigo, verbete in dados.items():
            cur.execute(
                "insert or replace into strongs values (?, ?, ?, ?, ?, ?, ?)",
                (
                    codigo,
                    idioma,
                    verbete.get("lemma"),
                    verbete.get("xlit") or verbete.get("translit"),
                    verbete.get("pron"),
                    (verbete.get("strongs_def") or "").strip(),
                    (verbete.get("derivation") or "").strip(),
                ),
            )
            total_verbetes += 1

    # ------------------------------------------------- palavras do texto
    total_palavras = 0
    sem_strong = 0
    for arquivo in sorted(os.listdir(pasta_textos)):
        caminho = os.path.join(pasta_textos, arquivo)
        if arquivo.startswith("gnt"):
            leitor = ler_grego(caminho)
        elif arquivo.startswith("hot"):
            leitor = ler_hebraico(caminho)
        else:
            continue

        for registro in leitor:
            try:
                cur.execute(
                    "insert or replace into palavras values (?,?,?,?,?,?,?,?,?,?,?)", registro
                )
            except sqlite3.Error:
                continue
            total_palavras += 1
            if not registro[6]:
                sem_strong += 1

    conexao.commit()
    cur.execute("vacuum")
    conexao.close()

    print(f"{total_verbetes:,} verbetes de Strong")
    print(f"{total_palavras:,} palavras no original ({sem_strong:,} sem número de Strong)")
    print(f"banco: {os.path.getsize(banco) / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(__doc__)
        raise SystemExit(1)
    gerar(sys.argv[1], sys.argv[2], sys.argv[3])
