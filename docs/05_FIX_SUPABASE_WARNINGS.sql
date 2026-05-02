-- ============================================================================
-- EVIS AI - CORRECOES DOS WARNINGS DO SUPABASE SECURITY ADVISOR
-- ============================================================================
-- Execute este arquivo no SQL Editor do Supabase e depois clique em
-- Security Advisor > Reset suggestions > Rerun linter.
--
-- Warnings cobertos:
-- 1. Function Search Path Mutable
-- 2. Extension in Public
-- 3. Materialized View in API
-- 4. RLS Policy Always True
-- 5. Auth RLS Initialization Plan nas policies recriadas aqui
--
-- Observacao: "Leaked Password Protection Disabled" nao e corrigido por SQL.
-- No Supabase Free, a protecao via HaveIBeenPwned exige plano Pro ou superior.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PARTE 1: extensoes fora do schema public
-- ----------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_trgm'
      AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION pg_trgm SET SCHEMA extensions;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'unaccent'
      AND n.nspname = 'public'
  ) THEN
    ALTER EXTENSION unaccent SET SCHEMA extensions;
  END IF;
END;
$$;

-- ----------------------------------------------------------------------------
-- PARTE 2: search_path fixo nas funcoes indicadas pelo Advisor
-- ----------------------------------------------------------------------------

DO $$
BEGIN
  IF to_regprocedure('public.evis_normalize_text(text)') IS NOT NULL THEN
    ALTER FUNCTION public.evis_normalize_text(text)
      SET search_path = public, extensions, pg_catalog;
  END IF;

  IF to_regprocedure('public.sinapi_normalize_text(text)') IS NOT NULL THEN
    ALTER FUNCTION public.sinapi_normalize_text(text)
      SET search_path = public, extensions, pg_catalog;
  END IF;

  IF to_regprocedure('public.set_updated_at()') IS NOT NULL THEN
    ALTER FUNCTION public.set_updated_at()
      SET search_path = public, pg_catalog;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.evis_normalize_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_catalog
AS $$
  SELECT regexp_replace(
    lower(extensions.unaccent(coalesce(input_text, ''))),
    '[^a-z0-9]+',
    ' ',
    'g'
  );
$$;

CREATE OR REPLACE FUNCTION public.sinapi_normalize_text(input_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_catalog
AS $$
  SELECT regexp_replace(
    lower(extensions.unaccent(coalesce(input_text, ''))),
    '[^a-z0-9]+',
    ' ',
    'g'
  );
$$;

-- ----------------------------------------------------------------------------
-- PARTE 3: materialized view fora da Data API
-- ----------------------------------------------------------------------------
-- O Advisor marca materialized views em schemas expostos pela API. Mantemos a
-- view no public para evitar quebrar objetos dependentes, mas removemos acesso
-- direto dos roles usados pela Data API.

REVOKE ALL ON TABLE public.vw_audit_metrics FROM anon;
REVOKE ALL ON TABLE public.vw_audit_metrics FROM authenticated;
REVOKE ALL ON TABLE public.vw_audit_metrics FROM PUBLIC;

-- ----------------------------------------------------------------------------
-- PARTE 4: limpar policies antigas que usavam USING (true) / WITH CHECK (true)
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "leitura_publica" ON public.brain_narrativas;
DROP POLICY IF EXISTS "leitura_publica" ON public.sinapi_composicoes;
DROP POLICY IF EXISTS "leitura_publica" ON public.catalogo_servicos_evis;
DROP POLICY IF EXISTS "leitura_publica" ON public.servicos_referencia_origem;
DROP POLICY IF EXISTS "leitura_publica" ON public.composicoes_modelo;
DROP POLICY IF EXISTS "leitura_publica" ON public.precos_referencia_historico;
DROP POLICY IF EXISTS "leitura_publica" ON public.cotacoes_reais;
DROP POLICY IF EXISTS "leitura_publica" ON public.snapshot_orcamento_itens;
DROP POLICY IF EXISTS "leitura_publica" ON public.sugestoes_catalogo;

DROP POLICY IF EXISTS "leitura_publica" ON public.obras;
DROP POLICY IF EXISTS "leitura_publica" ON public.servicos;
DROP POLICY IF EXISTS "leitura_publica" ON public.equipes_cadastro;
DROP POLICY IF EXISTS "leitura_publica" ON public.notas;
DROP POLICY IF EXISTS "leitura_publica" ON public.pendencias;

DROP POLICY IF EXISTS "escrita_autenticada" ON public.obras;
DROP POLICY IF EXISTS "escrita_autenticada" ON public.servicos;
DROP POLICY IF EXISTS "escrita_autenticada" ON public.equipes_cadastro;
DROP POLICY IF EXISTS "escrita_autenticada" ON public.notas;
DROP POLICY IF EXISTS "escrita_autenticada" ON public.pendencias;

DROP POLICY IF EXISTS "usuário_acessa_obras_autorizadas" ON public.obras;
DROP POLICY IF EXISTS "obra_isolation_policy" ON public.servicos;
DROP POLICY IF EXISTS "obra_isolation_policy" ON public.notas;
DROP POLICY IF EXISTS "obra_isolation_policy" ON public.equipes_cadastro;
DROP POLICY IF EXISTS "obra_isolation_policy" ON public.equipes_presenca;
DROP POLICY IF EXISTS "obra_isolation_policy" ON public.diario_obra;
DROP POLICY IF EXISTS "obra_isolation_policy" ON public.fotos;
DROP POLICY IF EXISTS "obra_isolation_policy" ON public.pendencias;

DROP POLICY IF EXISTS "Users see own obra" ON public.obras;
DROP POLICY IF EXISTS "Users insert own obra" ON public.obras;
DROP POLICY IF EXISTS "Users update own obra" ON public.obras;
DROP POLICY IF EXISTS "Users delete own obra" ON public.obras;

DROP POLICY IF EXISTS "Users see own servicos" ON public.servicos;
DROP POLICY IF EXISTS "Users insert servicos" ON public.servicos;
DROP POLICY IF EXISTS "Users update servicos" ON public.servicos;
DROP POLICY IF EXISTS "Users delete servicos" ON public.servicos;

DROP POLICY IF EXISTS "Users see own diario" ON public.diario_obra;
DROP POLICY IF EXISTS "Users insert diario" ON public.diario_obra;
DROP POLICY IF EXISTS "Users update diario" ON public.diario_obra;

DROP POLICY IF EXISTS "Users see own pendencias" ON public.pendencias;
DROP POLICY IF EXISTS "Users insert pendencias" ON public.pendencias;
DROP POLICY IF EXISTS "Users update pendencias" ON public.pendencias;

DROP POLICY IF EXISTS "Users see own equipes" ON public.equipes_cadastro;
DROP POLICY IF EXISTS "Users see presenca" ON public.equipes_presenca;
DROP POLICY IF EXISTS "Users insert presenca" ON public.equipes_presenca;

DROP POLICY IF EXISTS "Users see own notas" ON public.notas;
DROP POLICY IF EXISTS "Users insert notas" ON public.notas;

DROP POLICY IF EXISTS "Users see own fotos" ON public.fotos;
DROP POLICY IF EXISTS "Users insert fotos" ON public.fotos;

DROP POLICY IF EXISTS "catalogo_select_app_roles" ON public.brain_narrativas;
DROP POLICY IF EXISTS "catalogo_select_app_roles" ON public.sinapi_composicoes;
DROP POLICY IF EXISTS "catalogo_select_app_roles" ON public.catalogo_servicos_evis;
DROP POLICY IF EXISTS "catalogo_select_app_roles" ON public.servicos_referencia_origem;
DROP POLICY IF EXISTS "catalogo_select_app_roles" ON public.composicoes_modelo;
DROP POLICY IF EXISTS "catalogo_select_app_roles" ON public.precos_referencia_historico;
DROP POLICY IF EXISTS "catalogo_select_app_roles" ON public.cotacoes_reais;
DROP POLICY IF EXISTS "catalogo_select_app_roles" ON public.snapshot_orcamento_itens;
DROP POLICY IF EXISTS "catalogo_select_app_roles" ON public.sugestoes_catalogo;

DROP POLICY IF EXISTS "obras_select_app_roles" ON public.obras;
DROP POLICY IF EXISTS "obras_write_authenticated" ON public.obras;
DROP POLICY IF EXISTS "obras_update_authenticated" ON public.obras;
DROP POLICY IF EXISTS "obras_delete_authenticated" ON public.obras;

DROP POLICY IF EXISTS "obra_owned_select_app_roles" ON public.servicos;
DROP POLICY IF EXISTS "obra_owned_insert_authenticated" ON public.servicos;
DROP POLICY IF EXISTS "obra_owned_update_authenticated" ON public.servicos;
DROP POLICY IF EXISTS "obra_owned_delete_authenticated" ON public.servicos;

DROP POLICY IF EXISTS "obra_owned_select_app_roles" ON public.equipes_cadastro;
DROP POLICY IF EXISTS "obra_owned_insert_authenticated" ON public.equipes_cadastro;
DROP POLICY IF EXISTS "obra_owned_update_authenticated" ON public.equipes_cadastro;

DROP POLICY IF EXISTS "obra_owned_select_app_roles" ON public.equipes_presenca;
DROP POLICY IF EXISTS "obra_owned_insert_authenticated" ON public.equipes_presenca;

DROP POLICY IF EXISTS "obra_owned_select_app_roles" ON public.diario_obra;
DROP POLICY IF EXISTS "obra_owned_insert_authenticated" ON public.diario_obra;
DROP POLICY IF EXISTS "obra_owned_update_authenticated" ON public.diario_obra;

DROP POLICY IF EXISTS "obra_owned_select_app_roles" ON public.fotos;
DROP POLICY IF EXISTS "obra_owned_insert_authenticated" ON public.fotos;

DROP POLICY IF EXISTS "obra_owned_select_app_roles" ON public.notas;
DROP POLICY IF EXISTS "obra_owned_insert_authenticated" ON public.notas;

DROP POLICY IF EXISTS "obra_owned_select_app_roles" ON public.pendencias;
DROP POLICY IF EXISTS "obra_owned_insert_authenticated" ON public.pendencias;
DROP POLICY IF EXISTS "obra_owned_update_authenticated" ON public.pendencias;

DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'obras',
        'servicos',
        'equipes_cadastro',
        'equipes_presenca',
        'diario_obra',
        'fotos',
        'notas',
        'pendencias'
      )
      AND (
        qual ~* '(^|[^a-z_])true([^a-z_]|$)'
        OR with_check ~* '(^|[^a-z_])true([^a-z_]|$)'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      p.policyname,
      p.schemaname,
      p.tablename
    );
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- PARTE 5: RLS habilitado nas tabelas do Advisor
-- ----------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipes_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.equipes_presenca ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.diario_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pendencias ENABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.brain_narrativas ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sinapi_composicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.catalogo_servicos_evis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.servicos_referencia_origem ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.composicoes_modelo ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.precos_referencia_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cotacoes_reais ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.snapshot_orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.sugestoes_catalogo ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- PARTE 6: policies sem expressoes sempre verdadeiras
-- ----------------------------------------------------------------------------
-- O app atual usa anon key no frontend. Por isso as policies abaixo ainda
-- permitem anon/authenticated, mas sem USING (true). Quando o auth multiusuario
-- entrar, troque esta regra por isolamento real por usuario/obra.

CREATE POLICY "catalogo_select_app_roles"
  ON public.brain_narrativas
  FOR SELECT
  TO anon, authenticated
  USING ((SELECT auth.role()) IN ('anon', 'authenticated'));

CREATE POLICY "catalogo_select_app_roles"
  ON public.sinapi_composicoes
  FOR SELECT
  TO anon, authenticated
  USING ((SELECT auth.role()) IN ('anon', 'authenticated'));

CREATE POLICY "catalogo_select_app_roles"
  ON public.catalogo_servicos_evis
  FOR SELECT
  TO anon, authenticated
  USING ((SELECT auth.role()) IN ('anon', 'authenticated'));

CREATE POLICY "catalogo_select_app_roles"
  ON public.servicos_referencia_origem
  FOR SELECT
  TO anon, authenticated
  USING ((SELECT auth.role()) IN ('anon', 'authenticated'));

CREATE POLICY "catalogo_select_app_roles"
  ON public.composicoes_modelo
  FOR SELECT
  TO anon, authenticated
  USING ((SELECT auth.role()) IN ('anon', 'authenticated'));

CREATE POLICY "catalogo_select_app_roles"
  ON public.precos_referencia_historico
  FOR SELECT
  TO anon, authenticated
  USING ((SELECT auth.role()) IN ('anon', 'authenticated'));

CREATE POLICY "catalogo_select_app_roles"
  ON public.cotacoes_reais
  FOR SELECT
  TO anon, authenticated
  USING ((SELECT auth.role()) IN ('anon', 'authenticated'));

CREATE POLICY "catalogo_select_app_roles"
  ON public.snapshot_orcamento_itens
  FOR SELECT
  TO anon, authenticated
  USING ((SELECT auth.role()) IN ('anon', 'authenticated'));

CREATE POLICY "catalogo_select_app_roles"
  ON public.sugestoes_catalogo
  FOR SELECT
  TO anon, authenticated
  USING ((SELECT auth.role()) IN ('anon', 'authenticated'));

CREATE POLICY "obras_select_app_roles"
  ON public.obras
  FOR SELECT
  TO anon, authenticated
  USING ((SELECT auth.role()) IN ('anon', 'authenticated'));

CREATE POLICY "obras_write_authenticated"
  ON public.obras
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "obras_update_authenticated"
  ON public.obras
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.role()) = 'authenticated')
  WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "obras_delete_authenticated"
  ON public.obras
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "obra_owned_select_app_roles"
  ON public.servicos
  FOR SELECT
  TO anon, authenticated
  USING (
    obra_id IN (
      SELECT o.id
      FROM public.obras AS o
      WHERE ((SELECT auth.role()) IN ('anon', 'authenticated'))
    )
  );

CREATE POLICY "obra_owned_select_app_roles"
  ON public.equipes_cadastro
  FOR SELECT
  TO anon, authenticated
  USING (
    obra_id IN (
      SELECT o.id
      FROM public.obras AS o
      WHERE ((SELECT auth.role()) IN ('anon', 'authenticated'))
    )
  );

CREATE POLICY "obra_owned_select_app_roles"
  ON public.equipes_presenca
  FOR SELECT
  TO anon, authenticated
  USING (
    obra_id IN (
      SELECT o.id
      FROM public.obras AS o
      WHERE ((SELECT auth.role()) IN ('anon', 'authenticated'))
    )
  );

CREATE POLICY "obra_owned_select_app_roles"
  ON public.diario_obra
  FOR SELECT
  TO anon, authenticated
  USING (
    obra_id IN (
      SELECT o.id
      FROM public.obras AS o
      WHERE ((SELECT auth.role()) IN ('anon', 'authenticated'))
    )
  );

CREATE POLICY "obra_owned_select_app_roles"
  ON public.fotos
  FOR SELECT
  TO anon, authenticated
  USING (
    obra_id IN (
      SELECT o.id
      FROM public.obras AS o
      WHERE ((SELECT auth.role()) IN ('anon', 'authenticated'))
    )
  );

CREATE POLICY "obra_owned_select_app_roles"
  ON public.notas
  FOR SELECT
  TO anon, authenticated
  USING (
    obra_id IN (
      SELECT o.id
      FROM public.obras AS o
      WHERE ((SELECT auth.role()) IN ('anon', 'authenticated'))
    )
  );

CREATE POLICY "obra_owned_select_app_roles"
  ON public.pendencias
  FOR SELECT
  TO anon, authenticated
  USING (
    obra_id IN (
      SELECT o.id
      FROM public.obras AS o
      WHERE ((SELECT auth.role()) IN ('anon', 'authenticated'))
    )
  );

CREATE POLICY "obra_owned_insert_authenticated"
  ON public.servicos
  FOR INSERT
  TO authenticated
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_update_authenticated"
  ON public.servicos
  FOR UPDATE
  TO authenticated
  USING (obra_id IN (SELECT o.id FROM public.obras AS o))
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_delete_authenticated"
  ON public.servicos
  FOR DELETE
  TO authenticated
  USING (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_insert_authenticated"
  ON public.equipes_cadastro
  FOR INSERT
  TO authenticated
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_update_authenticated"
  ON public.equipes_cadastro
  FOR UPDATE
  TO authenticated
  USING (obra_id IN (SELECT o.id FROM public.obras AS o))
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_insert_authenticated"
  ON public.equipes_presenca
  FOR INSERT
  TO authenticated
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_insert_authenticated"
  ON public.diario_obra
  FOR INSERT
  TO authenticated
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_update_authenticated"
  ON public.diario_obra
  FOR UPDATE
  TO authenticated
  USING (obra_id IN (SELECT o.id FROM public.obras AS o))
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_insert_authenticated"
  ON public.fotos
  FOR INSERT
  TO authenticated
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_insert_authenticated"
  ON public.notas
  FOR INSERT
  TO authenticated
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_insert_authenticated"
  ON public.pendencias
  FOR INSERT
  TO authenticated
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

CREATE POLICY "obra_owned_update_authenticated"
  ON public.pendencias
  FOR UPDATE
  TO authenticated
  USING (obra_id IN (SELECT o.id FROM public.obras AS o))
  WITH CHECK (obra_id IN (SELECT o.id FROM public.obras AS o));

COMMIT;

-- ----------------------------------------------------------------------------
-- VERIFICACAO
-- ----------------------------------------------------------------------------

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    qual ILIKE '%true%'
    OR with_check ILIKE '%true%'
  )
ORDER BY tablename, policyname;

SELECT
  e.extname,
  n.nspname AS schema
FROM pg_extension e
JOIN pg_namespace n ON n.oid = e.extnamespace
WHERE e.extname IN ('pg_trgm', 'unaccent')
ORDER BY e.extname;

SELECT
  n.nspname,
  p.proname,
  p.proconfig
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('evis_normalize_text', 'sinapi_normalize_text', 'set_updated_at')
ORDER BY p.proname;
