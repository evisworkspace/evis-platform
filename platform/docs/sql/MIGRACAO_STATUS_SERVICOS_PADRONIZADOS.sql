-- ============================================
-- MIGRACAO: padronizacao de status dos servicos
-- Data: 2026-04-17
-- Objetivo:
-- 1. Normalizar valores legados para o padrao oficial
-- 2. Garantir apenas: nao_iniciado, em_andamento, concluido, pausado
-- ============================================

BEGIN;

UPDATE public.servicos
SET status = CASE
  WHEN lower(status) IN ('a_executar', 'a executar', 'planejado', 'pendente') THEN 'nao_iniciado'
  WHEN lower(status) IN ('em andamento', 'andamento', 'ativo') THEN 'em_andamento'
  WHEN lower(status) IN ('concluida', 'finalizado', 'finalizada') THEN 'concluido'
  WHEN lower(status) IN ('pausada') THEN 'pausado'
  ELSE lower(replace(coalesce(status, ''), ' ', '_'))
END;

UPDATE public.servicos
SET status = CASE
  WHEN coalesce(status, '') = '' AND coalesce(avanco_atual, 0) >= 100 THEN 'concluido'
  WHEN coalesce(status, '') = '' AND coalesce(avanco_atual, 0) > 0 THEN 'em_andamento'
  WHEN coalesce(status, '') = '' THEN 'nao_iniciado'
  ELSE status
END;

ALTER TABLE public.servicos
  DROP CONSTRAINT IF EXISTS servicos_status_check;

ALTER TABLE public.servicos
  ADD CONSTRAINT servicos_status_check
  CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido', 'pausado'));

COMMENT ON COLUMN public.servicos.status IS
  'Status padronizado do servico: nao_iniciado, em_andamento, concluido, pausado';

COMMIT;

-- Verificacao rapida:
-- SELECT status, COUNT(*) FROM public.servicos GROUP BY status ORDER BY status;
