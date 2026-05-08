# EVIS - Reader / Verifier / HITL Staging/Sandbox Execution Plan

> Fase: 4A.7  
> Tipo: plano de execucao e teste controlado  
> Status: plano criado; sem execucao SQL; sem migration aplicada; sem banco alterado  
> Candidate: `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`

## Checklist executivo antes de qualquer execução

- [ ] Ambiente confirmado como staging/sandbox/descartável.
- [ ] Confirmação explícita de que NÃO é produção.
- [ ] Project ref / URL do ambiente registrados.
- [ ] Backup ou snapshot confirmado.
- [ ] Role/usuário executor confirmado.
- [ ] Migration candidate congelado a partir do repositório.
- [ ] Pre-checks read-only executados e registrados.
- [ ] Ausência das 9 tabelas pipeline confirmada.
- [ ] Baseline de não contaminação registrado.
- [ ] Execução controlada autorizada por humano.
- [ ] Testes positivos preparados.
- [ ] Testes negativos preparados.
- [ ] Testes de RLS preparados.
- [ ] Teste de rollback preparado.
- [ ] Critérios de aprovação/reprovação aceitos.
- [ ] Logs de execução serão preservados.

## 1. Objetivo

Definir um plano reproduzivel e seguro para testar o migration candidate Reader / Verifier / HITL do Orcamentista IA em staging, sandbox ou banco descartavel antes de qualquer aplicacao real.

Esta fase nao executa o candidate. Ela documenta como executar, validar, reprovar, aprovar e reverter o candidate em ambiente controlado.

## 2. Escopo

Incluido nesta fase:

- planejar execucao em staging/sandbox;
- definir pre-checks obrigatorios;
- definir validacoes pos-execucao;
- definir testes positivos, negativos, RLS, rollback e nao contaminacao;
- definir criterios objetivos de aprovacao e reprovacao.

Fora do escopo:

- executar SQL agora;
- aplicar migration;
- alterar Supabase remoto;
- alterar banco real;
- alterar dados reais;
- alterar codigo operacional;
- alterar UI, rotas ou hooks;
- promover para producao.

## 3. Ambiente recomendado

Ambiente aceito para o primeiro teste:

- Supabase staging;
- banco sandbox descartavel;
- clone ou snapshot seguro do schema base;
- ambiente que possa ser destruido apos o teste.

Ambiente proibido:

- producao direta;
- projeto Supabase sem backup/snapshot validado;
- ambiente onde dados operacionais reais possam ser contaminados;
- ambiente onde operador nao consiga executar rollback completo.

## 4. Pre-checks obrigatorios

Antes de qualquer execucao do candidate, registrar em ata ou log:

- project ref e URL do ambiente;
- confirmacao explicita de que o ambiente nao e producao;
- identificacao do backup/snapshot;
- role usada para execucao;
- horario de inicio;
- operador responsavel;
- hash/commit do candidate usado.

### 4.1 Confirmar ambiente

Checklist humano:

- [ ] Project ref confere com staging/sandbox.
- [ ] URL do projeto nao e a URL de producao.
- [ ] Nome do projeto indica staging/sandbox/descartavel.
- [ ] Backup/snapshot foi criado e validado.
- [ ] Operador sabe como restaurar o snapshot.

### 4.2 Confirmar extensao UUID

Query read-only modelo:

```sql
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pgcrypto', 'uuid-ossp')
ORDER BY extname;
```

Esperado:

- `pgcrypto` presente;
- `gen_random_uuid()` disponivel.

### 4.3 Confirmar tabelas base

Query read-only modelo:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'opportunities',
    'orcamentos',
    'opportunity_files',
    'orcamento_itens'
  )
ORDER BY table_name;
```

Esperado:

- `opportunities`;
- `orcamentos`;
- `opportunity_files`;
- `orcamento_itens`.

### 4.4 Confirmar tipos das FKs alvo

Query read-only modelo:

```sql
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'opportunities' AND column_name = 'id')
    OR (table_name = 'orcamentos' AND column_name = 'id')
    OR (table_name = 'opportunity_files' AND column_name = 'id')
  )
ORDER BY table_name, column_name;
```

Esperado:

- as tres colunas `id` existem;
- as tres colunas sao `uuid`;
- as tres colunas sao PK no ambiente alvo.

### 4.5 Confirmar ausencia das 9 tabelas pipeline

Query read-only modelo:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'orc_reader_runs',
    'orc_reader_outputs',
    'orc_reader_safety_evaluations',
    'orc_verifier_runs',
    'orc_reader_verifier_comparisons',
    'orc_reader_verifier_divergences',
    'orc_hitl_issues',
    'orc_hitl_decisions',
    'orc_context_snapshots'
  )
ORDER BY table_name;
```

Esperado:

- zero linhas.

Se qualquer tabela ja existir, interromper o teste e reconciliar o ambiente antes de aplicar o candidate.

### 4.6 Confirmar RLS e policies existentes

Queries read-only modelo:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

Esperado:

- RLS conhecido nas tabelas base;
- policies abertas existentes apenas nas tabelas MVP ja conhecidas;
- nenhuma policy para as 9 tabelas pipeline antes da execucao.

### 4.7 Confirmar que `orcamento_itens` nao sera tocada

Antes da execucao, registrar baseline:

```sql
SELECT count(*) AS total_orcamento_itens
FROM public.orcamento_itens;
```

Tambem revisar o candidate localmente:

- nenhuma FK para `orcamento_itens`;
- nenhum trigger em `orcamento_itens`;
- nenhuma function/procedure de consolidacao;
- nenhum `INSERT`, `UPDATE`, `DELETE` ou `TRUNCATE` em `orcamento_itens`.

## 5. Plano de execucao controlada

Passos:

1. Abrir o arquivo candidate no repo:
   `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`.
2. Confirmar o cabecalho:
   `MIGRATION CANDIDATE ONLY. DO NOT EXECUTE IN PRODUCTION.`
3. Confirmar que o arquivo esta no commit aprovado para teste.
4. Confirmar novamente que o ambiente e staging/sandbox.
5. Registrar horario, ambiente, project ref, operador e commit.
6. Executar o candidate somente no ambiente controlado.
7. Capturar a saida completa da execucao.
8. Interromper imediatamente em qualquer erro.
9. Nao corrigir diretamente no banco.
10. Se houver erro, atualizar o candidate no repo, revisar e reiniciar em ambiente limpo.

Regra de controle:

- nenhum ajuste manual no banco deve substituir uma correcao versionada no repo.

## 6. Validacoes pos-execucao

### 6.1 Confirmar criacao das 9 tabelas

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'orc_reader_runs',
    'orc_reader_outputs',
    'orc_reader_safety_evaluations',
    'orc_verifier_runs',
    'orc_reader_verifier_comparisons',
    'orc_reader_verifier_divergences',
    'orc_hitl_issues',
    'orc_hitl_decisions',
    'orc_context_snapshots'
  )
ORDER BY table_name;
```

Esperado:

- 9 linhas.

### 6.2 Confirmar colunas principais

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name LIKE 'orc_%'
  AND column_name IN (
    'id',
    'opportunity_id',
    'orcamento_id',
    'opportunity_file_id',
    'page_number',
    'status',
    'created_at',
    'updated_at'
  )
ORDER BY table_name, ordinal_position;
```

Esperado:

- `opportunity_id` direto nas 9 tabelas;
- `orcamento_id` nullable nas 9 tabelas;
- `opportunity_file_id` e `page_number` obrigatorios nas tabelas page-scoped;
- `updated_at` apenas onde previsto no candidate.

### 6.3 Confirmar FKs

```sql
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
 AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
 AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
 AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
    'orc_reader_runs',
    'orc_reader_outputs',
    'orc_reader_safety_evaluations',
    'orc_verifier_runs',
    'orc_reader_verifier_comparisons',
    'orc_reader_verifier_divergences',
    'orc_hitl_issues',
    'orc_hitl_decisions',
    'orc_context_snapshots'
  )
ORDER BY tc.table_name, kcu.column_name;
```

Esperado:

- FKs para `opportunities`, `orcamentos`, `opportunity_files` e lineage interno;
- todas com `ON DELETE RESTRICT`;
- nenhuma FK para `orcamento_itens`.

### 6.4 Confirmar indices

```sql
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'orc_reader_runs',
    'orc_reader_outputs',
    'orc_reader_safety_evaluations',
    'orc_verifier_runs',
    'orc_reader_verifier_comparisons',
    'orc_reader_verifier_divergences',
    'orc_hitl_issues',
    'orc_hitl_decisions',
    'orc_context_snapshots'
  )
ORDER BY tablename, indexname;
```

Esperado:

- indices por `opportunity_id`;
- indices por `orcamento_id`;
- indices por arquivo/pagina nas tabelas page-scoped;
- indices de lineage;
- indices de status/timeline;
- indices adicionais da 4A.3.

### 6.5 Confirmar constraints

```sql
SELECT conrelid::regclass AS table_name, conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
  AND conrelid::regclass::text IN (
    'orc_reader_runs',
    'orc_reader_outputs',
    'orc_reader_safety_evaluations',
    'orc_verifier_runs',
    'orc_reader_verifier_comparisons',
    'orc_reader_verifier_divergences',
    'orc_hitl_issues',
    'orc_hitl_decisions',
    'orc_context_snapshots'
  )
ORDER BY table_name, conname;
```

Esperado:

- checks de `page_number`;
- checks de score 0..1;
- checks de status;
- checks de severidade;
- checks de texto critico nao vazio;
- checks de source suficiente em HITL/context;
- unique de divergencia `(comparison_id, dedupe_key)`.

### 6.6 Confirmar functions

```sql
SELECT proname, prosrc, proconfig
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname IN (
    'fn_orc_reader_outputs_prevent_raw_update',
    'fn_orc_hitl_decisions_append_only'
  )
ORDER BY proname;
```

Esperado:

- 2 funcoes;
- `proconfig` contendo `search_path=public, pg_temp`;
- funcoes apenas bloqueiam operacoes proibidas;
- nenhuma escrita em outras tabelas.

### 6.7 Confirmar triggers

```sql
SELECT trigger_name, event_object_table, event_manipulation, action_timing, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('orc_reader_outputs', 'orc_hitl_decisions')
ORDER BY event_object_table, trigger_name, event_manipulation;
```

Esperado:

- trigger de imutabilidade em `orc_reader_outputs`;
- trigger `UPDATE`/`DELETE` em `orc_hitl_decisions`;
- trigger `TRUNCATE` em `orc_hitl_decisions`.

### 6.8 Confirmar RLS habilitado e sem policies abertas

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'orc_reader_runs',
    'orc_reader_outputs',
    'orc_reader_safety_evaluations',
    'orc_verifier_runs',
    'orc_reader_verifier_comparisons',
    'orc_reader_verifier_divergences',
    'orc_hitl_issues',
    'orc_hitl_decisions',
    'orc_context_snapshots'
  )
ORDER BY tablename;
```

```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'orc_reader_runs',
    'orc_reader_outputs',
    'orc_reader_safety_evaluations',
    'orc_verifier_runs',
    'orc_reader_verifier_comparisons',
    'orc_reader_verifier_divergences',
    'orc_hitl_issues',
    'orc_hitl_decisions',
    'orc_context_snapshots'
  )
ORDER BY tablename, policyname;
```

Esperado:

- RLS habilitado nas 9 tabelas;
- zero policies;
- nenhuma policy `USING (true)`.

## 7. Testes positivos com service_role/admin

Estes testes devem ser executados somente em staging/sandbox e com role administrativa ou `service_role`.

Pre-requisito:

- escolher uma oportunidade real ou seed de staging;
- obter `opportunity_id`;
- obter `orcamento_id` compativel, se existir;
- obter `opportunity_file_id` ligado a oportunidade.

Se o seed de staging nao tiver orcamento, usar `NULL` nos campos `orcamento_id`. Nesta fase, `orcamento_id` continua nullable; nao usar o literal `'<ORCAMENTO_ID>'` quando nao houver id real.

Placeholders usados abaixo:

- `<OPPORTUNITY_ID>`
- `<ORCAMENTO_ID>` ou `NULL`
- `<OPPORTUNITY_FILE_ID>`
- `<READER_RUN_ID>`
- `<READER_OUTPUT_ID>`
- `<VERIFIER_RUN_ID>`
- `<COMPARISON_ID>`
- `<DIVERGENCE_ID>`
- `<HITL_ISSUE_ID>`
- `<HITL_DECISION_ID>`

### 7.1 Inserir `orc_reader_runs`

```sql
INSERT INTO public.orc_reader_runs (
  opportunity_id,
  orcamento_id,
  opportunity_file_id,
  page_number,
  document_id,
  reader_motor,
  source_quality,
  status,
  source_refs_json
) VALUES (
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  '<OPPORTUNITY_FILE_ID>',
  1,
  'sandbox-doc-001',
  'gpt-5.5-sandbox-reader',
  'sandbox_pdf_text',
  'received',
  '{"sandbox": true}'::jsonb
) RETURNING id;
```

### 7.2 Inserir `orc_reader_outputs`

```sql
INSERT INTO public.orc_reader_outputs (
  reader_run_id,
  opportunity_id,
  orcamento_id,
  opportunity_file_id,
  page_number,
  document_id,
  raw_output_json,
  normalized_output_json,
  identified_count,
  inferred_count,
  missing_count,
  confidence_score,
  source_refs_json
) VALUES (
  '<READER_RUN_ID>',
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  '<OPPORTUNITY_FILE_ID>',
  1,
  'sandbox-doc-001',
  '{"identified_items":[{"id":"item-1","description":"Parede a demolir"}]}'::jsonb,
  '{"identified_items":[{"id":"item-1","description":"Parede a demolir","source":"page_1"}]}'::jsonb,
  1,
  0,
  0,
  0.8500,
  '{"page":1,"sandbox":true}'::jsonb
) RETURNING id;
```

### 7.3 Inserir `orc_reader_safety_evaluations`

```sql
INSERT INTO public.orc_reader_safety_evaluations (
  reader_run_id,
  reader_output_id,
  opportunity_id,
  orcamento_id,
  opportunity_file_id,
  page_number,
  document_id,
  safety_gate_json,
  dimensional_checks_json,
  requires_verifier,
  requires_hitl,
  blocks_consolidation,
  allowed_to_dispatch,
  source_refs_json
) VALUES (
  '<READER_RUN_ID>',
  '<READER_OUTPUT_ID>',
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  '<OPPORTUNITY_FILE_ID>',
  1,
  'sandbox-doc-001',
  '{"result":"requires_verifier"}'::jsonb,
  '[]'::jsonb,
  true,
  false,
  false,
  false,
  '{"page":1,"sandbox":true}'::jsonb
) RETURNING id;
```

### 7.4 Inserir `orc_verifier_runs`

```sql
INSERT INTO public.orc_verifier_runs (
  reader_run_id,
  reader_output_id,
  opportunity_id,
  orcamento_id,
  opportunity_file_id,
  page_number,
  document_id,
  verifier_motor,
  verifier_output_json,
  status,
  source_refs_json
) VALUES (
  '<READER_RUN_ID>',
  '<READER_OUTPUT_ID>',
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  '<OPPORTUNITY_FILE_ID>',
  1,
  'sandbox-doc-001',
  'gemini-3.1-sandbox-verifier',
  '{"confirmed_items":[{"id":"item-1"}]}'::jsonb,
  'received',
  '{"page":1,"sandbox":true}'::jsonb
) RETURNING id;
```

### 7.5 Inserir `orc_reader_verifier_comparisons`

```sql
INSERT INTO public.orc_reader_verifier_comparisons (
  reader_output_id,
  verifier_run_id,
  opportunity_id,
  orcamento_id,
  opportunity_file_id,
  page_number,
  document_id,
  agreement_score,
  agreement_band,
  comparison_json,
  dispatch_decision_json,
  requires_hitl,
  blocks_consolidation,
  allowed_to_dispatch,
  status,
  source_refs_json
) VALUES (
  '<READER_OUTPUT_ID>',
  '<VERIFIER_RUN_ID>',
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  '<OPPORTUNITY_FILE_ID>',
  1,
  'sandbox-doc-001',
  0.9500,
  'high',
  '{"agreement":"high"}'::jsonb,
  '{"allowed_to_dispatch":true}'::jsonb,
  false,
  false,
  true,
  'dispatch_allowed',
  '{"page":1,"sandbox":true}'::jsonb
) RETURNING id;
```

### 7.6 Inserir `orc_reader_verifier_divergences`

```sql
INSERT INTO public.orc_reader_verifier_divergences (
  comparison_id,
  reader_output_id,
  verifier_run_id,
  opportunity_id,
  orcamento_id,
  opportunity_file_id,
  page_number,
  document_id,
  category,
  technical_field,
  affected_item,
  discipline,
  title,
  reader_value,
  verifier_value,
  reason,
  severity,
  requires_hitl,
  blocks_consolidation,
  dedupe_key,
  source_refs_json
) VALUES (
  '<COMPARISON_ID>',
  '<READER_OUTPUT_ID>',
  '<VERIFIER_RUN_ID>',
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  '<OPPORTUNITY_FILE_ID>',
  1,
  'sandbox-doc-001',
  'dimensao',
  'profundidade_estaca',
  'E1',
  'estrutural',
  'Divergencia sandbox de profundidade',
  '3.5m',
  '35m',
  'Teste controlado de divergencia',
  'media',
  true,
  false,
  'sandbox|dimensao|profundidade_estaca|E1|page_1|3.5m|35m|estrutural',
  '{"page":1,"sandbox":true}'::jsonb
) RETURNING id;
```

### 7.7 Inserir `orc_hitl_issues`

```sql
INSERT INTO public.orc_hitl_issues (
  comparison_id,
  reader_run_id,
  reader_output_id,
  verifier_run_id,
  divergence_id,
  opportunity_id,
  orcamento_id,
  opportunity_file_id,
  page_number,
  document_id,
  source_type,
  source_id,
  source_refs_json,
  issue_type,
  severity,
  status,
  title,
  description,
  evidence_summary,
  recommended_action,
  blocks_dispatch,
  blocks_consolidation
) VALUES (
  '<COMPARISON_ID>',
  '<READER_RUN_ID>',
  '<READER_OUTPUT_ID>',
  '<VERIFIER_RUN_ID>',
  '<DIVERGENCE_ID>',
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  '<OPPORTUNITY_FILE_ID>',
  1,
  'sandbox-doc-001',
  'comparison_divergence',
  '<DIVERGENCE_ID>',
  '{"page":1,"sandbox":true}'::jsonb,
  'dimensional_conflict',
  'media',
  'pendente',
  'Validar profundidade da estaca',
  'Reader e Verifier divergiram na profundidade.',
  'Reader 3.5m versus Verifier 35m.',
  'Solicitar validacao humana.',
  true,
  true
) RETURNING id;
```

### 7.8 Inserir `orc_hitl_decisions`

```sql
INSERT INTO public.orc_hitl_decisions (
  hitl_issue_id,
  opportunity_id,
  orcamento_id,
  decision_type,
  notes,
  decided_by,
  dispatch_released,
  consolidation_released,
  source_refs_json,
  issue_snapshot_json,
  decision_payload_json
) VALUES (
  '<HITL_ISSUE_ID>',
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  'aprovar_com_ressalva',
  'Teste sandbox de decisao humana.',
  'sandbox_operator',
  false,
  false,
  '{"page":1,"sandbox":true}'::jsonb,
  '{"issue_id":"<HITL_ISSUE_ID>","status":"pendente"}'::jsonb,
  '{"decision":"sandbox_only"}'::jsonb
) RETURNING id;
```

### 7.9 Inserir `orc_context_snapshots`

```sql
INSERT INTO public.orc_context_snapshots (
  opportunity_id,
  orcamento_id,
  opportunity_file_id,
  page_number,
  document_id,
  reader_run_id,
  reader_output_id,
  verifier_run_id,
  comparison_id,
  hitl_issue_id,
  source_type,
  source_id,
  source_refs_json,
  phase,
  context_status,
  context_snapshot_json,
  created_by
) VALUES (
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  '<OPPORTUNITY_FILE_ID>',
  1,
  'sandbox-doc-001',
  '<READER_RUN_ID>',
  '<READER_OUTPUT_ID>',
  '<VERIFIER_RUN_ID>',
  '<COMPARISON_ID>',
  '<HITL_ISSUE_ID>',
  'hitl_decision',
  '<HITL_DECISION_ID>',
  '{"page":1,"sandbox":true}'::jsonb,
  'reader_verifier_hitl',
  'validated',
  '{"summary":"sandbox context snapshot"}'::jsonb,
  'sandbox_operator'
) RETURNING id;
```

## 8. Testes negativos obrigatorios

Todos os testes negativos devem ser executados em staging/sandbox e devem falhar. Registrar erro exato retornado pelo banco.

### 8.1 Alterar `raw_output_json` apos insert

```sql
UPDATE public.orc_reader_outputs
SET raw_output_json = '{"tampered": true}'::jsonb
WHERE id = '<READER_OUTPUT_ID>';
```

Esperado:

- erro `raw_output_json is immutable after insert`.

### 8.2 UPDATE em `orc_hitl_decisions`

```sql
UPDATE public.orc_hitl_decisions
SET notes = 'tentativa proibida'
WHERE id = '<HITL_DECISION_ID>';
```

Esperado:

- erro de append-only.

### 8.3 DELETE em `orc_hitl_decisions`

```sql
DELETE FROM public.orc_hitl_decisions
WHERE id = '<HITL_DECISION_ID>';
```

Esperado:

- erro de append-only.

### 8.4 TRUNCATE em `orc_hitl_decisions`

```sql
TRUNCATE TABLE public.orc_hitl_decisions;
```

Esperado:

- erro de append-only via trigger statement-level.

### 8.5 `page_number <= 0`

```sql
INSERT INTO public.orc_reader_runs (
  opportunity_id, orcamento_id, opportunity_file_id, page_number,
  reader_motor, source_quality, status
) VALUES (
  '<OPPORTUNITY_ID>', '<ORCAMENTO_ID>', '<OPPORTUNITY_FILE_ID>', 0,
  'sandbox-reader', 'sandbox', 'received'
);
```

Esperado:

- erro de check constraint.

### 8.6 `confidence_score` fora de 0..1

```sql
INSERT INTO public.orc_reader_outputs (
  reader_run_id, opportunity_id, orcamento_id, opportunity_file_id, page_number,
  raw_output_json, normalized_output_json, confidence_score
) VALUES (
  '<READER_RUN_ID>', '<OPPORTUNITY_ID>', '<ORCAMENTO_ID>', '<OPPORTUNITY_FILE_ID>', 1,
  '{}'::jsonb, '{}'::jsonb, 1.5000
);
```

Esperado:

- erro de check constraint.

### 8.7 `agreement_score` fora de 0..1

```sql
INSERT INTO public.orc_reader_verifier_comparisons (
  reader_output_id, verifier_run_id, opportunity_id, orcamento_id,
  opportunity_file_id, page_number, agreement_score, agreement_band,
  comparison_json, dispatch_decision_json, status
) VALUES (
  '<READER_OUTPUT_ID>', '<VERIFIER_RUN_ID>', '<OPPORTUNITY_ID>', '<ORCAMENTO_ID>',
  '<OPPORTUNITY_FILE_ID>', 1, 1.5000, 'high',
  '{}'::jsonb, '{}'::jsonb, 'pending'
);
```

Esperado:

- erro de check constraint.

### 8.8 Severity invalida

```sql
INSERT INTO public.orc_reader_verifier_divergences (
  comparison_id, reader_output_id, verifier_run_id, opportunity_id, orcamento_id,
  opportunity_file_id, page_number, category, technical_field, title,
  reason, severity, dedupe_key
) VALUES (
  '<COMPARISON_ID>', '<READER_OUTPUT_ID>', '<VERIFIER_RUN_ID>', '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>', '<OPPORTUNITY_FILE_ID>', 1, 'sandbox', 'campo',
  'Teste severity invalida', 'Deve falhar', 'critical', 'sandbox-invalid-severity'
);
```

Esperado:

- erro de check constraint, pois severity valida e `baixa`, `media`, `alta` ou `critica`.

### 8.9 Status invalido

```sql
INSERT INTO public.orc_reader_runs (
  opportunity_id, orcamento_id, opportunity_file_id, page_number,
  reader_motor, source_quality, status
) VALUES (
  '<OPPORTUNITY_ID>', '<ORCAMENTO_ID>', '<OPPORTUNITY_FILE_ID>', 1,
  'sandbox-reader', 'sandbox', 'done'
);
```

Esperado:

- erro de check constraint.

### 8.10 Divergencia duplicada

Repetir o insert de divergencia positiva com o mesmo `comparison_id` e `dedupe_key`.

Esperado:

- erro de unique constraint `(comparison_id, dedupe_key)`.

### 8.11 HITL issue sem source suficiente

```sql
INSERT INTO public.orc_hitl_issues (
  opportunity_id,
  orcamento_id,
  source_type,
  issue_type,
  severity,
  status,
  title,
  description,
  evidence_summary,
  recommended_action
) VALUES (
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  'sandbox',
  'missing_source',
  'media',
  'pendente',
  'Issue sem source',
  'Deve falhar por falta de source suficiente.',
  'Sem source.',
  'Adicionar source.'
);
```

Esperado:

- erro de check `orc_hitl_issue_has_source_ck`.

### 8.12 Context snapshot sem source suficiente

```sql
INSERT INTO public.orc_context_snapshots (
  opportunity_id,
  orcamento_id,
  source_type,
  phase,
  context_status,
  context_snapshot_json
) VALUES (
  '<OPPORTUNITY_ID>',
  '<ORCAMENTO_ID>',
  'sandbox',
  'reader_verifier_hitl',
  'pending',
  '{}'::jsonb
);
```

Esperado:

- erro de check `orc_context_snapshot_has_source_ck`.

## 9. Testes de RLS

Objetivos:

- confirmar que RLS esta habilitado nas 9 tabelas;
- confirmar que nenhuma policy aberta `USING (true)` foi criada;
- confirmar que `anon`/`authenticated` sem policy nao conseguem operar;
- confirmar que `service_role`/admin consegue operar para teste;
- documentar que policies reais dependem de auth/tenant/company.

### 9.1 RLS habilitado

Usar a query da secao 6.8.

Esperado:

- `rowsecurity = true` nas 9 tabelas.

### 9.2 Nenhuma policy aberta

Usar a query de `pg_policies` da secao 6.8.

Esperado:

- zero policies nas 9 tabelas.

### 9.3 Teste como `anon`/`authenticated`

Executar via cliente Supabase configurado com anon key ou role equivalente em staging.

Operacoes esperadas:

- `SELECT` deve retornar bloqueado ou zero linhas por RLS;
- `INSERT` deve falhar por ausencia de policy;
- `UPDATE` deve falhar por ausencia de policy;
- `DELETE` deve falhar por ausencia de policy.

Nao criar policy temporaria para fazer esse teste. Se for preciso testar com policy, usar outro ciclo de migration em ambiente limpo.

### 9.4 Teste como `service_role`/admin

Usar a role administrativa apenas para:

- rodar testes positivos;
- rodar testes negativos;
- coletar validacoes;
- executar rollback no sandbox.

Confirmar que esse acesso nao representa permissao final de produto.

## 10. Testes de rollback

Executar rollback somente em ambiente descartavel.

Ordem:

```sql
DROP TRIGGER IF EXISTS trg_orc_hitl_decisions_no_truncate ON public.orc_hitl_decisions;
DROP TRIGGER IF EXISTS trg_orc_hitl_decisions_no_update_delete ON public.orc_hitl_decisions;
DROP FUNCTION IF EXISTS public.fn_orc_hitl_decisions_append_only();
DROP TRIGGER IF EXISTS trg_orc_reader_outputs_prevent_raw_update ON public.orc_reader_outputs;
DROP FUNCTION IF EXISTS public.fn_orc_reader_outputs_prevent_raw_update();

DROP TABLE IF EXISTS public.orc_context_snapshots;
DROP TABLE IF EXISTS public.orc_hitl_decisions;
DROP TABLE IF EXISTS public.orc_hitl_issues;
DROP TABLE IF EXISTS public.orc_reader_verifier_divergences;
DROP TABLE IF EXISTS public.orc_reader_verifier_comparisons;
DROP TABLE IF EXISTS public.orc_verifier_runs;
DROP TABLE IF EXISTS public.orc_reader_safety_evaluations;
DROP TABLE IF EXISTS public.orc_reader_outputs;
DROP TABLE IF EXISTS public.orc_reader_runs;
```

Validacoes apos rollback:

- as 9 tabelas pipeline nao existem;
- as 2 funcoes nao existem;
- as 3 triggers nao existem;
- `opportunities` continua existindo;
- `orcamentos` continua existindo;
- `opportunity_files` continua existindo;
- `orcamento_itens` continua existindo;
- `diario_obra` continua existindo;
- contagens baseline de tabelas operacionais permanecem coerentes.

## 11. Testes de nao contaminacao

Registrar baseline antes e depois:

```sql
SELECT 'opportunities' AS table_name, count(*) AS total FROM public.opportunities
UNION ALL
SELECT 'orcamentos', count(*) FROM public.orcamentos
UNION ALL
SELECT 'opportunity_files', count(*) FROM public.opportunity_files
UNION ALL
SELECT 'orcamento_itens', count(*) FROM public.orcamento_itens
UNION ALL
SELECT 'propostas', count(*) FROM public.propostas
UNION ALL
SELECT 'obras', count(*) FROM public.obras
UNION ALL
SELECT 'diario_obra', count(*) FROM public.diario_obra;
```

Confirmar:

- `orcamento_itens` nao recebeu `INSERT`;
- `orcamento_itens` nao recebeu `UPDATE`;
- `orcamento_itens` nao recebeu `DELETE`;
- `orcamentos` nao foi alterada;
- `opportunities` nao foi alterada;
- `propostas` nao foi alterada;
- `obras` nao foi alterada;
- `diario_obra` nao foi alterada;
- nenhum teste de pipeline consolidou item oficial.

## 12. Criterios objetivos de aprovacao

O candidate pode ser considerado aprovado para proxima etapa somente se:

- executa sem erro em staging/sandbox;
- cria exatamente as 9 tabelas pipeline esperadas;
- cria FKs compativeis e sem FK para `orcamento_itens`;
- cria indices esperados;
- cria constraints esperadas;
- cria funcoes com `SET search_path = public, pg_temp`;
- cria triggers esperadas;
- `raw_output_json` nao pode ser alterado;
- `orc_hitl_decisions` nao pode sofrer `UPDATE`, `DELETE` ou `TRUNCATE`;
- constraints bloqueiam dados invalidos;
- RLS fica habilitado;
- nenhuma policy aberta e criada;
- `anon`/`authenticated` sem policy nao conseguem operar;
- `service_role`/admin consegue operar para teste;
- rollback remove tudo que foi criado;
- tabelas operacionais permanecem intactas;
- nenhuma tabela de Obra/Diario e afetada;
- nenhum dado real e contaminado.

## 13. Criterios objetivos de reprovacao

O candidate deve ser reprovado se ocorrer qualquer item abaixo:

- erro de FK;
- erro de tipo;
- erro de extensao `gen_random_uuid()`;
- RLS inseguro;
- policy aberta criada;
- trigger de imutabilidade falha;
- `raw_output_json` fica alteravel;
- `orc_hitl_decisions` fica editavel;
- `orc_hitl_decisions` fica apagavel;
- `orc_hitl_decisions` fica truncavel;
- severity/status invalidos entram no banco;
- score fora de 0..1 entra no banco;
- duplicidade `(comparison_id, dedupe_key)` entra no banco;
- HITL issue sem source suficiente entra no banco;
- context snapshot sem source suficiente entra no banco;
- rollback incompleto;
- qualquer impacto em `orcamento_itens`;
- qualquer impacto inesperado em `orcamentos`, `opportunities`, `propostas`, `obras` ou Diario.

## 14. Checklist antes de avancar para 4B

- [ ] Plano 4A.7 revisado por engenharia.
- [ ] Ambiente staging/sandbox confirmado.
- [ ] Producao explicitamente excluida.
- [ ] Backup/snapshot confirmado.
- [ ] Operador definido.
- [ ] Commit/hash do candidate congelado.
- [ ] Rollback revisado.
- [ ] Logs de teste exigidos.
- [ ] Pre-checks executados e anexados.
- [ ] Resultado de execucao anexado.
- [ ] Testes positivos anexados.
- [ ] Testes negativos anexados.
- [ ] Testes RLS anexados.
- [ ] Teste de rollback anexado.
- [ ] Teste de nao contaminacao anexado.
- [ ] Aprovacao humana explicita registrada.

## 15. Proxima fase recomendada

Fase 4B - aplicar o migration candidate em staging/sandbox, somente apos aprovacao deste plano.

A 4B ainda nao deve ser producao. A promocao para producao deve depender dos logs completos de staging/sandbox, rollback validado e decisao explicita de RLS/auth/tenant/company.

## 16. Confirmacoes da fase 4A.7

- Nenhum SQL foi executado.
- Nenhuma migration foi aplicada.
- Nenhum banco foi alterado.
- Nenhum Supabase remoto foi alterado.
- Nenhum dado foi alterado.
- Nenhum codigo operacional foi alterado.
- Nenhuma UI foi alterada.
- Nenhuma rota foi criada.
- Nenhum hook foi criado.
- Nenhum commit foi feito nesta fase.
