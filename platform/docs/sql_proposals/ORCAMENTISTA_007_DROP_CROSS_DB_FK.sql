-- ORCAMENTISTA_007 — Drop cross-DB foreign key from orc_context_snapshots
--
-- Context: orc_context_snapshots.opportunity_id references opportunities(id), but
-- orc_* tables live in the staging Supabase project while opportunities live in the
-- main project. This FK can never be satisfied by real app data.
--
-- Apply on: STAGING Supabase (vtlepoljlqmjwuauygni)
-- Risk: LOW — removes a constraint that is currently always violated in production flows.

ALTER TABLE public.orc_context_snapshots
  DROP CONSTRAINT IF EXISTS orc_context_snapshots_opportunity_id_fkey;

-- Leave opportunity_id as a plain UUID column (no FK).
-- Referential integrity between projects is enforced at the application layer.
