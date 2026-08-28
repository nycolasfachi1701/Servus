-- =====================================================================
-- Servus — Migration 004: paleta azul/cinza/branco
-- Atualiza a cor padrão do sistema (era vinho) nas instalações existentes.
-- =====================================================================

alter table public.configuracoes alter column cor_primaria set default '#1E5AA8';
update public.configuracoes set cor_primaria = '#1E5AA8' where cor_primaria = '#8A1C3B';

alter table public.ministerios alter column cor set default '#1E5AA8';
update public.ministerios set cor = '#1E5AA8' where cor = '#8A1C3B';
