-- MIGRATION CANDIDATE ONLY. DO NOT EXECUTE IN PRODUCTION.
-- ORCAMENTISTA_003 — Persistência run-scoped do endpoint /analyze.
-- Este arquivo exige auditoria e teste controlado antes de qualquer aplicação real.

-- ============================================================================
-- EVIS AI — ORCAMENTISTA RUN-SCOPED ANALYSIS PERSISTENCE
-- ============================================================================
-- Escopo:
-- - Persistir os artefatos que o endpoint POST /api/orcamentista/opportunities/:id/analyze
--   já produz hoje, em vez de deixá-los morrer na resposta HTTP.
-- - 4 tabelas: orc_analysis_runs, orc_file_reads, orc_evidences, orc_preview_items.
-- - Sem FK para orcamento_itens. Sem trigger que escreva em orcamento_itens.
-- - Sem função de consolidação oficial.
-- - RLS habilitado nas 4 tabelas, sem policies abertas USING (true).
--
-- DECISÃO ARQUITETURAL (Etapa 2):
-- - Esta camada é run-scoped: 1 run agrega N arquivos analisados de uma vez.
-- - A camada page-scoped (Reader/Verifier) do candidate
--   ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql
--   fica preservada como camada FUTURA, para quando o PDF híbrido (Etapa 5/6)
--   exigir granularidade por página.
-- - As duas camadas podem coexistir:
--     * run-scoped (este migration) → consome o /analyze atual (txt/csv/json/md).
--     * page-scoped (candidate antigo) → entra com PDF híbrido.
-- - A integração futura com PDF híbrido decidirá se:
--     1. mantém as duas camadas indefinidamente; ou
--     2. consolida uma das camadas, deprecando a outra.
-- - orc_context_snapshots (já aplicada no banco real) continua sendo usada
--   como log/snapshot de eventos do /analyze.
-- - Nenhuma tabela oficial de orçamento (orcamento_itens/orcamentos) é tocada
--   por este migration.
--
-- Preconditions esperadas:
-- - public.opportunities(id) existe como uuid PK.
-- - public.orcamentos(id) existe como uuid PK.
-- - public.opportunity_files(id) existe como uuid PK.
-- - pgcrypto/gen_random_uuid() disponível.
-- - As 4 tabelas deste candidate não existem no banco real.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) orc_analysis_runs
-- ----------------------------------------------------------------------------
-- 1 linha por execução de POST /analyze (1 run = N arquivos analisados).
CREATE TABLE IF NOT EXISTS public.orc_analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  workspace_id text NOT NULL CHECK (length(trim(workspace_id)) > 0),
  status text NOT NULL CHECK (
    status IN (
      'started',
      'file_access_only',
      'file_text_extracted',
      'ai_extracted',
      'review_required',
      'backend_ai_not_configured',
      'completed',
      'failed'
    )
  ),
  source text NOT NULL DEFAULT 'orcamentista_analyze_endpoint'
    CHECK (length(trim(source)) > 0),
  preview_source text NULL CHECK (
    preview_source IS NULL OR preview_source IN (
      'metadata_only',
      'file_access_only',
      'file_text_extracted',
      'ai_extracted'
    )
  ),
  model_provider text NULL,
  model_name text NULL,
  total_files integer NOT NULL DEFAULT 0 CHECK (total_files >= 0),
  total_evidences integer NOT NULL DEFAULT 0 CHECK (total_evidences >= 0),
  total_preview_items integer NOT NULL DEFAULT 0 CHECK (total_preview_items >= 0),
  warnings_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  pendencias_hitl_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  safety_flags_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text NOT NULL DEFAULT 'orcamentista_analyze_endpoint'
    CHECK (length(trim(created_by)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NULL,
  CONSTRAINT orc_analysis_runs_completed_after_created_ck
    CHECK (completed_at IS NULL OR completed_at >= created_at)
);

COMMENT ON TABLE public.orc_analysis_runs IS
  'Execução run-scoped de /analyze. 1 run = N arquivos analisados em uma chamada.';
COMMENT ON COLUMN public.orc_analysis_runs.opportunity_id IS
  'Âncora obrigatória de auditoria/RLS.';
COMMENT ON COLUMN public.orc_analysis_runs.orcamento_id IS
  'Nullable nesta fase; torna-se obrigatório somente antes de commit oficial (Etapa 4).';
COMMENT ON COLUMN public.orc_analysis_runs.workspace_id IS
  'workspace_id legado (ex.: opp_<uuid>) usado pela UI para correlação local.';
COMMENT ON COLUMN public.orc_analysis_runs.preview_source IS
  'Origem do preview retornado por /analyze. Espelha contratos do hook useAnalyzeOpportunity.';
COMMENT ON COLUMN public.orc_analysis_runs.safety_flags_json IS
  'Snapshot das flags de segurança no momento do run (officialBudgetWrite, etc.).';

-- ----------------------------------------------------------------------------
-- 2) orc_file_reads
-- ----------------------------------------------------------------------------
-- 1 linha por opportunity_file analisado em um analysis_run.
CREATE TABLE IF NOT EXISTS public.orc_file_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id uuid NOT NULL REFERENCES public.orc_analysis_runs(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  opportunity_file_id uuid NOT NULL REFERENCES public.opportunity_files(id) ON DELETE RESTRICT,
  file_name text NULL,
  mime_type text NULL,
  storage_path text NULL,
  storage_path_present boolean NOT NULL DEFAULT false,
  download_status text NOT NULL CHECK (
    download_status IN (
      'missing_storage_path',
      'skipped_too_large',
      'download_failed',
      'downloaded'
    )
  ),
  read_status text NULL CHECK (
    read_status IS NULL OR read_status IN (
      'file_content_unavailable',
      'file_too_large',
      'text_extracted',
      'text_empty',
      'pdf_parser_unavailable',
      'unsupported_file_type'
    )
  ),
  downloaded_bytes integer NULL CHECK (downloaded_bytes IS NULL OR downloaded_bytes >= 0),
  extracted_chars integer NULL CHECK (extracted_chars IS NULL OR extracted_chars >= 0),
  warning text NULL,
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orc_file_reads IS
  'Diagnóstico de leitura por arquivo dentro de um analysis_run.';
COMMENT ON COLUMN public.orc_file_reads.download_status IS
  'Estado do download via storage. Espelha AnalyzeSourceFile.download_status no frontend.';
COMMENT ON COLUMN public.orc_file_reads.read_status IS
  'Estado da extração textual. Espelha AnalyzeSourceFile.read_status no frontend.';

-- ----------------------------------------------------------------------------
-- 3) orc_evidences
-- ----------------------------------------------------------------------------
-- N linhas por file_read. Cada evidência cita uma origem rastreável.
CREATE TABLE IF NOT EXISTS public.orc_evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id uuid NOT NULL REFERENCES public.orc_analysis_runs(id) ON DELETE RESTRICT,
  file_read_id uuid NULL REFERENCES public.orc_file_reads(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  opportunity_file_id uuid NULL REFERENCES public.opportunity_files(id) ON DELETE RESTRICT,
  evidence_type text NOT NULL CHECK (
    evidence_type IN (
      'text_excerpt',
      'metadata_only',
      'inference',
      'ai_extracted'
    )
  ),
  content_excerpt text NOT NULL CHECK (length(content_excerpt) > 0),
  page integer NULL CHECK (page IS NULL OR page > 0),
  confidence numeric(5,4) NULL CHECK (
    confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
  ),
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orc_evidences IS
  'Trechos extraídos com origem rastreável. Toda evidência aponta para um file_read e/ou arquivo.';
COMMENT ON COLUMN public.orc_evidences.evidence_type IS
  'text_excerpt = trecho literal. metadata_only = sem texto, só metadado. inference/ai_extracted = derivação do LLM.';
COMMENT ON COLUMN public.orc_evidences.page IS
  'Nullable. Será preenchido pela camada page-scoped futura (PDF híbrido).';

-- ----------------------------------------------------------------------------
-- 4) orc_preview_items
-- ----------------------------------------------------------------------------
-- N linhas por analysis_run. Itens preliminares que aguardam HITL.
-- NUNCA são copiados automaticamente para orcamento_itens.
CREATE TABLE IF NOT EXISTS public.orc_preview_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id uuid NOT NULL REFERENCES public.orc_analysis_runs(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  codigo text NULL,
  description text NOT NULL CHECK (length(trim(description)) > 0),
  unit text NOT NULL CHECK (length(trim(unit)) > 0),
  quantity numeric(18,4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  unit_price numeric(18,4) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price numeric(18,4) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  categoria text NULL,
  origem text NULL,
  confidence numeric(5,4) NULL CHECK (
    confidence IS NULL OR (confidence >= 0 AND confidence <= 1)
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected', 'edited', 'request_review')
  ),
  source_evidence_ids uuid[] NOT NULL DEFAULT ARRAY[]::uuid[],
  raw_ai_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  observacoes text NULL,
  warnings_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orc_preview_items IS
  'Itens preliminares gerados a partir de um analysis_run. Aguardam HITL. Nunca consolidados automaticamente.';
COMMENT ON COLUMN public.orc_preview_items.status IS
  'Default pending. approved/edited liberam o item para Etapa 4 (commit controlado). rejected/request_review impedem.';
COMMENT ON COLUMN public.orc_preview_items.source_evidence_ids IS
  'Array de orc_evidences.id que justificam este item. Item sem evidência será recusado pelo commit oficial.';
COMMENT ON COLUMN public.orc_preview_items.raw_ai_payload_json IS
  'Payload bruto retornado pela IA para auditoria. Não usar para cálculo.';

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_orc_analysis_runs_opportunity_id
  ON public.orc_analysis_runs(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_analysis_runs_orcamento_id
  ON public.orc_analysis_runs(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_analysis_runs_status_created_at
  ON public.orc_analysis_runs(status, created_at);

CREATE INDEX IF NOT EXISTS idx_orc_file_reads_analysis_run_id
  ON public.orc_file_reads(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_orc_file_reads_opportunity_id
  ON public.orc_file_reads(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_file_reads_opportunity_file_id
  ON public.orc_file_reads(opportunity_file_id);

CREATE INDEX IF NOT EXISTS idx_orc_evidences_analysis_run_id
  ON public.orc_evidences(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_orc_evidences_file_read_id
  ON public.orc_evidences(file_read_id);
CREATE INDEX IF NOT EXISTS idx_orc_evidences_opportunity_id
  ON public.orc_evidences(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_evidences_opportunity_file_id
  ON public.orc_evidences(opportunity_file_id);

CREATE INDEX IF NOT EXISTS idx_orc_preview_items_analysis_run_id
  ON public.orc_preview_items(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_orc_preview_items_opportunity_id
  ON public.orc_preview_items(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_preview_items_orcamento_id
  ON public.orc_preview_items(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_preview_items_status_created_at
  ON public.orc_preview_items(status, created_at);

-- ============================================================================
-- TRIGGER DE updated_at em orc_preview_items
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_orc_preview_items_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orc_preview_items_set_updated_at
  BEFORE UPDATE ON public.orc_preview_items
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_orc_preview_items_set_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
-- RLS habilitado nas 4 tabelas.
-- Policies definitivas ficam pendentes até decisão de auth/tenant/company_id.
-- Sem policies, acesso direto fica bloqueado por padrão para roles não privilegiados.
-- Acesso via service_role no backend continua funcionando, como nas demais tabelas orc_*.

ALTER TABLE public.orc_analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orc_file_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orc_evidences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orc_preview_items ENABLE ROW LEVEL SECURITY;

-- Placeholder documental:
-- CREATE POLICY ... ON public.orc_analysis_runs
--   FOR SELECT TO authenticated
--   USING (... opportunity_id/company_id/tenant rule ...);

-- ============================================================================
-- ROLLBACK PLAN COMENTADO (ORDEM REVERSA)
-- ============================================================================
-- Executar apenas em ambiente controlado e após revisão.
--
-- DROP TRIGGER IF EXISTS trg_orc_preview_items_set_updated_at ON public.orc_preview_items;
-- DROP FUNCTION IF EXISTS public.fn_orc_preview_items_set_updated_at();
--
-- DROP TABLE IF EXISTS public.orc_preview_items;
-- DROP TABLE IF EXISTS public.orc_evidences;
-- DROP TABLE IF EXISTS public.orc_file_reads;
-- DROP TABLE IF EXISTS public.orc_analysis_runs;
