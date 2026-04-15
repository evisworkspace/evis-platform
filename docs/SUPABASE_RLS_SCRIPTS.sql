-- ==========================================================
-- SCRIPT DE ATIVAÇÃO DE RLS (ROW LEVEL SECURITY) - EVIS AI
-- Instruções: Copie este script e execute no SQL Editor do Supabase Console.
-- Objetivo: Garantir isolamento total entre obras.
-- ==========================================================

-- 1. Habilitar RLS em todas as tabelas principais
ALTER TABLE obras ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes_cadastro ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipes_presenca ENABLE ROW LEVEL SECURITY;
ALTER TABLE diario_obra ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;

-- 2. Criar Políticas de Isolamento por obra_id
-- O usuário autenticado só pode ver dados onde o obra_id bate com o seu perfil/permissão.

-- Política para a tabela de OBRAS (base para o seletor)
CREATE POLICY "usuário_acessa_obras_autorizadas" ON obras
  FOR SELECT USING (
    id IN (SELECT (auth.jwt() ->> 'obra_id')::uuid)
    OR 
    auth.role() = 'authenticated' -- Permitir listagem inicial se necessário, ou restringir por perfil
  );

-- Política Genérica de Isolamento para TODAS as tabelas de dados
-- (Substitua {TABLE_NAME} pelo nome da tabela se for fazer uma por uma, 
--  ou use o loop abaixo se tiver permissão de admin)

DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('servicos', 'notas', 'equipes_cadastro', 'equipes_presenca', 'diario_obra', 'fotos', 'pendencias')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "obra_isolation_policy" ON %I', t);
        EXECUTE format('CREATE POLICY "obra_isolation_policy" ON %I 
                        FOR ALL 
                        USING (obra_id = (auth.jwt() ->> ''obra_id'')::uuid)
                        WITH CHECK (obra_id = (auth.jwt() ->> ''obra_id'')::uuid)', t);
    END LOOP;
END;
$$;

-- 3. Nota sobre o obra_id no JWT
-- Para que isso funcione, o seu backend/auth deve incluir o 'obra_id' nas claims do usuário no Supabase.
