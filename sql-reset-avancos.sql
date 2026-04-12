-- =====================================================
-- SCRIPT SQL - RESET DE AVANÇOS PARA TESTE REGRESSIVO
-- Execute este script no Supabase SQL Editor
-- =====================================================

-- IMPORTANTE: Substitua 'SUA_OBRA_ID' pelo ID real da obra

-- =====================================================
-- 1. RESET DOS SERVIÇOS (avanção = 0, status = não iniciado)
-- =====================================================
-- UPDATE servicos 
-- SET avanco_atual = 0, status_atual = 'nao_iniciado' 
-- WHERE obra_id = 'SUA_OBRA_ID';

-- =====================================================
-- 2. LIMPAR DIÁRIOS (opcional - mantém strukturamas limpa transcrições)
-- =====================================================
-- DELETE FROM diario_obra WHERE obra_id = 'SUA_OBRA_ID';

-- =====================================================
-- 3. LIMPAR PRESENÇA (opcional)
-- =====================================================
-- DELETE FROM equipes_presenca WHERE obra_id = 'SUA_OBRA_ID';

-- =====================================================
-- 4. VERIFICAR DADOS ANTES (execute para confirmar)
-- =====================================================
-- SELECT id_servico, nome, avanco_atual, status_atual FROM servicos WHERE obra_id = 'SUA_OBRA_ID' ORDER BY id_servico;

-- =====================================================
-- INSTRUÇÕES:
-- 1. Copie este script para o SQL Editor do Supabase
-- 2. Substitua 'SUA_OBRA_ID' pelo ID da obra (veja em Configurações)
-- 3. Descomente as linhas desejadas
-- 4. Execute (Run)
-- 5. Recarregue o app no navegador
-- =====================================================