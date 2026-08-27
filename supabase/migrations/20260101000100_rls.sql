-- =====================================================================
-- Servus — Migration 002: Row Level Security
-- Princípio do menor privilégio: nenhuma policy é concedida ao papel
-- `anon`; tudo exige usuário autenticado e o papel adequado.
-- =====================================================================

alter table public.pessoas            enable row level security;
alter table public.usuarios           enable row level security;
alter table public.convites           enable row level security;
alter table public.ministerios        enable row level security;
alter table public.ministerio_lideres enable row level security;
alter table public.funcoes            enable row level security;
alter table public.pessoa_funcao      enable row level security;
alter table public.tipos_culto        enable row level security;
alter table public.tipo_culto_vaga    enable row level security;
alter table public.cultos             enable row level security;
alter table public.disponibilidade    enable row level security;
alter table public.escala_itens       enable row level security;
alter table public.eventos            enable row level security;
alter table public.configuracoes      enable row level security;

-- ------------------------------------------------------------- pessoas
-- Dado pessoal completo só para liderança; membro enxerga a si mesmo.
-- (o restante do sistema usa a view `pessoas_publicas` para nomes/fotos)
create policy pessoas_select on public.pessoas for select to authenticated
  using (public.eh_lideranca() or id = public.pessoa_atual());
create policy pessoas_insert on public.pessoas for insert to authenticated
  with check (public.eh_admin());
create policy pessoas_update on public.pessoas for update to authenticated
  using (public.eh_admin() or id = public.pessoa_atual())
  with check (public.eh_admin() or id = public.pessoa_atual());
create policy pessoas_delete on public.pessoas for delete to authenticated
  using (public.eh_admin());

-- ------------------------------------------------------------ usuarios
create policy usuarios_select on public.usuarios for select to authenticated
  using (public.eh_admin() or id = auth.uid());
create policy usuarios_insert on public.usuarios for insert to authenticated
  with check (public.eh_admin());
create policy usuarios_update on public.usuarios for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());
create policy usuarios_delete on public.usuarios for delete to authenticated
  using (public.eh_admin());

-- ------------------------------------------------------------ convites
create policy convites_all on public.convites for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- --------------------------------------------------------- ministerios
create policy ministerios_select on public.ministerios for select to authenticated
  using (true);
create policy ministerios_write on public.ministerios for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy ministerio_lideres_select on public.ministerio_lideres for select to authenticated
  using (true);
create policy ministerio_lideres_write on public.ministerio_lideres for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- ------------------------------------------------------------- funcoes
create policy funcoes_select on public.funcoes for select to authenticated
  using (true);
create policy funcoes_write on public.funcoes for all to authenticated
  using (public.lidera_ministerio(ministerio_id))
  with check (public.lidera_ministerio(ministerio_id));

create policy pessoa_funcao_select on public.pessoa_funcao for select to authenticated
  using (true);
create policy pessoa_funcao_write on public.pessoa_funcao for all to authenticated
  using (public.lidera_funcao(funcao_id))
  with check (public.lidera_funcao(funcao_id));

-- --------------------------------------------------------- tipos_culto
create policy tipos_culto_select on public.tipos_culto for select to authenticated
  using (true);
create policy tipos_culto_write on public.tipos_culto for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

create policy tipo_culto_vaga_select on public.tipo_culto_vaga for select to authenticated
  using (true);
create policy tipo_culto_vaga_write on public.tipo_culto_vaga for all to authenticated
  using (public.eh_admin()) with check (public.eh_admin());

-- -------------------------------------------------------------- cultos
create policy cultos_select on public.cultos for select to authenticated
  using (true);
create policy cultos_insert on public.cultos for insert to authenticated
  with check (public.eh_lideranca());
create policy cultos_update on public.cultos for update to authenticated
  using (public.eh_lideranca()) with check (public.eh_lideranca());
create policy cultos_delete on public.cultos for delete to authenticated
  using (public.eh_admin());

-- ------------------------------------------------------ disponibilidade
create policy disponibilidade_select on public.disponibilidade for select to authenticated
  using (public.eh_lideranca() or pessoa_id = public.pessoa_atual());
create policy disponibilidade_write on public.disponibilidade for all to authenticated
  using (public.eh_admin() or pessoa_id = public.pessoa_atual())
  with check (public.eh_admin() or pessoa_id = public.pessoa_atual());

-- -------------------------------------------------------- escala_itens
-- A escala é pública dentro da igreja: todos veem quem está escalado.
create policy escala_itens_select on public.escala_itens for select to authenticated
  using (true);
create policy escala_itens_insert on public.escala_itens for insert to authenticated
  with check (public.lidera_funcao(funcao_id));
create policy escala_itens_delete on public.escala_itens for delete to authenticated
  using (public.lidera_funcao(funcao_id));
-- Liderança edita a escala; o escalado só confirma presença (o trigger
-- `escala_itens_guard` impede que ele altere qualquer outra coluna).
create policy escala_itens_update on public.escala_itens for update to authenticated
  using (public.lidera_funcao(funcao_id) or pessoa_id = public.pessoa_atual())
  with check (public.lidera_funcao(funcao_id) or pessoa_id = public.pessoa_atual());

-- ------------------------------------------------------------- eventos
create policy eventos_select on public.eventos for select to authenticated
  using (true);
create policy eventos_write on public.eventos for all to authenticated
  using (public.eh_lideranca()) with check (public.eh_lideranca());

-- ------------------------------------------------------- configuracoes
create policy configuracoes_select on public.configuracoes for select to authenticated
  using (true);
create policy configuracoes_update on public.configuracoes for update to authenticated
  using (public.eh_admin()) with check (public.eh_admin());
