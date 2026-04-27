-- ============================================
-- DESCOBERTA DE SCHEMA - EXECUTE UMA QUERY POR VEZ
-- ============================================
-- Copie e execute cada bloco separadamente
-- Cole o resultado de CADA query aqui
-- ============================================

-- QUERY 1: Listar todas as tabelas
-- ============================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


-- QUERY 2: Estrutura da tabela OBRAS
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'obras'
ORDER BY ordinal_position;


-- QUERY 3: Estrutura da tabela SERVICOS
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'servicos'
ORDER BY ordinal_position;


-- QUERY 4: Estrutura da tabela EQUIPES_CADASTRO
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'equipes_cadastro'
ORDER BY ordinal_position;


-- QUERY 5: Estrutura da tabela EQUIPES_PRESENCA
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'equipes_presenca'
ORDER BY ordinal_position;


-- QUERY 6: Estrutura da tabela DIARIO_OBRA
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'diario_obra'
ORDER BY ordinal_position;


-- QUERY 7: Estrutura da tabela NOTAS
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'notas'
ORDER BY ordinal_position;


-- QUERY 8: Estrutura da tabela PENDENCIAS
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'pendencias'
ORDER BY ordinal_position;


-- QUERY 9: Estrutura da tabela FOTOS
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'fotos'
ORDER BY ordinal_position;


-- QUERY 10: Estrutura da tabela ALIAS_CONHECIMENTO
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'alias_conhecimento'
ORDER BY ordinal_position;


-- QUERY 11: Foreign Keys
-- ============================================
SELECT
  tc.table_name AS tabela,
  kcu.column_name AS coluna,
  ccu.table_name AS referencia_tabela,
  ccu.column_name AS referencia_coluna
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;
