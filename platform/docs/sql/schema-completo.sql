-- ============================================
-- SCHEMA COMPLETO - UMA ÚNICA QUERY
-- ============================================
-- Execute e copie TODO o resultado
-- ============================================

SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'obras',
    'servicos',
    'equipes_cadastro',
    'equipes_presenca',
    'diario_obra',
    'notas',
    'pendencias',
    'fotos',
    'alias_conhecimento'
  )
ORDER BY table_name, ordinal_position;
