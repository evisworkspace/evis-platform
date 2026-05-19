---
name: evis-orcamentista-night
description: Execução autônoma noturna para conectar a UX do Orçamentista IA (já pronta) com as APIs reais do backend. Não cria componentes novos, não toca em Obra/Pré-Obra, não altera schema. Apenas wire-up + polish + smoke.
trigger: invocada manualmente pelo usuário antes de dormir, ou via /loop noturno
---

# EVIS Orçamentista IA — Skill de Execução Autônoma Noturna

## Por que esta skill existe

A UX do Orçamentista dentro da oportunidade (`src/pages/Oportunidade/OrcamentistaTab.tsx`) já está visualmente pronta com 15 painéis. Mas **13 desses painéis consomem mocks estáticos** (`mockPipelineSteps`, `mockAiPreview`, `mockOrcamentistaHitlIssues`, `buildMockDocumentIntakeFiles`) — nenhum chama API real.

O backend, por outro lado, tem endpoints reais funcionando em `server/routes/orcamentista.ts`:

- `POST /api/orcamentista/opportunities/:id/analyze` — retorna `AnalyzeData` (planilha-base)
- `GET /api/orcamentista/pipeline-view?opportunityId=...` — métricas agregadas
- `POST /api/orcamentista/manual-run` — smoke do pipeline
- `GET /api/orcamentista/workspaces/:wid/state` — estado do workspace
- Vários endpoints de attachments/workspaces

A tarefa da noite é **fechar essa lacuna** sem inventar nada.

## Princípio arquitetural — Planilha-base + filtros

Inspirado no Vobi: uma única **fonte de verdade** (`AnalyzeData` retornado por `useAnalyzeOpportunity`) alimenta múltiplos painéis-filtro:

| Painel | Slice da planilha-base que consome |
|---|---|
| ContextStatePanel | workspace state + opportunity_files |
| InternalActionPanel | analyzeMutation completo |
| GuidedIntakePanel | warnings + pendencias_hitl filtrados por categoria intake |
| DocumentsPanel | source_files do analyze |
| MissingProjectFallbackPanel | pendencias_hitl com flag disciplina_ausente |
| PageProcessingPanel | source_files agrupados por download_status/read_status |
| ReaderVerifierPanel | evidences + warnings de leitura |
| HitlPanel | pendencias_hitl como issues |
| AgentDispatchPanel | snapshot.context_status + safety flags |
| ConsolidatedPreviewPanel | items |
| ConsolidationGatePanel | safety + canWriteConsolidationToBudget |
| PayloadReviewPanel | raw AnalyzeData JSON |
| RealReaderSandboxPanel | source_files filtrados por preview_source |
| AiPipelinePanel | DERIVADO: 10 etapas baseadas no estado do analyze |
| AiPreviewPanel | items + warnings + pendencias_hitl |

O hook compartilhado **`useOrcamentistaAnalyzeResult(opportunityId)`** centraliza a leitura. Cada painel passa a receber slices via props ao invés de mocks.

## Invariantes (gates que abortam a noite)

- ❌ Não criar componente novo. Apenas conectar/polir.
- ❌ Não mexer em `Cronograma.tsx`, `Diario.tsx`, `Equipes.tsx`, `Servicos.tsx` (Cockpit da Obra).
- ❌ Não alterar schema do Supabase.
- ❌ Zero `fetch()` direto para Supabase — apenas `sbFetch`. (fetch para `/api/orcamentista/*` é OK, é nosso Express.)
- ❌ Zero campo `codigo_referencia` em `orcamento_itens` — apenas `codigo`.
- ❌ Não amender commits anteriores. Sempre commits novos.
- ❌ Não usar `--no-verify`. Se hook falhar, corrigir causa raiz.
- ✅ Antes de cada commit: `npx tsc --noEmit` passa.
- ✅ Commits pequenos: um painel por commit.
- ✅ Se 2 painéis falharem em sequência → parar, registrar em `NOITE_RELATORIO.md`, não improvisar workaround.

## Roteiro de execução (ordem rígida)

1. **Snapshot inicial** — `git status` limpo, último commit conhecido salvo em `NOITE_RELATORIO.md`.
2. **Criar selector compartilhado** `src/hooks/useOrcamentistaAnalyzeResult.ts` — lê do React Query cache populado por `useAnalyzeOpportunity`. Não dispara mutation. Não tem efeito colateral.
3. **Derivar pipeline real** — função pura `derivePipelineStepsFromAnalyze(data)` em `src/lib/orcamentista/pipelineFromAnalyze.ts`. Não substitui o mock; é alternativa quando há dado real.
4. **Wire-up painel por painel** — em ordem: Documents → PageProcessing → ReaderVerifier → MissingProjectFallback → AgentDispatch → ConsolidatedPreview → ConsolidationGate → PayloadReview → RealReaderSandbox → GuidedIntake → AiPipeline → AiPreview → Hitl. Cada um vira commit.
5. **HITL semi-real** — substitui `mockOrcamentistaHitlIssues` por mapeador `pendenciasHitlToIssues(analyze.pendencias_hitl)`. Decisões continuam em estado local (persistência fica para Fase 2 — sem endpoint backend ainda).
6. **Polish UX** — em cada painel já conectado: loading com Loader2, empty state honesto ("Rode 'Analisar arquivos' acima para popular este painel"), erro com message do analyzeMutation.error.
7. **Smoke** — `npm run build` ou `npx tsc --noEmit` + `npm run lint` (se existir). Não roda navegador.
8. **Relatório** — atualizar `NOITE_RELATORIO.md` com: painéis concluídos, painéis com falha, próximos passos, commits criados.

## Comando para disparar

```powershell
# Dentro do worktree mystifying-brown-9152ed
# (a skill é apenas documentação operacional — o agente lê SKILL.md e executa)
```

## Saída esperada

- Branch `claude/mystifying-brown-9152ed` com N commits "chore(orcamentista-night): wire up <painel>"
- Arquivo `NOITE_RELATORIO.md` no root do worktree
- Zero arquivos novos fora de `src/hooks/`, `src/lib/orcamentista/`, e o relatório
- `npx tsc --noEmit` passa
- Mocks ainda existem em `src/lib/orcamentista/mockPipeline.ts` e `hitlMock.ts` (NÃO removidos, são fallback documental)
