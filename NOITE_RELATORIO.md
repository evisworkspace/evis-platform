# RELATÓRIO DA EXECUÇÃO NOTURNA — Orçamentista IA Wire-up

**Início:** 2026-05-18 (madrugada)
**Branch:** claude/mystifying-brown-9152ed
**Snapshot inicial:** commit 7da8e31 (feat(orcamentista): extract supported file text locally)

## Diagnóstico de partida

Após auditoria forense dos 18 painéis em `src/pages/Oportunidade/`:

- **5 painéis já reais**: OrcamentistaTab (pai), OrcamentistaManualItemsPanel, OrcamentistaContextStatePanel, OrcamentistaInternalActionPanel, OrcamentistaChat (parcialmente).
- **13 painéis mockados**: GuidedIntake, Documents, MissingProjectFallback, PageProcessing, ReaderVerifier, Hitl, AgentDispatch, ConsolidatedPreview, ConsolidationGate, PayloadReview, RealReaderSandbox, AiPipeline, AiPreview.
- **Backend tem 11 endpoints reais** em `server/routes/orcamentista.ts`. Nenhuma rota nova será criada esta noite.
- **Não existe endpoint backend para persistir decisões HITL** — decisões continuam estado local mas alimentadas por `pendencias_hitl` reais do analyze.

## Estratégia

Criar **selector compartilhado** `useOrcamentistaAnalyzeResult` que lê o cache da `useAnalyzeOpportunity` mutation e distribui slices da `AnalyzeData` (planilha-base) para os 13 painéis. Cada painel vira "filtro visual" da mesma fonte de verdade — espelhando o modelo do Vobi descrito pelo usuário.

## Progresso

Atualizado em tempo real durante a noite.

### Pré-requisitos
- [x] Auditoria completa
- [x] Skill `skills/evis-orcamentista-night/SKILL.md` criada
- [ ] Selector compartilhado criado
- [ ] Função `derivePipelineStepsFromAnalyze` criada

### Painéis (13 alvos)

| # | Painel | Status | Commit |
|---|---|---|---|
| 1 | OrcamentistaDocumentsPanel | pendente | - |
| 2 | OrcamentistaPageProcessingPanel | pendente | - |
| 3 | OrcamentistaReaderVerifierPanel | pendente | - |
| 4 | OrcamentistaMissingProjectFallbackPanel | pendente | - |
| 5 | OrcamentistaAgentDispatchPanel | pendente | - |
| 6 | OrcamentistaConsolidatedPreviewPanel | pendente | - |
| 7 | OrcamentistaConsolidationGatePanel | pendente | - |
| 8 | OrcamentistaPayloadReviewPanel | pendente | - |
| 9 | OrcamentistaRealReaderSandboxPanel | pendente | - |
| 10 | OrcamentistaGuidedIntakePanel | pendente | - |
| 11 | OrcamentistaAiPipelinePanel | pendente | - |
| 12 | OrcamentistaAiPreviewPanel | pendente | - |
| 13 | OrcamentistaHitlPanel | pendente | - |

### Smoke final
- [ ] `npx tsc --noEmit` passa
- [ ] Vite build não regride

## Notas / Decisões de design

(preenchido durante a execução)

## Pendências pós-noite (Fase 2)

(preenchido ao final)
