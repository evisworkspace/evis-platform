-- ============================================
-- LIMPEZA TOTAL DO BANCO - RESET COMPLETO
-- ============================================
-- ⚠️ ATENÇÃO: Este script DELETA TODOS os dados
-- Use apenas para reset completo
-- ============================================

-- Deletar em ordem (respeitando FKs)
DELETE FROM public.fotos;
DELETE FROM public.pendencias;
DELETE FROM public.notas;
DELETE FROM public.diario_obra;
DELETE FROM public.equipes_presenca;
DELETE FROM public.servicos;
DELETE FROM public.equipes_cadastro;
DELETE FROM public.obras;

-- Alias global NÃO é deletado (conhecimento compartilhado)
-- DELETE FROM public.alias_conhecimento;

-- Confirmar limpeza
SELECT
  'obras' AS tabela, COUNT(*) AS registros FROM public.obras
UNION ALL
SELECT 'servicos', COUNT(*) FROM public.servicos
UNION ALL
SELECT 'equipes_cadastro', COUNT(*) FROM public.equipes_cadastro
UNION ALL
SELECT 'equipes_presenca', COUNT(*) FROM public.equipes_presenca
UNION ALL
SELECT 'diario_obra', COUNT(*) FROM public.diario_obra
UNION ALL
SELECT 'notas', COUNT(*) FROM public.notas
UNION ALL
SELECT 'pendencias', COUNT(*) FROM public.pendencias
UNION ALL
SELECT 'fotos', COUNT(*) FROM public.fotos;

-- ============================================
-- Resultado esperado: TUDO em 0 (exceto alias_conhecimento)
-- ============================================
