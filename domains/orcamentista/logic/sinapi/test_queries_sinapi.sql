-- ============================================
-- VALIDACAO BASICA - PR / SEM DESONERACAO
-- ============================================

SELECT COUNT(*) AS total_registros
FROM public.sinapi_composicoes
WHERE uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO';

SELECT categoria, COUNT(*) AS total
FROM public.sinapi_composicoes
WHERE uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
GROUP BY categoria
ORDER BY total DESC, categoria;

SELECT
  COUNT(*) FILTER (WHERE codigo IS NULL OR btrim(codigo) = '') AS sem_codigo,
  COUNT(*) FILTER (WHERE descricao IS NULL OR btrim(descricao) = '') AS sem_descricao,
  COUNT(*) FILTER (WHERE unidade IS NULL OR btrim(unidade) = '') AS sem_unidade,
  COUNT(*) FILTER (WHERE valor_unitario IS NULL) AS sem_valor
FROM public.sinapi_composicoes
WHERE uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO';

SELECT codigo, COUNT(*) AS total
FROM public.sinapi_composicoes
WHERE uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
GROUP BY codigo
HAVING COUNT(*) > 1
ORDER BY total DESC, codigo;

SELECT
  COUNT(*) AS com_analitico
FROM public.sinapi_composicoes
WHERE uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
  AND composicao IS NOT NULL
  AND jsonb_array_length(composicao) > 0;

SELECT
  COUNT(*) AS com_percentual_mao_de_obra
FROM public.sinapi_composicoes
WHERE uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
  AND percentual_mao_de_obra IS NOT NULL;

-- ============================================
-- CONSULTAS DE USO
-- ============================================

SELECT *
FROM public.sinapi_composicoes
WHERE codigo = '104658'
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO';

SELECT codigo, descricao, unidade, valor_unitario, percentual_mao_de_obra
FROM public.sinapi_composicoes
WHERE descricao_tsv
      @@ plainto_tsquery('portuguese', public.sinapi_normalize_text('piso podotatil'))
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
LIMIT 10;

SELECT codigo, descricao, valor_unitario
FROM public.sinapi_composicoes
WHERE categoria = 'Pintura'
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
ORDER BY descricao
LIMIT 20;

SELECT codigo, descricao, unidade, valor_unitario
FROM public.sinapi_composicoes
WHERE descricao ILIKE '%argamassa%'
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
LIMIT 10;

SELECT codigo, descricao, valor_unitario, percentual_atribuido_sp
FROM public.sinapi_composicoes
WHERE percentual_atribuido_sp > 0
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
ORDER BY percentual_atribuido_sp DESC
LIMIT 20;

SELECT codigo, descricao, valor_unitario, percentual_mao_de_obra
FROM public.sinapi_composicoes
WHERE percentual_mao_de_obra IS NOT NULL
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
ORDER BY percentual_mao_de_obra DESC
LIMIT 20;

SELECT codigo, descricao, situacao, valor_unitario
FROM public.sinapi_composicoes
WHERE situacao = 'SEM CUSTO'
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO'
ORDER BY codigo
LIMIT 50;

-- ============================================
-- PERFORMANCE
-- ============================================

EXPLAIN ANALYZE
SELECT *
FROM public.sinapi_composicoes
WHERE codigo = '104658'
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO';

EXPLAIN ANALYZE
SELECT codigo, descricao
FROM public.sinapi_composicoes
WHERE descricao_tsv
      @@ plainto_tsquery('portuguese', public.sinapi_normalize_text('acessibilidade concreto'))
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO';

EXPLAIN ANALYZE
SELECT codigo, descricao
FROM public.sinapi_composicoes
WHERE descricao ILIKE '%rampa%'
  AND uf = 'PR'
  AND regime_desoneracao = 'SEM_DESONERACAO';

SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS size
FROM pg_tables
WHERE tablename = 'sinapi_composicoes';
