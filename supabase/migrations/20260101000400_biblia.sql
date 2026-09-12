-- =====================================================================
-- Servus — Migration 005: anotações e destaques da Bíblia
--
-- O texto bíblico vive dentro do app (SQLite embutido, offline). Aqui
-- ficam apenas as marcações de cada pessoa, para sincronizar entre
-- aparelhos e não se perder ao trocar de celular.
-- =====================================================================

create table public.biblia_anotacoes (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  livro         smallint not null check (livro between 1 and 66),
  capitulo      smallint not null check (capitulo > 0),
  versiculo     smallint not null check (versiculo > 0),
  -- destaque (amarelo, verde, azul…) e/ou anotação escrita
  cor           text,
  texto         text,
  -- guardados junto para listar as anotações sem abrir o banco da Bíblia
  referencia    text not null,
  trecho        text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint biblia_anotacoes_conteudo check (cor is not null or texto is not null),
  unique (usuario_id, livro, capitulo, versiculo)
);

create index biblia_anotacoes_usuario_idx
  on public.biblia_anotacoes (usuario_id, livro, capitulo);

create trigger biblia_anotacoes_atualizado_em before update on public.biblia_anotacoes
  for each row execute function public.set_atualizado_em();

-- ------------------------------------------------------------ RLS
-- Anotação é pessoal: ninguém mais vê, nem a liderança.
alter table public.biblia_anotacoes enable row level security;

create policy biblia_anotacoes_proprias on public.biblia_anotacoes for all to authenticated
  using (usuario_id = auth.uid())
  with check (usuario_id = auth.uid());
