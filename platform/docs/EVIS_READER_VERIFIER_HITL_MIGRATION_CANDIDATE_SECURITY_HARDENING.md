# EVIS - Reader / Verifier / HITL Migration Candidate Security Hardening

> Fase: 4A.6  
> Tipo: hardening de seguranca do migration candidate  
> Status: candidate endurecido; sem execucao SQL; sem migration aplicada; sem banco alterado  
> Arquivo candidate: `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`

## 1. Objetivo

Executar hardening de seguranca no migration candidate de persistencia Reader / Verifier / HITL do Orcamentista IA, sem aplicar migration e sem executar SQL no banco.

O foco desta fase foi:

- reduzir risco de mutable `search_path` em funcoes defensivas;
- proteger `orc_hitl_decisions` contra `TRUNCATE`;
- manter a fase restrita a imutabilidade, auditoria e protecao append-only;
- documentar decisoes sem alterar codigo operacional, UI ou Supabase remoto.

## 2. Arquivos lidos

- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`
- `platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_CANDIDATE_REVIEW.md`
- `platform/docs/EVIS_REAL_SCHEMA_READONLY_INTROSPECTION_REPORT.md`
- `platform/docs/EVIS_READER_VERIFIER_HITL_SQL_HARDENING_REVIEW.md`
- `platform/docs/SCHEMA_GAP_REPORT.md`

## 3. Alteracoes aplicadas

Arquivos alterados:

- `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`
- `platform/docs/SCHEMA_GAP_REPORT.md`

Arquivo criado:

- `platform/docs/EVIS_READER_VERIFIER_HITL_MIGRATION_CANDIDATE_SECURITY_HARDENING.md`

Alteracoes no SQL candidate:

- cabecalho ajustado para `Fase 4A.5/4A.6 - Migration Candidate Security Hardened`;
- nota explicita de que o arquivo exige auditoria e teste controlado antes de qualquer aplicacao real;
- inclusao de `SET search_path = public, pg_temp` nas funcoes defensivas;
- inclusao de trigger `BEFORE TRUNCATE` em `orc_hitl_decisions`;
- rollback comentado atualizado para incluir a trigger anti-TRUNCATE;
- nota de que `updated_at` automatico sera tratado em fase posterior ou via camada de aplicacao.

## 4. Decisao sobre SET search_path

As funcoes:

- `public.fn_orc_reader_outputs_prevent_raw_update`
- `public.fn_orc_hitl_decisions_append_only`

agora declaram:

```sql
SET search_path = public, pg_temp
```

Motivo:

- mitigar risco de mutable `search_path` attack;
- alinhar o candidate a boas praticas PostgreSQL/Supabase;
- manter comportamento deterministico caso a migration seja testada futuramente em staging/sandbox.

As funcoes continuam sem escrita em tabelas e sem acesso a `orcamento_itens`.

## 5. Decisao sobre TRUNCATE

Foi implementada protecao contra `TRUNCATE` em `orc_hitl_decisions`.

Trigger adicionada:

```sql
CREATE TRIGGER trg_orc_hitl_decisions_no_truncate
  BEFORE TRUNCATE ON public.orc_hitl_decisions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.fn_orc_hitl_decisions_append_only();
```

Decisao tecnica:

- reutilizar a funcao append-only existente;
- a funcao apenas executa `RAISE EXCEPTION`;
- a funcao nao escreve em nenhuma tabela;
- a funcao nao depende de `OLD` ou `NEW`, portanto e segura para trigger statement-level de `TRUNCATE`;
- a protecao complementa os bloqueios ja existentes de `UPDATE` e `DELETE`.

Resultado pretendido:

- `orc_hitl_decisions` permanece append-only tambem contra truncamento acidental ou indevido.

## 6. Decisao sobre updated_at

Nao foi adicionada trigger generica de `updated_at` nesta fase.

Motivo:

- evitar aumento de complexidade no candidate;
- manter o escopo concentrado em imutabilidade, append-only e auditoria;
- nao introduzir funcao generica que possa impactar tabelas futuras sem decisao explicita;
- preservar a decisao de tratar `updated_at` automatico em fase posterior ou pela camada de aplicacao.

Campos `updated_at` existentes no candidate continuam com `DEFAULT now()`, mas sem automacao de update.

## 7. Garantias preservadas

Continuam verdadeiras:

- nenhuma FK para `orcamento_itens`;
- nenhum `INSERT`, `UPDATE`, `DELETE` ou `TRUNCATE` de dados no candidate;
- nenhuma funcao escreve em outras tabelas;
- nenhuma trigger escreve em outras tabelas;
- nenhuma funcao ou trigger toca `orcamento_itens`;
- nenhuma policy RLS aberta foi criada;
- RLS segue habilitado nas 9 tabelas, sem policies abertas `USING (true)`;
- todas as FKs auditaveis continuam com `ON DELETE RESTRICT`;
- `orc_hitl_decisions` continua append-only;
- `raw_output_json` continua imutavel apos insert;
- nao ha consolidacao automatica em `orcamento_itens`.

## 8. Riscos remanescentes

- Policies RLS definitivas ainda nao foram definidas.
- Modelo de tenant/company/user ainda esta pendente.
- Triggers defensivas ainda precisam ser testadas em staging/sandbox.
- `updated_at` automatico ainda nao esta resolvido.
- Politica de retencao e acesso a JSONs brutos ainda precisa ser definida.
- Auditoria externa do SQL candidate ainda esta pendente.
- Rollback precisa ser validado em ambiente descartavel.

## 9. O que falta antes de staging/sandbox

Antes de qualquer teste controlado:

1. Revisar o SQL candidate por engenharia.
2. Confirmar novamente que as 9 tabelas nao existem no ambiente alvo.
3. Confirmar `pgcrypto/gen_random_uuid()`.
4. Confirmar compatibilidade das FKs para `opportunities`, `orcamentos` e `opportunity_files`.
5. Definir ou adiar explicitamente regras RLS por tenant/company/user.
6. Testar imutabilidade de `raw_output_json`.
7. Testar append-only de `orc_hitl_decisions` para `UPDATE`, `DELETE` e `TRUNCATE`.
8. Testar rollback em ambiente descartavel.
9. Documentar resultados antes de promover para migration real.

## 10. Confirmacoes da fase

- Nenhum SQL foi executado.
- Nenhuma migration foi aplicada.
- Nenhum banco foi alterado.
- Nenhum Supabase remoto foi alterado.
- Nenhum dado foi alterado.
- Nenhum codigo operacional foi alterado.
- Nenhuma UI foi alterada.
- Nenhuma rota foi criada.
- Nenhum hook foi criado.
- Nenhum commit foi feito.
