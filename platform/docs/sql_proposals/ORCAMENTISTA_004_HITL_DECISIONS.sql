-- MIGRATION CANDIDATE ONLY. DO NOT EXECUTE IN PRODUCTION.
-- ORCAMENTISTA_004 — HITL decisions sobre orc_preview_items (run-scoped).
-- Este arquivo exige auditoria e teste controlado antes de qualquer aplicação real.

-- ============================================================================
-- EVIS AI — ORCAMENTISTA HITL DECISIONS (preview-item-scoped)
-- ============================================================================
-- Escopo:
-- - Persistir a decisão humana sobre cada orc_preview_items gerado por um
--   analysis_run (Etapa 2). Cada decisão referencia um preview_item + analysis_run.
-- - Sem FK para orcamento_itens. Sem trigger que escreva em orcamento_itens.
-- - Sem função de consolidação oficial. Commit oficial fica para a Etapa 4.
-- - RLS habilitado, sem policies abertas USING (true).
-- - Append-only: UPDATE/DELETE bloqueados por trigger para preservar histórico.
--
-- DECISÃO ARQUITETURAL (Etapa 3):
-- - Esta tabela é preview-item-scoped: 1 linha por decisão sobre 1 preview_item.
-- - É DIFERENTE da orc_hitl_decisions do candidate antigo Reader/Verifier:
--     * candidate antigo (page-scoped): orc_hitl_decisions referencia
--       orc_hitl_issues, que vinha de divergências page-scoped do Verifier.
--     * Etapa 3 (run-scoped): decisão direta sobre o item preliminar gerado
--       pelo /analyze atual, sem passar por Verifier.
-- - O NOME da tabela é o mesmo (orc_hitl_decisions) na intenção semântica,
--   mas o candidate antigo NÃO está aplicado no banco real. Esta migration
--   define a única versão futura aplicada.
-- - Se um dia o candidate Reader/Verifier for aplicado, ele terá que se
--   adaptar a este esquema (preview-item-scoped) ou usar tabela diferente.
-- - O fluxo de aprovação NÃO escreve em orcamento_itens. A Etapa 4 cria
--   um endpoint dedicado de commit que lê decisões 'approve'/'edit' e
--   só então grava no orçamento oficial, atrás de flag.
--
-- Preconditions esperadas:
-- - public.opportunities(id) existe.
-- - public.orc_analysis_runs(id) existe (aplicar migration 003 antes).
-- - public.orc_preview_items(id) existe (aplicar migration 003 antes).
-- - pgcrypto/gen_random_uuid() disponível.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) orc_hitl_decisions (preview-item-scoped, append-only)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orc_hitl_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id uuid NOT NULL REFERENCES public.orc_analysis_runs(id) ON DELETE RESTRICT,
  preview_item_id uuid NOT NULL REFERENCES public.orc_preview_items(id) ON DELETE RESTRICT,
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE RESTRICT,
  decision text NOT NULL CHECK (
    decision IN ('approve', 'edit', 'reject', 'request_review')
  ),
  edited_payload_json jsonb NULL,
  reason text NULL,
  decided_by text NOT NULL DEFAULT 'unknown_user'
    CHECK (length(trim(decided_by)) > 0),
  decided_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orc_hitl_decisions_edit_payload_ck
    CHECK (
      (decision = 'edit' AND edited_payload_json IS NOT NULL)
      OR (decision <> 'edit')
    )
);

COMMENT ON TABLE public.orc_hitl_decisions IS
  'Decisão humana sobre preview item (run-scoped). Append-only.';
COMMENT ON COLUMN public.orc_hitl_decisions.decision IS
  'approve | edit | reject | request_review.';
COMMENT ON COLUMN public.orc_hitl_decisions.edited_payload_json IS
  'Payload editado pelo humano. Obrigatório quando decision = edit. NULL caso contrário.';
COMMENT ON COLUMN public.orc_hitl_decisions.reason IS
  'Motivo opcional informado pelo revisor.';

-- ----------------------------------------------------------------------------
-- ÍNDICES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orc_hitl_decisions_analysis_run_id
  ON public.orc_hitl_decisions(analysis_run_id);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_decisions_preview_item_id
  ON public.orc_hitl_decisions(preview_item_id);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_decisions_opportunity_id
  ON public.orc_hitl_decisions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_decisions_decided_at
  ON public.orc_hitl_decisions(decided_at);
CREATE INDEX IF NOT EXISTS idx_orc_hitl_decisions_decision_decided_at
  ON public.orc_hitl_decisions(decision, decided_at);

-- ----------------------------------------------------------------------------
-- TRIGGER APPEND-ONLY
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_orc_hitl_decisions_append_only_v2()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  RAISE EXCEPTION 'orc_hitl_decisions is append-only: % is not allowed', TG_OP;
END;
$$;

CREATE TRIGGER trg_orc_hitl_decisions_no_update_delete_v2
  BEFORE UPDATE OR DELETE ON public.orc_hitl_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_orc_hitl_decisions_append_only_v2();

CREATE TRIGGER trg_orc_hitl_decisions_no_truncate_v2
  BEFORE TRUNCATE ON public.orc_hitl_decisions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.fn_orc_hitl_decisions_append_only_v2();

-- ----------------------------------------------------------------------------
-- ATUALIZAÇÃO DE STATUS EM orc_preview_items APÓS DECISÃO
-- ----------------------------------------------------------------------------
-- Trigger AFTER INSERT que reflete a decisão no campo status do preview_item.
-- Mantém a consulta simples na UI (status do item = última decisão), sem
-- precisar de join cada vez. Decisões antigas continuam preservadas em
-- orc_hitl_decisions (append-only).
CREATE OR REPLACE FUNCTION public.fn_orc_hitl_decisions_sync_preview_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  new_status text;
BEGIN
  -- Mapeia a decisão para o status do preview_item.
  new_status := CASE NEW.decision
    WHEN 'approve' THEN 'approved'
    WHEN 'edit' THEN 'edited'
    WHEN 'reject' THEN 'rejected'
    WHEN 'request_review' THEN 'request_review'
    ELSE 'pending'
  END;

  UPDATE public.orc_preview_items
  SET status = new_status,
      updated_at = now()
  WHERE id = NEW.preview_item_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_orc_hitl_decisions_sync_preview_status
  AFTER INSERT ON public.orc_hitl_decisions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_orc_hitl_decisions_sync_preview_status();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ----------------------------------------------------------------------------
ALTER TABLE public.orc_hitl_decisions ENABLE ROW LEVEL SECURITY;

-- Placeholder documental:
-- CREATE POLICY ... ON public.orc_hitl_decisions
--   FOR SELECT TO authenticated
--   USING (... opportunity_id/company_id/tenant rule ...);

-- ============================================================================
-- ROLLBACK PLAN COMENTADO (ORDEM REVERSA)
-- ============================================================================
-- DROP TRIGGER IF EXISTS trg_orc_hitl_decisions_sync_preview_status ON public.orc_hitl_decisions;
-- DROP FUNCTION IF EXISTS public.fn_orc_hitl_decisions_sync_preview_status();
-- DROP TRIGGER IF EXISTS trg_orc_hitl_decisions_no_truncate_v2 ON public.orc_hitl_decisions;
-- DROP TRIGGER IF EXISTS trg_orc_hitl_decisions_no_update_delete_v2 ON public.orc_hitl_decisions;
-- DROP FUNCTION IF EXISTS public.fn_orc_hitl_decisions_append_only_v2();
-- DROP TABLE IF EXISTS public.orc_hitl_decisions;
