-- ============================================
-- DIAGNÓSTICO COMPLETO DO SCHEMA SUPABASE
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- Copie TODO o resultado e cole de volta
-- ============================================

-- BLOCO 1: Listar todas as tabelas
SELECT '=== BLOCO 1: TABELAS EXISTENTES ===' as info;
SELECT
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) AS tamanho,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) AS total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- BLOCO 2: Estrutura detalhada de cada tabela
SELECT '=== BLOCO 2: ESTRUTURA COMPLETA ===' as info;
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- BLOCO 3: Contagem de registros
SELECT '=== BLOCO 3: TOTAL DE REGISTROS ===' as info;
SELECT 'obras' AS tabela, COUNT(*) AS registros FROM obras
UNION ALL
SELECT 'servicos', COUNT(*) FROM servicos
UNION ALL
SELECT 'equipes_cadastro', COUNT(*) FROM equipes_cadastro
UNION ALL
SELECT 'equipes_presenca', COUNT(*) FROM equipes_presenca
UNION ALL
SELECT 'notas', COUNT(*) FROM notas
UNION ALL
SELECT 'pendencias', COUNT(*) FROM pendencias
UNION ALL
SELECT 'diario_obra', COUNT(*) FROM diario_obra
UNION ALL
SELECT 'fotos', COUNT(*) FROM fotos
UNION ALL
SELECT 'alias_conhecimento', COUNT(*) FROM alias_conhecimento;

-- BLOCO 4: Chaves estrangeiras
SELECT '=== BLOCO 4: FOREIGN KEYS ===' as info;
SELECT
  tc.table_name AS tabela_origem,
  kcu.column_name AS coluna,
  ccu.table_name AS tabela_destino,
  ccu.column_name AS coluna_destino
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- BLOCO 5: RLS Status
SELECT '=== BLOCO 5: ROW LEVEL SECURITY ===' as info;
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'ATIVO' ELSE 'DESATIVADO' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- BLOCO 6: Policies (se RLS ativo)
SELECT '=== BLOCO 6: POLICIES ATIVAS ===' as info;
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- BLOCO 7: Índices
SELECT '=== BLOCO 7: ÍNDICES ===' as info;
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- FINAL: Resumo Executivo
-- ============================================
SELECT '=== RESUMO EXECUTIVO ===' as info;
SELECT
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tabelas,
  (SELECT COUNT(*) FROM obras) as total_obras,
  (SELECT COUNT(*) FROM servicos) as total_servicos,
  (SELECT COUNT(*) FROM equipes_cadastro) as total_equipes,
  (SELECT COUNT(*) FROM alias_conhecimento) as total_aliases;
