-- =============================================================================
-- ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql
-- =============================================================================
--
-- PROPOSTA DE MIGRATION — APENAS REVISÃO / NÃO EXECUTAR AUTOMATICAMENTE
--
-- Objetivo:
--   Tornar a coluna `orcamentos.obra_id` nullable (DROP NOT NULL),
--   permitindo a criação de orçamentos vinculados a Oportunidades
--   sem exigir uma Obra criada previamente.
--
-- Contexto:
--   O fluxo canônico EVIS prevê:
--     Oportunidade → Orçamento → Proposta → Obra → Diário
--   O módulo Orçamentista IA (Fase 1C) implementou a criação de orçamentos
--   diretamente na oportunidade, usando o vínculo:
--     opportunities.orcamento_id → orcamentos.id
--   O banco real possui `orcamentos.obra_id NOT NULL`, bloqueando esse fluxo.
--   Esta migration é a menor alteração segura para desbloqueá-lo.
--
-- Estratégia:
--   - Tornar obra_id nullable — não remover a coluna.
--   - O legado de Obra continua filtrando por obra_id (useOrcamento.ts).
--   - Orçamentos de Obra existentes não são afetados (obra_id permanece preenchido).
--   - Orçamentos de Oportunidade ficam com obra_id = NULL.
--   - NÃO adicionar orcamentos.opportunity_id nesta migration.
--   - PROIBIDO usar obra_id = opp_<id> como vínculo.
--
-- Responsável pela decisão: Revisão manual obrigatória antes da execução.
-- Fase EVIS: Fase 1D.3 — Migration Proposal
-- Status: PROPOSTA — NÃO APLICADA
-- Data da proposta: 2026-05-04
--
-- =============================================================================



-- =============================================================================
-- SEÇÃO 1: PRÉ-CHECKS — RODAR ANTES DE QUALQUER ALTERAÇÃO
-- =============================================================================
-- Objetivo: confirmar estado atual do schema antes de alterar.
-- NÃO alteram nada. Apenas leitura.

-- 1.1 Verificar nullable atual de orcamentos.obra_id
--     Esperado antes desta migration: is_nullable = NO
--     Esperado após esta migration:   is_nullable = YES
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'orcamentos'
  and column_name  = 'obra_id';

-- 1.2 Verificar FK e constraints relacionais sobre obra_id em orcamentos
--     Nota: o NOT NULL é verificado corretamente via information_schema.columns.is_nullable (Seção 1.1).
--     Esta query verifica FKs (ex: obra_id → obras.id), UNIQUE e CHECK constraints relacionais.
select
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name  as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints       tc
left join information_schema.key_column_usage   kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema   = kcu.table_schema
left join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema   = tc.table_schema
where tc.table_schema = 'public'
  and tc.table_name   = 'orcamentos'
  and kcu.column_name = 'obra_id';

-- 1.3 Verificar RLS/Policies em orcamentos e orcamento_itens
--     ATENÇÃO: se alguma policy usar obra_id como filtro,
--     ela pode quebrar para orçamentos com obra_id = NULL.
--     Revisar cada policy listada antes de executar a migration.
select
  tablename,
  policyname,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename  in ('orcamentos', 'orcamento_itens')
order by tablename, policyname;

-- 1.4 Verificar triggers que possam depender de obra_id
select
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
from information_schema.triggers
where trigger_schema      = 'public'
  and event_object_table  in ('orcamentos', 'orcamento_itens')
order by trigger_name;

-- 1.5 Verificar índices sobre obra_id em orcamentos
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename  = 'orcamentos'
  and indexdef   ilike '%obra_id%';

-- 1.6 Contagem de orçamentos existentes (baseline)
select
  count(*)                                        as total_orcamentos,
  count(*) filter (where obra_id is not null)     as com_obra_id,
  count(*) filter (where obra_id is null)         as sem_obra_id
from public.orcamentos;

-- 1.7 Verificar se já existe algum orçamento com obra_id = NULL
--     (Se já existir, o banco real pode já aceitar nullable — verificar)
select count(*) as ja_possui_obra_id_null
from public.orcamentos
where obra_id is null;



-- =============================================================================
-- SEÇÃO 2: MIGRATION PROPOSTA
-- =============================================================================
-- ATENÇÃO:
--   - Executar SOMENTE após revisão humana dos resultados da Seção 1.
--   - Verificar se alguma policy RLS usa obra_id antes de prosseguir.
--   - Esta é a menor alteração possível: apenas DROP NOT NULL na coluna.
--   - A FK para obras.id (se existir) é mantida — apenas a constraint
--     NOT NULL é removida.
--   - Orçamentos com obra_id preenchido continuam funcionando normalmente.
--   - Orçamentos novos de Oportunidade serão criados com obra_id = NULL.

begin;

alter table public.orcamentos
  alter column obra_id drop not null;

commit;



-- =============================================================================
-- SEÇÃO 3: VALIDAÇÃO PÓS-MIGRATION
-- =============================================================================
-- Rodar imediatamente após a migration para confirmar o efeito.
-- Esperado: is_nullable = YES

select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'orcamentos'
  and column_name  = 'obra_id';

-- Confirmar que orçamentos legados (com obra_id) continuam intactos
select
  count(*)                                        as total_orcamentos,
  count(*) filter (where obra_id is not null)     as com_obra_id,
  count(*) filter (where obra_id is null)         as sem_obra_id
from public.orcamentos;



-- =============================================================================
-- SEÇÃO 4: ROLLBACK SEGURO
-- =============================================================================
-- Usar SOMENTE se a migration precisar ser revertida.
-- REQUISITO: não pode existir nenhum orçamento com obra_id = NULL
--            que já tenha sido criado depois da migration.
--            Se existirem, a reversão falhará com violação de constraint.

begin;

-- 4.1 Verificar quantos orçamentos têm obra_id = NULL antes de reverter
--     Se este count > 0, a reversão NÃO pode ser executada com segurança
--     sem antes deletar ou atualizar esses registros.
select count(*) as orcamentos_sem_obra
from public.orcamentos
where obra_id is null;

-- 4.2 Rollback — executar APENAS se orcamentos_sem_obra = 0
--     (descomentar a linha abaixo somente nessa condição)

-- alter table public.orcamentos
--   alter column obra_id set not null;

commit;



-- =============================================================================
-- SEÇÃO 5: CHECKLIST DE TESTES MANUAIS PÓS-MIGRATION
-- =============================================================================
-- Executar estes testes manualmente na aplicação após aplicar a migration.

-- [ ] 1. Acessar uma Oportunidade existente em /oportunidades/:id/orcamentista
-- [ ] 2. Clicar em "Criar orçamento da oportunidade"
--         - Esperado: orçamento criado sem obra_id, sem erro
--         - Esperado: opportunities.orcamento_id atualizado com o novo id
-- [ ] 3. Verificar no Supabase Dashboard que o novo registro em orcamentos
--         tem obra_id = NULL e orcamento_id presente em opportunities
-- [ ] 4. Adicionar item manual no painel de itens
--         - Esperado: item criado em orcamento_itens com orcamento_id correto
-- [ ] 5. Editar item manual
--         - Esperado: PATCH bem-sucedido, valor_total recalculado
-- [ ] 6. Remover item manual
--         - Esperado: DELETE bem-sucedido, lista atualizada
-- [ ] 7. Acessar uma Obra existente em /obras/:obraId e verificar orçamento legado
--         - Esperado: orçamento legado com obra_id continua carregando normalmente
--         - Esperado: nenhuma regressão na aba de orçamento da Obra
-- [ ] 8. Verificar policies RLS identificadas na Seção 1.3
--         - Se alguma policy usa obra_id como filtro obrigatório,
--           verificar se orçamentos com obra_id = NULL passam ou são bloqueados
--           pela policy (RLS pode precisar ser ajustada separadamente)



-- =============================================================================
-- SEÇÃO 6: NOTAS DE ARQUITETURA
-- =============================================================================
--
-- Esta migration NÃO:
--   - Adiciona coluna opportunity_id em orcamentos
--   - Remove a coluna obra_id
--   - Altera a FK de obra_id para obras.id (se existir)
--   - Altera orcamento_itens
--   - Altera opportunities
--   - Altera RLS/policies
--   - Altera triggers
--   - Altera código TypeScript
--
-- Vínculo de orçamento por oportunidade após esta migration:
--   opportunities.orcamento_id (string | null)
--     → orcamentos.id
--       → orcamento_itens.orcamento_id
--
-- Vínculo de orçamento por obra (legado, não alterado):
--   useOrcamento.ts: sbFetch(`orcamentos?obra_id=eq.${obraId}`)
--     → orcamentos.obra_id (nullable, mas preenchido para Obras)
--       → orcamento_itens.orcamento_id
--
-- Referência de código:
--   src/hooks/useOportunidadeOrcamento.ts — criarOrcamentoParaOportunidade()
--   src/pages/Oportunidade/OrcamentistaTab.tsx
--   src/pages/Oportunidade/OrcamentistaManualItemsPanel.tsx
--
-- Documentação:
--   platform/docs/SCHEMA_GAP_REPORT.md — Seções 11.9 e 11.10
--
-- =============================================================================
