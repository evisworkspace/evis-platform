# EVIS ORCAMENTISTA - READER / VERIFIER / HITL PERSISTENCE SCHEMA AUDIT

> Fase: 4A.0  
> Tipo: auditoria e documentacao  
> Status: sem migration, sem alteracao de banco, sem escrita de dados

## 1. Objetivo da persistencia

Definir a arquitetura de persistencia futura para o fluxo manual seguro do Orçamentista IA:

```text
Reader manual real
  -> normalizacao
    -> safety gate
      -> dimensional checks
        -> Verifier manual
          -> comparacao Reader x Verifier
            -> agreement score + divergencias deduplicadas
              -> HITL
                -> decisao humana
                  -> bloqueio/liberacao controlada
```

O foco desta fase e garantir rastreabilidade tecnica e auditoria antes de qualquer escrita no orcamento oficial.

## 2. Por que nao criar migration ainda

Nao criar migration nesta fase evita cristalizar um schema antes de fechar decisoes criticas:

- modelo final de relacoes entre `opportunity_id`, `orcamento_id`, arquivo e pagina;
- estrategia de RLS para dados sensiveis de decisao humana;
- politica de versionamento e retencao de JSON bruto;
- contratos de status para gate, comparacao e HITL;
- fronteira de escrita em `orcamento_itens` (que permanece bloqueada).

Conclusao: primeiro auditar e decidir, depois migrar.

## 3. Entidades existentes relacionadas

Estruturas ja encontradas no projeto (documentacao + hooks/tipos):

```text
opportunities
opportunity_events
opportunity_files
propostas
orcamentos
orcamento_itens
obras
```

Observacao: nao ha tabela canonica persistente para Reader/Verifier/Comparison/HITL deste fluxo.

## 4. Relacao com opportunity / orcamento / documento / pagina

Modelo alvo de rastreabilidade:

- `opportunity_id`: ancora obrigatoria do fluxo; pode estar como coluna direta em todas as tabelas ou ser obrigatorio por lineage FK, desde que recuperavel sem ambiguidade.
- `orcamento_id`: opcional enquanto nao houver orcamento oficial; obrigatorio para fases de consolidacao/escrita.
- `opportunity_file_id`: referencia ao arquivo de origem em `opportunity_files`.
- `document_id`: campo textual de compatibilidade com contratos atuais do pipeline.
- `page_number`: granularidade por pagina para evidencias e divergencias.

## 5. Proposta de tabelas futuras (conceitual)

```text
orc_reader_runs
orc_reader_outputs
orc_reader_safety_evaluations
orc_verifier_runs
orc_reader_verifier_comparisons
orc_reader_verifier_divergences
orc_hitl_issues
orc_hitl_decisions
orc_context_snapshots
```

### 5.1 Campos sugeridos por tabela

`orc_reader_runs`
- id, opportunity_id, orcamento_id, opportunity_file_id, document_id, page_number
- reader_motor, source_quality, status, created_at, updated_at

`orc_reader_outputs`
- id, reader_run_id, raw_output_json, normalized_output_json
- identified_count, inferred_count, missing_count, confidence_score
- created_at

`orc_reader_safety_evaluations`
- id, reader_output_id, safety_gate_json, dimensional_checks_json
- requires_verifier, requires_hitl, blocks_consolidation, allowed_to_dispatch
- created_at

`orc_verifier_runs`
- id, reader_output_id, opportunity_id (direto ou derivado por lineage), verifier_input_json, normalized_verifier_json
- status, created_at, updated_at

`orc_reader_verifier_comparisons`
- id, reader_output_id, verifier_run_id, opportunity_id (direto ou derivado por lineage)
- agreement_score, agreement_band
- comparison_json, dispatch_decision_json
- requires_hitl, blocks_consolidation, allowed_to_dispatch
- created_at

`orc_reader_verifier_divergences`
- id, comparison_id, opportunity_id (direto ou derivado por lineage), category, title
- reader_value, verifier_value, reason
- severity, requires_hitl, blocks_consolidation
- dedupe_key, created_at

`orc_hitl_issues`
- id, comparison_id, source_type, source_id
- opportunity_id, orcamento_id, opportunity_file_id, document_id, page_number
- issue_type, severity, status
- title, description, evidence_summary, recommended_action
- blocks_dispatch, blocks_consolidation
- created_at, updated_at

`orc_hitl_decisions`
- id, hitl_issue_id, decision_type, notes
- decided_by, decided_at
- dispatch_released, consolidation_released
- decision_payload_json
- append_only: true (sem update/delete destrutivo da trilha)

`orc_context_snapshots`
- id, opportunity_id, orcamento_id, phase
- context_status (`validated`/`pending`/`blocked`/`incomplete`)
- validated_facts_json, pending_questions_json, block_reasons_json
- created_at

## 6. Status possiveis recomendados

- Reader: `received`, `normalized`, `safety_evaluated`, `blocked`, `ready_for_verifier`
- Verifier: `received`, `normalized`, `compared`, `requires_hitl`, `blocked`, `approved`
- Comparison: `pending`, `divergent`, `requires_hitl`, `dispatch_allowed`, `consolidation_blocked`
- HITL issue: `pendente`, `em_revisao`, `aprovada_com_ressalva`, `bloqueada`, `documento_solicitado`, `convertida_em_verba`, `ignorada_nesta_fase`, `reanalisar_futuramente`
- Contexto: `validated`, `pending`, `blocked`, `incomplete`

## 7. Fluxo de HITL persistente (alvo)

```text
comparison gerou divergencia
  -> cria orc_hitl_issues
    -> humano decide (orc_hitl_decisions)
      -> atualiza status da issue
        -> recalcula bloqueio de dispatch/consolidacao
          -> somente fase futura pode liberar escrita real
```

## 8. Regras de seguranca

- Nunca usar Reader/Verifier para gravar direto em `orcamento_itens`.
- `raw_output_json` do Reader deve ser imutavel apos persistido.
- Escrita futura em orcamento oficial so apos:
  - comparacao concluida;
  - HITLs resolvidos;
  - aprovacao humana explicita;
  - trilha auditavel completa.
- Toda decisao humana deve ter `decided_by`, `decided_at` e `notes`.
- `orc_hitl_decisions` deve ser append-only para preservar auditoria completa.
- Divergencia `high`/`critical` deve bloquear consolidacao ate resolucao formal.
- Contexto `pending`/`blocked` nao alimenta quantitativos finais.

## 9. Observacoes de RLS (para fase futura)

- Definir estrategia de autorizacao por tenant/equipe antes de criar politicas.
- Evitar politica aberta em tabelas de auditoria/HITL.
- Separar permissao de leitura tecnica e permissao de decisao humana.
- Registrar trilha de acesso a payloads brutos (podem conter dados sensiveis).

## 10. Riscos mapeados

- Persistir cedo demais e congelar modelo incorreto de vinculo documento/pagina.
- Inconsistencia entre `document_id` textual e `opportunity_file_id` uuid.
- Liberar escrita em `orcamento_itens` sem gate/hitl e perder controle de qualidade.
- RLS indefinido em tabelas de decisao humana.
- Acoplamento excessivo entre fluxo comercial (`opportunity`) e operacional (`obra`) sem regras.

## 11. Proximos passos (antes de migration)

1. Fechar decisoes humanas pendentes sobre IDs, RLS e retencao.
2. Congelar dicionario de status por entidade.
3. Validar modelo conceitual com cenarios reais (fundacao/estacas/divergencias).
4. So depois preparar migration incremental e revisavel.

## 12. Confirmacoes da Fase 4A.0

- Nenhuma migration criada.
- Nenhuma tabela criada.
- Nenhuma alteracao de banco executada.
- Nenhum dado gravado.
- Nenhuma alteracao em Obra/Diario.
- Nenhuma alteracao em UI.
