-- ============================================
-- MIGRACAO: metadados de referencia de custo em servicos
-- Data: 2026-04-17
-- Objetivo:
-- 1. Persistir a origem do preco aplicado no servico
-- 2. Preservar competencia, fonte e confianca para auditoria
-- 3. Permitir rastrear o codigo da referencia usada
-- ============================================

BEGIN;

ALTER TABLE public.servicos
  ADD COLUMN IF NOT EXISTS codigo_referencia text,
  ADD COLUMN IF NOT EXISTS origem_preco text,
  ADD COLUMN IF NOT EXISTS origem_preco_detalhe text,
  ADD COLUMN IF NOT EXISTS competencia_preco date,
  ADD COLUMN IF NOT EXISTS fonte_preco text,
  ADD COLUMN IF NOT EXISTS confianca_referencia smallint;

ALTER TABLE public.servicos
  DROP CONSTRAINT IF EXISTS servicos_confianca_referencia_check;

ALTER TABLE public.servicos
  ADD CONSTRAINT servicos_confianca_referencia_check
  CHECK (
    confianca_referencia IS NULL
    OR (confianca_referencia BETWEEN 0 AND 100)
  );

COMMENT ON COLUMN public.servicos.codigo_referencia IS
  'Codigo da referencia aplicada ao servico, ex: reboco-parede-m2 ou codigo SINAPI.';

COMMENT ON COLUMN public.servicos.origem_preco IS
  'Camada principal da referencia usada: catalogo_evis, sinapi, manual, etc.';

COMMENT ON COLUMN public.servicos.origem_preco_detalhe IS
  'Detalhe da origem aplicada: sinapi_derivado, sinapi_direto, composicao_propria, fornecedor, etc.';

COMMENT ON COLUMN public.servicos.competencia_preco IS
  'Competencia do preco aplicado ao servico.';

COMMENT ON COLUMN public.servicos.fonte_preco IS
  'Fonte textual do preco aplicado, ex: Seed EVIS Residencial v1 ou SINAPI.';

COMMENT ON COLUMN public.servicos.confianca_referencia IS
  'Nivel de confianca da referencia aplicada ao servico, de 0 a 100.';

COMMIT;

-- Verificacao rapida:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'servicos'
--   AND column_name IN (
--     'codigo_referencia',
--     'origem_preco',
--     'origem_preco_detalhe',
--     'competencia_preco',
--     'fonte_preco',
--     'confianca_referencia'
--   )
-- ORDER BY column_name;
