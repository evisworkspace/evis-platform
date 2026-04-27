-- ============================================
-- TABELA SINAPI - PR / SEM DESONERACAO
-- Projeto: Orcamentista
-- ============================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION public.sinapi_normalize_text(input_text TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT lower(public.unaccent('public.unaccent'::regdictionary, coalesce(input_text, '')));
$$;

CREATE TABLE IF NOT EXISTS public.sinapi_composicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  unidade TEXT NOT NULL,
  categoria TEXT,
  uf TEXT NOT NULL DEFAULT 'PR',
  regime_desoneracao TEXT NOT NULL DEFAULT 'SEM_DESONERACAO',
  competencia DATE NOT NULL,
  valor_unitario NUMERIC(12,2),
  percentual_atribuido_sp NUMERIC(10,4),
  percentual_mao_de_obra NUMERIC(10,4),
  situacao TEXT,
  composicao JSONB,
  manutencoes JSONB,
  origem TEXT NOT NULL DEFAULT 'SINAPI',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sinapi_composicoes
  ADD COLUMN IF NOT EXISTS descricao_tsv tsvector
  GENERATED ALWAYS AS (
    to_tsvector('portuguese', public.sinapi_normalize_text(descricao))
  ) STORED;

COMMENT ON TABLE public.sinapi_composicoes IS 'Base SINAPI de composicoes para orcamentacao. Versao atual focada em PR sem desoneracao.';
COMMENT ON COLUMN public.sinapi_composicoes.codigo IS 'Codigo da composicao SINAPI';
COMMENT ON COLUMN public.sinapi_composicoes.descricao IS 'Descricao da composicao';
COMMENT ON COLUMN public.sinapi_composicoes.descricao_tsv IS 'Coluna computada para Full Text Search sem acentos, gerada automaticamente.';
COMMENT ON COLUMN public.sinapi_composicoes.unidade IS 'Unidade de medida da composicao';
COMMENT ON COLUMN public.sinapi_composicoes.uf IS 'UF de referencia da composicao';
COMMENT ON COLUMN public.sinapi_composicoes.regime_desoneracao IS 'Regime aplicado: SEM_DESONERACAO, COM_DESONERACAO etc';
COMMENT ON COLUMN public.sinapi_composicoes.competencia IS 'Competencia da tabela SINAPI';
COMMENT ON COLUMN public.sinapi_composicoes.valor_unitario IS 'Custo da composicao para a UF selecionada';
COMMENT ON COLUMN public.sinapi_composicoes.percentual_atribuido_sp IS 'Percentual atribuido a Sao Paulo (%AS)';
COMMENT ON COLUMN public.sinapi_composicoes.percentual_mao_de_obra IS 'Percentual de mao de obra da composicao na UF';
COMMENT ON COLUMN public.sinapi_composicoes.situacao IS 'Situacao da composicao no relatorio analitico';
COMMENT ON COLUMN public.sinapi_composicoes.composicao IS 'Itens analiticos da composicao em JSONB';
COMMENT ON COLUMN public.sinapi_composicoes.manutencoes IS 'Eventos de manutencao da composicao no mes em JSONB';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_sinapi_composicao_competencia'
      AND conrelid = 'public.sinapi_composicoes'::regclass
  ) THEN
    ALTER TABLE public.sinapi_composicoes
      ADD CONSTRAINT uq_sinapi_composicao_competencia
      UNIQUE (codigo, uf, regime_desoneracao, competencia);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_sinapi_codigo_nao_vazio'
      AND conrelid = 'public.sinapi_composicoes'::regclass
  ) THEN
    ALTER TABLE public.sinapi_composicoes
      ADD CONSTRAINT ck_sinapi_codigo_nao_vazio
      CHECK (btrim(codigo) <> '');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_sinapi_descricao_nao_vazia'
      AND conrelid = 'public.sinapi_composicoes'::regclass
  ) THEN
    ALTER TABLE public.sinapi_composicoes
      ADD CONSTRAINT ck_sinapi_descricao_nao_vazia
      CHECK (btrim(descricao) <> '');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_sinapi_unidade_nao_vazia'
      AND conrelid = 'public.sinapi_composicoes'::regclass
  ) THEN
    ALTER TABLE public.sinapi_composicoes
      ADD CONSTRAINT ck_sinapi_unidade_nao_vazia
      CHECK (btrim(unidade) <> '');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_sinapi_valor_positivo'
      AND conrelid = 'public.sinapi_composicoes'::regclass
  ) THEN
    ALTER TABLE public.sinapi_composicoes
      ADD CONSTRAINT ck_sinapi_valor_positivo
      CHECK (valor_unitario IS NULL OR valor_unitario >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_sinapi_uf'
      AND conrelid = 'public.sinapi_composicoes'::regclass
  ) THEN
    ALTER TABLE public.sinapi_composicoes
      ADD CONSTRAINT ck_sinapi_uf
      CHECK (char_length(uf) = 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_sinapi_regime'
      AND conrelid = 'public.sinapi_composicoes'::regclass
  ) THEN
    ALTER TABLE public.sinapi_composicoes
      ADD CONSTRAINT ck_sinapi_regime
      CHECK (regime_desoneracao IN ('SEM_DESONERACAO', 'COM_DESONERACAO', 'SEM_ENCARGOS'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_sinapi_codigo
  ON public.sinapi_composicoes (codigo);

CREATE INDEX IF NOT EXISTS idx_sinapi_categoria
  ON public.sinapi_composicoes (categoria);

CREATE INDEX IF NOT EXISTS idx_sinapi_uf_regime_competencia
  ON public.sinapi_composicoes (uf, regime_desoneracao, competencia);

CREATE INDEX IF NOT EXISTS idx_sinapi_situacao
  ON public.sinapi_composicoes (situacao);

CREATE INDEX IF NOT EXISTS idx_sinapi_ativo
  ON public.sinapi_composicoes (ativo);

CREATE INDEX IF NOT EXISTS idx_sinapi_descricao_fts
  ON public.sinapi_composicoes
  USING gin (descricao_tsv);

CREATE INDEX IF NOT EXISTS idx_sinapi_descricao_trgm
  ON public.sinapi_composicoes
  USING gin (descricao gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_sinapi_composicao_jsonb
  ON public.sinapi_composicoes
  USING gin (composicao);

CREATE INDEX IF NOT EXISTS idx_sinapi_manutencoes_jsonb
  ON public.sinapi_composicoes
  USING gin (manutencoes);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sinapi_composicoes_updated_at ON public.sinapi_composicoes;

CREATE TRIGGER trg_sinapi_composicoes_updated_at
BEFORE UPDATE ON public.sinapi_composicoes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
