-- ══════════════════════════════════════════════════════════════════
-- 02 — CORREÇÕES DEFINITIVAS — BANCO DE DADOS EBS
-- Projeto: jwutiebpfauwzzltwgbb.supabase.co
-- Data: 2026-04-14
-- Coach: Executar em ordem. Não pular etapas.
-- ══════════════════════════════════════════════════════════════════


-- ──────────────────────────────────────────────────────────────────
-- ETAPA 1 — TABELA: obras
-- Problema: 4 colunas esperadas pelo código não existem no banco
-- Ação: adicionar colunas (sem renomeação necessária)
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS cliente     TEXT;
ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS data_inicio DATE;
ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS data_fim    DATE;
ALTER TABLE public.obras ADD COLUMN IF NOT EXISTS descricao   TEXT;

-- Verificação:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'obras'
ORDER BY ordinal_position;


-- ──────────────────────────────────────────────────────────────────
-- ETAPA 2 — TABELA: servicos
-- Problema: banco usa nomes diferentes dos que o código espera
-- Ação: renomear colunas existentes + adicionar ausentes
-- ──────────────────────────────────────────────────────────────────

-- Renomear status_atual → status
ALTER TABLE public.servicos RENAME COLUMN status_atual TO status;

-- Renomear data_inicio → data_prevista
-- (data_fim já existe e será mantida como data_conclusao)
ALTER TABLE public.servicos RENAME COLUMN data_inicio   TO data_prevista;
ALTER TABLE public.servicos RENAME COLUMN data_fim      TO data_conclusao;

-- Adicionar coluna responsavel (ausente no banco)
ALTER TABLE public.servicos ADD COLUMN IF NOT EXISTS responsavel TEXT;

-- Popular responsavel a partir de equipe (se existir)
UPDATE public.servicos
SET responsavel = equipe
WHERE responsavel IS NULL AND equipe IS NOT NULL;

-- Verificação:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'servicos'
ORDER BY ordinal_position;


-- ──────────────────────────────────────────────────────────────────
-- ETAPA 3 — TABELA: equipes_cadastro
-- Problema: banco usa nomes e tipos diferentes dos que o código espera
-- Ação: renomear colunas + popular dados de transição
-- ──────────────────────────────────────────────────────────────────

-- Renomear especialidade → funcao
ALTER TABLE public.equipes_cadastro RENAME COLUMN especialidade TO funcao;

-- Adicionar coluna contato (unifica telefone + email)
ALTER TABLE public.equipes_cadastro ADD COLUMN IF NOT EXISTS contato TEXT;

-- Popular contato a partir de telefone ou email
UPDATE public.equipes_cadastro
SET contato = COALESCE(telefone, email)
WHERE contato IS NULL;

-- Adicionar coluna status (string) a partir de ativo (boolean)
ALTER TABLE public.equipes_cadastro ADD COLUMN IF NOT EXISTS status TEXT;

-- Popular status a partir de ativo
UPDATE public.equipes_cadastro
SET status = CASE WHEN ativo = true THEN 'ativo' ELSE 'inativo' END
WHERE status IS NULL;

-- Verificação:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'equipes_cadastro'
ORDER BY ordinal_position;


-- ──────────────────────────────────────────────────────────────────
-- ETAPA 4 — RLS (Row Level Security)
-- Problema: todas as tabelas estão com leitura pública sem controle
-- Ação: ativar RLS com política adequada ao estágio atual do projeto
-- Nota: leitura pública mantida por ora — revisar ao implementar auth
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.obras            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipes_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pendencias       ENABLE ROW LEVEL SECURITY;

-- Leitura pública (mantida para funcionamento atual)
CREATE POLICY "leitura_publica" ON public.obras
  FOR SELECT USING (true);

CREATE POLICY "leitura_publica" ON public.servicos
  FOR SELECT USING (true);

CREATE POLICY "leitura_publica" ON public.equipes_cadastro
  FOR SELECT USING (true);

CREATE POLICY "leitura_publica" ON public.notas
  FOR SELECT USING (true);

CREATE POLICY "leitura_publica" ON public.pendencias
  FOR SELECT USING (true);

-- Escrita requer autenticação
CREATE POLICY "escrita_autenticada" ON public.obras
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "escrita_autenticada" ON public.servicos
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "escrita_autenticada" ON public.equipes_cadastro
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "escrita_autenticada" ON public.notas
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "escrita_autenticada" ON public.pendencias
  FOR ALL USING (auth.role() = 'authenticated');

-- Verificação final RLS:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;


-- ──────────────────────────────────────────────────────────────────
-- VERIFICAÇÃO FINAL — estado do banco após todas as correções
-- ──────────────────────────────────────────────────────────────────

SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_name = t.table_name AND table_schema = 'public') AS total_colunas
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- ══════════════════════════════════════════════════════════════════
-- FIM DAS CORREÇÕES
-- Após executar: trazer resultado da verificação final para validação
-- Não avançar para próxima etapa sem confirmação.
-- ══════════════════════════════════════════════════════════════════
