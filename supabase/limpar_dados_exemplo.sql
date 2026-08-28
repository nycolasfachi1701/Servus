-- =====================================================================
-- Servus — Limpeza dos dados de exemplo
--
-- Apaga TODO o conteúdo operacional (membros, ministérios, funções,
-- cultos, escalas, disponibilidades e eventos) para a igreja começar do
-- zero com os dados reais.
--
-- O que é PRESERVADO:
--   • seus acessos (auth.users e public.usuarios) e o papel de cada um;
--   • a pessoa ligada a cada acesso — senão você perderia o vínculo do
--     seu próprio login com o cadastro de membro;
--   • as configurações da igreja (nome, logo, cor, mensagem, pesos).
--
-- Rode no SQL Editor do Supabase. É uma transação: ou tudo, ou nada.
-- =====================================================================

begin;

-- 1. escalas e tudo que depende de um culto
delete from public.escala_itens;
delete from public.disponibilidade;
delete from public.cultos;

-- 2. tipos de culto e suas vagas
delete from public.tipo_culto_vaga;
delete from public.tipos_culto;

-- 3. programação
delete from public.eventos;

-- 4. ministérios, funções e vínculos
delete from public.pessoa_funcao;
delete from public.funcoes;
delete from public.ministerio_lideres;
delete from public.ministerios;

-- 5. pessoas — menos as que têm acesso ao sistema (você e sua liderança)
delete from public.pessoas p
where not exists (
  select 1 from public.usuarios u where u.pessoa_id = p.id
);

-- 6. convites de exemplo que nunca foram usados
delete from public.convites where usado_em is null;

commit;

-- ------------------------------------------------------- conferência
select
  (select count(*) from public.pessoas)         as pessoas_restantes,
  (select count(*) from public.usuarios)        as acessos,
  (select count(*) from public.ministerios)     as ministerios,
  (select count(*) from public.funcoes)         as funcoes,
  (select count(*) from public.tipos_culto)     as tipos_culto,
  (select count(*) from public.cultos)          as cultos,
  (select count(*) from public.escala_itens)    as escala_itens,
  (select count(*) from public.eventos)         as eventos;
