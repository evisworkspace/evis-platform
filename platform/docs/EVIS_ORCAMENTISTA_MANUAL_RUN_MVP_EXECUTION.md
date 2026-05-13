# EVIS Orçamentista IA - Manual Run MVP Execution Report

> Data: 2026-05-12
> Status: Concluído com Sucesso
> Tipo: Execução Server-side do Pipeline
> Ambiente: Staging

## 1. Objetivo da Execução

Validar o fluxo completo de persistência do Orçamentista IA em ambiente de Staging por meio de um script manual (`manualRunCli.ts`). O objetivo principal é garantir que as etapas de Reader, Verifier, HITL e Snapshots sejam gravadas corretamente no Supabase, **sem nenhuma escrita** não autorizada na tabela oficial de orçamento (`orcamento_itens`).

## 2. Parâmetros de Ambiente

- **Staging Utilizado:** `vtlepoljlqmjwuauygni`
- **Produção Bloqueada:** O projeto de produção (`jwutiebpfauwzzltwgbb`) **não** foi utilizado e não constou em nenhuma variável acessada pelo pipeline.
- **Tabela Oficial Bloqueada:** Regras de proibição de escrita ativas no `stagingClient`.

## 3. Comando Executado

O teste foi acionado de forma isolada, no modo _synthetic_ test (novas âncoras), através do comando:

```powershell
npx tsx platform/server/orcamentista/manualRunCli.ts --mode manual_test --confirm-staging-write
```

*(Nota: Variáveis de ambiente como `PROJECT_REF` e chaves foram previamente injetadas na sessão local via export de PowerShell, garantindo que credenciais não ficassem no arquivo `.env` durante o commit).*

## 4. Resultado da Execução

A execução retornou o status **`success`**, gerando os seguintes identificadores âncora:

- **opportunityId:** `67bcee28-8983-4d64-b62c-7f7ca5b7b039`
- **orcamentoId:** `36efbfc4-39b6-42b1-8956-bc1ec542b8db`
- **opportunityFileId:** `ff99e18f-88b1-4a72-a2f5-d50d796cae5f`
- **readerRunId:** `ff3f9aa0-e494-4fc2-9729-667c77bdd0c1`
- **verifierRunId:** `e4ab42c0-93bd-409b-afd7-9eeb72a7ca69`
- **hitlIssueId:** `fc9813b0-b16f-44a9-8bb0-d1b213210073`
- **finalContextSnapshotId:** `d20c11a0-23f6-4222-a32f-81c040922b7b`

## 5. Resumo do Pipeline Criado

O objeto de sumário (`pipelineSummary`) atestou as seguintes inserções:
- `total_files`: 1
- `total_reader_runs`: 1
- `total_verifier_runs`: 1
- `open_hitl_issues`: 1

## 6. Confirmações de Segurança (Gate)

O script confirmou estritamente o isolamento da produção e da consolidação orçamentária:

- **`latestContextStatus`:** `blocked` (Nenhuma consolidação permitida).
- **`canWriteConsolidationToBudget`:** `false`.
- **`touchedBudgetItemsTable`:** `false`.
- **`touchedTables`:** As tabelas manipuladas foram exclusivamente as entidades-mãe (`orcamentos`, `opportunities`, `opportunity_files`) e o escopo do pipeline (`orc_reader_runs`, `orc_reader_outputs`, `orc_reader_safety_evaluations`, `orc_verifier_runs`, `orc_reader_verifier_comparisons`, `orc_reader_verifier_divergences`, `orc_hitl_issues`, `orc_hitl_decisions`, `orc_context_snapshots`). A tabela oficial `orcamento_itens` **não apareceu** na lista de tabelas tocadas.

## 7. Conclusão Objetiva

**Manual Run MVP validado.**
A arquitetura de contratos, repositórios de leitura e escrita para o pipeline do Orçamentista conectou-se com sucesso ao banco Supabase em Staging. A segurança da arquitetura provou-se correta ao processar os dados sem risco de vazar informações impuras ou não tratadas à tabela final de orçamentos. O Sandbox autônomo está operacional.

> [!CAUTION]
> **Alerta Operacional:** 
> Durante os passos operacionais dessa validação na sessão local do usuário, a string completa do token JWT correspondente à *Service Role Key* de staging foi inadvertidamente exposta na interface em texto plano. Esta Service Role Key deve ser considerada comprometida e **rotacionada** imediatamente no dashboard do Supabase do ambiente de Staging (`vtlepoljlqmjwuauygni`).
