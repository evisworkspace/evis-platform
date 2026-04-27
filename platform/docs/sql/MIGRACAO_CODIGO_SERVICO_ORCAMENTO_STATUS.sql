-- ============================================
-- MIGRACAO: codigo_servico + orcamento_status
-- Data: 2026-04-16
-- Objetivo:
-- 1. Renomear servicos.id_servico -> servicos.codigo_servico
-- 2. Garantir unicidade por obra
-- 3. Adicionar obras.orcamento_status
-- ============================================

BEGIN;

ALTER TABLE public.obras
  ADD COLUMN IF NOT EXISTS orcamento_status TEXT NOT NULL DEFAULT 'rascunho';

COMMENT ON COLUMN public.obras.orcamento_status IS
  'Status do orçamento: rascunho, aprovado, importado';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'servicos'
      AND column_name = 'id_servico'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'servicos'
      AND column_name = 'codigo_servico'
  ) THEN
    ALTER TABLE public.servicos RENAME COLUMN id_servico TO codigo_servico;
  END IF;
END $$;

ALTER TABLE public.servicos
  ALTER COLUMN codigo_servico SET NOT NULL;

COMMENT ON COLUMN public.servicos.codigo_servico IS
  'Codigo do orçamento no formato N.M, único por obra';

DO $$
DECLARE
  duplicates_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO duplicates_count
  FROM (
    SELECT obra_id, codigo_servico
    FROM public.servicos
    GROUP BY obra_id, codigo_servico
    HAVING COUNT(*) > 1
  ) duplicated_codes;

  IF duplicates_count > 0 THEN
    RAISE EXCEPTION
      'Existem códigos de serviço duplicados por obra. Corrija antes de criar a constraint UNIQUE.';
  END IF;
END $$;

ALTER TABLE public.servicos
  DROP CONSTRAINT IF EXISTS servicos_id_servico_unique;

DROP INDEX IF EXISTS idx_servicos_obra_codigo_servico;
DROP INDEX IF EXISTS idx_servicos_obra_id_servico;

CREATE UNIQUE INDEX IF NOT EXISTS idx_servicos_obra_codigo_servico
  ON public.servicos (obra_id, codigo_servico);

COMMIT;

-- Consulta de verificação pós-migração:
-- SELECT id, nome, status, orcamento_status FROM public.obras ORDER BY nome;
-- SELECT obra_id, codigo_servico, nome FROM public.servicos ORDER BY obra_id, codigo_servico;
