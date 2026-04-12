-- =====================================================
-- RESET BADIDA PARA TESTE COM AGENTE IA
-- Execute no Supabase SQL Editor
-- IMPORTANTE: Substitua 'SUA_OBRA_ID' pelo ID real
-- =====================================================

-- 1. ZERAR SERVIÇOS (mantém estrutura, zera avanço)
UPDATE servicos 
SET avanco_atual = 0, status_atual = 'nao_iniciado', data_inicio = NULL, data_fim = NULL
WHERE obra_id = '3c7ade92-5078-4db3-996c-1390a9a2bb27';

-- 2. LIMPAR DIÁRIO
DELETE FROM diario_obra WHERE obra_id = '3c7ade92-5078-4db3-996c-1390a9a2bb27';

-- 3. LIMPAR PRESENÇA
DELETE FROM equipes_presenca WHERE obra_id = '3c7ade92-5078-4db3-996c-1390a9a2bb27';

-- 4. LIMPAR NOTAS (zera tudo gerado pela IA)
DELETE FROM notas WHERE obra_id = '3c7ade92-5078-4db3-996c-1390a9a2bb27';

-- 5. LIMPAR FOTOS
DELETE FROM fotos WHERE obra_id = '3c7ade92-5078-4db3-996c-1390a9a2bb27';

-- 6. LIMPAR PENDÊNCIAS
DELETE FROM pendencias WHERE obra_id = '3c7ade92-5078-4db3-996c-1390a9a2bb27';

-- 7. MANTER EQUIPES (não apaga)
-- EQUIPES SÃO MANTIDAS

-- Verificar resultado:
-- SELECT 'servicos' as tabela, count(*) as total FROM servicos WHERE obra_id = '3c7ade92-5078-4db3-996c-1390a9a2bb27'
-- UNION ALL
-- SELECT 'equipes_cadastro', count(*) FROM equipes_cadastro WHERE obra_id = '3c7ade92-5078-4db3-996c-1390a9a2bb27';