# EVIS - Reader / Verifier / HITL Migration Candidate Review

> Fase: 4A.5  
> Tipo: migration candidate documental  
> Status: candidate criado; sem execucao SQL; sem migration aplicada; sem banco alterado  
> Arquivo candidate: `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`

## 1. Objetivo

Promover o SQL draft 4A.3 para um migration candidate revisavel da persistencia Reader / Verifier / HITL do Orçamentista IA.

Esta fase nao aplica migration. Nenhum SQL foi executado. Nenhum banco foi alterado. Nenhum codigo operacional ou UI foi alterado.

## 2. Arquivos lidos

- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_DRAFT.sql`
- `platform/docs/EVIS_READER_VERIFIER_HITL_SQL_HARDENING_REVIEW.md`
- `platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md`
- `platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_DRAFT.md`
- `platform/docs/SCHEMA_GAP_REPORT.md`
- `platform/docs/EVIS_ARCHITECTURE_PREFLIGHT_AUDIT.md`

## 3. Arquivos criados

- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`
- `platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_CANDIDATE_REVIEW.md`

## 4. Arquivos alterados

- `platform/docs/SCHEMA_GAP_REPORT.md`

## 5. O que mudou do draft para o migration candidate

O candidate preserva a estrutura principal do draft 4A.3, mas deixa a proposta mais proxima de uma migration auditavel:

- Cabecalho trocado para `MIGRATION CANDIDATE ONLY. DO NOT EXECUTE IN PRODUCTION.`
- Mantidas as 9 tabelas oficiais do pipeline.
- Mantidas FKs somente para `opportunities`, `orcamentos`, `opportunity_files` e tabelas internas do pipeline.
- Mantido `opportunity_id uuid NOT NULL` nas 9 tabelas.
- Mantido `orcamento_id uuid NULL` nas 9 tabelas.
- Mantido `document_id text NULL`, sem FK obrigatoria.
- Mantidos `opportunity_file_id + page_number` obrigatorios nas tabelas page-scoped.
- Adicionados checks de contadores nao negativos em `orc_reader_outputs`.
- Adicionado check de source suficiente em `orc_context_snapshots`.
- `orc_reader_verifier_divergences.status` foi harmonizado para portugues.
- RLS foi promovido de comentario para `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`.
- Policies reais continuam pendentes e nao foram criadas.
- Triggers executaveis de protecao foram adicionadas no candidate.
- Rollback comentado foi expandido para incluir triggers e funcoes.

## 6. Tabelas incluidas

1. `orc_reader_runs`
2. `orc_reader_outputs`
3. `orc_reader_safety_evaluations`
4. `orc_verifier_runs`
5. `orc_reader_verifier_comparisons`
6. `orc_reader_verifier_divergences`
7. `orc_hitl_issues`
8. `orc_hitl_decisions`
9. `orc_context_snapshots`

## 7. Decisao sobre status, agreement_band e severity

Decisao adotada: **Opcao C ajustada**.

- `severity` fica em portugues em todas as tabelas que usam severidade: `baixa`, `media`, `alta`, `critica`.
- `agreement_band` permanece em ingles: `low`, `medium`, `high`, pois e uma metrica tecnica e tende a interoperar melhor com logs/avaliadores.
- Status tecnicos de pipeline permanecem em ingles, por exemplo `received`, `normalized`, `compared`, `dispatch_allowed`.
- Status operacional de divergencia foi harmonizado para portugues:
  - antes: `open`, `accepted`, `dismissed`, `resolved`
  - candidate: `aberta`, `aceita`, `descartada`, `resolvida`
- Status de HITL ja estava em portugues e foi mantido.

Motivo: separar vocabulario tecnico de maquina de vocabulario operacional humano, sem criar uma traducao artificial para metricas tecnicas.

## 8. Decisao sobre triggers

Triggers executaveis foram incluidos no candidate porque sao simples, defensivos e auditaveis:

1. `fn_orc_reader_outputs_prevent_raw_update`
   - Bloqueia alteracao de `raw_output_json` em `orc_reader_outputs`.
   - Nao escreve em nenhuma tabela.
   - Nao toca `orcamento_itens`.

2. `fn_orc_hitl_decisions_append_only`
   - Bloqueia `UPDATE` e `DELETE` em `orc_hitl_decisions`.
   - Garante append-only por regra de banco.
   - Nao escreve em nenhuma tabela.
   - Nao toca `orcamento_itens`.

Essas triggers ainda precisam ser testadas em ambiente controlado antes de qualquer aplicacao real.

## 9. Decisao sobre RLS

O candidate habilita RLS nas 9 tabelas com:

```sql
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
```

Nenhuma policy aberta foi criada.

Decisao: deixar as policies definitivas para uma fase posterior de seguranca, apos decisao de auth/tenant/company_id. Sem policies, o acesso direto por roles nao privilegiados fica bloqueado, o que e aceitavel enquanto nao houver UI/API produtiva usando essas tabelas.

Diretrizes pendentes:

- Definir regra por `opportunity_id` e futuro `company_id`.
- Separar papeis de Reader, Verifier, HITL humano e auditor readonly.
- Restringir `raw_output_json`, `issue_snapshot_json` e `decision_payload_json`.
- Evitar `USING (true)` nas tabelas do pipeline.

## 10. FKs criadas no candidate

FKs externas:

- `opportunity_id` -> `public.opportunities(id)` nas 9 tabelas.
- `orcamento_id` -> `public.orcamentos(id)` nas 9 tabelas, sempre nullable.
- `opportunity_file_id` -> `public.opportunity_files(id)` quando aplicavel.

FKs internas:

- `reader_run_id` -> `orc_reader_runs(id)`
- `reader_output_id` -> `orc_reader_outputs(id)`
- `verifier_run_id` -> `orc_verifier_runs(id)`
- `comparison_id` -> `orc_reader_verifier_comparisons(id)`
- `divergence_id` -> `orc_reader_verifier_divergences(id)`
- `hitl_issue_id` -> `orc_hitl_issues(id)`

Todas usam `ON DELETE RESTRICT`.

Confirmacao: nao ha FK para `orcamento_itens`.

## 11. Indices criados no candidate

O candidate mantem os indices minimos e os indices adicionados no hardening 4A.3:

- 9 indices por `opportunity_id`.
- 9 indices por `orcamento_id`.
- 6 indices por `opportunity_file_id, page_number`.
- 9 indices de lineage interno.
- 6 indices por status/context status e `created_at`.
- 3 indices compostos recomendados.
- 7 indices adicionais de hardening:
  - `idx_orc_verifier_runs_reader_run_id`
  - `idx_orc_context_snapshots_reader_run_id`
  - `idx_orc_context_snapshots_reader_output_id`
  - `idx_orc_context_snapshots_verifier_run_id`
  - `idx_orc_context_snapshots_comparison_id`
  - `idx_orc_hitl_issues_severity`
  - `idx_orc_hitl_decisions_decided_at`

## 12. Constraints criadas no candidate

Principais constraints:

- `page_number > 0` nas tabelas page-scoped.
- `page_number IS NULL OR page_number > 0` nas tabelas contextuais.
- Scores entre 0 e 1:
  - `confidence_score`
  - `agreement_score`
- Textos criticos nao vazios:
  - motores Reader/Verifier
  - `category`
  - `technical_field`
  - `title`
  - `reason`
  - `dedupe_key`
  - `notes`
  - `decided_by`
  - `source_type`
  - `phase`
  - `created_by`
- Status controlados por CHECK.
- Severity controlada por CHECK.
- Coerencia de bloqueio:
  - `blocks_consolidation = true` impede `allowed_to_dispatch = true`.
- `unique (comparison_id, dedupe_key)` em divergencias.
- Source suficiente em `orc_hitl_issues`.
- Source suficiente em `orc_context_snapshots`.

## 13. Protecao contra escrita em orcamento_itens

O candidate nao cria:

- FK para `orcamento_itens`.
- Trigger em `orcamento_itens`.
- Function/procedure de consolidacao.
- INSERT/UPDATE/DELETE de dados.
- Escrita oficial ou indireta em `orcamento_itens`.

O pipeline continua apenas persistindo evidencias, comparacoes, divergencias, HITL e snapshots de contexto.

## 14. Riscos remanescentes

- Policies RLS finais ainda nao existem.
- O modelo ainda nao possui `company_id`/tenant.
- `orcamento_id` continua nullable por design nesta fase.
- Status tecnicos em ingles exigem documentacao consistente para consumidores futuros.
- Triggers precisam ser testadas em staging antes de producao.
- Retencao e acesso a `raw_output_json` precisam de politica de seguranca.
- `updated_at` ainda nao possui trigger automatica nas tabelas com esse campo.

## 15. Por que ainda nao aplicar em producao

Ainda nao aplicar porque:

- As policies RLS finais nao foram definidas.
- Nao houve teste em ambiente controlado.
- Nao houve auditoria externa do candidate.
- Nao existe ainda UI/API produtiva consumindo essas tabelas.
- O contrato de tenant/company ainda esta pendente.
- O pipeline ainda nao possui gate de consolidacao oficial aprovado.

## 16. Pre-requisitos para teste controlado

Antes de aplicar em staging:

1. Revisar o SQL candidate por engenharia.
2. Confirmar novamente que as 9 tabelas nao existem no ambiente alvo.
3. Confirmar `pgcrypto/gen_random_uuid()`.
4. Confirmar tipos das FK-alvo: `opportunities.id`, `orcamentos.id`, `opportunity_files.id`.
5. Executar em staging, nunca diretamente em producao.
6. Validar que RLS bloqueia roles nao privilegiadas sem policies.
7. Testar trigger de imutabilidade de `raw_output_json`.
8. Testar trigger append-only de `orc_hitl_decisions`.
9. Rodar rollback em ambiente descartavel.
10. Documentar resultado antes de promover a migration real.

## 17. Plano de rollback

Rollback comentado no final do SQL candidate:

1. Dropar trigger/função de append-only de `orc_hitl_decisions`.
2. Dropar trigger/função de imutabilidade de `orc_reader_outputs`.
3. Dropar tabelas em ordem reversa:
   - `orc_context_snapshots`
   - `orc_hitl_decisions`
   - `orc_hitl_issues`
   - `orc_reader_verifier_divergences`
   - `orc_reader_verifier_comparisons`
   - `orc_verifier_runs`
   - `orc_reader_safety_evaluations`
   - `orc_reader_outputs`
   - `orc_reader_runs`

Rollback em producao deve ser excecao. Como as tabelas sao de auditoria, preferir migration corretiva quando houver dados reais.

## 18. Checklist antes de execucao real

- [ ] SQL candidate revisado por engenharia.
- [ ] Nenhuma FK para `orcamento_itens`.
- [ ] Nenhuma escrita em `orcamento_itens`.
- [ ] RLS revisado e policies definitivas planejadas.
- [ ] Triggers testadas em staging.
- [ ] Rollback testado em ambiente descartavel.
- [ ] Contrato de tenant/company decidido ou explicitamente adiado.
- [ ] Plano de retencao e acesso para JSONs sensiveis definido.
- [ ] Observabilidade e auditoria minima definidas.
- [ ] Aprovação humana para aplicar migration real registrada.

## 19. Confirmacoes da fase

- Nenhum SQL foi executado.
- Nenhuma migration foi aplicada.
- Nenhum banco foi alterado.
- Nenhum codigo operacional/UI foi alterado.
- Nenhum arquivo fora do escopo foi alterado.
- Candidate criado apenas como documento SQL revisavel.
