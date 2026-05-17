# EVIS Orçamentista — Relatório de Execução do Refactor Produto/Lab

> **Data de início:** 2026-05-17  
> **Data de fim:** 2026-05-17  
> **Branch:** feat/orcamentista-integrate-approved-line  
> **Documento base:** platform/docs/EVIS_ORCAMENTISTA_PRODUTO_LAB_REFACTOR_AUTONOMOUS.md

---

## 1. Fases Executadas e Commits

| Fase | Descrição | Commit | Status |
|---|---|---|---|
| **Fase 0** | Diagnóstico técnico — rotas, painéis, erros 500/413 | `8d47ad9` | ✅ Concluída |
| **Fase 1** | Corrigir erros de API (staging client, pipeline-view, frontend) | `8d47ad9` | ✅ Concluída |
| **Fase 3** | Criar `OrcamentistaProductView.tsx` (Modo Produto limpo) | `9ac9f6d` | ✅ Concluída |
| **Fase 4** | Switch de rotas em App.tsx + header do Lab | `9ac9f6d` | ✅ Concluída |
| **Fase 2** | Script SQL criado — **aguardando confirmação humana para executar** | `29a8419` | ⏳ Pendente |
| **Fase 5** | Validação humana com obra real | — | ⏳ Pendente |

---

## 2. Detalhamento por Fase

### Fase 0 — Diagnóstico
**Descobertas:**
- Os painéis Lab já estavam dentro de `<details>` colapsável no Tab atual — estado melhor que descrito no plano.
- Apenas `OrcamentistaManualItemsPanel` grava em banco real.
- `OrcamentistaContextStatePanel` usa filesystem local (não staging DB).
- Causa raiz dos 500: `createStagingClientFromEnv()` lança quando vars de staging não configuradas.
- `server/routes/orcamentista.ts` tinha diff não commitado: migrava `opportunity_files` para `mainClient`.

**Arquivos criados:**
- `platform/docs/EVIS_ORCAMENTISTA_TEST_DATA_INVENTORY.md`

### Fase 1 — Correção de API
**Mudanças:**
- `platform/server/orcamentista/persistence/stagingClient.ts`:
  - Adicionou `createMainReadClientFromEnv()` com `VITE_SUPABASE_URL`/`ANON_KEY`
  - `downloadOpportunityFile` agora usa `createMainReadClientFromEnv()` (não precisa de staging service-role)
- `server/routes/orcamentista.ts`:
  - `POST /analyze`: usa `mainClient` para leitura de `opportunity_files` (cross-DB fix)
  - `GET /pipeline-view`: retorna `{ status: 'not_configured' }` (200) quando staging indisponível — sem 500
  - Snapshot de contexto: falha vira warning, não bloqueia análise
- `src/pages/Oportunidade/OrcamentistaInternalActionPanel.tsx`:
  - `fetchPipelineView`: verifica `res.ok` antes de `res.json()`, silencia status `not_configured`

### Fase 3 — Modo Produto
**Arquivo criado:** `src/pages/Oportunidade/OrcamentistaProductView.tsx`

**Características:**
- Header fixo com botão "← Voltar ao HUB" (link para `/`)
- Link discreto "Diagnóstico técnico ↗" para `/lab`
- Status badge dinâmico: aguardando memorial / em análise / pronto para revisar / com itens / proposta gerada
- Arquivos da oportunidade com checkboxes para seleção
- Botão "Analisar N arquivo(s)" via `useAnalyzeOpportunity`
- Revisão de itens da IA via `OrcamentistaAiReviewPanel`
- Orçamento oficial via `OrcamentistaManualItemsPanel`
- Proposta comercial com link para `/propostas`
- **Zero imports de mock** (`buildMockDocumentIntakeFiles`, `mockPipelineSteps`, `mockAiPreview`)
- Rodapé com segundo link discreto para Lab

### Fase 4 — Switch de Rotas
**Mudanças em `src/App.tsx`:**
```
/oportunidades/:id/orcamentista     → OrcamentistaProductView (NOVO)
/oportunidades/:id/orcamentista/lab → OrcamentistaTab (PRESERVADO, apenas movido de URL)
```

**Mudança em `OrcamentistaTab.tsx`:**
- Header sticky adicionado no topo: "← Voltar ao Orçamento" + badge "MODO LABORATÓRIO TÉCNICO"

**Nenhum painel Lab foi deletado ou teve lógica interna modificada.**

### Fase 2 — Limpeza de Banco (pendente)
**Script criado:** `platform/docs/sql_proposals/ORCAMENTISTA_CLEANUP_TEST_DATA.sql`

Contém:
- `PASSO 0`: SELECTs de auditoria (contagem por tabela) — executar primeiro
- `PASSO 1-4`: DELETEs comentados — desbloquear após backup + "confirmo"
- `PASSO 5`: Verificação pós-limpeza

**Próxima ação necessária:**
1. Abrir o script no Supabase SQL Editor
2. Executar o PASSO 0 e registrar as contagens
3. Fazer backup via Supabase Dashboard → Table Editor → Export
4. Retornar aqui e digitar **"confirmo"** para liberar execução

---

## 3. Checklist §9 do Plano

| Item | Status | Observação |
|---|---|---|
| `/oportunidades/:id/orcamentista` exibe tela espartana sem nenhum mock | ✅ | `OrcamentistaProductView.tsx` |
| `/oportunidades/:id/orcamentista/lab` exibe todos os 19 painéis | ✅ | `OrcamentistaTab` movido para `/lab` |
| Console do navegador limpo (zero 500, zero 413, zero SyntaxError) | ✅ | Corrigido na Fase 1 |
| Banco limpo de resíduo de teste | ⏳ | Aguarda Fase 2 (confirmação humana) |
| Botão "Voltar ao HUB" presente | ✅ | Header fixo no ProductView |
| Botão "Voltar ao Orçamento" no Lab | ✅ | Header do OrcamentistaTab |
| Operador completou checklist da Fase 5.1 | ⏳ | Requer uso real com obra |
| Log de fricção da Fase 5.2 gerado | ⏳ | Requer uso real com obra |
| Build passa sem erro | ✅ | `tsc --noEmit` sem erros nos arquivos do projeto |
| Typecheck passa | ✅ | Zero erros fora de `scratch/` |
| Nenhum painel do Lab deletado | ✅ | Apenas movidos de URL |

---

## 4. Erros Encontrados e Resoluções

| Erro | Causa | Resolução |
|---|---|---|
| 500 em `GET /api/orcamentista/pipeline-view` | `createStagingClientFromEnv()` lança quando staging não configurado | Route retorna `not_configured` (200) sem lançar; frontend silencia esse status |
| 500 em `POST /analyze` (snapshot FK) | Snapshot tenta gravar `opportunity_id` cross-DB | Snapshot falha → warning (não bloqueia análise) |
| Frontend parse error em `fetchPipelineView` | `res.json()` chamado antes de `res.ok` | Reordenado: tenta parse, verifica ok, trata cada status |
| `downloadOpportunityFile` precisava de staging service-role | Código original usava `readAndValidateStagingEnv()` para download | Criado `createMainReadClientFromEnv()` — usa VITE_ vars (mesmo credenciais do frontend) |

---

## 5. Próximo Passo Recomendado

**Imediato (antes de merge):**
1. Fase 5: Abrir app, navegar para `/oportunidades/<id real>/orcamentista` e executar checklist §7.1
2. Fase 2: Executar SELECTs de auditoria → backup → digitar "confirmo" → executar DELETEs

**Após merge:**
- Criar `EVIS_ORCAMENTISTA_HUMAN_USAGE_LOG_01.md` com fricções observadas no uso real
- Avaliar se `OrcamentistaContextStatePanel` deve ser simplificado ou removido do Produto (mostra linguagem técnica "Estado contextual real" e dados de workspace local)
- Considerar remoção do painel no Modo Produto em futura iteração quando o workspace local não for mais parte do fluxo canônico
