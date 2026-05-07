# EVIS - Reader / Verifier / HITL Migration Draft

> Fase: 4A.1  
> Tipo: proposta tecnica de persistencia (draft)  
> Status: documento de arquitetura; sem execucao SQL; sem migration aplicada

## 1. Objetivo

Definir o desenho de persistencia para o fluxo seguro do Orçamentista IA em pre-obra:

```text
Reader persistido
  -> Verifier persistido
    -> comparacao Reader x Verifier
      -> divergencias
        -> HITL issues
          -> HITL decisions
            -> context snapshots
              -> gate futuro
                -> escrita futura controlada em orcamento_itens
```

Este documento descreve **schema proposto** para futura migration, sem aplicar no banco nesta fase.

## 2. Regras arquiteturais aplicadas no draft

1. `opportunity_id` obrigatorio como coluna direta nas 9 tabelas propostas, mesmo quando derivavel por FK, para RLS, auditoria, rastreabilidade e debug.
2. `orcamento_id` nullable nas fases iniciais (Reader/Verifier/comparison/divergence/HITL/contexto).
3. `orcamento_id` deve se tornar obrigatorio antes de qualquer fase de payload oficial/consolidacao/escrita.
4. Campos JSON semanticos, nao payload generico principal:
   - `raw_output_json`
   - `normalized_output_json`
   - `safety_gate_json`
   - `dimensional_checks_json`
   - `verifier_output_json`
   - `comparison_json`
   - `dispatch_decision_json`
   - `context_snapshot_json`
5. Referencia primaria de fonte em escopo de pagina: `opportunity_file_id + page_number` obrigatorios. Em tabelas contextuais/globais, esses campos podem ser nullable, mas exigem `source_type` e `source_id`/`source_ref`/`source_refs_json` suficientes.
6. `document_id` apenas compatibilidade/futuro, sem FK obrigatoria nesta fase.
7. `orc_hitl_decisions` append-only, sem delecao em cascata a partir de `orc_hitl_issues`.
8. `raw_output_json` do Reader imutavel.
9. Reader/Verifier/HITL nao escrevem em `orcamento_itens`.
10. Escrita em `orcamento_itens` fica para fase futura com gate + HITL + aprovacao humana.
11. `orc_hitl_issues.comparison_id` nullable, pois HITLs podem nascer antes da comparacao formal.
12. `dedupe_key` de divergencia deve ser especifica; chaves grosseiras podem apagar divergencias legitimas.

## 3. Tabelas propostas

1. `orc_reader_runs`
2. `orc_reader_outputs`
3. `orc_reader_safety_evaluations`
4. `orc_verifier_runs`
5. `orc_reader_verifier_comparisons`
6. `orc_reader_verifier_divergences`
7. `orc_hitl_issues`
8. `orc_hitl_decisions`
9. `orc_context_snapshots`

## 4. Proposta por tabela

## 4.1 `orc_reader_runs`

- Objetivo: registrar execucao do Reader por oportunidade/arquivo/pagina.
- Campos principais:
  - `id uuid pk`
  - `opportunity_id uuid not null` -> FK `opportunities(id)`
  - `orcamento_id uuid null` -> FK `orcamentos(id)`
  - `opportunity_file_id uuid not null` -> FK `opportunity_files(id)`
  - `page_number integer not null check (page_number > 0)`
  - `document_id text null`
  - `reader_motor text not null`
  - `source_quality text not null`
  - `status text not null`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- Nullable vs required:
  - required: `opportunity_id`, `opportunity_file_id`, `page_number`, `reader_motor`, `source_quality`, `status`
  - nullable: `orcamento_id`, `document_id`
- Enums/check sugeridos:
  - `status in ('received','normalized','safety_evaluated','blocked','ready_for_verifier')`
  - `source_quality` alinhado aos tipos de leitura.
- Indices:
  - `(opportunity_id)`, `(orcamento_id)`, `(opportunity_file_id)`, `(status)`, `(created_at)`, `(opportunity_id, opportunity_file_id, page_number)`
- Risco: alta cardinalidade por pagina; precisa indice composto para consulta operacional.
- RLS points:
  - leitura/escrita restrita por escopo da oportunidade.

## 4.2 `orc_reader_outputs`

- Objetivo: persistir output bruto e normalizado do Reader.
- Campos principais:
  - `id uuid pk`
  - `reader_run_id uuid not null` -> FK `orc_reader_runs(id)` on delete cascade
  - `opportunity_id uuid not null` -> FK `opportunities(id)`
  - `orcamento_id uuid null` -> FK `orcamentos(id)`
  - `opportunity_file_id uuid not null` -> FK `opportunity_files(id)`
  - `page_number integer not null`
  - `document_id text null`
  - `raw_output_json jsonb not null`
  - `normalized_output_json jsonb not null`
  - `identified_count integer not null default 0`
  - `inferred_count integer not null default 0`
  - `missing_count integer not null default 0`
  - `confidence_score numeric(5,4) null`
  - `created_at timestamptz not null default now()`
- Constraints:
  - `check (confidence_score is null or (confidence_score >= 0 and confidence_score <= 1))`
  - `check (page_number > 0)`
- Imutabilidade:
  - `raw_output_json` imutavel (trigger futura de bloqueio em update).
- Indices:
  - `(reader_run_id)`, `(opportunity_id)`, `(orcamento_id)`, `(opportunity_file_id)`, `(created_at)`
- RLS points:
  - leitura tecnica restrita; escrita apenas pipeline Reader autorizado.

## 4.3 `orc_reader_safety_evaluations`

- Objetivo: persistir safety gate + checks dimensionais do Reader.
- Campos principais:
  - `id uuid pk`
  - `reader_output_id uuid not null` -> FK `orc_reader_outputs(id)` on delete cascade
  - `reader_run_id uuid not null` -> FK `orc_reader_runs(id)` on delete cascade
  - `opportunity_id uuid not null` -> FK `opportunities(id)`
  - `orcamento_id uuid null` -> FK `orcamentos(id)`
  - `opportunity_file_id uuid not null` -> FK `opportunity_files(id)`
  - `page_number integer not null`
  - `document_id text null`
  - `safety_gate_json jsonb not null`
  - `dimensional_checks_json jsonb not null`
  - `requires_verifier boolean not null default true`
  - `requires_hitl boolean not null default false`
  - `blocks_consolidation boolean not null default false`
  - `allowed_to_dispatch boolean not null default false`
  - `created_at timestamptz not null default now()`
- Indices:
  - `(reader_output_id)`, `(reader_run_id)`, `(opportunity_id)`, `(opportunity_file_id)`, `(created_at)`
- Constraints:
  - `check (page_number > 0)`
  - coerencia booleana: se `blocks_consolidation = true`, `allowed_to_dispatch = false`.
- Risco:
  - regras de negocio podem evoluir; manter JSON semantico + booleans denormalizados.

## 4.4 `orc_verifier_runs`

- Objetivo: registrar execucao do Verifier sobre output do Reader.
- Campos principais:
  - `id uuid pk`
  - `reader_output_id uuid not null` -> FK `orc_reader_outputs(id)`
  - `reader_run_id uuid not null` -> FK `orc_reader_runs(id)`
  - `opportunity_id uuid not null` -> FK `opportunities(id)`
  - `orcamento_id uuid null` -> FK `orcamentos(id)`
  - `opportunity_file_id uuid not null` -> FK `opportunity_files(id)`
  - `page_number integer not null`
  - `document_id text null`
  - `verifier_motor text not null`
  - `verifier_output_json jsonb not null`
  - `status text not null`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- Status/check:
  - `status in ('received','normalized','compared','requires_hitl','blocked','approved')`
  - `check (page_number > 0)`
- Indices:
  - `(reader_output_id)`, `(reader_run_id)`, `(opportunity_id)`, `(orcamento_id)`, `(opportunity_file_id)`, `(status)`, `(created_at)`

## 4.5 `orc_reader_verifier_comparisons`

- Objetivo: armazenar comparacao formal Reader x Verifier.
- Campos principais:
  - `id uuid pk`
  - `reader_output_id uuid not null` -> FK `orc_reader_outputs(id)`
  - `verifier_run_id uuid not null` -> FK `orc_verifier_runs(id)`
  - `opportunity_id uuid not null` -> FK `opportunities(id)`
  - `orcamento_id uuid null` -> FK `orcamentos(id)`
  - `opportunity_file_id uuid not null` -> FK `opportunity_files(id)`
  - `page_number integer not null`
  - `document_id text null`
  - `agreement_score numeric(5,4) not null`
  - `agreement_band text not null`
  - `comparison_json jsonb not null`
  - `dispatch_decision_json jsonb not null`
  - `requires_hitl boolean not null default false`
  - `blocks_consolidation boolean not null default false`
  - `allowed_to_dispatch boolean not null default false`
  - `status text not null`
  - `created_at timestamptz not null default now()`
- Constraints:
  - `check (page_number > 0)`
  - `agreement_score between 0 and 1`
  - `agreement_band in ('low','medium','high')`
  - `status in ('pending','divergent','requires_hitl','dispatch_allowed','consolidation_blocked')`
- Indices:
  - `(reader_output_id)`, `(verifier_run_id)`, `(opportunity_id)`, `(comparison_id)` via pk, `(status)`, `(created_at)`

## 4.6 `orc_reader_verifier_divergences`

- Objetivo: registrar divergencias granularmente (deduplicadas) por comparacao.
- Campos principais:
  - `id uuid pk`
  - `comparison_id uuid not null` -> FK `orc_reader_verifier_comparisons(id)` on delete cascade
  - `reader_output_id uuid not null` -> FK `orc_reader_outputs(id)`
  - `verifier_run_id uuid not null` -> FK `orc_verifier_runs(id)`
  - `opportunity_id uuid not null` -> FK `opportunities(id)`
  - `orcamento_id uuid null` -> FK `orcamentos(id)`
  - `opportunity_file_id uuid not null` -> FK `opportunity_files(id)`
  - `page_number integer not null`
  - `document_id text null`
  - `category text not null`
  - `title text not null`
  - `reader_value text null`
  - `verifier_value text null`
  - `reason text not null`
  - `severity text not null`
  - `requires_hitl boolean not null default true`
  - `blocks_consolidation boolean not null default false`
  - `source_reference text null`
  - `dedupe_key text not null`
  - `status text not null default 'open'`
  - `created_at timestamptz not null default now()`
- Constraints:
  - `check (page_number > 0)`
  - `severity in ('low','medium','high','critical')`
  - `status in ('open','accepted','dismissed','resolved')`
  - `title`, `reason` e `dedupe_key` nao vazios apos trim.
- Indices:
  - `(comparison_id)`, `(reader_output_id)`, `(verifier_run_id)`, `(opportunity_id)`, `(opportunity_file_id)`, `(severity)`, `(status)`, `(created_at)`, unique `(comparison_id, dedupe_key)`
- Dedupe seguro:
  - `unique (comparison_id, dedupe_key)` so e seguro se `dedupe_key` for especifica.
  - Recomenda-se normalizar e combinar `category`, `technical_field`, `affected_item`, `source_reference` ou `opportunity_file_id/page_number`, `reader_value`/`verifier_value` quando necessario e disciplina/dominio quando aplicavel.
  - Exemplo: `foundation|pile_depth|estacas_c25|file:<uuid>|page:1|reader:600cm|verifier:not_confirmed`.
  - Nao usar chave grosseira como apenas `fck`, `comprimento` ou `profundidade`.

## 4.7 `orc_hitl_issues`

- Objetivo: fila de pendencias HITL a partir de divergencias/comparacoes e tambem de origens pre-comparacao, como baixa confianca do Reader, safety gate, dimensional check, projeto ausente, documento ilegivel, Verifier isolado ou divergencia de intake.
- Campos principais:
  - `id uuid pk`
  - `comparison_id uuid null` -> FK `orc_reader_verifier_comparisons(id)`
  - `reader_run_id uuid null` -> FK `orc_reader_runs(id)`
  - `reader_output_id uuid null` -> FK `orc_reader_outputs(id)`
  - `verifier_run_id uuid null` -> FK `orc_verifier_runs(id)`
  - `divergence_id uuid null` -> FK `orc_reader_verifier_divergences(id)`
  - `hitl_issue_id` referenciado externamente apenas como id da propria tabela (pk)
  - `source_type text not null`
  - `source_id uuid null` (ex: divergence id, reader output id ou verifier run id)
  - `source_ref text null`
  - `source_refs_json jsonb not null default '{}'::jsonb`
  - `opportunity_id uuid not null` -> FK `opportunities(id)`
  - `orcamento_id uuid null` -> FK `orcamentos(id)`
  - `opportunity_file_id uuid null` -> FK `opportunity_files(id)`
  - `page_number integer null`
  - `document_id text null`
  - `issue_type text not null`
  - `severity text not null`
  - `status text not null`
  - `title text not null`
  - `description text not null`
  - `evidence_summary text not null`
  - `recommended_action text not null`
  - `blocks_dispatch boolean not null default true`
  - `blocks_consolidation boolean not null default true`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
- Constraints:
  - `severity in ('baixa','media','alta','critica')`
  - `status in ('pendente','em_revisao','aprovada_com_ressalva','bloqueada','documento_solicitado','convertida_em_verba','ignorada_nesta_fase','reanalisar_futuramente')`
  - `check (page_number is null or page_number > 0)`
  - `title`, `description`, `evidence_summary` e `recommended_action` nao vazios apos trim.
  - `source_type` obrigatorio e nao vazio.
  - pelo menos uma referencia de origem preenchida: `source_id`, `source_ref`, `comparison_id`, `reader_output_id`, `verifier_run_id` ou `source_refs_json` nao vazio.
  - se a origem for page-scoped, `opportunity_file_id` e `page_number` devem estar preenchidos.
- Indices:
  - `(comparison_id)`, `(reader_run_id)`, `(reader_output_id)`, `(verifier_run_id)`, `(opportunity_id)`, `(orcamento_id)`, `(opportunity_file_id)`, `(status)`, `(severity)`, `(created_at)`

## 4.8 `orc_hitl_decisions`

- Objetivo: registrar decisoes humanas append-only sobre issues.
- Campos principais:
  - `id uuid pk`
  - `hitl_issue_id uuid not null` -> FK `orc_hitl_issues(id)` on delete restrict/no action
  - `opportunity_id uuid not null` -> FK `opportunities(id)`
  - `orcamento_id uuid null` -> FK `orcamentos(id)`
  - `decision_type text not null`
  - `notes text not null`
  - `decided_by text not null`
  - `decided_at timestamptz not null default now()`
  - `dispatch_released boolean not null default false`
  - `consolidation_released boolean not null default false`
  - `decision_payload_json jsonb not null default '{}'::jsonb`
  - `created_at timestamptz not null default now()`
- Constraints:
  - `decision_type in ('aprovar_com_ressalva','manter_bloqueado','solicitar_documento','marcar_como_verba','ignorar_nesta_fase','reanalisar_futuramente')`
  - `notes` e `decided_by` nao vazios apos trim.
- Append-only:
  - sem update/delete aplicacional;
  - trigger futura para bloquear `UPDATE` e `DELETE`.
  - sem `ON DELETE CASCADE`: uma issue nao deve apagar decisoes humanas; se precisar invalidar, usar status `cancelled`/`voided` ou decisao compensatoria.
  - `orc_hitl_issues` tambem nao deve ter delecao operacional normal.
- Indices:
  - `(hitl_issue_id)`, `(opportunity_id)`, `(orcamento_id)`, `(decided_at)`, `(created_at)`
- Risco:
  - decisao sem identidade forte do usuario; exigir `decided_by` nao vazio e, futuramente, `decided_by_user_id`.

## 4.9 `orc_context_snapshots`

- Objetivo: registrar historico append-only do contexto validado/pendente/bloqueado ao longo do fluxo, como trilha de decisao e nao como copia redundante de estado mutavel.
- Campos principais:
  - `id uuid pk`
  - `opportunity_id uuid not null` -> FK `opportunities(id)`
  - `orcamento_id uuid null` -> FK `orcamentos(id)`
  - `opportunity_file_id uuid null` -> FK `opportunity_files(id)`
  - `page_number integer null`
  - `document_id text null`
  - `reader_run_id uuid null` -> FK `orc_reader_runs(id)`
  - `reader_output_id uuid null` -> FK `orc_reader_outputs(id)`
  - `verifier_run_id uuid null` -> FK `orc_verifier_runs(id)`
  - `comparison_id uuid null` -> FK `orc_reader_verifier_comparisons(id)`
  - `hitl_issue_id uuid null` -> FK `orc_hitl_issues(id)`
  - `source_type text not null`
  - `source_id uuid null`
  - `source_ref text null`
  - `source_refs_json jsonb not null default '{}'::jsonb`
  - `phase text not null`
  - `context_status text not null`
  - `context_snapshot_json jsonb not null`
  - `created_by text not null default 'system'`
  - `created_at timestamptz not null default now()`
- Constraints:
  - `context_status in ('validated','pending','blocked','incomplete')`
  - `check (page_number is null or page_number > 0)`
  - `phase`, `source_type` e `created_by` nao vazios apos trim.
  - pelo menos uma referencia de origem preenchida: `source_id`, `source_ref`, `reader_run_id`, `reader_output_id`, `verifier_run_id`, `comparison_id`, `hitl_issue_id` ou `source_refs_json` nao vazio.
- Indices:
  - `(opportunity_id)`, `(orcamento_id)`, `(opportunity_file_id)`, `(reader_run_id)`, `(reader_output_id)`, `(verifier_run_id)`, `(comparison_id)`, `(hitl_issue_id)`, `(context_status)`, `(created_at)`
- Imutabilidade:
  - append-only; novos snapshots corrigem ou substituem semanticamente o anterior sem update/delete operacional.

## 5. Ordem de criacao recomendada

1. `orc_reader_runs`
2. `orc_reader_outputs`
3. `orc_reader_safety_evaluations`
4. `orc_verifier_runs`
5. `orc_reader_verifier_comparisons`
6. `orc_reader_verifier_divergences`
7. `orc_hitl_issues`
8. `orc_hitl_decisions`
9. `orc_context_snapshots`

Motivo: respeita lineage de FK e facilita rollback reverso.

## 6. Indices minimos consolidados (checklist)

- `opportunity_id` em todas as 9 tabelas.
- `orcamento_id` em todas as 9 tabelas.
- `opportunity_file_id` em tabelas com escopo de pagina (`reader_runs`, `reader_outputs`, `safety`, `verifier_runs`, `comparisons`, `divergences`) e em `hitl_issues`/`context_snapshots` quando a origem for page-scoped.
- `reader_run_id`: outputs, safety, verifier, snapshots.
- `reader_output_id`: safety, verifier, comparisons, divergences, snapshots.
- `verifier_run_id`: comparisons, divergences, snapshots.
- `comparison_id`: divergences, hitl_issues (nullable), snapshots (nullable).
- `hitl_issue_id`: hitl_decisions, snapshots.
- `status` nas tabelas de fluxo.
- `created_at` em todas.

## 7. Constraints de seguranca propostas

1. Decisions append-only (`orc_hitl_decisions`).
2. `raw_output_json` imutavel (`orc_reader_outputs`).
3. Nenhuma tabela do pipeline com FK/trigger de escrita em `orcamento_itens`.
4. Status controlado por check constraints.
5. Severidade controlada por check constraints.
6. Source refs obrigatorios onde aplicavel:
   - obrigar `opportunity_file_id` e `page_number` em camadas page-scoped de leitura, safety, verificacao, comparacao e divergencia.
   - em `hitl_issues` e `context_snapshots`, permitir `opportunity_file_id/page_number` nullable apenas quando houver `source_type` e `source_id`/`source_ref`/`source_refs_json` suficientes.
   - `page_number` deve obedecer `page_number > 0` sempre que preenchido.
7. Coerencia de bloqueio:
   - se `blocks_consolidation = true` => `allowed_to_dispatch = false` onde existir ambos.
8. Dedupe de divergencia por `(comparison_id, dedupe_key)`, com `dedupe_key` especifica por categoria, campo tecnico, item afetado, fonte/pagina, valores divergentes e disciplina quando aplicavel.
9. `orc_hitl_decisions.hitl_issue_id` sem `ON DELETE CASCADE`; FK `RESTRICT`/`NO ACTION` para preservar decisoes humanas.
10. Textos criticos (`title`, `dedupe_key`, `decided_by`, `notes`, `reason`) nao vazios quando aplicavel.

## 8. Regras de imutabilidade

- `orc_reader_outputs.raw_output_json`: imutavel apos insert.
- `orc_hitl_decisions`: append-only (cada nova decisao cria nova linha).
- `orc_context_snapshots`: append-only historico; nao deve virar copia redundante sem proposito nem estado mutavel.

## 9. RLS points (sem policy definitiva)

- Segmentar por `opportunity_id` como eixo principal.
- Separar permissoes:
  - writer tecnico (Reader/Verifier service role);
  - reviewer humano (HITL decisions);
  - leitura analitica.
- Restringir acesso a `raw_output_json` e `decision_payload_json` por papel.
- Evitar policy aberta do tipo `USING (true)` nessas tabelas.
- Planejar compatibilidade futura com `company_id`/tenant.

## 10. Rollback plan proposto

Rollback de migration futura (quando existir), em ordem reversa de dependencia:

1. Dropar indices nao-PK das novas tabelas.
2. Dropar tabelas nesta ordem:
   - `orc_context_snapshots`
   - `orc_hitl_decisions`
   - `orc_hitl_issues`
   - `orc_reader_verifier_divergences`
   - `orc_reader_verifier_comparisons`
   - `orc_verifier_runs`
   - `orc_reader_safety_evaluations`
   - `orc_reader_outputs`
   - `orc_reader_runs`
3. Dropar tipos enum dedicados (se tiverem sido criados).
4. Revisar policies RLS associadas para evitar objetos orfaos.

Observacao: como as tabelas serao append-only e de auditoria, rollback deve ser excecao; preferir migration corretiva.

## 11. Riscos da proposta

- Crescimento de volume por pagina e por rodada de comparacao.
- Dependencia de `opportunity_file_id` sem tabela canonica de paginas.
- Divergencia semantica se enums/status forem alterados sem governanca.
- Risco de excesso de JSON sem campos denormalizados minimos para filtros.

## 12. Proxima fase recomendada

Fase 4A.2: transformar este draft em SQL documental revisavel (`sql_proposals`) e checklist de validacao read-only, ainda sem aplicar.

## 13. Confirmacoes da fase

- Nenhum SQL executado.
- Nenhuma migration aplicada.
- Nenhum banco alterado.
- Nenhum codigo operacional/UI alterado por este draft.
