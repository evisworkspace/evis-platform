-- =============================================================================
-- ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql
-- =============================================================================
--
-- DRAFT ONLY - DO NOT EXECUTE AUTOMATICALLY
--
-- Fase: 4B.S4.O - Orcamentos Baseline Schema Draft
-- Objetivo:
--   Criar um baseline minimo, canonico e auditavel para as tabelas:
--     - public.orcamentos
--     - public.orcamento_itens
--
-- Uso futuro permitido:
--   Somente em staging, depois de revisao humana explicita, confirmacao do ref
--   vtlepoljlqmjwuauygni e revalidacao de pgcrypto/gen_random_uuid().
--
-- Bloqueios:
--   - Nao executar em producao.
--   - Nao usar o ref jwutiebpfauwzzltwgbb.
--   - Nao usar como migration sem revisao humana.
--   - Nao inclui seed, dados de teste, DROP, TRUNCATE, RLS ou policies.
--
-- Fontes:
--   - platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md
--   - platform/docs/EVIS_SUPABASE_STAGING_BASELINE_SCHEMA_PLAN_4BS4P.md
--   - platform/docs/EVIS_SUPABASE_STAGING_PREFLIGHT_4BS3.md
--   - platform/docs/SCHEMA_GAP_REPORT.md
--
-- Decisoes chave:
--   - orcamentos.id e uuid PK DEFAULT gen_random_uuid().
--   - orcamentos.obra_id e text NULL, sem FK para public.obras(id).
--   - opportunity_id nao e adicionado em public.orcamentos nesta fase.
--   - public.opportunities.orcamento_id e public.propostas.orcamento_id
--     permanecem UUIDs avulsos sem FK neste baseline.
--   - orcamento_itens.orcamento_id referencia public.orcamentos(id)
--     com ON DELETE CASCADE, conforme schema real introspectado.
--
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- ORCAMENTOS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id text NULL,
  nome text NOT NULL,
  cliente text NULL,
  status text NOT NULL DEFAULT 'rascunho',
  bdi numeric NOT NULL DEFAULT 25,
  total_bruto numeric NOT NULL DEFAULT 0,
  total_final numeric NOT NULL DEFAULT 0,
  observacoes text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- ORCAMENTO_ITENS
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orcamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  codigo text NULL,
  descricao text NOT NULL,
  unidade text NOT NULL DEFAULT 'un',
  quantidade numeric NOT NULL DEFAULT 1,
  valor_unitario numeric NOT NULL DEFAULT 0,
  valor_total numeric NOT NULL DEFAULT 0,
  origem text NOT NULL DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- INDICES
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_orcamentos_obra_id
  ON public.orcamentos(obra_id);

CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento_id
  ON public.orcamento_itens(orcamento_id);

COMMIT;

-- =============================================================================
-- FIM DO DRAFT
-- =============================================================================
