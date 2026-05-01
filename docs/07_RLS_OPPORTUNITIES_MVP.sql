-- ============================================================================
-- EVIS AI - RLS MVP PARA OPORTUNIDADES
-- ============================================================================
-- Objetivo:
-- - Resolver warnings de tabelas com RLS enabled sem policies.
-- - Liberar acesso interno/local MVP nas tabelas do modulo Oportunidades enquanto
--   o frontend ainda nao possui autenticacao formal e pode operar via role anon.
--
-- Importante:
-- - Esta policy e ampla e temporaria para MVP interno/local.
-- - Deve ser substituida futuramente por policies com company_id, user_id e
--   auth.uid() antes de qualquer uso comercial.
-- - Nao desativa RLS.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- CONTACTS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS contacts_authenticated_select_mvp ON public.contacts;
CREATE POLICY contacts_authenticated_select_mvp
  ON public.contacts
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS contacts_authenticated_insert_mvp ON public.contacts;
CREATE POLICY contacts_authenticated_insert_mvp
  ON public.contacts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS contacts_authenticated_update_mvp ON public.contacts;
CREATE POLICY contacts_authenticated_update_mvp
  ON public.contacts
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS contacts_authenticated_delete_mvp ON public.contacts;
CREATE POLICY contacts_authenticated_delete_mvp
  ON public.contacts
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- OPPORTUNITIES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS opportunities_authenticated_select_mvp ON public.opportunities;
CREATE POLICY opportunities_authenticated_select_mvp
  ON public.opportunities
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS opportunities_authenticated_insert_mvp ON public.opportunities;
CREATE POLICY opportunities_authenticated_insert_mvp
  ON public.opportunities
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS opportunities_authenticated_update_mvp ON public.opportunities;
CREATE POLICY opportunities_authenticated_update_mvp
  ON public.opportunities
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS opportunities_authenticated_delete_mvp ON public.opportunities;
CREATE POLICY opportunities_authenticated_delete_mvp
  ON public.opportunities
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- OPPORTUNITY_EVENTS
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS opportunity_events_authenticated_select_mvp ON public.opportunity_events;
CREATE POLICY opportunity_events_authenticated_select_mvp
  ON public.opportunity_events
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS opportunity_events_authenticated_insert_mvp ON public.opportunity_events;
CREATE POLICY opportunity_events_authenticated_insert_mvp
  ON public.opportunity_events
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS opportunity_events_authenticated_update_mvp ON public.opportunity_events;
CREATE POLICY opportunity_events_authenticated_update_mvp
  ON public.opportunity_events
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS opportunity_events_authenticated_delete_mvp ON public.opportunity_events;
CREATE POLICY opportunity_events_authenticated_delete_mvp
  ON public.opportunity_events
  FOR DELETE
  TO anon, authenticated
  USING (true);

-- ----------------------------------------------------------------------------
-- OPPORTUNITY_FILES
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS opportunity_files_authenticated_select_mvp ON public.opportunity_files;
CREATE POLICY opportunity_files_authenticated_select_mvp
  ON public.opportunity_files
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS opportunity_files_authenticated_insert_mvp ON public.opportunity_files;
CREATE POLICY opportunity_files_authenticated_insert_mvp
  ON public.opportunity_files
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS opportunity_files_authenticated_update_mvp ON public.opportunity_files;
CREATE POLICY opportunity_files_authenticated_update_mvp
  ON public.opportunity_files
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS opportunity_files_authenticated_delete_mvp ON public.opportunity_files;
CREATE POLICY opportunity_files_authenticated_delete_mvp
  ON public.opportunity_files
  FOR DELETE
  TO anon, authenticated
  USING (true);

COMMIT;
