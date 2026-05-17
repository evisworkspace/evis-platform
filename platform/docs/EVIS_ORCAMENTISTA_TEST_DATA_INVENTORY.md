# EVIS Orçamentista — Inventário de Dados de Teste

> Gerado em: 2026-05-17  
> Fase 0 do refactor Produto/Lab (EVIS_ORCAMENTISTA_PRODUTO_LAB_REFACTOR_AUTONOMOUS.md)

---

## 1. Padrões de resíduo de teste identificados no código

### 1.1 Marcadores hardcoded no frontend

| Arquivo | Linha | Marcador |
|---|---|---|
| `src/pages/Oportunidade/OrcamentistaInternalActionPanel.tsx` | 113 | `mode: 'manual_test'` |
| `src/pages/Oportunidade/OrcamentistaInternalActionPanel.tsx` | 114 | `marker: 'UI_MANUAL_RUN'` |

### 1.2 Padrões a buscar no banco (queries sugeridas)

Execute via Supabase Dashboard ou `psql` antes da Fase 2:

```sql
-- Verificar oportunidades de teste
SELECT id, titulo, status, created_at
FROM oportunidades
WHERE titulo ILIKE '%UI_MANUAL_RUN%'
   OR titulo ILIKE '%Manual Run Opportunity%'
   OR titulo ILIKE '%TEST%';

-- Verificar itens de orçamento com origem de teste
SELECT id, orcamento_id, descricao, origem, created_at
FROM orcamento_itens
WHERE origem IN ('manual_test', 'consolidated_preview_mock')
   OR descricao = 'Item Teste Manual';

-- Verificar arquivos vinculados a oportunidades de teste
SELECT f.id, f.nome, f.opportunity_id, o.titulo
FROM opportunity_files f
JOIN oportunidades o ON o.id = f.opportunity_id
WHERE o.titulo ILIKE '%UI_MANUAL_RUN%'
   OR o.titulo ILIKE '%Manual Run Opportunity%';
```

> **Nota:** As queries acima não foram executadas nesta fase. Execução real ocorre na Fase 2,
> após confirmação humana e geração de backup.

---

## 2. Mapeamento de rotas (Fase 0.1)

| Rota | Componente | Observação |
|---|---|---|
| `/oportunidades/:id/orcamentista` | `OrcamentistaTab` | Rota atual — será migrada para `OrcamentistaProductView` na Fase 4 |
| `/oportunidades/:id/orcamentista/lab` | (não existe ainda) | Será criada na Fase 4 apontando para `OrcamentistaTab` |
| `/orcamentista` | `OrcamentistaChat` | Standalone, não impactado |

**Arquivos que importam `OrcamentistaTab`:**
- `src/App.tsx` (router)
- `src/pages/Oportunidade/OrcamentistaTab.tsx` (self)

---

## 3. Inventário de painéis por categoria (Fase 0.2)

| Painel | Grava em banco real? | Lê de banco real? | Exibe mock? | Destino |
|---|---|---|---|---|
| `OrcamentistaManualItemsPanel` | **SIM** | **SIM** | Não | Produto |
| `OrcamentistaAiReviewPanel` | Não (apenas CTA) | Não | Não | Produto |
| `OrcamentistaContextStatePanel` | Não | Filesystem local | Não | Produto (renomear label) |
| `OrcamentistaInternalActionPanel` | Não | Não | Não | Produto |
| `OrcamentistaDocumentsPanel` | Não | Não | **SIM** (buildMock) | Lab |
| `OrcamentistaGuidedIntakePanel` | Não | Não | **SIM** | Lab |
| `OrcamentistaMissingProjectFallbackPanel` | Não | Não | **SIM** | Lab |
| `OrcamentistaPageProcessingPanel` | Não | Não | **SIM** | Lab |
| `OrcamentistaReaderVerifierPanel` | Não | Não | **SIM** | Lab |
| `OrcamentistaHitlPanel` | Não | Não | **SIM** | Lab |
| `OrcamentistaAgentDispatchPanel` | Não | Não | **SIM** | Lab |
| `OrcamentistaConsolidatedPreviewPanel` | Não | Não | **SIM** | Lab |
| `OrcamentistaConsolidationGatePanel` | Não | Não | **SIM** | Lab |
| `OrcamentistaPayloadReviewPanel` | Não | Não | **SIM** | Lab |
| `OrcamentistaRealReaderSandboxPanel` | Não | Não | **SIM** | Lab |
| `OrcamentistaAiPipelinePanel` | Não | Não | **SIM** (mockPipelineSteps) | Lab |
| `OrcamentistaAiPreviewPanel` | Não | Não | **SIM** (mockAiPreview) | Lab |
| `OrcamentistaChat` | Não | Não | Não | Lab |

**Observação:** Os painéis Lab já estão dentro de `<details>` colapsável em `OrcamentistaTab.tsx`.
O estado atual é melhor que o descrito no plano original. A Fase 3/4 apenas extrai o fluxo de produto
para um componente limpo e separa a rota.

---

## 4. Causa raiz dos erros 500/413 (Fase 0.4)

### 4.1 Erros 500 em `/api/orcamentista/pipeline-view`

**Causa:** `createStagingClientFromEnv()` chama `readAndValidateStagingEnv()` que lança `Error`
quando as variáveis de staging (`EVIS_STAGING_PROJECT_REF`, etc.) não estão configuradas no ambiente.

**Fluxo do erro:**
1. `OrcamentistaInternalActionPanel` → `GET /api/orcamentista/pipeline-view?opportunityId=...`
2. Handler chama `createStagingClientFromEnv()`
3. `readAndValidateStagingEnv()` lança quando env não configurada
4. Catch retorna `{ error: 'Internal server error', details: '...' }` com status 500
5. Frontend recebe JSON, checa `json.status` (undefined) ≠ 'not_found' → exibe "Erro ao carregar Pipeline View"

**Status:** O servidor SEMPRE retorna JSON (mesmo em erro). O SyntaxError reportado no plano
provavelmente vinha de uma versão anterior onde o catch não estava configurado.

### 4.2 Erros 500 em `/api/orcamentista/opportunities/:id/analyze`

**Causa anterior:** Snapshot de contexto falhava (FK cross-DB) e o código retornava 500.
**Fix já aplicado (unstaged em `server/routes/orcamentista.ts`):**
- Migrou `opportunity_files` queries para `createMainReadClientFromEnv()` 
- Snapshot falha → apenas adiciona warning, não bloqueia análise

### 4.3 Erro 413 no upload workspace

**Causa:** `POST /api/orcamentista/workspaces/:id/files` tem `limit: '50mb'`.
Se o bodyParser global do Express tem limite menor (padrão 100kb para JSON), PDFs grandes
enviados sem `express.raw` intermediário recebem 413 antes de chegar ao handler.
A rota usa `express.raw` o que deveria sobrescrever — pode ser problema de ordem de middleware.

---

## 5. Próxima ação

**Fase 1:** Commitar as correções pendentes em `server/routes/orcamentista.ts` e corrigir
o handler do `pipeline-view` para retornar status amigável quando staging não configurado.
