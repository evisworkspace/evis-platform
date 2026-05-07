-- DRAFT ONLY. DO NOT EXECUTE.
-- Fase 4A.2 — SQL Draft Review
-- Este arquivo e proposta tecnica revisavel e nao deve ser aplicado em producao.

-- ============================================================================
-- EVIS AI - ORCAMENTISTA READER / VERIFIER / HITL PERSISTENCE (DRAFT)
-- ============================================================================
-- Escopo:
-- - Proposta de schema para persistencia auditavel pre-obra
-- - Sem escrita oficial em orcamento_itens
-- - Sem trigger/procedure de consolidacao oficial
--
-- Observacao UUID:
-- - O projeto atual usa gen_random_uuid() em SQLs existentes.
-- - Caso o ambiente nao tenha pgcrypto habilitado, avaliar:
--   CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- - Nao executar neste momento (somente referencia de draft).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) orc_reader_runs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_reader_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  opportunity_file_id uuid NOT NULL REFERENCES public.opportunity_files(id) ON DELETE RESTRICT,
  page_number integer NOT NULL CHECK (page_number > 0),
  document_id text NULL,
  reader_motor text NOT NULL CHECK (length(trim(reader_motor)) > 0),
  source_quality text NOT NULL CHECK (length(trim(source_quality)) > 0),
  status text NOT NULL CHECK (
    status IN ('received', 'normalized', 'safety_evaluated', 'blocked', 'ready_for_verifier')
  ),
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orc_reader_runs IS
  'Execucao de Reader por oportunidade/arquivo/pagina. Page-scoped obrigatoria.';

-- ----------------------------------------------------------------------------
-- 2) orc_reader_outputs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_reader_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_run_id uuid NOT NULL REFERENCES public.orc_reader_runs(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  opportunity_file_id uuid NOT NULL REFERENCES public.opportunity_files(id) ON DELETE RESTRICT,
  page_number integer NOT NULL CHECK (page_number > 0),
  document_id text NULL,
  raw_output_json jsonb NOT NULL,
  normalized_output_json jsonb NOT NULL,
  identified_count integer NOT NULL DEFAULT 0,
  inferred_count integer NOT NULL DEFAULT 0,
  missing_count integer NOT NULL DEFAULT 0,
  confidence_score numeric(5,4) NULL CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orc_reader_outputs IS
  'Output bruto e normalizado do Reader. raw_output_json deve ser tratado como imutavel.';

-- ----------------------------------------------------------------------------
-- 3) orc_reader_safety_evaluations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_reader_safety_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_run_id uuid NOT NULL REFERENCES public.orc_reader_runs(id) ON DELETE RESTRICT,
  reader_output_id uuid NOT NULL REFERENCES public.orc_reader_outputs(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  opportunity_file_id uuid NOT NULL REFERENCES public.opportunity_files(id) ON DELETE RESTRICT,
  page_number integer NOT NULL CHECK (page_number > 0),
  document_id text NULL,
  safety_gate_json jsonb NOT NULL,
  dimensional_checks_json jsonb NOT NULL,
  requires_verifier boolean NOT NULL DEFAULT true,
  requires_hitl boolean NOT NULL DEFAULT false,
  blocks_consolidation boolean NOT NULL DEFAULT false,
  allowed_to_dispatch boolean NOT NULL DEFAULT false,
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orc_reader_safety_block_dispatch_ck
    CHECK (NOT (blocks_consolidation = true AND allowed_to_dispatch = true))
);

COMMENT ON TABLE public.orc_reader_safety_evaluations IS
  'Resultado de safety gate e checks dimensionais por pagina.';

-- ----------------------------------------------------------------------------
-- 4) orc_verifier_runs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_verifier_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_run_id uuid NOT NULL REFERENCES public.orc_reader_runs(id) ON DELETE RESTRICT,
  reader_output_id uuid NOT NULL REFERENCES public.orc_reader_outputs(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  opportunity_file_id uuid NOT NULL REFERENCES public.opportunity_files(id) ON DELETE RESTRICT,
  page_number integer NOT NULL CHECK (page_number > 0),
  document_id text NULL,
  verifier_motor text NOT NULL CHECK (length(trim(verifier_motor)) > 0),
  verifier_output_json jsonb NOT NULL,
  status text NOT NULL CHECK (
    status IN ('received', 'normalized', 'compared', 'requires_hitl', 'blocked', 'approved')
  ),
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orc_verifier_runs IS
  'Execucao do Verifier sobre output do Reader por pagina.';

-- ----------------------------------------------------------------------------
-- 5) orc_reader_verifier_comparisons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_reader_verifier_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reader_output_id uuid NOT NULL REFERENCES public.orc_reader_outputs(id) ON DELETE RESTRICT,
  verifier_run_id uuid NOT NULL REFERENCES public.orc_verifier_runs(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  opportunity_file_id uuid NOT NULL REFERENCES public.opportunity_files(id) ON DELETE RESTRICT,
  page_number integer NOT NULL CHECK (page_number > 0),
  document_id text NULL,
  agreement_score numeric(5,4) NOT NULL CHECK (agreement_score >= 0 AND agreement_score <= 1),
  agreement_band text NOT NULL CHECK (agreement_band IN ('low', 'medium', 'high')),
  comparison_json jsonb NOT NULL,
  dispatch_decision_json jsonb NOT NULL,
  requires_hitl boolean NOT NULL DEFAULT false,
  blocks_consolidation boolean NOT NULL DEFAULT false,
  allowed_to_dispatch boolean NOT NULL DEFAULT false,
  status text NOT NULL CHECK (
    status IN ('pending', 'divergent', 'requires_hitl', 'dispatch_allowed', 'consolidation_blocked')
  ),
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orc_comp_block_dispatch_ck
    CHECK (NOT (blocks_consolidation = true AND allowed_to_dispatch = true))
);

COMMENT ON TABLE public.orc_reader_verifier_comparisons IS
  'Comparacao formal Reader x Verifier por pagina.';

-- ----------------------------------------------------------------------------
-- 6) orc_reader_verifier_divergences
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_reader_verifier_divergences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id uuid NOT NULL REFERENCES public.orc_reader_verifier_comparisons(id) ON DELETE RESTRICT,
  reader_output_id uuid NOT NULL REFERENCES public.orc_reader_outputs(id) ON DELETE RESTRICT,
  verifier_run_id uuid NOT NULL REFERENCES public.orc_verifier_runs(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  opportunity_file_id uuid NOT NULL REFERENCES public.opportunity_files(id) ON DELETE RESTRICT,
  page_number integer NOT NULL CHECK (page_number > 0),
  document_id text NULL,
  category text NOT NULL CHECK (length(trim(category)) > 0),
  technical_field text NOT NULL CHECK (length(trim(technical_field)) > 0),
  affected_item text NULL,
  discipline text NULL,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  reader_value text NULL,
  verifier_value text NULL,
  reason text NOT NULL CHECK (length(trim(reason)) > 0),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  requires_hitl boolean NOT NULL DEFAULT true,
  blocks_consolidation boolean NOT NULL DEFAULT false,
  dedupe_key text NOT NULL CHECK (length(trim(dedupe_key)) > 0),
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'dismissed', 'resolved')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orc_divergences_dedupe_unique UNIQUE (comparison_id, dedupe_key)
);

COMMENT ON TABLE public.orc_reader_verifier_divergences IS
  'Divergencias deduplicadas por comparison.';
COMMENT ON COLUMN public.orc_reader_verifier_divergences.dedupe_key IS
  'Chave de dedupe especifica: category + technical_field + affected_item + source/page + reader_value/verifier_value + discipline/domain quando aplicavel.';

-- ----------------------------------------------------------------------------
-- 7) orc_hitl_issues
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_hitl_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comparison_id uuid NULL REFERENCES public.orc_reader_verifier_comparisons(id) ON DELETE RESTRICT,
  reader_run_id uuid NULL REFERENCES public.orc_reader_runs(id) ON DELETE RESTRICT,
  reader_output_id uuid NULL REFERENCES public.orc_reader_outputs(id) ON DELETE RESTRICT,
  verifier_run_id uuid NULL REFERENCES public.orc_verifier_runs(id) ON DELETE RESTRICT,
  divergence_id uuid NULL REFERENCES public.orc_reader_verifier_divergences(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  opportunity_file_id uuid NULL REFERENCES public.opportunity_files(id) ON DELETE RESTRICT,
  page_number integer NULL CHECK (page_number IS NULL OR page_number > 0),
  document_id text NULL,
  source_type text NOT NULL CHECK (length(trim(source_type)) > 0),
  source_id uuid NULL,
  source_ref text NULL,
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  issue_type text NOT NULL CHECK (length(trim(issue_type)) > 0),
  severity text NOT NULL CHECK (severity IN ('baixa', 'media', 'alta', 'critica')),
  status text NOT NULL CHECK (
    status IN (
      'pendente', 'em_revisao', 'aprovada_com_ressalva', 'bloqueada',
      'documento_solicitado', 'convertida_em_verba',
      'ignorada_nesta_fase', 'reanalisar_futuramente'
    )
  ),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  description text NOT NULL CHECK (length(trim(description)) > 0),
  evidence_summary text NOT NULL CHECK (length(trim(evidence_summary)) > 0),
  recommended_action text NOT NULL CHECK (length(trim(recommended_action)) > 0),
  blocks_dispatch boolean NOT NULL DEFAULT true,
  blocks_consolidation boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orc_hitl_issue_has_source_ck CHECK (
    source_id IS NOT NULL
    OR NULLIF(trim(COALESCE(source_ref, '')), '') IS NOT NULL
    OR comparison_id IS NOT NULL
    OR reader_output_id IS NOT NULL
    OR verifier_run_id IS NOT NULL
    OR source_refs_json <> '{}'::jsonb
  )
);

COMMENT ON TABLE public.orc_hitl_issues IS
  'Fila de HITL. comparison_id e nullable para permitir issues pre-comparison.';

-- ----------------------------------------------------------------------------
-- 8) orc_hitl_decisions (append-only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_hitl_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hitl_issue_id uuid NOT NULL REFERENCES public.orc_hitl_issues(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  decision_type text NOT NULL CHECK (
    decision_type IN (
      'aprovar_com_ressalva', 'manter_bloqueado', 'solicitar_documento',
      'marcar_como_verba', 'ignorar_nesta_fase', 'reanalisar_futuramente'
    )
  ),
  notes text NOT NULL CHECK (length(trim(notes)) > 0),
  decided_by text NOT NULL CHECK (length(trim(decided_by)) > 0),
  decided_at timestamptz NOT NULL DEFAULT now(),
  dispatch_released boolean NOT NULL DEFAULT false,
  consolidation_released boolean NOT NULL DEFAULT false,
  source_type text NULL,
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  issue_snapshot_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  decision_payload_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orc_hitl_decisions IS
  'Decisoes humanas append-only. Sem ON DELETE CASCADE para preservar auditoria.';
COMMENT ON COLUMN public.orc_hitl_decisions.issue_snapshot_json IS
  'Snapshot contextual da issue no momento da decisao, para evitar dependencia exclusiva do estado futuro da issue.';

-- ----------------------------------------------------------------------------
-- 9) orc_context_snapshots (append-only historico)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_context_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  orcamento_id uuid NULL REFERENCES public.orcamentos(id) ON DELETE RESTRICT,
  opportunity_file_id uuid NULL REFERENCES public.opportunity_files(id) ON DELETE RESTRICT,
  page_number integer NULL CHECK (page_number IS NULL OR page_number > 0),
  document_id text NULL,
  reader_run_id uuid NULL REFERENCES public.orc_reader_runs(id) ON DELETE RESTRICT,
  reader_output_id uuid NULL REFERENCES public.orc_reader_outputs(id) ON DELETE RESTRICT,
  verifier_run_id uuid NULL REFERENCES public.orc_verifier_runs(id) ON DELETE RESTRICT,
  comparison_id uuid NULL REFERENCES public.orc_reader_verifier_comparisons(id) ON DELETE RESTRICT,
  hitl_issue_id uuid NULL REFERENCES public.orc_hitl_issues(id) ON DELETE RESTRICT,
  source_type text NOT NULL CHECK (length(trim(source_type)) > 0),
  source_id uuid NULL,
  source_ref text NULL,
  source_refs_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  phase text NOT NULL CHECK (length(trim(phase)) > 0),
  context_status text NOT NULL CHECK (context_status IN ('validated', 'pending', 'blocked', 'incomplete')),
  context_snapshot_json jsonb NOT NULL,
  created_by text NOT NULL DEFAULT 'system' CHECK (length(trim(created_by)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.orc_context_snapshots IS
  'Historico append-only de contexto. Nao usar como estado mutavel redundante.';

-- ============================================================================
-- INDICES MINIMOS
-- ============================================================================

-- opportunity_id
CREATE INDEX IF NOT EXISTS idx_orc_reader_runs_opportunity_id ON public.orc_reader_runs(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_reader_outputs_opportunity_id ON public.orc_reader_outputs(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_reader_safety_opportunity_id ON public.orc_reader_safety_evaluations(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_verifier_runs_opportunity_id ON public.orc_verifier_runs(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_comparisons_opportunity_id ON public.orc_reader_verifier_comparisons(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_divergences_opportunity_id ON public.orc_reader_verifier_divergences(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_issues_opportunity_id ON public.orc_hitl_issues(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_decisions_opportunity_id ON public.orc_hitl_decisions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_context_snapshots_opportunity_id ON public.orc_context_snapshots(opportunity_id);

-- orcamento_id
CREATE INDEX IF NOT EXISTS idx_orc_reader_runs_orcamento_id ON public.orc_reader_runs(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_reader_outputs_orcamento_id ON public.orc_reader_outputs(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_reader_safety_orcamento_id ON public.orc_reader_safety_evaluations(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_verifier_runs_orcamento_id ON public.orc_verifier_runs(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_comparisons_orcamento_id ON public.orc_reader_verifier_comparisons(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_divergences_orcamento_id ON public.orc_reader_verifier_divergences(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_issues_orcamento_id ON public.orc_hitl_issues(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_decisions_orcamento_id ON public.orc_hitl_decisions(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_context_snapshots_orcamento_id ON public.orc_context_snapshots(orcamento_id);

-- opportunity_file_id / page_number
CREATE INDEX IF NOT EXISTS idx_orc_reader_runs_file_page ON public.orc_reader_runs(opportunity_file_id, page_number);
CREATE INDEX IF NOT EXISTS idx_orc_reader_outputs_file_page ON public.orc_reader_outputs(opportunity_file_id, page_number);
CREATE INDEX IF NOT EXISTS idx_orc_reader_safety_file_page ON public.orc_reader_safety_evaluations(opportunity_file_id, page_number);
CREATE INDEX IF NOT EXISTS idx_orc_verifier_runs_file_page ON public.orc_verifier_runs(opportunity_file_id, page_number);
CREATE INDEX IF NOT EXISTS idx_orc_comparisons_file_page ON public.orc_reader_verifier_comparisons(opportunity_file_id, page_number);
CREATE INDEX IF NOT EXISTS idx_orc_divergences_file_page ON public.orc_reader_verifier_divergences(opportunity_file_id, page_number);

-- lineage ids
CREATE INDEX IF NOT EXISTS idx_orc_reader_outputs_reader_run_id ON public.orc_reader_outputs(reader_run_id);
CREATE INDEX IF NOT EXISTS idx_orc_reader_safety_reader_run_id ON public.orc_reader_safety_evaluations(reader_run_id);
CREATE INDEX IF NOT EXISTS idx_orc_reader_safety_reader_output_id ON public.orc_reader_safety_evaluations(reader_output_id);
CREATE INDEX IF NOT EXISTS idx_orc_verifier_runs_reader_output_id ON public.orc_verifier_runs(reader_output_id);
CREATE INDEX IF NOT EXISTS idx_orc_comparisons_verifier_run_id ON public.orc_reader_verifier_comparisons(verifier_run_id);
CREATE INDEX IF NOT EXISTS idx_orc_divergences_comparison_id ON public.orc_reader_verifier_divergences(comparison_id);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_issues_comparison_id ON public.orc_hitl_issues(comparison_id);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_decisions_hitl_issue_id ON public.orc_hitl_decisions(hitl_issue_id);
CREATE INDEX IF NOT EXISTS idx_orc_context_snapshots_hitl_issue_id ON public.orc_context_snapshots(hitl_issue_id);

-- status / created_at
CREATE INDEX IF NOT EXISTS idx_orc_reader_runs_status_created_at ON public.orc_reader_runs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orc_verifier_runs_status_created_at ON public.orc_verifier_runs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orc_comparisons_status_created_at ON public.orc_reader_verifier_comparisons(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orc_divergences_status_created_at ON public.orc_reader_verifier_divergences(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_issues_status_created_at ON public.orc_hitl_issues(status, created_at);
CREATE INDEX IF NOT EXISTS idx_orc_context_snapshots_status_created_at ON public.orc_context_snapshots(context_status, created_at);

-- indices compostos recomendados
CREATE INDEX IF NOT EXISTS idx_orc_reader_runs_opp_file_page
  ON public.orc_reader_runs(opportunity_id, opportunity_file_id, page_number);
CREATE INDEX IF NOT EXISTS idx_orc_verifier_runs_opp_status_created
  ON public.orc_verifier_runs(opportunity_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_orc_divergences_comparison_dedupe
  ON public.orc_reader_verifier_divergences(comparison_id, dedupe_key);

-- ============================================================================
-- IMUTABILIDADE DRAFT (NAO IMPLEMENTAR NESTA FASE)
-- ============================================================================
-- Proposta futura:
-- - trigger BEFORE UPDATE em orc_reader_outputs para impedir alteracao de raw_output_json
-- - trigger BEFORE UPDATE/DELETE em orc_hitl_decisions para garantir append-only
-- Neste draft, mantemos apenas a recomendacao documental, sem implementacao executavel.

-- ============================================================================
-- RLS DRAFT / DO NOT APPLY YET
-- ============================================================================
-- Diretrizes futuras:
-- 1) Segmentar por opportunity_id (e possivel company_id/tenant futuro).
-- 2) Papeis distintos:
--    - reader_writer
--    - verifier_writer
--    - human_decider
--    - auditor_readonly
-- 3) Evitar policies abertas do tipo USING (true).
-- 4) Restringir acesso a raw_output_json e issue_snapshot_json.
-- 5) Policias definitivas devem ser revisadas em fase propria.

-- ============================================================================
-- ROLLBACK DRAFT (ORDEM REVERSA)
-- ============================================================================
-- 1) DROP INDEX ... (nao-PK), se necessario.
-- 2) DROP TABLE public.orc_context_snapshots;
-- 3) DROP TABLE public.orc_hitl_decisions;
-- 4) DROP TABLE public.orc_hitl_issues;
-- 5) DROP TABLE public.orc_reader_verifier_divergences;
-- 6) DROP TABLE public.orc_reader_verifier_comparisons;
-- 7) DROP TABLE public.orc_verifier_runs;
-- 8) DROP TABLE public.orc_reader_safety_evaluations;
-- 9) DROP TABLE public.orc_reader_outputs;
-- 10) DROP TABLE public.orc_reader_runs;
