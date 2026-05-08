# EVIS - Reader/Verifier/HITL Post-Migration Validation Plan

> Fase: 4B.2.P
> Tipo: plano documental de validacao funcional pos-migration; sem execucao real
> Status: plano pronto; nenhum SQL executado; nenhum dado inserido; banco intocado
> Staging autorizado: `vtlepoljlqmjwuauygni`
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo

Definir um runbook seguro e auditavel para a Fase 4B.2.E — Post-Migration Validation, que validara funcionalmente as 9 tabelas Reader/Verifier/HITL aplicadas no staging em 4B.1.E.

Esta fase (4B.2.P) NAO executa SQL, NAO insere dados, NAO altera schema e NAO toca producao.

## 2. Ambiente

| Item | Valor |
|------|-------|
| Staging autorizado | `vtlepoljlqmjwuauygni` |
| Producao bloqueada | `jwutiebpfauwzzltwgbb` |
| Estado pos-4B.1.E | 26 tabelas publicas (17 baseline + 9 pipeline) |
| RLS pipeline | habilitado nas 9 tabelas, sem policies |
| Triggers de protecao | 3 ativos |
| Funcoes de protecao | 2 ativas |
| Constraints CHECK pipeline | 47 ativas (4 named + 43 inline) |
| Constraints UNIQUE | 1 (`orc_divergences_dedupe_unique`) |
| FKs externas | 26, todas RESTRICT |
| FKs internas | 21, todas RESTRICT |

## 3. Inventario Detectado para Validacao

### 3.1 Tabelas alvo (9)

| # | Tabela | Append-only via trigger | Imutabilidade parcial |
|---|--------|------------------------|---------------------|
| 1 | `orc_reader_runs` | NAO | NAO |
| 2 | `orc_reader_outputs` | NAO | SIM (`raw_output_json` imutavel) |
| 3 | `orc_reader_safety_evaluations` | NAO | NAO |
| 4 | `orc_verifier_runs` | NAO | NAO |
| 5 | `orc_reader_verifier_comparisons` | NAO | NAO |
| 6 | `orc_reader_verifier_divergences` | NAO | NAO |
| 7 | `orc_hitl_issues` | NAO | NAO |
| 8 | `orc_hitl_decisions` | SIM (UPDATE/DELETE/TRUNCATE bloqueados) | total |
| 9 | `orc_context_snapshots` | NAO (mas semanticamente append-only) | NAO |

### 3.2 Constraints CHECK relevantes para teste

| Categoria | Exemplo | Tabelas afetadas |
|-----------|---------|------------------|
| `page_number > 0` | `CHECK (page_number > 0)` | runs, outputs, safety, verifier, comparisons, divergences |
| `length(trim(...)) > 0` | em campos texto NOT NULL | reader_motor, source_quality, verifier_motor, category, technical_field, title, reason, dedupe_key, etc |
| Status enum | `status IN (...)` | reader_runs, verifier_runs, comparisons, divergences, hitl_issues |
| Severity enum | `severity IN ('baixa','media','alta','critica')` | divergences, hitl_issues |
| Decision type enum | `decision_type IN (...)` | hitl_decisions |
| Score range | `agreement_score BETWEEN 0 AND 1` | comparisons |
| Confidence range | `confidence_score IS NULL OR (>=0 AND <=1)` | reader_outputs |
| Counts non-negative | `identified_count >= 0` etc | reader_outputs |
| Block-vs-dispatch | `NOT (blocks_consolidation AND allowed_to_dispatch)` | safety_evaluations, comparisons |
| Has-source | pelo menos uma fonte identificavel | hitl_issues, context_snapshots |

### 3.3 UNIQUE constraint

`orc_divergences_dedupe_unique (comparison_id, dedupe_key)` — testar duplicidade.

### 3.4 Triggers

| Trigger | Tabela | Bloqueia |
|---------|--------|---------|
| `trg_orc_reader_outputs_prevent_raw_update` | `orc_reader_outputs` | UPDATE de `raw_output_json` |
| `trg_orc_hitl_decisions_no_update_delete` | `orc_hitl_decisions` | UPDATE e DELETE de qualquer linha |
| `trg_orc_hitl_decisions_no_truncate` | `orc_hitl_decisions` | TRUNCATE da tabela |

### 3.5 FKs obrigatorias (NOT NULL)

| Tabela | FK NOT NULL |
|--------|-------------|
| `orc_reader_runs` | opportunity_id, opportunity_file_id |
| `orc_reader_outputs` | reader_run_id, opportunity_id, opportunity_file_id |
| `orc_reader_safety_evaluations` | reader_run_id, reader_output_id, opportunity_id, opportunity_file_id |
| `orc_verifier_runs` | reader_run_id, reader_output_id, opportunity_id, opportunity_file_id |
| `orc_reader_verifier_comparisons` | reader_output_id, verifier_run_id, opportunity_id, opportunity_file_id |
| `orc_reader_verifier_divergences` | comparison_id, reader_output_id, verifier_run_id, opportunity_id, opportunity_file_id |
| `orc_hitl_issues` | opportunity_id |
| `orc_hitl_decisions` | hitl_issue_id, opportunity_id |
| `orc_context_snapshots` | opportunity_id |

### 3.6 FKs opcionais (NULL)

`orcamento_id` em todas as 9 tabelas. `opportunity_file_id` em `orc_hitl_issues` e `orc_context_snapshots`. Ancestrais de pipeline em `orc_hitl_issues` e `orc_context_snapshots`.

### 3.7 Colunas JSONB obrigatorias

| Tabela | JSONB NOT NULL |
|--------|---------------|
| `orc_reader_runs` | source_refs_json (default `'{}'`) |
| `orc_reader_outputs` | raw_output_json, normalized_output_json, source_refs_json |
| `orc_reader_safety_evaluations` | safety_gate_json, dimensional_checks_json, source_refs_json |
| `orc_verifier_runs` | verifier_output_json, source_refs_json |
| `orc_reader_verifier_comparisons` | comparison_json, dispatch_decision_json, source_refs_json |
| `orc_reader_verifier_divergences` | source_refs_json |
| `orc_hitl_issues` | source_refs_json |
| `orc_hitl_decisions` | source_refs_json, issue_snapshot_json, decision_payload_json |
| `orc_context_snapshots` | source_refs_json, context_snapshot_json |

### 3.8 Status/enums textuais aceitos

| Tabela | Coluna | Valores aceitos |
|--------|--------|-----------------|
| `orc_reader_runs` | status | received, normalized, safety_evaluated, blocked, ready_for_verifier |
| `orc_verifier_runs` | status | received, normalized, compared, requires_hitl, blocked, approved |
| `orc_reader_verifier_comparisons` | status | pending, divergent, requires_hitl, dispatch_allowed, consolidation_blocked |
| `orc_reader_verifier_comparisons` | agreement_band | low, medium, high |
| `orc_reader_verifier_divergences` | status | aberta, aceita, descartada, resolvida (default `aberta`) |
| `orc_reader_verifier_divergences` | severity | baixa, media, alta, critica |
| `orc_hitl_issues` | severity | baixa, media, alta, critica |
| `orc_hitl_issues` | status | pendente, em_revisao, aprovada_com_ressalva, bloqueada, documento_solicitado, convertida_em_verba, ignorada_nesta_fase, reanalisar_futuramente |
| `orc_hitl_decisions` | decision_type | aprovar_com_ressalva, manter_bloqueado, solicitar_documento, marcar_como_verba, ignorar_nesta_fase, reanalisar_futuramente |
| `orc_context_snapshots` | context_status | validated, pending, blocked, incomplete |

## 4. Estrategia de Cleanup/Rollback

### 4.1 Principio fundamental

**Toda escrita em tabelas pipeline acontece dentro de `BEGIN; ... ROLLBACK;` numa unica chamada API.** Nada persiste apos o teste.

Razoes:
- `orc_hitl_decisions` tem trigger BEFORE UPDATE/DELETE — uma vez inserido sem rollback, fica permanente
- Reduz risco de residuos esquecidos
- Cleanup automatico independe de ordem de FKs
- Funciona mesmo se um teste falhar no meio: `ROLLBACK` desfaz tudo

### 4.2 Padrao de chamada para teste positivo

```sql
BEGIN;
  -- Anchor data (test opportunity, file, orcamento)
  INSERT INTO public.opportunities (id, ...) VALUES ('00000000-...-4b2-...', 'EVIS_TEST_4B2 ...');
  INSERT INTO public.opportunity_files (id, opportunity_id, ...) VALUES (...);
  INSERT INTO public.orcamentos (id, nome, status, bdi, ...) VALUES (..., 'EVIS_TEST_4B2', ...);

  -- Pipeline inserts
  INSERT INTO public.orc_reader_runs (...) VALUES (...);
  -- ...continuacao do pipeline...

  -- Verificacoes via SELECT count(*)
  SELECT COUNT(*) FROM public.orc_reader_runs WHERE opportunity_id = '...';

ROLLBACK;
```

### 4.3 Padrao de chamada para teste negativo

Cada teste negativo roda em sua propria transacao para nao contaminar outros testes:

```sql
BEGIN;
  INSERT INTO public.orc_reader_runs (page_number, ...) VALUES (0, ...);
  -- esperado: ERROR — viola CHECK page_number > 0
ROLLBACK;
```

A chamada API retornara erro 400, mas o staging nao tera sido alterado. O erro sera capturado e classificado como "violacao esperada confirmada".

### 4.4 Padrao de chamada para teste de trigger

```sql
BEGIN;
  -- Setup
  INSERT INTO public.opportunities (id, ...) VALUES (...);
  INSERT INTO public.orc_hitl_issues (...) VALUES (...) RETURNING id;
  INSERT INTO public.orc_hitl_decisions (...) VALUES (...) RETURNING id;

  -- Tentar UPDATE (deve falhar pelo trigger)
  UPDATE public.orc_hitl_decisions SET notes = 'tampered' WHERE id = ...;
ROLLBACK;
```

### 4.5 Quando NAO usar transacao

Apenas leituras (RLS audit, status check, count) podem rodar sem `BEGIN`/`ROLLBACK`. Read-only por definicao.

### 4.6 Plano B — Cleanup por marcador

Caso alguma transacao falhe de modo a deixar dados:

```sql
-- Cleanup defensivo (so se necessario)
DELETE FROM public.orc_context_snapshots WHERE source_type LIKE 'EVIS_TEST_4B2%';
DELETE FROM public.orc_reader_verifier_divergences WHERE category LIKE 'EVIS_TEST_4B2%';
DELETE FROM public.orc_reader_verifier_comparisons WHERE comparison_json::text LIKE '%EVIS_TEST_4B2%';
DELETE FROM public.orc_verifier_runs WHERE verifier_motor LIKE 'EVIS_TEST_4B2%';
DELETE FROM public.orc_reader_safety_evaluations WHERE safety_gate_json::text LIKE '%EVIS_TEST_4B2%';
DELETE FROM public.orc_reader_outputs WHERE raw_output_json::text LIKE '%EVIS_TEST_4B2%';
DELETE FROM public.orc_reader_runs WHERE reader_motor LIKE 'EVIS_TEST_4B2%';
DELETE FROM public.orc_hitl_issues WHERE title LIKE 'EVIS_TEST_4B2%';
DELETE FROM public.opportunity_files WHERE filename LIKE 'EVIS_TEST_4B2%';
DELETE FROM public.opportunities WHERE name LIKE 'EVIS_TEST_4B2%';
DELETE FROM public.orcamentos WHERE nome LIKE 'EVIS_TEST_4B2%';
-- orc_hitl_decisions: NAO pode DELETE — trigger bloqueia. Confiar em ROLLBACK.
```

`orc_hitl_decisions` so pode ser limpa via rollback transacional. Se uma decisao escapar para o banco, o unico caminho e drop+recreate da tabela ou desabilitar o trigger temporariamente — ambos PROIBIDOS na 4B.2.E.

## 5. Marcadores de Dados Sinteticos

Todos os dados de teste devem usar marcadores claramente identificaveis:

| Tipo | Marcador |
|------|---------|
| Prefixo textual | `EVIS_TEST_4B2_` |
| UUID semantico | UUIDs gerados via `gen_random_uuid()` em runtime, capturados via `RETURNING id` |
| created_by (quando aplicavel) | `'4B.2 validation'` |
| Status sintetico | usar valores reais do enum, mas com payload identificavel |
| Nome de obra/cliente | `'EVIS_TEST_4B2 — Validation Run'` |
| Reader/verifier motor | `'EVIS_TEST_4B2_motor_v1'` |

Nenhum dado real de cliente. Nenhum nome real de obra. Nenhum CPF/CNPJ.

## 6. Plano de Testes — Fase 4B.2.E

### 6.1 Bloco A — Pre-checks read-only

| # | Verificacao | Esperado |
|---|------------|---------|
| A1 | `current_database()`, `version()` | postgres, PG 17.6 |
| A2 | 9 tabelas pipeline presentes | 9 |
| A3 | `rowsecurity = true` nas 9 tabelas | 9 |
| A4 | Zero policies em `pg_policies` para tabelas pipeline | 0 |
| A5 | 3 triggers presentes em `pg_trigger` | 3 |
| A6 | 2 funcoes presentes em `pg_proc` (fn_orc_*) | 2 |
| A7 | UNIQUE constraint presente | 1 |
| A8 | `count(*)` zero em todas as 9 tabelas | tudo zero |

### 6.2 Bloco B — Happy path (teste positivo, dentro de BEGIN/ROLLBACK)

Em uma unica chamada API, encadear:

| # | Insert | Validacao |
|---|--------|-----------|
| B1 | `opportunities` (test anchor) | RETURNING id |
| B2 | `opportunity_files` referenciando B1 | RETURNING id |
| B3 | `orcamentos` (test anchor) | RETURNING id |
| B4 | `orc_reader_runs` referenciando B1, B2, B3 | RETURNING id, status='ready_for_verifier' |
| B5 | `orc_reader_outputs` referenciando B4 | RETURNING id, raw_output_json valido |
| B6 | `orc_reader_safety_evaluations` referenciando B4, B5 | RETURNING id |
| B7 | `orc_verifier_runs` referenciando B4, B5 | RETURNING id, status='approved' |
| B8 | `orc_reader_verifier_comparisons` referenciando B5, B7 | RETURNING id, agreement_band='high' |
| B9 | `orc_reader_verifier_divergences` referenciando B8, B5, B7 | RETURNING id, status default='aberta' |
| B10 | `orc_hitl_issues` referenciando B8, B9 | RETURNING id, status='pendente' |
| B11 | `orc_hitl_decisions` referenciando B10 | RETURNING id, decision_type='aprovar_com_ressalva' |
| B12 | `orc_context_snapshots` referenciando B4..B10 | RETURNING id, context_status='validated' |
| B13 | `SELECT COUNT(*)` em cada uma das 9 tabelas | 1 cada |
| B14 | `ROLLBACK` | implicito ao final |

### 6.3 Bloco C — Testes negativos de CHECK

Cada teste em sua propria chamada API com `BEGIN; ...; ROLLBACK;`:

| # | Violacao | Esperado |
|---|---------|---------|
| C1 | `page_number = 0` em `orc_reader_runs` | ERROR check_violation |
| C2 | `page_number = -1` | ERROR check_violation |
| C3 | `reader_motor = ''` (string vazia) | ERROR check_violation |
| C4 | `reader_motor = '   '` (so espacos) | ERROR check_violation |
| C5 | `status = 'invalid_status'` em `orc_reader_runs` | ERROR check_violation |
| C6 | `severity = 'invalid'` em `orc_hitl_issues` | ERROR check_violation |
| C7 | `decision_type = 'invalid'` em `orc_hitl_decisions` | ERROR check_violation |
| C8 | `agreement_score = 1.5` em comparisons | ERROR check_violation |
| C9 | `agreement_score = -0.1` | ERROR check_violation |
| C10 | `agreement_band = 'extreme'` | ERROR check_violation |
| C11 | `confidence_score = 2.0` em outputs | ERROR check_violation |
| C12 | `identified_count = -1` em outputs | ERROR check_violation |
| C13 | `blocks_consolidation = true AND allowed_to_dispatch = true` em safety | ERROR check `orc_reader_safety_block_dispatch_ck` |
| C14 | `blocks_consolidation = true AND allowed_to_dispatch = true` em comparisons | ERROR check `orc_comp_block_dispatch_ck` |
| C15 | `orc_hitl_issues` sem nenhuma fonte (todas NULL, source_refs_json `{}`) | ERROR check `orc_hitl_issue_has_source_ck` |
| C16 | `orc_context_snapshots` sem nenhuma fonte | ERROR check `orc_context_snapshot_has_source_ck` |

### 6.4 Bloco D — Testes negativos de FK

| # | Violacao | Esperado |
|---|---------|---------|
| D1 | `orc_reader_runs.opportunity_id` apontando para uuid inexistente | ERROR foreign_key_violation |
| D2 | `orc_reader_runs.opportunity_file_id` apontando para uuid inexistente | ERROR foreign_key_violation |
| D3 | `orc_reader_outputs.reader_run_id` apontando para uuid inexistente | ERROR foreign_key_violation |
| D4 | `orc_hitl_decisions.hitl_issue_id` apontando para uuid inexistente | ERROR foreign_key_violation |
| D5 | DELETE de uma `opportunities` test row apos inserir reader_run | ERROR foreign_key_violation (RESTRICT) |

### 6.5 Bloco E — Teste negativo de UNIQUE

| # | Violacao | Esperado |
|---|---------|---------|
| E1 | Inserir duas `orc_reader_verifier_divergences` com mesma `(comparison_id, dedupe_key)` | ERROR unique_violation `orc_divergences_dedupe_unique` |

### 6.6 Bloco F — Testes de triggers

| # | Acao | Esperado |
|---|------|---------|
| F1 | `UPDATE orc_reader_outputs SET raw_output_json = '{"x":1}' WHERE id = ...` | EXCEPTION 'raw_output_json is immutable after insert' |
| F2 | `UPDATE orc_reader_outputs SET normalized_output_json = '{"x":1}' WHERE id = ...` | OK (so raw_output_json e bloqueado; o resto pode ser atualizado) |
| F3 | `UPDATE orc_hitl_decisions SET notes = 'tampered' WHERE id = ...` | EXCEPTION append-only |
| F4 | `DELETE FROM orc_hitl_decisions WHERE id = ...` | EXCEPTION append-only |
| F5 | `TRUNCATE public.orc_hitl_decisions` (dentro de BEGIN/ROLLBACK) | EXCEPTION append-only TRUNCATE |

### 6.7 Bloco G — RLS audit (read-only, sem criar policies)

| # | Verificacao | Esperado |
|---|------------|---------|
| G1 | `pg_tables.rowsecurity = true` para as 9 tabelas | 9 |
| G2 | `pg_policies` para as 9 tabelas | 0 linhas |
| G3 | `pg_class.relforcerowsecurity` (force RLS) | false (default) |

Nao tentar autenticacao via anon/JWT — fora do escopo. Validacao funcional de RLS sera feita em fase de Auth.

### 6.8 Bloco H — Pos-checks finais

| # | Verificacao | Esperado |
|---|------------|---------|
| H1 | `count(*)` zero em todas as 9 tabelas pipeline | tudo zero |
| H2 | Nenhuma linha com marcador `EVIS_TEST_4B2` em qualquer tabela | tudo zero |
| H3 | 26 tabelas publicas (sem novas inadvertidas) | 26 |
| H4 | Triggers, funcoes, constraints inalteradas | identicas a 4B.1.E |
| H5 | Producao nao tocada | confirmado por endpoint hardcoded |

## 7. Testes Permitidos

- INSERT em tabelas pipeline dentro de transacao com ROLLBACK explicito
- INSERT em `opportunities`, `opportunity_files`, `orcamentos` como anchor de teste, sempre dentro de transacao com ROLLBACK
- SELECT em qualquer tabela
- UPDATE controlado para testar trigger de imutabilidade
- DELETE controlado para testar trigger de append-only
- TRUNCATE controlado para testar trigger anti-truncate
- Audit de `pg_tables`, `pg_policies`, `pg_trigger`, `pg_proc`, `pg_constraint`
- Captura de mensagens de erro SQLSTATE para classificacao

## 8. Testes Proibidos

- Qualquer chamada contra `jwutiebpfauwzzltwgbb`
- Qualquer DROP ou TRUNCATE persistente (sem ROLLBACK)
- Qualquer INSERT que escape de transacao por falta de ROLLBACK
- Qualquer ALTER TABLE no schema
- Qualquer ALTER TRIGGER ou DROP TRIGGER nas 9 tabelas
- Qualquer CREATE POLICY ou DROP POLICY
- Qualquer ALTER USER, GRANT, REVOKE
- Qualquer escrita em tabelas baseline fora das 3 anchors (`opportunities`, `opportunity_files`, `orcamentos`)
- Qualquer uso de dados reais de cliente (CPF, CNPJ, nome real, valor real)
- Qualquer alteracao em codigo, UI, .env
- Commit sem aprovacao humana

## 9. Plano de Execucao Sugerido para 4B.2.E

```
Etapa 1: Pre-checks read-only (Bloco A)
Etapa 2: Bloco B — Happy path em transacao com ROLLBACK
Etapa 3: Bloco C — 16 testes negativos CHECK, cada um em transacao isolada
Etapa 4: Bloco D — 5 testes negativos FK
Etapa 5: Bloco E — 1 teste UNIQUE
Etapa 6: Bloco F — 5 testes de triggers
Etapa 7: Bloco G — RLS audit
Etapa 8: Bloco H — Pos-checks finais
Etapa 9: Cleanup defensivo se H1 ou H2 nao zerarem
Etapa 10: Relatorio 4B.2.E
```

Cada etapa deve verificar resultado antes de avancar. Abortar imediatamente se H1 ou H2 indicarem residuo nao removivel.

## 10. Criterios de Sucesso

A 4B.2.E sera considerada bem-sucedida se:

- [ ] Pre-checks A1..A8 passam
- [ ] Happy path B1..B14 completa em transacao com ROLLBACK, sem erro inesperado
- [ ] Todos os 16 testes C1..C16 retornam ERROR de CHECK conforme esperado
- [ ] Todos os 5 testes D1..D5 retornam ERROR de FK
- [ ] Teste E1 retorna ERROR UNIQUE
- [ ] F1, F3, F4, F5 retornam EXCEPTION pelos triggers
- [ ] F2 (UPDATE de coluna nao protegida) e bem-sucedido
- [ ] G1..G3 confirmam RLS auditado e sem policies
- [ ] H1..H5 confirmam estado limpo identico a pos-4B.1.E
- [ ] Nenhuma chamada para `jwutiebpfauwzzltwgbb` registrada
- [ ] Producao nao tocada
- [ ] Nenhuma alteracao de schema, trigger, policy, codigo, UI, .env

## 11. Criterios de Abortar

Abortar imediatamente se:

- Qualquer teste positivo (Bloco B) falhar com erro inesperado
- Qualquer teste negativo retornar SUCESSO em vez de ERROR (sinal de constraint/trigger fraca)
- H1 ou H2 detectar dados residuais que nao podem ser removidos
- Qualquer chamada acidental para `jwutiebpfauwzzltwgbb`
- Ref do alvo nao confirmado como `vtlepoljlqmjwuauygni` antes de cada chamada
- Erro de conexao que sugira alvo errado
- Aparecimento de tabela inesperada em `pg_tables`
- Modificacao involuntaria de policies, triggers ou funcoes

## 12. Riscos Identificados

| # | Risco | Severidade | Mitigacao |
|---|-------|-----------|-----------|
| 1 | Dados de teste persistirem em `orc_hitl_decisions` se ROLLBACK falhar | Media | Sempre usar `BEGIN; ...; ROLLBACK;` numa unica chamada API; trigger nao deixa apagar depois |
| 2 | Cleanup parcial em outras tabelas se ROLLBACK falhar | Baixa | Marcadores `EVIS_TEST_4B2` permitem DELETE seletivo posterior |
| 3 | Falha em insert anchor (opportunities) deixar lixo | Baixa | Anchor tambem dentro da mesma transacao com ROLLBACK |
| 4 | Teste de trigger TRUNCATE corromper estado | Baixa | TRUNCATE dentro de BEGIN/ROLLBACK; trigger ja deve abortar |
| 5 | Conflito com pgcrypto/uuid em alguns ambientes | Muito Baixa | Confirmado em 4B.S5 e 4B.1.E |
| 6 | Algum teste invalidar transacao e bloquear ROLLBACK | Baixa | Cada teste negativo em sua propria transacao isolada — falha em um nao afeta outros |

## 13. Estimativa de Complexidade

| Bloco | Chamadas API estimadas |
|-------|----------------------|
| A — Pre-checks | 1 (batch) |
| B — Happy path | 1 (transacao unica) |
| C — CHECK | 16 |
| D — FK | 5 |
| E — UNIQUE | 1 |
| F — Triggers | 5 |
| G — RLS audit | 1 (batch) |
| H — Pos-checks | 1 (batch) |
| Total | ~31 chamadas |

Tempo estimado: 1-2 minutos de execucao real, mais analise.

## 14. Decisao Objetiva

> [!IMPORTANT]
> **PRONTO PARA AUTORIZAR 4B.2.E**
>
> Plano coberto, com:
> - Estrategia de cleanup robusta (BEGIN/ROLLBACK)
> - Marcadores claros (EVIS_TEST_4B2)
> - Cobertura completa: 1 happy path + 16 CHECK + 5 FK + 1 UNIQUE + 5 trigger + 3 RLS audit + 5 pos-check = 36 verificacoes
> - Producao bloqueada por endpoint hardcoded
> - Sem necessidade de criar policy, alterar schema, ou tocar codigo
>
> Aguardando autorizacao explicita para iniciar 4B.2.E.

---

**Confirmacoes da Fase 4B.2.P:**

- nenhum SQL executado;
- nenhum dado inserido;
- nenhum banco alterado;
- nenhum Supabase remoto alterado;
- producao `jwutiebpfauwzzltwgbb` nao foi usada;
- staging `vtlepoljlqmjwuauygni` referenciado apenas como alvo documental;
- nenhum codigo operacional/UI alterado;
- nenhum `.env` alterado;
- nenhum secret documentado;
- 4B.2.E permanece bloqueada ate autorizacao humana.
