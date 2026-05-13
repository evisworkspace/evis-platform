# EVIS Orçamentista IA - Manual Run MVP

## Objetivo

Criar um caminho manual, server-side e mínimo para ligar o Orçamentista IA ao Supabase staging usando a persistence layer já criada.

Fluxo executado pelo runner:

1. criar ou receber `opportunity`
2. criar ou receber `orcamento`
3. criar ou receber `opportunity_file`
4. executar `persistReaderStage`
5. executar `persistVerifierStage`
6. executar `persistHitlStage`
7. executar `persistContextSnapshot`
8. consultar `getOpportunityPipelineSummary`

## Arquivos

- `platform/server/orcamentista/persistence/stagingClient.ts`
- `platform/server/orcamentista/orcamentistaManualRun.ts`
- `platform/server/orcamentista/manualRunCli.ts`

## Variaveis necessarias

Definir somente na sessao atual do terminal:

```powershell
$env:EVIS_STAGING_PROJECT_REF="<staging project ref>"
$env:EVIS_BLOCKED_PRODUCTION_PROJECT_REF="<blocked production project ref>"
$env:EVIS_STAGING_SUPABASE_URL="<staging supabase url>"
$env:EVIS_STAGING_SUPABASE_SERVICE_ROLE_KEY="<staging service key>"
```

Nao usar `.env`. Nao usar `supabase/.temp`. Nao imprimir valores.

## Comando manual

Modo sintetico:

```powershell
npx tsx platform/server/orcamentista/manualRunCli.ts --mode manual_test --confirm-staging-write
```

Modo com anchors existentes:

```powershell
npx tsx platform/server/orcamentista/manualRunCli.ts --mode existing --opportunity-id <uuid> --orcamento-id <uuid> --confirm-staging-write
```

Opcional:

```powershell
--opportunity-file-id <uuid>
--marker EVIS_TEST_MANUAL_RUN_MVP
```

## Seguranca

O `stagingClient`:

- le apenas variaveis de ambiente da sessao atual
- exige o project ref autorizado de staging
- exige URL apontando para staging
- bloqueia valores operacionais que apontem para o ref de producao configurado
- valida o `ref` do JWT quando a key estiver nesse formato
- bloqueia qualquer acesso via client a tabela oficial de itens de orcamento
- nao imprime secrets

O manual run:

- mantem `canWriteConsolidationToBudget=false`
- grava gate `blocked`
- grava `dispatch_released=false`
- grava `consolidation_released=false`
- nao executa consolidacao orcamentaria
- nao altera schema, migration, RLS ou policies
- nao cria UI

## Como confirmar que funcionou

A saida segura do CLI deve conter:

- `status: "success"`
- `opportunityId`
- `orcamentoId`
- `opportunityFileId`
- `readerRunId`
- `verifierRunId`
- `hitlIssueId`
- `finalContextSnapshotId`
- `pipelineSummary.total_reader_runs >= 1`
- `pipelineSummary.total_verifier_runs >= 1`
- `pipelineSummary.open_hitl_issues >= 1`
- `latestContextStatus: "blocked"`
- `canWriteConsolidationToBudget: false`

## Como confirmar que a tabela oficial de itens nao foi tocada

A saida do CLI deve conter:

```json
{
  "touchedBudgetItemsTable": false
}
```

Tambem confirme que `touchedTables` nao inclui a tabela oficial de itens de orcamento.

## Observacao operacional

Este MVP nao faz cleanup automatico: ele e um manual run pratico para gerar um pipeline auditavel em staging. Usar marcador sintetico para rastrear as linhas criadas.
