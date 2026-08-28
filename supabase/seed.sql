-- =====================================================================
-- Servus — Seed de demonstração
-- Roda com o papel `postgres` (SQL Editor do Supabase ou `supabase db reset`),
-- portanto ignora RLS. Seguro de rodar mais de uma vez.
-- =====================================================================

update public.configuracoes
   set nome_igreja = 'Igreja Videira',
       mensagem_titulo = 'Escala — {periodo}',
       mensagem_despedida = 'Deus abençoe! Qualquer imprevisto, avise a liderança com antecedência.'
 where id = 1;

-- ------------------------------------------------------------- pessoas
insert into public.pessoas (id, nome, telefone, email, nascimento, batismo, estado_civil, status) values
  ('a0000000-0000-4000-8000-000000000001', 'Ana Beatriz Souza',    '+5511990000001', 'ana@exemplo.com',      '1994-03-12', '2012-04-08', 'solteiro',      'ativo'),
  ('a0000000-0000-4000-8000-000000000002', 'Bruno Carvalho',       '+5511990000002', 'bruno@exemplo.com',    '1988-07-25', '2009-12-20', 'casado',        'ativo'),
  ('a0000000-0000-4000-8000-000000000003', 'Camila Ferreira',      '+5511990000003', 'camila@exemplo.com',   '1999-01-05', '2018-06-17', 'solteiro',      'ativo'),
  ('a0000000-0000-4000-8000-000000000004', 'Daniel Rocha',         '+5511990000004', 'daniel@exemplo.com',   '1985-11-30', '2005-03-27', 'casado',        'ativo'),
  ('a0000000-0000-4000-8000-000000000005', 'Eduarda Lima',         '+5511990000005', 'eduarda@exemplo.com',  '2001-09-14', '2019-11-10', 'solteiro',      'ativo'),
  ('a0000000-0000-4000-8000-000000000006', 'Felipe Andrade',       '+5511990000006', 'felipe@exemplo.com',   '1992-05-02', '2014-08-24', 'uniao_estavel', 'ativo'),
  ('a0000000-0000-4000-8000-000000000007', 'Gabriela Martins',     '+5511990000007', 'gabriela@exemplo.com', '1997-12-19', '2016-05-15', 'solteiro',      'ativo'),
  ('a0000000-0000-4000-8000-000000000008', 'Henrique Batista',     '+5511990000008', 'henrique@exemplo.com', '1990-02-08', '2011-09-11', 'casado',        'ativo'),
  ('a0000000-0000-4000-8000-000000000009', 'Isabela Nunes',        '+5511990000009', 'isabela@exemplo.com',  '1996-06-21', '2015-10-04', 'solteiro',      'ativo'),
  ('a0000000-0000-4000-8000-000000000010', 'João Pedro Alves',     '+5511990000010', 'joao@exemplo.com',     '1983-08-17', '2003-07-06', 'casado',        'ativo'),
  ('a0000000-0000-4000-8000-000000000011', 'Karina Dias',          '+5511990000011', 'karina@exemplo.com',   '2000-04-27', '2020-02-16', 'solteiro',      'ativo'),
  ('a0000000-0000-4000-8000-000000000012', 'Lucas Moreira',        '+5511990000012', 'lucas@exemplo.com',    '1995-10-09', '2013-11-03', 'solteiro',      'ativo'),
  ('a0000000-0000-4000-8000-000000000013', 'Mariana Teixeira',     '+5511990000013', 'mariana@exemplo.com',  '1987-01-23', '2008-04-13', 'casado',        'ativo'),
  ('a0000000-0000-4000-8000-000000000014', 'Nathan Ribeiro',       '+5511990000014', 'nathan@exemplo.com',   '2003-03-03', '2021-08-29', 'solteiro',      'ativo'),
  ('a0000000-0000-4000-8000-000000000015', 'Priscila Gomes',       '+5511990000015', 'priscila@exemplo.com', '1991-09-30', '2010-06-20', 'casado',        'afastado'),
  ('a0000000-0000-4000-8000-000000000016', 'Rafael Monteiro',      '+5511990000016', 'rafael@exemplo.com',   '1998-07-11', null,         'solteiro',      'visitante')
on conflict (id) do nothing;

-- --------------------------------------------------------- ministérios
insert into public.ministerios (id, nome, cor, descricao) values
  ('b0000000-0000-4000-8000-000000000001', 'Louvor',    '#1E5AA8', 'Ministério de música e adoração'),
  ('b0000000-0000-4000-8000-000000000002', 'Som e Mídia','#0E7C86', 'Mesa de som, projeção e transmissão'),
  ('b0000000-0000-4000-8000-000000000003', 'Recepção',  '#2E9E6B', 'Acolhimento e recepção'),
  ('b0000000-0000-4000-8000-000000000004', 'Infantil',  '#E0A32E', 'Ministério com crianças'),
  ('b0000000-0000-4000-8000-000000000005', 'Diaconato', '#6B5BD2', 'Serviço, ceia e ordem do culto')
on conflict (id) do nothing;

insert into public.ministerio_lideres (ministerio_id, pessoa_id) values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004'),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000008')
on conflict do nothing;

-- ------------------------------------------------------------- funções
insert into public.funcoes (id, ministerio_id, nome) values
  ('c0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001', 'Violão'),
  ('c0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Guitarra'),
  ('c0000000-0000-4000-8000-000000000003', 'b0000000-0000-4000-8000-000000000001', 'Baixo'),
  ('c0000000-0000-4000-8000-000000000004', 'b0000000-0000-4000-8000-000000000001', 'Teclado'),
  ('c0000000-0000-4000-8000-000000000005', 'b0000000-0000-4000-8000-000000000001', 'Bateria'),
  ('c0000000-0000-4000-8000-000000000006', 'b0000000-0000-4000-8000-000000000001', 'Voz principal'),
  ('c0000000-0000-4000-8000-000000000007', 'b0000000-0000-4000-8000-000000000001', 'Back vocal'),
  ('c0000000-0000-4000-8000-000000000008', 'b0000000-0000-4000-8000-000000000002', 'Mesa de som'),
  ('c0000000-0000-4000-8000-000000000009', 'b0000000-0000-4000-8000-000000000002', 'Projeção'),
  ('c0000000-0000-4000-8000-000000000010', 'b0000000-0000-4000-8000-000000000003', 'Recepção'),
  ('c0000000-0000-4000-8000-000000000011', 'b0000000-0000-4000-8000-000000000004', 'Professor(a)'),
  ('c0000000-0000-4000-8000-000000000012', 'b0000000-0000-4000-8000-000000000005', 'Diácono(a)')
on conflict (id) do nothing;

insert into public.pessoa_funcao (pessoa_id, funcao_id) values
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000006'),
  ('a0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000007'),
  ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000006'),
  ('a0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000007'),
  ('a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000004'),
  ('a0000000-0000-4000-8000-000000000004', 'c0000000-0000-4000-8000-000000000001'),
  ('a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000007'),
  ('a0000000-0000-4000-8000-000000000005', 'c0000000-0000-4000-8000-000000000011'),
  ('a0000000-0000-4000-8000-000000000006', 'c0000000-0000-4000-8000-000000000005'),
  ('a0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000006'),
  ('a0000000-0000-4000-8000-000000000007', 'c0000000-0000-4000-8000-000000000009'),
  ('a0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000008'),
  ('a0000000-0000-4000-8000-000000000008', 'c0000000-0000-4000-8000-000000000009'),
  ('a0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000007'),
  ('a0000000-0000-4000-8000-000000000009', 'c0000000-0000-4000-8000-000000000010'),
  ('a0000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000010', 'c0000000-0000-4000-8000-000000000012'),
  ('a0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000004'),
  ('a0000000-0000-4000-8000-000000000011', 'c0000000-0000-4000-8000-000000000007'),
  ('a0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000002'),
  ('a0000000-0000-4000-8000-000000000012', 'c0000000-0000-4000-8000-000000000005'),
  ('a0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000010'),
  ('a0000000-0000-4000-8000-000000000013', 'c0000000-0000-4000-8000-000000000011'),
  ('a0000000-0000-4000-8000-000000000014', 'c0000000-0000-4000-8000-000000000003'),
  ('a0000000-0000-4000-8000-000000000014', 'c0000000-0000-4000-8000-000000000008'),
  ('a0000000-0000-4000-8000-000000000015', 'c0000000-0000-4000-8000-000000000010'),
  ('a0000000-0000-4000-8000-000000000016', 'c0000000-0000-4000-8000-000000000012')
on conflict do nothing;

-- --------------------------------------------------------- tipos de culto
insert into public.tipos_culto (id, nome, dia_semana, horario) values
  ('d0000000-0000-4000-8000-000000000001', 'Domingo Manhã', 0, '09:00'),
  ('d0000000-0000-4000-8000-000000000002', 'Domingo Noite', 0, '19:00'),
  ('d0000000-0000-4000-8000-000000000003', 'Quarta de Oração', 3, '20:00')
on conflict (id) do nothing;

insert into public.tipo_culto_vaga (tipo_culto_id, funcao_id, quantidade) values
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000001', 1),
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000004', 1),
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000005', 1),
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000006', 1),
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000007', 2),
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000008', 1),
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000009', 1),
  ('d0000000-0000-4000-8000-000000000001', 'c0000000-0000-4000-8000-000000000010', 2),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000002', 1),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000003', 1),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000004', 1),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000005', 1),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000006', 1),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000007', 2),
  ('d0000000-0000-4000-8000-000000000002', 'c0000000-0000-4000-8000-000000000008', 1),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000001', 1),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000006', 1),
  ('d0000000-0000-4000-8000-000000000003', 'c0000000-0000-4000-8000-000000000008', 1)
on conflict do nothing;

-- ------------------------------- cultos das últimas e próximas semanas
do $$
declare
  v_domingo date := current_date - ((extract(dow from current_date))::int);  -- domingo desta semana
  v_quarta  date;
  v_semana  int;
begin
  for v_semana in -3..3 loop
    -- domingo manhã e noite
    insert into public.cultos (tipo_culto_id, data, horario)
    values ('d0000000-0000-4000-8000-000000000001', v_domingo + (v_semana * 7), '09:00')
    on conflict do nothing;

    insert into public.cultos (tipo_culto_id, data, horario)
    values ('d0000000-0000-4000-8000-000000000002', v_domingo + (v_semana * 7), '19:00')
    on conflict do nothing;

    -- quarta da mesma semana
    v_quarta := v_domingo + (v_semana * 7) + 3;
    insert into public.cultos (tipo_culto_id, data, horario)
    values ('d0000000-0000-4000-8000-000000000003', v_quarta, '20:00')
    on conflict do nothing;
  end loop;
end $$;

-- Histórico: escala preenchida e culto finalizado para os cultos passados,
-- para o rodízio já nascer com carga acumulada realista.
insert into public.escala_itens (culto_id, funcao_id, pessoa_id, confirmado, confirmado_em)
select c.id, v.funcao_id, cand.pessoa_id, true, now()
from public.cultos c
join public.tipo_culto_vaga v on v.tipo_culto_id = c.tipo_culto_id
join lateral (
  select pf.pessoa_id
  from public.pessoa_funcao pf
  join public.pessoas p on p.id = pf.pessoa_id and p.status = 'ativo'
  where pf.funcao_id = v.funcao_id
  order by md5(c.id::text || pf.pessoa_id::text)
  limit v.quantidade
) cand on true
where c.data < current_date
  and not exists (select 1 from public.escala_itens ei where ei.culto_id = c.id)
on conflict do nothing;

update public.cultos
   set finalizado_em = (data + horario)::timestamptz
 where data < current_date and finalizado_em is null;

-- Uma indisponibilidade de exemplo no próximo domingo
insert into public.disponibilidade (pessoa_id, culto_id, disponivel, observacao)
select 'a0000000-0000-4000-8000-000000000002', c.id, false, 'Viagem a trabalho'
from public.cultos c
where c.data > current_date
order by c.data, c.horario
limit 1
on conflict do nothing;

-- -------------------------------------------------------------- eventos
do $$
begin
  if not exists (select 1 from public.eventos) then
    insert into public.eventos (titulo, inicio, fim, local, ministerio_id, responsavel_id, descricao) values
      ('Ensaio geral do louvor', (current_date + 5 + time '19:30')::timestamptz, (current_date + 5 + time '21:30')::timestamptz, 'Templo — sala de música', 'b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000004', 'Ensaio das músicas do domingo.'),
      ('Congresso de Jovens',    (current_date + 20 + time '19:00')::timestamptz, (current_date + 22 + time '22:00')::timestamptz, 'Templo sede', null, 'a0000000-0000-4000-8000-000000000010', 'Três noites de congresso com preletor convidado.'),
      ('Batismos',               (current_date + 34 + time '16:00')::timestamptz, null, 'Chácara Betel', 'b0000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000013', 'Batismo dos novos membros.');
  end if;
end $$;
