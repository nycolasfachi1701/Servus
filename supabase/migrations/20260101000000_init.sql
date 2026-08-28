-- =====================================================================
-- Servus — Sistema de gestão da igreja
-- Migration 001: schema base (tabelas, views e funções auxiliares)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- tipos
create type public.papel_usuario as enum ('admin', 'lider', 'membro');
create type public.status_pessoa as enum ('ativo', 'afastado', 'visitante', 'inativo');
create type public.estado_civil as enum ('solteiro', 'casado', 'divorciado', 'viuvo', 'uniao_estavel', 'nao_informado');

-- ------------------------------------------------------- util: updated_at
create or replace function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

-- -------------------------------------------------------------- pessoas
create table public.pessoas (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null check (length(btrim(nome)) > 0),
  foto_url      text,
  telefone      text,
  email         text,
  nascimento    date,
  batismo       date,
  endereco      text,
  estado_civil  public.estado_civil not null default 'nao_informado',
  status        public.status_pessoa not null default 'ativo',
  observacoes   text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index pessoas_nome_idx on public.pessoas (lower(nome));
create index pessoas_status_idx on public.pessoas (status);
create unique index pessoas_email_idx on public.pessoas (lower(email)) where email is not null;
create trigger pessoas_atualizado_em before update on public.pessoas
  for each row execute function public.set_atualizado_em();

-- ------------------------------------------------------------- usuarios
-- Liga um usuário do Supabase Auth a um registro de pessoa + papel.
create table public.usuarios (
  id            uuid primary key references auth.users (id) on delete cascade,
  pessoa_id     uuid unique references public.pessoas (id) on delete set null,
  papel         public.papel_usuario not null default 'membro',
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create trigger usuarios_atualizado_em before update on public.usuarios
  for each row execute function public.set_atualizado_em();

-- ------------------------------------------------------------- convites
-- Um admin pré-autoriza um e-mail; ao se cadastrar, o usuário já nasce
-- com o papel e a pessoa corretos (sem precisar de service role key).
create table public.convites (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  papel      public.papel_usuario not null default 'membro',
  pessoa_id  uuid references public.pessoas (id) on delete cascade,
  criado_em  timestamptz not null default now(),
  usado_em   timestamptz
);
create unique index convites_email_idx on public.convites (lower(email)) where usado_em is null;

-- ---------------------------------------------------------- ministerios
create table public.ministerios (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null unique,
  cor           text not null default '#1E5AA8',
  descricao     text,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create trigger ministerios_atualizado_em before update on public.ministerios
  for each row execute function public.set_atualizado_em();

create table public.ministerio_lideres (
  ministerio_id uuid not null references public.ministerios (id) on delete cascade,
  pessoa_id     uuid not null references public.pessoas (id) on delete cascade,
  primary key (ministerio_id, pessoa_id)
);

-- -------------------------------------------------------------- funcoes
-- Funções/instrumentos dentro de um ministério (violão, teclado, voz...).
create table public.funcoes (
  id            uuid primary key default gen_random_uuid(),
  ministerio_id uuid not null references public.ministerios (id) on delete cascade,
  nome          text not null,
  criado_em     timestamptz not null default now(),
  unique (ministerio_id, nome)
);

create table public.pessoa_funcao (
  pessoa_id uuid not null references public.pessoas (id) on delete cascade,
  funcao_id uuid not null references public.funcoes (id) on delete cascade,
  primary key (pessoa_id, funcao_id)
);
create index pessoa_funcao_funcao_idx on public.pessoa_funcao (funcao_id);

-- ---------------------------------------------------------- tipos_culto
create table public.tipos_culto (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  dia_semana    smallint not null check (dia_semana between 0 and 6), -- 0 = domingo
  horario       time not null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create trigger tipos_culto_atualizado_em before update on public.tipos_culto
  for each row execute function public.set_atualizado_em();

create table public.tipo_culto_vaga (
  id            uuid primary key default gen_random_uuid(),
  tipo_culto_id uuid not null references public.tipos_culto (id) on delete cascade,
  funcao_id     uuid not null references public.funcoes (id) on delete cascade,
  quantidade    smallint not null default 1 check (quantidade between 1 and 20),
  unique (tipo_culto_id, funcao_id)
);

-- --------------------------------------------------------------- cultos
-- Ocorrência concreta de um culto (recorrente ou avulso).
create table public.cultos (
  id            uuid primary key default gen_random_uuid(),
  tipo_culto_id uuid references public.tipos_culto (id) on delete set null,
  titulo        text,
  data          date not null,
  horario       time not null,
  observacao    text,
  finalizado_em timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint cultos_titulo_ou_tipo check (tipo_culto_id is not null or titulo is not null)
);
create unique index cultos_tipo_data_idx on public.cultos (tipo_culto_id, data)
  where tipo_culto_id is not null;
create index cultos_data_idx on public.cultos (data);
create trigger cultos_atualizado_em before update on public.cultos
  for each row execute function public.set_atualizado_em();

-- ------------------------------------------------------- disponibilidade
create table public.disponibilidade (
  pessoa_id  uuid not null references public.pessoas (id) on delete cascade,
  culto_id   uuid not null references public.cultos (id) on delete cascade,
  disponivel boolean not null default true,
  observacao text,
  criado_em  timestamptz not null default now(),
  primary key (pessoa_id, culto_id)
);
create index disponibilidade_culto_idx on public.disponibilidade (culto_id);

-- --------------------------------------------------------- escala_itens
create table public.escala_itens (
  id            uuid primary key default gen_random_uuid(),
  culto_id      uuid not null references public.cultos (id) on delete cascade,
  funcao_id     uuid not null references public.funcoes (id) on delete cascade,
  pessoa_id     uuid references public.pessoas (id) on delete set null,
  confirmado    boolean not null default false,
  confirmado_em timestamptz,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index escala_itens_culto_idx on public.escala_itens (culto_id);
create index escala_itens_pessoa_idx on public.escala_itens (pessoa_id);
-- Uma pessoa não pode ocupar duas vagas da mesma função no mesmo culto.
create unique index escala_itens_unicos_idx on public.escala_itens (culto_id, funcao_id, pessoa_id)
  where pessoa_id is not null;
create trigger escala_itens_atualizado_em before update on public.escala_itens
  for each row execute function public.set_atualizado_em();

-- -------------------------------------------------------------- eventos
create table public.eventos (
  id             uuid primary key default gen_random_uuid(),
  titulo         text not null,
  inicio         timestamptz not null,
  fim            timestamptz,
  local          text,
  ministerio_id  uuid references public.ministerios (id) on delete set null,
  responsavel_id uuid references public.pessoas (id) on delete set null,
  descricao      text,
  imagem_url     text,
  criado_em      timestamptz not null default now(),
  atualizado_em  timestamptz not null default now(),
  constraint eventos_periodo check (fim is null or fim >= inicio)
);
create index eventos_inicio_idx on public.eventos (inicio);
create trigger eventos_atualizado_em before update on public.eventos
  for each row execute function public.set_atualizado_em();

-- -------------------------------------------------------- configuracoes
create table public.configuracoes (
  id                  smallint primary key default 1 check (id = 1),
  nome_igreja         text not null default 'Servus',
  logo_url            text,
  cor_primaria        text not null default '#1E5AA8',
  mensagem_titulo     text not null default 'Escala de {periodo}',
  mensagem_despedida  text not null default 'Deus abençoe! Qualquer imprevisto, avise a liderança.',
  limite_escalas_mes  smallint not null default 6 check (limite_escalas_mes between 1 and 31),
  peso_rodizio        smallint not null default 10,
  peso_preferencia    smallint not null default 3,
  peso_dupla          smallint not null default 2,
  atualizado_em       timestamptz not null default now()
);
insert into public.configuracoes (id) values (1) on conflict do nothing;
create trigger configuracoes_atualizado_em before update on public.configuracoes
  for each row execute function public.set_atualizado_em();

-- ============================================================== helpers
-- Funções SECURITY DEFINER: usadas nas policies sem cair em recursão.
create or replace function public.papel_atual()
returns public.papel_usuario
language sql stable security definer set search_path = public
as $$ select u.papel from public.usuarios u where u.id = auth.uid(); $$;

create or replace function public.pessoa_atual()
returns uuid
language sql stable security definer set search_path = public
as $$ select u.pessoa_id from public.usuarios u where u.id = auth.uid(); $$;

create or replace function public.eh_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.papel_atual() = 'admin', false); $$;

create or replace function public.eh_lideranca()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.papel_atual() in ('admin', 'lider'), false); $$;

create or replace function public.lidera_ministerio(p_ministerio uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.eh_admin() or exists (
    select 1 from public.ministerio_lideres ml
    where ml.ministerio_id = p_ministerio
      and ml.pessoa_id = public.pessoa_atual()
  );
$$;

create or replace function public.lidera_funcao(p_funcao uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.eh_admin() or exists (
    select 1
    from public.funcoes f
    join public.ministerio_lideres ml on ml.ministerio_id = f.ministerio_id
    where f.id = p_funcao and ml.pessoa_id = public.pessoa_atual()
  );
$$;

-- ================================================================ views
-- Diretório mínimo visível a qualquer usuário autenticado (LGPD: sem
-- telefone, endereço, datas ou observações).
create view public.pessoas_publicas with (security_invoker = false) as
  select p.id, p.nome, p.foto_url, p.status
  from public.pessoas p;

-- Carga do rodízio: só conta o que realmente aconteceu (culto finalizado).
create view public.rodizio_carga with (security_invoker = false) as
  select ei.pessoa_id,
         ei.funcao_id,
         count(*)::int as total,
         max(c.data)   as ultima_data
  from public.escala_itens ei
  join public.cultos c on c.id = ei.culto_id
  where ei.pessoa_id is not null
    and c.finalizado_em is not null
  group by ei.pessoa_id, ei.funcao_id;

revoke all on public.pessoas_publicas from anon;
revoke all on public.rodizio_carga from anon;
grant select on public.pessoas_publicas to authenticated;
grant select on public.rodizio_carga to authenticated;

-- ============================================================= triggers
-- Novo usuário do Auth: consome convite, liga a uma pessoa e define papel.
-- O primeiro usuário do sistema vira admin automaticamente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_convite public.convites%rowtype;
  v_pessoa  uuid;
  v_papel   public.papel_usuario := 'membro';
  v_primeiro boolean;
begin
  select not exists (select 1 from public.usuarios) into v_primeiro;

  select * into v_convite
  from public.convites
  where lower(email) = lower(new.email) and usado_em is null
  limit 1;

  if v_convite.id is not null then
    v_papel  := v_convite.papel;
    v_pessoa := v_convite.pessoa_id;
    update public.convites set usado_em = now() where id = v_convite.id;
  end if;

  if v_pessoa is null then
    select id into v_pessoa from public.pessoas where lower(email) = lower(new.email) limit 1;
  end if;

  if v_pessoa is null then
    insert into public.pessoas (nome, email)
    values (coalesce(nullif(btrim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)), new.email)
    returning id into v_pessoa;
  end if;

  if v_primeiro then
    v_papel := 'admin';
  end if;

  insert into public.usuarios (id, pessoa_id, papel)
  values (new.id, v_pessoa, v_papel)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Membro só pode mexer na própria confirmação de presença.
create or replace function public.guard_escala_item()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if public.eh_admin() or public.lidera_funcao(new.funcao_id) then
    return new;
  end if;
  if new.culto_id is distinct from old.culto_id
     or new.funcao_id is distinct from old.funcao_id
     or new.pessoa_id is distinct from old.pessoa_id then
    raise exception 'Sem permissão: só a confirmação de presença pode ser alterada.';
  end if;
  new.confirmado_em := case when new.confirmado then now() else null end;
  return new;
end;
$$;

create trigger escala_itens_guard before update on public.escala_itens
  for each row execute function public.guard_escala_item();
