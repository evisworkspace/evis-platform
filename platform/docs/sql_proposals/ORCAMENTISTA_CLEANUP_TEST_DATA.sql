-- ============================================================
-- ORCAMENTISTA — Limpeza de Resíduo de Teste
-- ============================================================
-- ATENÇÃO: Executar SOMENTE após:
--   1. Confirmar quantidade de linhas com os SELECTs abaixo
--   2. Exportar backup via Supabase Dashboard (Table Editor → Export)
--   3. Receber confirmação explícita ("confirmo") do operador humano
--
-- Projeto: EVIS AI (Supabase main)
-- Criado em: 2026-05-17
-- Fase 2 do refactor EVIS_ORCAMENTISTA_PRODUTO_LAB_REFACTOR_AUTONOMOUS.md
-- ============================================================

-- ============================================================
-- PASSO 0 — AUDITORIA (executar primeiro, não modifica dados)
-- ============================================================

-- A. Contar itens de orçamento com origem de teste
SELECT COUNT(*) AS total_itens_teste,
       origem,
       descricao
FROM orcamento_itens
WHERE origem IN ('manual_test', 'consolidated_preview_mock')
   OR descricao = 'Item Teste Manual'
GROUP BY origem, descricao
ORDER BY total_itens_teste DESC;

-- B. Contar oportunidades de teste
SELECT COUNT(*) AS total_oportunidades_teste, status
FROM oportunidades
WHERE titulo ILIKE '%UI_MANUAL_RUN%'
   OR titulo ILIKE '%Manual Run Opportunity%'
   OR titulo ILIKE '%TEST%'
GROUP BY status;

-- C. Contar arquivos vinculados a oportunidades de teste
SELECT COUNT(*) AS total_arquivos_teste
FROM opportunity_files f
WHERE f.opportunity_id IN (
  SELECT id FROM oportunidades
  WHERE titulo ILIKE '%UI_MANUAL_RUN%'
     OR titulo ILIKE '%Manual Run Opportunity%'
     OR titulo ILIKE '%TEST%'
);

-- D. Listar IDs exatos das oportunidades de teste (para confirmar antes de deletar)
SELECT id, titulo, status, created_at
FROM oportunidades
WHERE titulo ILIKE '%UI_MANUAL_RUN%'
   OR titulo ILIKE '%Manual Run Opportunity%'
   OR titulo ILIKE '%TEST%'
ORDER BY created_at DESC;

-- ============================================================
-- PASSO 1 — LIMPEZA DE ITENS DE ORÇAMENTO DE TESTE
-- ============================================================
-- Deletar apenas itens com origem de teste ou descrição de teste.
-- NÃO afeta itens com origem 'manual', 'sinapi' ou 'ia' reais.

/*
DELETE FROM orcamento_itens
WHERE origem IN ('manual_test', 'consolidated_preview_mock')
   OR descricao = 'Item Teste Manual';
*/

-- ============================================================
-- PASSO 2 — LIMPEZA DE ARQUIVOS VINCULADOS A OPORTUNIDADES DE TESTE
-- ============================================================
-- Executar ANTES de deletar as oportunidades (FK constraint).

/*
DELETE FROM opportunity_files
WHERE opportunity_id IN (
  SELECT id FROM oportunidades
  WHERE titulo ILIKE '%UI_MANUAL_RUN%'
     OR titulo ILIKE '%Manual Run Opportunity%'
     OR titulo ILIKE '%TEST%'
);
*/

-- ============================================================
-- PASSO 3 — LIMPEZA DE SNAPSHOTS DE CONTEXTO VINCULADOS
-- ============================================================
-- Se a tabela orc_context_snapshots existir e tiver registros de teste:

/*
DELETE FROM orc_context_snapshots
WHERE opportunity_id IN (
  SELECT id FROM oportunidades
  WHERE titulo ILIKE '%UI_MANUAL_RUN%'
     OR titulo ILIKE '%Manual Run Opportunity%'
     OR titulo ILIKE '%TEST%'
)
   OR context_snapshot_json::text ILIKE '%UI_MANUAL_RUN%'
   OR context_snapshot_json::text ILIKE '%manual_test%';
*/

-- ============================================================
-- PASSO 4 — LIMPEZA DE OPORTUNIDADES DE TESTE
-- ============================================================
-- Executar DEPOIS dos passos 1, 2, 3.

/*
DELETE FROM oportunidades
WHERE titulo ILIKE '%UI_MANUAL_RUN%'
   OR titulo ILIKE '%Manual Run Opportunity%'
   OR titulo ILIKE '%TEST%';
*/

-- ============================================================
-- PASSO 5 — VERIFICAÇÃO PÓS-LIMPEZA
-- ============================================================
-- Executar após cada DELETE para confirmar que os dados foram removidos.

/*
-- Verificar itens restantes de teste (deve retornar 0)
SELECT COUNT(*) FROM orcamento_itens
WHERE origem IN ('manual_test', 'consolidated_preview_mock')
   OR descricao = 'Item Teste Manual';

-- Verificar oportunidades de teste (deve retornar 0)
SELECT COUNT(*) FROM oportunidades
WHERE titulo ILIKE '%UI_MANUAL_RUN%'
   OR titulo ILIKE '%Manual Run Opportunity%'
   OR titulo ILIKE '%TEST%';
*/

-- ============================================================
-- NOTAS
-- ============================================================
-- 1. Ajuste os filtros ILIKE se o ambiente de teste usar nomes diferentes.
-- 2. O storage (Supabase Storage bucket 'opportunity-files') NÃO é limpo por SQL.
--    Arquivos físicos no storage devem ser removidos manualmente via Dashboard.
-- 3. Se FK constraints impedirem a exclusão, verificar dependências com:
--    SELECT constraint_name, table_name FROM information_schema.table_constraints
--    WHERE constraint_type = 'FOREIGN KEY';
-- ============================================================
