-- ============================================================================
-- ORCAMENTISTA_005_COMMIT_BATCHES
--
-- Rastreia cada batch de commit oficial (preview_items aprovados →
-- orcamento_itens). Append-only: proibido UPDATE e DELETE via trigger.
--
-- Pré-requisito: migrations 003 (orc_analysis_runs) e 004 já aplicadas.
-- Flag de habilitação: EVIS_ORCAMENTISTA_ENABLE_OFFICIAL_COMMIT=true
--   (checada no endpoint, não nesta migration).
--
-- Etapa 4 — Commit oficial controlado.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Tabela principal
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_commit_batches (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id        UUID        NOT NULL
                                     REFERENCES public.orc_analysis_runs(id)
                                     ON DELETE RESTRICT,
  opportunity_id         TEXT        NOT NULL,
  orcamento_id           TEXT        NOT NULL,
  total_items_committed  INT         NOT NULL DEFAULT 0,
  total_items_skipped    INT         NOT NULL DEFAULT 0,
  -- Array of committed orcamento_itens UUIDs
  committed_item_ids     JSONB       NOT NULL DEFAULT '[]',
  -- Array of { preview_item_id, reason } objects for each skipped item
  skip_reasons_json      JSONB       NOT NULL DEFAULT '[]',
  safety_flags_json      JSONB       NOT NULL DEFAULT '{}',
  committed_by           TEXT        NOT NULL DEFAULT 'unknown_user',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Índices operacionais
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orc_commit_batches_run
  ON public.orc_commit_batches(analysis_run_id);

CREATE INDEX IF NOT EXISTS idx_orc_commit_batches_opportunity
  ON public.orc_commit_batches(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_orc_commit_batches_orcamento
  ON public.orc_commit_batches(orcamento_id);

-- ----------------------------------------------------------------------------
-- 3. Append-only trigger (proíbe UPDATE e DELETE)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_orc_commit_batches_append_only()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'orc_commit_batches é append-only. UPDATE e DELETE proibidos.'
    USING ERRCODE = '55000';
END;
$$;

DROP TRIGGER IF EXISTS trg_orc_commit_batches_append_only
  ON public.orc_commit_batches;

CREATE TRIGGER trg_orc_commit_batches_append_only
  BEFORE UPDATE OR DELETE OR TRUNCATE
  ON public.orc_commit_batches
  FOR EACH STATEMENT
  EXECUTE FUNCTION fn_orc_commit_batches_append_only();

-- ----------------------------------------------------------------------------
-- 4. RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.orc_commit_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orc_commit_batches_open ON public.orc_commit_batches;
CREATE POLICY orc_commit_batches_open
  ON public.orc_commit_batches
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- Fim da migration 005
-- NÃO EXECUTAR em produção sem revisão explícita do time.
-- ----------------------------------------------------------------------------
