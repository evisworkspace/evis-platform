# EVIS - Orcamentista Pipeline Read Models

> Fase: 4C.READ
> Tipo: Read models agregados para pipeline
> Data: 2026-05-12
> Status: skeleton de leitura criado

## 1. Objetivo da fase

Criar read models/agregadores server-side para consultar o estado do pipeline do Orçamentista IA. O objetivo é permitir que interfaces futuras consumam o status do processamento (Reader, Verifier, HITL) sem liberar a escrita no banco nem consultar `orcamento_itens`.

## 2. Arquivos lidos
- `platform/server/orcamentista/persistence/contracts.ts`
- `platform/server/orcamentista/persistence/guards.ts`
- `platform/server/orcamentista/persistence/repository.ts`
- `platform/server/orcamentista/persistence/readerPersistence.ts`
- `platform/server/orcamentista/persistence/verifierPersistence.ts`
- `platform/server/orcamentista/persistence/hitlPersistence.ts`
- `platform/server/orcamentista/persistence/index.ts`

## 3. Arquivos criados/alterados
- `platform/server/orcamentista/persistence/readModels.ts` (criado)
- `platform/server/orcamentista/persistence/index.ts` (alterado para incluir o novo módulo)
- `platform/docs/EVIS_ORCAMENTISTA_PIPELINE_READ_MODELS_4C_READ.md` (criado)

## 4. Read models implementados

Foram implementadas as seguintes funções no módulo `readModels.ts`:
1. `getOpportunityPipelineSummary(client, opportunityId)`: Agrega o total de arquivos, execuções e problemas do pipeline para uma oportunidade.
2. `getReaderVerifierHitlTimeline(client, opportunityId)`: Constrói uma linha do tempo agregada do processamento de Reader, Verifier e requisições HITL.
3. `getLatestContextSnapshot(client, opportunityId)`: Busca o último status consolidado da oportunidade (snapshot).
4. `getPendingHitlIssues(client, opportunityId)`: Filtra as issues que ainda exigem revisão humana (HITL).
5. `getPipelineHealthForOpportunity(client, opportunityId)`: Analisa os dados anteriores para identificar problemas ativos (`blockers`, `warnings`) no pipeline.

## 5. Confirmações de segurança

- **Nenhum SQL remoto executado:** Todos os acessos simulam chamadas por um client injetado (`SupabaseLikeReadClient`).
- **Nenhum banco alterado:** A fase é 100% código server-side estático.
- **Produção não usada:** Nenhuma credencial foi tocada.
- **Ausência de remotes writes:** Nenhuma função utiliza métodos de mutação (`insert`, `update`, `delete`, `upsert`).
- **`orcamento_itens` segue bloqueado:** A função de validação interna `assertTableAllowedForRead` não inclui e ativamente rejeitaria acessos a `orcamento_itens`, seguindo a estratégia já elaborada.

## 6. Recomendação objetiva
**Pronto para avançar para 4C.VALIDATE**. 
Com a infraestrutura de escrita isolada e os agregadores de leitura criados, a persistência do pipeline está completamente separada dos mecanismos manuais legados e com o sandbox finalizado. A validação geral deste conjunto poderá ocorrer em um ambiente seguro controlado.
