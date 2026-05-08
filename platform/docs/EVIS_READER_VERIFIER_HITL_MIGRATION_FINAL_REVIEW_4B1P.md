# EVIS - Reader/Verifier/HITL Migration Final Review

> Fase: 4B.1.P
> Tipo: revisao final da migration candidate — read-only, sem execucao de SQL
> Status: revisao concluida; migration aprovada para execucao controlada em staging
> Staging autorizado: `vtlepoljlqmjwuauygni`
> Producao bloqueada: `jwutiebpfauwzzltwgbb`

## 1. Objetivo

Revisar o arquivo SQL candidate da migration Reader/Verifier/HITL antes da execucao real no staging (`vtlepoljlqmjwuauygni`), confirmando integridade estrutural, ausencia de comandos perigosos, coerencia de FKs e estrategia de RLS.

## 2. Ambiente

- **Staging**: `vtlepoljlqmjwuauygni` — autorizado
- **Producao**: `jwutiebpfauwzzltwgbb` — bloqueada, nao acessada
- **Banco de referencia**: `postgres` (PostgreSQL 17.6 / Supabase Staging)
- **Baseline validado em**: 4B.S5

## 3. Arquivo SQL Candidate Localizado

```
platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql
```

- Origem: Fase 4A.5/4A.6 — Security Hardened Migration Candidate
- 496 linhas
- Lido integralmente nesta fase
- Nenhum SQL foi executado

Arquivo draft de referencia (fase 4A.2, nao executar):
```
platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_DRAFT.sql
```

## 4. As 9 Tabelas Pipeline

Todas criadas com `CREATE TABLE IF NOT EXISTS`:

| # | Tabela | Presente no Candidate |
|---|--------|----------------------|
| 1 | `orc_reader_runs` | Sim — linha 35 |
| 2 | `orc_reader_outputs` | Sim — linha 62 |
| 3 | `orc_reader_safety_evaluations` | Sim — linha 90 |
| 4 | `orc_verifier_runs` | Sim — linha 117 |
| 5 | `orc_reader_verifier_comparisons` | Sim — linha 142 |
| 6 | `orc_reader_verifier_divergences` | Sim — linha 175 |
| 7 | `orc_hitl_issues` | Sim — linha 215 |
| 8 | `orc_hitl_decisions` | Sim — linha 264 |
| 9 | `orc_context_snapshots` | Sim — linha 295 |

**Contagem**: 9 de 9. Compativel com ausencia confirmada no staging (4B.S5, Secao 4).

## 5. FKs para Tabelas do Baseline

### 5.1 Ancoras Externas (tabelas ja existentes no staging)

| FK | Tipo | Tabelas Origem | Constraint |
|----|------|----------------|-----------|
| `opportunities(id)` | `uuid NOT NULL` | Todas as 9 tabelas | ON DELETE RESTRICT |
| `orcamentos(id)` | `uuid NULL` | Todas as 9 tabelas | ON DELETE RESTRICT |
| `opportunity_files(id)` | `uuid NOT NULL` ou `NULL` | 8 de 9 tabelas | ON DELETE RESTRICT |

- `opportunity_id` e NOT NULL em todas as 9 tabelas — ancora obrigatoria de auditoria
- `orcamento_id` e NULL em todas as 9 tabelas — intencional para fase pre-consolidacao
- `opportunity_file_id` e NOT NULL em tabelas Reader/Verifier/Comparison/Divergence; NULL em `orc_hitl_issues` e `orc_context_snapshots`

### 5.2 FKs Internas (entre tabelas pipeline)

| Tabela | Referencia Interna |
|--------|-------------------|
| `orc_reader_outputs` | `orc_reader_runs(id)` NOT NULL RESTRICT |
| `orc_reader_safety_evaluations` | `orc_reader_runs(id)` + `orc_reader_outputs(id)` NOT NULL RESTRICT |
| `orc_verifier_runs` | `orc_reader_runs(id)` + `orc_reader_outputs(id)` NOT NULL RESTRICT |
| `orc_reader_verifier_comparisons` | `orc_reader_outputs(id)` + `orc_verifier_runs(id)` NOT NULL RESTRICT |
| `orc_reader_verifier_divergences` | `orc_reader_verifier_comparisons(id)` + `orc_reader_outputs(id)` + `orc_verifier_runs(id)` NOT NULL RESTRICT |
| `orc_hitl_issues` | Todas as 5 anteriores (todas NULL, aceita issues pre-comparison) |
| `orc_hitl_decisions` | `orc_hitl_issues(id)` NOT NULL RESTRICT |
| `orc_context_snapshots` | Todas as 8 anteriores (todas NULL, historico generico) |

**Ordem de criacao**: Respeitada — cada tabela so e criada apos todas as suas dependencias.

### 5.3 Tipos de FK Verificados

| Alvo | Tipo do PK no Baseline (4B.S5) | Tipo FK no Candidate | Compativel |
|------|-------------------------------|---------------------|-----------|
| `opportunities.id` | `uuid` (confirmado) | `uuid` | Sim |
| `opportunity_files.id` | `uuid` (confirmado) | `uuid` | Sim |
| `orcamentos.id` | `uuid` (confirmado) | `uuid` | Sim |

## 6. Indices Previstos

Total de indices: 43

| Grupo | Quantidade | Descricao |
|-------|-----------|-----------|
| `opportunity_id` | 9 | Um por tabela pipeline |
| `orcamento_id` | 9 | Um por tabela pipeline |
| `(opportunity_file_id, page_number)` | 6 | Tabelas com escopo de pagina |
| Lineage IDs | 9 | reader_run_id, reader_output_id, verifier_run_id, comparison_id, hitl_issue_id |
| `(status, created_at)` | 6 | Suporte a queries de fila/pipeline |
| Compostos | 3 | opp+file+page, opp+status+created, comparison+dedupe_key |
| Hardening 4A.3 | 7 | reader_run_id em verifier, context snapshots lineage, severity, decided_at |

Todos com `CREATE INDEX IF NOT EXISTS`. Idempotentes.

## 7. Constraints de Integridade

| Constraint | Tabela | Regra |
|-----------|--------|-------|
| `orc_reader_safety_block_dispatch_ck` | `orc_reader_safety_evaluations` | NOT (blocks_consolidation=true AND allowed_to_dispatch=true) |
| `orc_comp_block_dispatch_ck` | `orc_reader_verifier_comparisons` | NOT (blocks_consolidation=true AND allowed_to_dispatch=true) |
| `orc_divergences_dedupe_unique` | `orc_reader_verifier_divergences` | UNIQUE (comparison_id, dedupe_key) |
| `orc_hitl_issue_has_source_ck` | `orc_hitl_issues` | Pelo menos uma fonte identificavel |
| `orc_context_snapshot_has_source_ck` | `orc_context_snapshots` | Pelo menos uma fonte identificavel |

## 8. Triggers de Protecao

| Trigger | Tabela | Comportamento |
|---------|--------|--------------|
| `trg_orc_reader_outputs_prevent_raw_update` | `orc_reader_outputs` | BEFORE UPDATE — impede alteracao de `raw_output_json` (imutabilidade do payload bruto) |
| `trg_orc_hitl_decisions_no_update_delete` | `orc_hitl_decisions` | BEFORE UPDATE OR DELETE — append-only, qualquer UPDATE/DELETE lanca EXCEPTION |
| `trg_orc_hitl_decisions_no_truncate` | `orc_hitl_decisions` | BEFORE TRUNCATE — impede TRUNCATE |

Funcoes com `SET search_path = public, pg_temp` — sem risco de search_path injection.

## 9. Status e Vocabulario

| Tabela | Campo `status` | Valores |
|--------|---------------|---------|
| `orc_reader_runs` | status | `received`, `normalized`, `safety_evaluated`, `blocked`, `ready_for_verifier` |
| `orc_verifier_runs` | status | `received`, `normalized`, `compared`, `requires_hitl`, `blocked`, `approved` |
| `orc_reader_verifier_comparisons` | status | `pending`, `divergent`, `requires_hitl`, `dispatch_allowed`, `consolidation_blocked` |
| `orc_reader_verifier_divergences` | status | `aberta`, `aceita`, `descartada`, `resolvida` |
| `orc_hitl_issues` | status | `pendente`, `em_revisao`, `aprovada_com_ressalva`, `bloqueada`, `documento_solicitado`, `convertida_em_verba`, `ignorada_nesta_fase`, `reanalisar_futuramente` |
| `orc_hitl_decisions` | decision_type | `aprovar_com_ressalva`, `manter_bloqueado`, `solicitar_documento`, `marcar_como_verba`, `ignorar_nesta_fase`, `reanalisar_futuramente` |
| `orc_context_snapshots` | context_status | `validated`, `pending`, `blocked`, `incomplete` |

Vocabulario de status tecnicos de pipeline em ingles; status operacionais (divergencia, HITL) em portugues — decisao harmonizada na 4A.5.

## 10. Timestamps e Auditoria

| Tabela | `created_at` | `updated_at` |
|--------|-------------|-------------|
| `orc_reader_runs` | NOT NULL DEFAULT now() | NOT NULL DEFAULT now() |
| `orc_reader_outputs` | NOT NULL DEFAULT now() | Ausente (append-only) |
| `orc_reader_safety_evaluations` | NOT NULL DEFAULT now() | Ausente (append-only) |
| `orc_verifier_runs` | NOT NULL DEFAULT now() | NOT NULL DEFAULT now() |
| `orc_reader_verifier_comparisons` | NOT NULL DEFAULT now() | Ausente (append-only) |
| `orc_reader_verifier_divergences` | NOT NULL DEFAULT now() | Ausente |
| `orc_hitl_issues` | NOT NULL DEFAULT now() | NOT NULL DEFAULT now() |
| `orc_hitl_decisions` | NOT NULL DEFAULT now() | Ausente (append-only por trigger) |
| `orc_context_snapshots` | NOT NULL DEFAULT now() | Ausente (append-only) |

**Nota sobre `updated_at`**: Presente apenas nas tabelas mutiveis (`orc_reader_runs`, `orc_verifier_runs`, `orc_hitl_issues`). Nao ha trigger de auto-atualizacao — documentado no cabecalho como tratamento adiado para fase posterior ou camada de aplicacao. Nao e defeito; e trade-off consciente.

## 11. RLS e Policies

| Tabela | RLS | Policies no Candidate |
|--------|-----|-----------------------|
| `orc_reader_runs` | ENABLE ROW LEVEL SECURITY | Nenhuma — deferred |
| `orc_reader_outputs` | ENABLE ROW LEVEL SECURITY | Nenhuma — deferred |
| `orc_reader_safety_evaluations` | ENABLE ROW LEVEL SECURITY | Nenhuma — deferred |
| `orc_verifier_runs` | ENABLE ROW LEVEL SECURITY | Nenhuma — deferred |
| `orc_reader_verifier_comparisons` | ENABLE ROW LEVEL SECURITY | Nenhuma — deferred |
| `orc_reader_verifier_divergences` | ENABLE ROW LEVEL SECURITY | Nenhuma — deferred |
| `orc_hitl_issues` | ENABLE ROW LEVEL SECURITY | Nenhuma — deferred |
| `orc_hitl_decisions` | ENABLE ROW LEVEL SECURITY | Nenhuma — deferred |
| `orc_context_snapshots` | ENABLE ROW LEVEL SECURITY | Nenhuma — deferred |

**Avaliacao**: RLS habilitado sem policies = acesso bloqueado para roles nao privilegiados por padrao. A execucao da migration sera feita via Management API (service_role), que bypassa RLS. A aplicacao tambem opera via service_role no estagio atual. Sem policies abertas do tipo `USING (true)` — conforme requisito de seguranca da 4A.5.

**Policies definitivas**: Deferred para fase posterior de Auth/tenant/company_id. Placeholder documental presente nos comentarios do arquivo (linha 471-474).

## 12. Comandos Proibidos — Auditoria

| Comando | Presente no Candidate | Observacao |
|---------|----------------------|-----------|
| `DROP TABLE` | Nao | Presente apenas em rollback plan comentado |
| `DROP TRIGGER` | Nao | Presente apenas em rollback plan comentado |
| `DROP FUNCTION` | Nao | Presente apenas em rollback plan comentado |
| `TRUNCATE` | Nao | O trigger PROTEGE contra TRUNCATE — nao executa |
| `DELETE` | Nao | O trigger PROTEGE contra DELETE — nao executa |
| `UPDATE` destrutivo | Nao | O trigger PROTEGE raw_output_json — nao executa |
| `INSERT` de dados/seed | Nao | Nenhum INSERT de dados presente |
| `ALTER TABLE` destrutivo | Nao | Apenas `ENABLE ROW LEVEL SECURITY` |
| Escrita em tabelas fora do pipeline | Nao | Todas as operacoes sao em tabelas `orc_*` |
| Referencia a producao | Nao | Nenhuma string `jwutiebpfauwzzltwgbb` |

**Resultado: nenhum comando proibido encontrado.**

## 13. Divergencias entre Draft (4A.2) e Migration Candidate (4A.5/4A.6)

| Item | Draft 4A.2 | Candidate 4A.5/4A.6 | Avaliacao |
|------|-----------|---------------------|----------|
| Triggers de imutabilidade | Comentados/doc-only | Implementados (executaveis) | Candidate mais seguro |
| RLS | Comentado/doc-only | `ENABLE ROW LEVEL SECURITY` ativo | Candidate mais seguro |
| Status de divergencias | `open`, `accepted`, `dismissed`, `resolved` | `aberta`, `aceita`, `descartada`, `resolvida` | Harmonizado para portugues na 4A.5 |
| CHECKs em identified_count etc | Ausentes | `CHECK (identified_count >= 0)` etc | Hardening adicional |
| COMMENTs em colunas | Minimos | Expandidos | Melhor documentacao |
| Indices hardening 4A.3 | Presentes em ambos | Identicos | OK |

**O DRAFT nao deve ser executado. O CANDIDATE e o arquivo correto para 4B.1.E.**

## 14. Riscos Identificados

| # | Risco | Severidade | Mitigacao |
|---|-------|-----------|-----------|
| 1 | `updated_at` nao auto-atualiza por trigger | Baixa | Documentado; camada de aplicacao responsavel |
| 2 | RLS ativo sem policies — se service_role nao for usado, acesso sera negado | Baixa | Esperado e intencional; policies a definir em fase posterior |
| 3 | `orc_reader_outputs.raw_output_json` imutavel por trigger — aplicacao nao pode corrigir valores sem novo INSERT | Baixa | Intencional; fluxo correto e gerar novo output |
| 4 | `orc_hitl_decisions` append-only — nao permite correcao de decisao errada via UPDATE | Media | Mitigacao de design: decisao nova superseeds a anterior via `decision_type` semantico |

Nenhum risco bloqueia a execucao em staging.

## 15. Pendencias para Fases Posteriores

| Item | Fase Prevista |
|------|--------------|
| Trigger de auto-update para `updated_at` | Pos-4B.1 |
| Policies de RLS (autenticacao, tenant, company_id) | Fase de Auth |
| Funcao/procedure de consolidacao oficial em `orcamento_itens` | Fase de Consolidacao |
| FK `orcamento_id` torna-se NOT NULL | Pre-consolidacao |

## 16. Evidencias de Idempotencia

- Todas as 9 tabelas: `CREATE TABLE IF NOT EXISTS`
- Todos os 43 indices: `CREATE INDEX IF NOT EXISTS`
- Todas as funcoes: `CREATE OR REPLACE FUNCTION`
- Re-execucao em staging nao causaria erro nem estado inconsistente

## 17. Decisao Objetiva

> [!IMPORTANT]
> **MIGRATION CANDIDATE APROVADA PARA EXECUCAO CONTROLADA EM STAGING**
>
> O arquivo `ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql` esta:
> - Estruturalmente correto
> - Livre de comandos perigosos
> - Com FKs e tipos coerentes com o baseline confirmado em 4B.S5
> - Com RLS configurado sem policies abertas
> - Com triggers de protecao implementados e corretos
> - Com indices suficientes para o pipeline Reader/Verifier/HITL
> - Com rollback plan documentado (comentado, ordem reversa)
>
> **Autorizado para execucao como Fase 4B.1.E no staging `vtlepoljlqmjwuauygni`.**

---

**Bloqueio**: 4B.1.E ainda nao foi executada. Este relatorio encerra a preparacao documental da migration.
