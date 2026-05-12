# EVIS - Orcamentista Persistence Contracts and Guards

> Fase: 4C.1
> Tipo: contratos e guards da camada oficial de persistência
> Data: 2026-05-12
> Status: concluído

## 1. Objetivo da fase

Criar os contratos TypeScript e guards de segurança da camada de persistência do Orçamentista, garantindo que qualquer futura escrita passe por validações explícitas e que `orcamento_itens` permaneça bloqueado.

## 2. Arquivos criados

- `platform/server/orcamentista/persistence/contracts.ts`: Definição de todos os inputs de persistência.
- `platform/server/orcamentista/persistence/guards.ts`: Lógica de proteção e allowlist/blocklist.
- `platform/server/orcamentista/persistence/index.ts`: Exportação consolidada da camada.

## 3. Contratos criados

Foram mapeados 10 contratos de entrada para persistência, alinhados com o schema SQL da Fase 4B:

1. `RegisterOpportunityFileInput` (Metadata de arquivos)
2. `CreateReaderRunInput` (Execução do Reader)
3. `CreateReaderOutputInput` (Output do Reader)
4. `CreateSafetyEvaluationInput` (Safety Gate)
5. `CreateVerifierRunInput` (Execução do Verifier)
6. `CreateReaderVerifierComparisonInput` (Comparação)
7. `CreateDivergenceInput` (Divergências deduplicadas)
8. `CreateHitlIssueInput` (Fila HITL)
9. `CreateHitlDecisionInput` (Decisões append-only)
10. `CreateContextSnapshotInput` (Gate/Snapshots de contexto)

## 4. Guards de Segurança

Implementados em `guards.ts`:

- **Allowlist**: Apenas as 10 tabelas acima são permitidas.
- **Blocklist**: `orcamento_itens`, `orcamentos`, `opportunities`, `servicos`, `obras` estão bloqueados.
- **Guard de Consolidação**: `canWriteConsolidationToBudget = false` por padrão.
- **Guard de Payload**: Exige `opportunity_id` em todas as operações.
- **Guard Mestre**: `validatePersistenceIntent(tableName, payload)` que executa todas as verificações.

## 5. Bloqueio de `orcamento_itens`

O bloqueio foi implementado em três níveis:
1. **Definição de Blocklist**: `orcamento_itens` é o primeiro item da lista proibida.
2. **Função `assertNoBudgetItemWrite`**: Lança erro de bloqueio se houver tentativa de escrita.
3. **Flag `canWriteConsolidationToBudget`**: Definida como `false`, impedindo logicamente qualquer fluxo de consolidação.

## 6. O que ficou fora de escopo

- Implementação de repository (Supabase calls).
- Criação de endpoints HTTP.
- Integração com a UI.
- Migrações de banco de dados.
- Alteração de código legado.

## 7. Riscos

- **Duplicação de Tipos**: Alguns tipos em `src/types.ts` são similares, mas os novos contratos são específicos para o payload de persistência do servidor.
- **Falta de Transação**: O driver `PostgREST` (Supabase Client) não suporta transações multi-tabela nativas no client. Será necessário decidir no 4C.2 entre usar RPCs ou compensações de erro.

## 8. Decisão Objetiva

**Pronto para 4C.2.**

Os contratos e guards fornecem a base de segurança necessária para iniciar a implementação do repository na próxima fase.

---
*(Relatório gerado automaticamente pela Fase 4C.1)*
