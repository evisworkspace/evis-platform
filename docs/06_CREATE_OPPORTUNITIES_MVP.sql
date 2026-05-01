-- ============================================================================
-- EVIS AI - MVP DE OPORTUNIDADES
-- ============================================================================
-- Esta migration cria o núcleo mínimo de CRM/Oportunidades.
--
-- Regra de domínio:
-- - A oportunidade nasce antes da obra.
-- - obra_id só deve ser preenchido após fechamento/conversão comercial.
-- - orcamento_id e proposta_id ficam sem FK por enquanto, até reconciliação
--   futura com os módulos oficiais de Orçamento e Propostas.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- CONTACTS
-- ----------------------------------------------------------------------------
-- Cadastro mínimo de contatos. Um contato pode existir antes de qualquer
-- oportunidade, orçamento, proposta ou obra.

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  documento text,
  tipo text NOT NULL DEFAULT 'cliente',
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- OPPORTUNITIES
-- ----------------------------------------------------------------------------
-- A oportunidade representa uma intenção comercial ainda incompleta. Ela pode
-- nascer apenas com título e snapshots do cliente, antes de existir obra.
--
-- obra_id é opcional e só deve ser preenchido após fechamento.
-- orcamento_id e proposta_id são UUIDs sem FK até a reconciliação futura dos
-- módulos Orçamento e Propostas.

CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  status text NOT NULL DEFAULT 'novo',
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  origem text,
  prioridade text NOT NULL DEFAULT 'media',
  cliente_nome_snapshot text,
  telefone_snapshot text,
  email_snapshot text,
  endereco_resumo text,
  tipo_obra text,
  metragem_estimada numeric(12, 2),
  valor_estimado numeric(14, 2),
  observacao text,
  orcamentista_workspace_id text,
  orcamento_id uuid,
  proposta_id uuid,
  obra_id uuid REFERENCES public.obras(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT opportunities_status_check CHECK (
    status IN (
      'novo',
      'qualificando',
      'aguardando_documentos',
      'em_orcamento',
      'proposta_enviada',
      'negociacao',
      'ganha',
      'perdida',
      'arquivada'
    )
  ),
  CONSTRAINT opportunities_prioridade_check CHECK (
    prioridade IN ('baixa', 'media', 'alta', 'urgente')
  )
);

-- ----------------------------------------------------------------------------
-- OPPORTUNITY_EVENTS
-- ----------------------------------------------------------------------------
-- Linha do tempo da oportunidade: contato inicial, ligação, visita, mudança de
-- status, decisão humana, retorno do cliente ou evento gerado pela IA.

CREATE TABLE IF NOT EXISTS public.opportunity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  descricao text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- OPPORTUNITY_FILES
-- ----------------------------------------------------------------------------
-- Arquivos associados à oportunidade: briefing, imagens, projetos iniciais,
-- documentos comerciais ou anexos usados pelo Orçamentista IA.

CREATE TABLE IF NOT EXISTS public.opportunity_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  nome text NOT NULL,
  url text,
  storage_path text,
  categoria text,
  mime_type text,
  tamanho_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- ÍNDICES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id
  ON public.opportunities(contact_id);

CREATE INDEX IF NOT EXISTS idx_opportunities_status
  ON public.opportunities(status);

CREATE INDEX IF NOT EXISTS idx_opportunities_obra_id
  ON public.opportunities(obra_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_events_opportunity_id
  ON public.opportunity_events(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_opportunity_files_opportunity_id
  ON public.opportunity_files(opportunity_id);

COMMIT;
