-- ============================================
-- DDL: Catalogo Residencial EVIS + versionamento
-- Data: 2026-04-17
-- Objetivo:
-- 1. Manter SINAPI como referencia oficial
-- 2. Criar catalogo residencial proprio do EVIS
-- 3. Versionar precos ao longo do tempo
-- 4. Preservar snapshot do preco usado em cada orcamento
-- ============================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.evis_normalize_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT lower(public.unaccent('public.unaccent'::regdictionary, coalesce(input_text, '')));
$$;

CREATE TABLE IF NOT EXISTS public.catalogo_servicos_evis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  nome text NOT NULL,
  descricao text,
  categoria text NOT NULL,
  unidade_referencia text NOT NULL,
  tipo_obra text NOT NULL DEFAULT 'residencial',
  status_catalogo text NOT NULL DEFAULT 'proposto',
  origem_principal text NOT NULL DEFAULT 'composicao_propria',
  aceita_cotacao_direta boolean NOT NULL DEFAULT true,
  permite_composicao_analitica boolean NOT NULL DEFAULT true,
  aliases jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadados jsonb NOT NULL DEFAULT '{}'::jsonb,
  busca_tsv tsvector GENERATED ALWAYS AS (
    to_tsvector(
      'portuguese',
      public.evis_normalize_text(coalesce(nome, '') || ' ' || coalesce(descricao, ''))
    )
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalogo_servicos_evis_status_check
    CHECK (status_catalogo IN ('proposto', 'aprovado', 'descontinuado')),
  CONSTRAINT catalogo_servicos_evis_origem_check
    CHECK (origem_principal IN ('sinapi_direto', 'sinapi_derivado', 'composicao_propria', 'fornecedor', 'historico_real'))
);

CREATE TABLE IF NOT EXISTS public.servicos_referencia_origem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo_servico_id uuid NOT NULL REFERENCES public.catalogo_servicos_evis(id) ON DELETE CASCADE,
  fonte text NOT NULL,
  tabela_origem text,
  chave_origem text,
  codigo_origem text,
  descricao_origem text,
  unidade_origem text,
  fator_conversao numeric(14,6),
  formula_conversao text,
  observacoes text,
  confianca smallint NOT NULL DEFAULT 80,
  principal boolean NOT NULL DEFAULT false,
  competencia_ref date,
  uf text,
  cidade text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT servicos_referencia_origem_fonte_check
    CHECK (fonte IN ('sinapi_direto', 'sinapi_derivado', 'composicao_propria', 'fornecedor', 'historico_real')),
  CONSTRAINT servicos_referencia_origem_confianca_check
    CHECK (confianca BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS public.composicoes_modelo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo_servico_id uuid NOT NULL REFERENCES public.catalogo_servicos_evis(id) ON DELETE CASCADE,
  versao integer NOT NULL DEFAULT 1,
  nome_modelo text NOT NULL,
  composicao_json jsonb NOT NULL,
  premissas_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  perdas_percentual numeric(6,2),
  produtividade_unidade_hora numeric(14,4),
  status_modelo text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT composicoes_modelo_status_check
    CHECK (status_modelo IN ('rascunho', 'validado', 'obsoleto')),
  CONSTRAINT composicoes_modelo_unique_versao
    UNIQUE (catalogo_servico_id, versao)
);

CREATE TABLE IF NOT EXISTS public.precos_referencia_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo_servico_id uuid NOT NULL REFERENCES public.catalogo_servicos_evis(id) ON DELETE CASCADE,
  composicao_modelo_id uuid REFERENCES public.composicoes_modelo(id) ON DELETE SET NULL,
  origem_referencia_id uuid REFERENCES public.servicos_referencia_origem(id) ON DELETE SET NULL,
  tipo_preco text NOT NULL,
  valor_unitario numeric(14,2) NOT NULL,
  unidade text NOT NULL,
  competencia date NOT NULL,
  valid_from date,
  valid_to date,
  uf text,
  cidade text,
  fonte_nome text,
  fonte_documento text,
  observacoes text,
  confianca smallint NOT NULL DEFAULT 80,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT precos_referencia_tipo_check
    CHECK (tipo_preco IN ('sinapi', 'cotacao_real', 'historico_obra', 'manual', 'fornecedor')),
  CONSTRAINT precos_referencia_confianca_check
    CHECK (confianca BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS public.cotacoes_reais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalogo_servico_id uuid NOT NULL REFERENCES public.catalogo_servicos_evis(id) ON DELETE CASCADE,
  fornecedor_nome text NOT NULL,
  contato text,
  valor_unitario numeric(14,2) NOT NULL,
  unidade text NOT NULL,
  uf text,
  cidade text,
  data_cotacao date NOT NULL,
  validade_dias integer,
  prazo_entrega_dias integer,
  condicao_pagamento text,
  comprovante_url text,
  observacoes text,
  aprovado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.snapshot_orcamento_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id uuid,
  codigo_servico text NOT NULL,
  catalogo_servico_id uuid REFERENCES public.catalogo_servicos_evis(id) ON DELETE SET NULL,
  origem_referencia_id uuid REFERENCES public.servicos_referencia_origem(id) ON DELETE SET NULL,
  preco_referencia_id uuid REFERENCES public.precos_referencia_historico(id) ON DELETE SET NULL,
  descricao_snapshot text NOT NULL,
  unidade text NOT NULL,
  quantidade numeric(14,4) NOT NULL,
  valor_unitario_snapshot numeric(14,2) NOT NULL,
  valor_total_snapshot numeric(14,2) NOT NULL,
  competencia_preco date,
  fonte_preco text,
  origem_preco text,
  memoria_calculo jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sugestoes_catalogo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  categoria text,
  unidade_referencia text,
  contexto_origem text NOT NULL DEFAULT 'orcamentista',
  origem_sugestao text NOT NULL DEFAULT 'manual',
  status_sugestao text NOT NULL DEFAULT 'proposto',
  dados_sugestao jsonb NOT NULL DEFAULT '{}'::jsonb,
  catalogo_servico_id uuid REFERENCES public.catalogo_servicos_evis(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sugestoes_catalogo_status_check
    CHECK (status_sugestao IN ('proposto', 'aprovado', 'rejeitado', 'incorporado'))
);

CREATE INDEX IF NOT EXISTS idx_catalogo_servicos_evis_categoria
  ON public.catalogo_servicos_evis (categoria);

CREATE INDEX IF NOT EXISTS idx_catalogo_servicos_evis_status
  ON public.catalogo_servicos_evis (status_catalogo);

CREATE INDEX IF NOT EXISTS idx_catalogo_servicos_evis_busca
  ON public.catalogo_servicos_evis
  USING gin (busca_tsv);

CREATE INDEX IF NOT EXISTS idx_servicos_referencia_origem_catalogo
  ON public.servicos_referencia_origem (catalogo_servico_id, principal DESC, confianca DESC);

CREATE INDEX IF NOT EXISTS idx_composicoes_modelo_catalogo
  ON public.composicoes_modelo (catalogo_servico_id, versao DESC);

CREATE INDEX IF NOT EXISTS idx_precos_referencia_catalogo_competencia
  ON public.precos_referencia_historico (catalogo_servico_id, competencia DESC);

CREATE INDEX IF NOT EXISTS idx_cotacoes_reais_catalogo_data
  ON public.cotacoes_reais (catalogo_servico_id, data_cotacao DESC);

CREATE INDEX IF NOT EXISTS idx_snapshot_orcamento_obra_codigo
  ON public.snapshot_orcamento_itens (obra_id, codigo_servico);

CREATE INDEX IF NOT EXISTS idx_sugestoes_catalogo_status
  ON public.sugestoes_catalogo (status_sugestao, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_catalogo_servicos_evis_updated_at ON public.catalogo_servicos_evis;
CREATE TRIGGER trg_catalogo_servicos_evis_updated_at
BEFORE UPDATE ON public.catalogo_servicos_evis
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_servicos_referencia_origem_updated_at ON public.servicos_referencia_origem;
CREATE TRIGGER trg_servicos_referencia_origem_updated_at
BEFORE UPDATE ON public.servicos_referencia_origem
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_composicoes_modelo_updated_at ON public.composicoes_modelo;
CREATE TRIGGER trg_composicoes_modelo_updated_at
BEFORE UPDATE ON public.composicoes_modelo
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_precos_referencia_historico_updated_at ON public.precos_referencia_historico;
CREATE TRIGGER trg_precos_referencia_historico_updated_at
BEFORE UPDATE ON public.precos_referencia_historico
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cotacoes_reais_updated_at ON public.cotacoes_reais;
CREATE TRIGGER trg_cotacoes_reais_updated_at
BEFORE UPDATE ON public.cotacoes_reais
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_sugestoes_catalogo_updated_at ON public.sugestoes_catalogo;
CREATE TRIGGER trg_sugestoes_catalogo_updated_at
BEFORE UPDATE ON public.sugestoes_catalogo
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE VIEW public.vw_referencias_servicos_evis AS
SELECT
  c.id AS catalogo_servico_id,
  c.slug,
  c.nome,
  c.descricao,
  c.categoria,
  c.unidade_referencia,
  c.tipo_obra,
  c.status_catalogo,
  c.origem_principal,
  c.busca_tsv,
  ref.fonte AS origem_referencia,
  ref.codigo_origem,
  ref.descricao_origem,
  ref.unidade_origem,
  ref.confianca AS confianca_referencia,
  preco.valor_unitario AS valor_unitario_referencia,
  preco.unidade AS unidade_preco,
  preco.competencia AS competencia_referencia,
  preco.fonte_nome AS fonte_preco,
  preco.tipo_preco
FROM public.catalogo_servicos_evis c
LEFT JOIN LATERAL (
  SELECT r.*
  FROM public.servicos_referencia_origem r
  WHERE r.catalogo_servico_id = c.id
    AND r.ativo = true
  ORDER BY r.principal DESC, r.confianca DESC, r.created_at DESC
  LIMIT 1
) ref ON true
LEFT JOIN LATERAL (
  SELECT p.*
  FROM public.precos_referencia_historico p
  WHERE p.catalogo_servico_id = c.id
    AND p.ativo = true
  ORDER BY p.competencia DESC, p.created_at DESC
  LIMIT 1
) preco ON true
WHERE c.status_catalogo <> 'descontinuado';

COMMENT ON VIEW public.vw_referencias_servicos_evis IS
  'Visao agregada do catalogo residencial EVIS com melhor referencia e ultimo preco conhecido';

COMMIT;

-- Validacao rapida:
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
--   AND table_name IN (
--     'catalogo_servicos_evis',
--     'servicos_referencia_origem',
--     'composicoes_modelo',
--     'precos_referencia_historico',
--     'cotacoes_reais',
--     'snapshot_orcamento_itens',
--     'sugestoes_catalogo'
--   )
-- ORDER BY table_name;
