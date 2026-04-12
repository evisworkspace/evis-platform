-- ============================================================================
-- EVIS AI - SCRIPT PRONTO PARA COPIAR E COLAR NO SUPABASE SQL EDITOR
-- ============================================================================
-- Execute tudo de uma vez (Ctrl+Enter ou Run)

-- 1. HABILITAR RLS
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE diario_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes_presenca ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;

-- 2. NORMALIZAR DADOS LEGADOS (só se necessário)
UPDATE servicos SET status_atual = 'nao_iniciado' WHERE status_atual NOT IN ('nao_iniciado', 'em_andamento', 'concluido');

-- 3. CRIAR CONSTRAINTS (DROP IF EXISTS primeiro)
ALTER TABLE servicos DROP CONSTRAINT IF EXISTS check_avanco;
ALTER TABLE servicos ADD CONSTRAINT check_avanco CHECK (avanco_atual >= 0 AND avanco_atual <= 100);

ALTER TABLE servicos DROP CONSTRAINT IF EXISTS check_status_enum;
ALTER TABLE servicos ADD CONSTRAINT check_status_enum CHECK (status_atual IN ('nao_iniciado', 'em_andamento', 'concluido'));

ALTER TABLE servicos DROP CONSTRAINT IF EXISTS check_datas_validas;
ALTER TABLE servicos ADD CONSTRAINT check_datas_validas CHECK (data_fim >= data_inicio);

ALTER TABLE pendencias DROP CONSTRAINT IF EXISTS check_prioridade_enum;
ALTER TABLE pendencias ADD CONSTRAINT check_prioridade_enum CHECK (prioridade IN ('alta', 'media', 'baixa'));

ALTER TABLE pendencias DROP CONSTRAINT IF EXISTS check_pendencia_status_enum;
ALTER TABLE pendencias ADD CONSTRAINT check_pendencia_status_enum CHECK (status IN ('ABERTA', 'RESOLVIDA'));

ALTER TABLE notas DROP CONSTRAINT IF EXISTS check_tipo_nota_enum;
ALTER TABLE notas ADD CONSTRAINT check_tipo_nota_enum CHECK (tipo IN ('observacao', 'decisao', 'alerta', 'lembrete'));

-- 4. POLICAS RLS (DROP IF EXISTS primeiro)
DROP POLICY IF EXISTS "Allow all for authenticated" ON obras;
CREATE POLICY "Allow all for authenticated" ON obras FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON servicos;
CREATE POLICY "Allow all for authenticated" ON servicos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON diario_obra;
CREATE POLICY "Allow all for authenticated" ON diario_obra FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON pendencias;
CREATE POLICY "Allow all for authenticated" ON pendencias FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON equipes_cadastro;
CREATE POLICY "Allow all for authenticated" ON equipes_cadastro FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON equipes_presenca;
CREATE POLICY "Allow all for authenticated" ON equipes_presenca FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON notas;
CREATE POLICY "Allow all for authenticated" ON notas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated" ON fotos;
CREATE POLICY "Allow all for authenticated" ON fotos FOR ALL USING (true) WITH CHECK (true);

-- 5. INDEXES (CREATE IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_servicos_obra ON servicos(obra_id);
CREATE INDEX IF NOT EXISTS idx_servicos_categoria ON servicos(categoria);
CREATE INDEX IF NOT EXISTS idx_diario_obra_data ON diario_obra(created_at);
CREATE INDEX IF NOT EXISTS idx_equipes_presenca_data ON equipes_presenca(data_presenca);
CREATE INDEX IF NOT EXISTS idx_notas_obra_tipo_data ON notas(obra_id, tipo, data_nota DESC);
CREATE INDEX IF NOT EXISTS idx_fotos_obra_data ON fotos(obra_id, data_foto DESC);

-- ============================================================================
-- VERIFICAR
-- ============================================================================
SELECT 'RLS Enabled' as check_type, COUNT(*) as tables_with_rls
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;