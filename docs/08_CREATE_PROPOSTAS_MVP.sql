-- ============================================================================
-- EVIS AI - MVP DE PROPOSTAS PERSISTIDAS
-- ============================================================================
-- Proposta nasce depois de orçamento vinculado à oportunidade.
-- Regras de domínio:
--   - opportunity_id deve estar preenchido antes de gerar proposta.
--   - orcamento_id fica sem FK até reconciliação formal do módulo Orçamento
--     no schema oficial (ver SCHEMA_GAP_REPORT.md).
--   - payload é snapshot imutável da proposta no momento da geração —
--     não deve ser atualizado após status = 'enviada'.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PROPOSTAS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.propostas (
  id                    uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id        uuid          REFERENCES public.opportunities(id) ON DELETE SET NULL,
  orcamento_id          uuid,
  titulo                text          NOT NULL,
  cliente_nome_snapshot text,
  status                text          NOT NULL DEFAULT 'rascunho',
  validade_dias         integer       NOT NULL DEFAULT 10,
  valor_total           numeric(14,2),
  bdi                   numeric(5,2),
  payload               jsonb         NOT NULL DEFAULT '{}'::jsonb,
  observacoes           text,
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now(),

  CONSTRAINT propostas_status_check CHECK (
    status IN ('rascunho', 'enviada', 'aceita', 'recusada', 'expirada')
  )
);

-- ----------------------------------------------------------------------------
-- ÍNDICES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_propostas_opportunity_id
  ON public.propostas(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_propostas_orcamento_id
  ON public.propostas(orcamento_id);

CREATE INDEX IF NOT EXISTS idx_propostas_status
  ON public.propostas(status);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
-- Acesso amplo temporário para MVP interno/local.
-- Substituir por company_id, user_id e auth.uid() antes de uso comercial.

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS propostas_open_access ON public.propostas;

CREATE POLICY "propostas_open_access"
  ON public.propostas
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
