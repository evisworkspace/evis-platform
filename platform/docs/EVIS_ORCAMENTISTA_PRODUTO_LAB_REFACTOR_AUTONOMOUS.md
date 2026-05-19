# EVIS ORÇAMENTISTA — REFACTOR PRODUTO vs LABORATÓRIO

> **Documento de execução autônoma.** Self-contained. Quem executa não precisa ter visto a conversa que originou este plano.

---

## 0. Contexto e Diagnóstico

### O que existe hoje

O módulo Orçamentista (rota `/oportunidades/:id/orcamentista`, componente `src/pages/Oportunidade/OrcamentistaTab.tsx`) renderiza **19 painéis lado a lado** em uma única tela. Lista completa:

```
OrcamentistaManualItemsPanel
OrcamentistaAiReviewPanel
OrcamentistaAiPipelinePanel
OrcamentistaAiPreviewPanel
OrcamentistaDocumentsPanel
OrcamentistaPageProcessingPanel
OrcamentistaReaderVerifierPanel
OrcamentistaHitlPanel
OrcamentistaAgentDispatchPanel
OrcamentistaConsolidatedPreviewPanel
OrcamentistaConsolidationGatePanel
OrcamentistaPayloadReviewPanel
OrcamentistaRealReaderSandboxPanel
OrcamentistaMissingProjectFallbackPanel
OrcamentistaGuidedIntakePanel
OrcamentistaInternalActionPanel
OrcamentistaContextStatePanel
OrcamentistaChat (importado do pai)
```

A maioria desses painéis exibe selos `MOCK / LAB — NÃO GRAVA DADOS`, `MOCK · SIMULAÇÃO`, `FASE 3B · MANUAL MODEL RUN READY`, `simulated_only = true`, payloads JSON brutos, scores de confiança, IDs de agente, IDs de evidência, etc.

Apenas **um** painel grava no banco real (`orcamento_itens`): `OrcamentistaManualItemsPanel`. Todo o restante é R&D visualmente exposto.

### Por que isso é problema

O comentário das linhas 29-45 do próprio `OrcamentistaTab.tsx` já declara o contrato pretendido:

```
- "OFICIAL" = gravado em orcamento_itens no banco.
- "PRÉVIA IA" = staging, nunca consolidado automaticamente.
- Mocks não aparecem na jornada principal.
- Chat fica no Lab colapsado.
```

Esse contrato **não está cumprido**. Mocks aparecem em toda a tela. Chat não está colapsado. A jornada principal está afogada em painéis de laboratório.

Sintomas observados em uso real:
- Sem botão "Voltar ao HUB" — usuário fica preso na rota
- Erros 500 em série nas APIs `/api/orcamentista/*` e `/api/orcamentis...` retornando HTML (`<!DOCTYPE...`) onde o frontend espera JSON
- Erro 413 (Payload Too Large) no POST `/api/orcamentista/workspaces/UI_MANUAL_RUN_workspace/...`
- Resíduo de teste (`UI_MANUAL_RUN`, `Item Teste Manual`, `manual_test`) contamina superfície do produto
- Linguagem de backend exposta ("Estado contextual real", "ESCRITA OFICIAL BLOQUEADA", "Workspace local ainda não existe", "blocked_by_safety_gate")

### Decisão arquitetural

Separar fisicamente duas superfícies:

| Superfície | Rota | Conteúdo |
|---|---|---|
| **Modo Produto** | `/oportunidades/:id/orcamentista` | Espartana. Só dados reais do banco. Sem JSON, sem score, sem mock |
| **Modo Laboratório** | `/oportunidades/:id/orcamentista/lab` | Tudo que existe hoje. Preservado 100%, apenas movido |

A entrada no Laboratório fica em um link discreto no rodapé do Modo Produto (rótulo: "Visão técnica de engenharia" ou "Diagnóstico"). Nunca CTA principal.

**Princípio inegociável:** nada do que foi construído é descartado. Tudo é preservado em `/lab`. A refatoração é aditiva e reorganizadora, não destrutiva.

---

## 1. Pré-requisitos de Leitura (Obrigatório)

Antes de qualquer mutação, ler na ordem:

1. `CLAUDE.md` (raiz) — regras inegociáveis do projeto
2. `platform/docs/CODING_STANDARDS.md` — padrão completo de código
3. `src/types.ts` — todos os tipos. Confirmar que `OrcamentoItem.codigo` é o nome real do campo (não `codigo_referencia`)
4. `src/lib/api.ts` — confirmar assinatura do `sbFetch`
5. `src/AppContext.tsx` — confirmar shape do `config` retornado por `useAppContext()`
6. `src/pages/Oportunidade/OrcamentistaTab.tsx` — ler **inteiro**; este é o ponto de mutação principal
7. `src/App.tsx` linhas 535-542 — rotas atuais do Orçamentista
8. `src/hooks/useOportunidadeOrcamento.ts` — hook que serve dados oficiais
9. `server/routes/orcamentista.ts` — endpoints que estão retornando 500

Não pular nenhum desses arquivos. Se algum não existir, **parar e reportar**, não inferir.

---

## 2. Fase 0 — Diagnóstico Técnico Sem Mutação

Objetivo: confirmar o terreno antes de mexer. **Nenhum arquivo é alterado nesta fase.**

### 0.1 Mapeamento de rotas

Confirmar via `Grep` no diretório `src/`:
- Lista de todos os arquivos que importam `OrcamentistaTab`
- Lista de todos os componentes que recebem `<Link to="/oportunidades/.../orcamentista...">` ou similar
- Existe alguma navegação que aponta para o Orçamentista a partir do HUB?

### 0.2 Inventário de painéis por categoria

Para cada um dos 19 painéis listados em §0, abrir e classificar:

| Painel | Grava em banco real? | Lê de banco real? | Exibe mock? |
|---|---|---|---|
| OrcamentistaManualItemsPanel | sim | sim | não |
| ... (preencher todos) | | | |

Esse inventário define o que vai para **Produto** (grava ou lê real, sem mock) e o que vai para **Lab** (qualquer mock visível).

### 0.3 Inventário de oportunidades de teste no banco

Via `sbFetch` ou query SQL read-only no Supabase:
- Listar `oportunidades` com nome contendo `TEST`, `MANUAL_RUN`, `UI_MANUAL_RUN`, `Teste`, `Manual Run Opportunity`
- Listar `orcamento_itens` com `descricao = 'Item Teste Manual'` ou `origem = 'manual_test'`
- Listar arquivos em `opportunity_files` vinculados a essas oportunidades

**Gerar arquivo:** `platform/docs/EVIS_ORCAMENTISTA_TEST_DATA_INVENTORY.md` com a lista exata. Não apagar nada nesta fase.

### 0.4 Investigação dos erros 500/413

- Capturar a URL exata de pelo menos 3 das requisições 500
- Abrir `server/routes/orcamentista.ts` e localizar os handlers correspondentes
- Identificar a causa: stack trace, erro de DB, env var faltando, etc.
- Confirmar se o frontend está enviando payload muito grande (causa do 413) ou se o servidor tem limite mal configurado
- **Documentar a causa raiz** antes de tentar corrigir

**Checkpoint Fase 0:** documento `EVIS_ORCAMENTISTA_TEST_DATA_INVENTORY.md` criado + causa raiz dos 500/413 identificada por escrito.

---

## 3. Fase 1 — Corrigir Erros de API (causa raiz)

Não construir UX em cima de API quebrada. Esta fase precede a refatoração visual.

### 1.1 Erros 500 nas rotas `/api/orcamentista/*`

Para cada endpoint identificado na Fase 0.4:
- Localizar o handler em `server/routes/orcamentista.ts`
- Garantir que sempre retorna JSON, mesmo em erro (`res.status(500).json({ error: '...' })`, nunca HTML)
- Validar que o middleware de erro não substitui o body por página HTML padrão do framework

**Anti-padrão a evitar:** silenciar o erro retornando 200 com payload vazio. Corrigir a **causa**, não o sintoma.

### 1.2 Erro 413 no POST `/api/orcamentista/workspaces/.../...`

Investigar:
- Tamanho real do payload sendo enviado pelo frontend
- Limite configurado no servidor (body-parser, express raw limit, multer, etc.)

Decisão:
- Se o payload é legitimamente grande (PDFs encoded em base64, por exemplo): **mudar o protocolo** para upload via stream / multipart, não aumentar limite cegamente
- Se o payload está inchado por dados desnecessários: enxugar no frontend

### 1.3 Tratamento de erro no frontend

Localizar `fetchPipelineView` em `OrcamentistaInternalActionPanel.tsx` linha 75 (apontada pelo stack trace). Garantir que:
- Não chama `response.json()` sem antes checar `response.ok`
- Em erro, exibe mensagem humanizada, não `SyntaxError: Failed to execute 'json' on 'Response'`

**Checkpoint Fase 1:** abrir o app, recarregar, console sem 500/413/SyntaxError. Se algum permanecer, registrar em `EVIS_ORCAMENTISTA_API_RESIDUAL_ERRORS.md` antes de seguir.

---

## 4. Fase 2 — Limpeza de Resíduo de Teste

Esta fase é **destrutiva no banco**. Requer confirmação humana explícita antes de executar.

### 4.1 Script de limpeza (criar, não executar)

Criar `platform/docs/sql_proposals/ORCAMENTISTA_CLEANUP_TEST_DATA.sql` com:
- `DELETE FROM orcamento_itens WHERE origem IN ('manual_test', 'consolidated_preview_mock') OR descricao = 'Item Teste Manual';`
- `DELETE FROM opportunity_files WHERE opportunity_id IN (SELECT id FROM oportunidades WHERE nome LIKE '%UI_MANUAL_RUN%' OR nome LIKE '%Manual Run Opportunity%' OR nome LIKE '%TEST%');`
- `DELETE FROM oportunidades WHERE nome LIKE '%UI_MANUAL_RUN%' OR nome LIKE '%Manual Run Opportunity%' OR nome LIKE '%TEST%';`
- (Ajustar nomes de tabelas e colunas conforme inventário real da Fase 0.3)

Cada `DELETE` precedido de `SELECT` espelho comentado para auditoria.

### 4.2 Backup obrigatório

Antes de executar, exportar via `pg_dump` ou via export Supabase as linhas a serem deletadas, salvo em `platform/docs/sql_proposals/backups/cleanup_YYYYMMDD_HHMM.sql`.

### 4.3 Execução

**Parar e perguntar ao humano operador antes de rodar.** Mostrar:
- Quantidade exata de linhas que serão deletadas (de cada tabela)
- Confirmação de que backup foi feito
- Aguardar `confirmo` explícito

**Checkpoint Fase 2:** banco sem resíduo de teste. App ainda funciona. Abrir lista de oportunidades — só obras reais aparecem.

---

## 5. Fase 3 — Modo Produto (aditivo, não destrutivo)

Esta fase **não toca** em nenhum dos 19 painéis existentes. Apenas adiciona código novo.

### 5.1 Criar componente `OrcamentistaProductView.tsx`

Caminho: `src/pages/Oportunidade/OrcamentistaProductView.tsx`

Responsabilidade: **renderizar a jornada espartana do operador humano**.

Estrutura visual (do topo para baixo):

```
[← Voltar ao HUB]                    [Diagnóstico técnico ↗]

ORÇAMENTO — <nome da obra>

Status: [Aguardando memorial | Em análise | Pronto para revisar | Aprovado | Proposta gerada]

┌─ Memorial descritivo ──────────────────────────────┐
│ (Drag & drop ou botão "Enviar arquivo")           │
│ ou lista de arquivos já enviados (nome + tamanho) │
└────────────────────────────────────────────────────┘

┌─ Itens do orçamento ───────────────────────────────┐
│ (Lista de orcamento_itens reais do banco)         │
│ Código | Descrição | Un | Qtd | Valor | Total     │
│ ...                                                │
│ TOTAL: R$ ...                                      │
└────────────────────────────────────────────────────┘

[Adicionar item manual]  [Aprovar tudo]  [Gerar proposta]
```

**Regras absolutas do Modo Produto:**

| Proibido | Permitido |
|---|---|
| Selo `MOCK`, `LAB`, `SIMULAÇÃO`, `SANDBOX`, `FASE 2J`, etc. | Status humano: "Aguardando", "Em análise", "Pronto" |
| JSON bruto na tela | Tabela limpa com colunas nomeadas em português |
| Score de confiança numérico | Ícone discreto de "atenção" se confiança < limiar |
| ID de agente, ID de evidência, ID de finding | Nome legível: "Análise civil", "Análise estrutural" |
| Termos: `dispatch`, `payload`, `safety gate`, `consolidated_preview`, `staging` | Termos: "enviar", "revisar", "aprovar", "gerar" |
| Stack trace, erro técnico cru | "Não consegui processar este arquivo. Tente novamente." |

### 5.2 Hooks consumidos

Apenas hooks que leem dados **reais** do banco:
- `useOportunidadeOrcamento(opportunityId, config)` — orçamento oficial
- `useOpportunityFiles(opportunityId, config)` — arquivos reais

**Não importar** os mocks: `buildMockDocumentIntakeFiles`, `mockPipelineSteps`, `mockAiPreview`, nem nenhum lib de `src/lib/orcamentista/mock*`.

### 5.3 HITL no Modo Produto

Quando um item de orçamento exigir revisão humana real (não simulada), exibir card simples:

```
┌─ Precisa da sua aprovação ─────────────────────────┐
│ Item: Pintura acrílica interna em paredes          │
│ A IA não conseguiu confirmar a quantidade.         │
│ [Confirmar como está]  [Editar]  [Remover]         │
└────────────────────────────────────────────────────┘
```

Sem JSON, sem score, sem rastreabilidade técnica visível. A rastreabilidade fica no banco e no Modo Lab.

### 5.4 Botão "Voltar ao HUB"

Header fixo no topo da página, sempre visível. Componente reaproveitável `BackToHub` se ainda não existir. Usar `<Link to="/">` (ou rota correta do HUB — confirmar via `App.tsx`).

### 5.5 Link discreto para o Laboratório

Rodapé da página, alinhado à direita, fonte pequena, cor `text-white/40`:

```
Diagnóstico técnico ↗
```

`href={`/oportunidades/${id}/orcamentista/lab`}`.

**Checkpoint Fase 3:** componente `OrcamentistaProductView` existe, compila, mas **ainda não está roteado**. Próxima fase faz o switch.

---

## 6. Fase 4 — Switch de Rota (a mudança visível)

Esta fase é **o momento de virada**. Mantém-se reversível em 1 commit.

### 6.1 Renomear rota atual para `/lab`

Em `src/App.tsx` linha 541:

```typescript
// ANTES
<Route path="/oportunidades/:id/orcamentista" element={<OrcamentistaTab />} />

// DEPOIS
<Route path="/oportunidades/:id/orcamentista" element={<OrcamentistaProductView />} />
<Route path="/oportunidades/:id/orcamentista/lab" element={<OrcamentistaTab />} />
```

`OrcamentistaTab` (com os 19 painéis) **continua existindo intacto** — apenas migra de URL.

### 6.2 Header do Modo Lab

Adicionar no topo do `OrcamentistaTab.tsx`:

```
[← Voltar ao Orçamento]      MODO LABORATÓRIO TÉCNICO
```

Para deixar claro a quem entra que está em superfície de pesquisa, não produto.

### 6.3 Limpeza de imports e mocks vazando

Conferir se nenhum import de mock (`buildMockDocumentIntakeFiles`, `mockPipelineSteps`, `mockAiPreview`) aparece no `OrcamentistaProductView`. Esses imports só podem viver dentro de `OrcamentistaTab` e seus painéis filhos.

**Checkpoint Fase 4:** abrir `/oportunidades/<id real>/orcamentista` em browser — vê-se a tela espartana, sem mocks. Clicar em "Diagnóstico técnico" — vê-se a tela atual com os 19 painéis preservados.

---

## 7. Fase 5 — Validação Humana Operacional

Esta fase **não é automatizável**. Requer um humano usando o app.

### 7.1 Checklist do operador (executar com obra real)

Numa obra real de baixo risco:

- [ ] Consigo voltar ao HUB de qualquer ponto do Orçamentista em 1 clique
- [ ] Subi um memorial real (PDF de obra de verdade) sem erro
- [ ] Consigo entender em < 5 segundos o estado do orçamento (status visível)
- [ ] Itens identificados pela IA aparecem em tabela legível, sem JSON
- [ ] Quando precisei aprovar algo, a pergunta foi humana, não técnica
- [ ] Gerei a proposta no fim e ela faz sentido
- [ ] Não vi nenhum selo `MOCK`, `LAB`, `SIMULAÇÃO`, `FASE X`, `simulated_only`
- [ ] Não vi nenhum erro vermelho no console (F12)
- [ ] O link "Diagnóstico técnico" me leva ao Modo Lab e funciona como antes
- [ ] Volto do Lab para o Produto sem perder estado

### 7.2 Registro de fricções

Criar `platform/docs/EVIS_ORCAMENTISTA_HUMAN_USAGE_LOG_01.md` com:
- Data de uso
- Obra usada (anonimizada se cliente)
- Lista de fricções observadas
- Sugestões de simplificação adicional

Esse documento alimenta a próxima iteração.

**Checkpoint Fase 5:** checklist completo, log de uso registrado.

---

## 8. Hard Rules — NUNCA fazer

1. **Nunca deletar** `OrcamentistaTab.tsx` nem nenhum dos 19 painéis. Eles são preservados em `/lab`.
2. **Nunca expor selos de fase, mock ou sandbox** no Modo Produto.
3. **Nunca usar `fetch` direto** — sempre `sbFetch` de `src/lib/api.ts`.
4. **Nunca usar campo `codigo_referencia`** — o nome correto é `codigo` em `OrcamentoItem`.
5. **Nunca obter config via props manuais** — sempre `useAppContext()`.
6. **Nunca silenciar erro 500 com try/catch vazio.** Investigar causa.
7. **Nunca executar DELETE em produção** sem backup explícito e confirmação humana.
8. **Nunca aumentar limite de body sem entender o motivo** do payload estar grande.
9. **Nunca importar `mock*` ou `buildMock*`** no `OrcamentistaProductView` ou em qualquer componente da jornada de produto.
10. **Nunca traduzir termos técnicos manualmente no JSX** — extrair para função/constante se aparecer em > 2 lugares.

---

## 9. Critérios de Sucesso da Refatoração Completa

Aceitação só com **todos** os itens abaixo verdadeiros:

- [ ] `/oportunidades/:id/orcamentista` exibe tela espartana sem nenhum mock
- [ ] `/oportunidades/:id/orcamentista/lab` exibe todos os 19 painéis atuais, sem perda de funcionalidade
- [ ] Console do navegador limpo (zero 500, zero 413, zero SyntaxError) em fluxo padrão
- [ ] Banco limpo de resíduo de teste (UI_MANUAL_RUN, Item Teste Manual, etc.)
- [ ] Botão "Voltar ao HUB" presente em toda página interna do Orçamentista
- [ ] Operador humano (você) completou checklist da Fase 5.1 com obra real
- [ ] Log de fricção da Fase 5.2 gerado
- [ ] Build (`npm run build` ou equivalente) passa sem erro
- [ ] Typecheck passa sem erro
- [ ] Nenhum painel do Lab foi deletado nem teve sua lógica interna modificada

---

## 10. Rollback

Cada fase é commit separado. Para reverter:

| Reverter | Comando |
|---|---|
| Fase 4 (rota) | `git revert <commit-hash-da-fase-4>` |
| Fase 3 (componente novo) | Manter o componente; apenas reverter Fase 4. O componente novo não é roteado, então é inerte. |
| Fase 2 (limpeza banco) | Restaurar do backup `platform/docs/sql_proposals/backups/cleanup_YYYYMMDD_HHMM.sql` |
| Fase 1 (API) | `git revert <commit-hash-da-fase-1>` |

Banco é o único ponto irreversível. Por isso a Fase 2 exige backup e confirmação humana antes da execução.

---

## 11. Ordem de Execução Recomendada

```
Fase 0 (diagnóstico)
  ↓
Fase 1 (API errors — corrigir causa raiz)
  ↓
Fase 3 (criar Modo Produto — aditivo, seguro)
  ↓
Fase 4 (switch de rota — momento de virada)
  ↓
Fase 5 (validação humana com obra real)
  ↓
Fase 2 (limpeza de banco — só depois que tudo está validado e há backup)
```

**Atenção:** Fase 2 vai por último de propósito. Não apagar dados antes de provar que o sistema funciona com dados reais. Se algo der errado nas fases 3-5, ainda temos os dados de teste como referência.

---

## 12. O que NÃO está no escopo deste documento

Para evitar inflação de escopo, **fica explicitamente fora**:

- RAG / embeddings
- MCP server
- Agentes autônomos novos
- OCR avançado
- Onboarding de novo usuário
- Linguagem visual unificada com outros módulos (HUB, Diário, etc.) — virá em refactor separado
- Internacionalização
- Autenticação / RLS / rate-limit
- Métricas / observabilidade

Este documento trata exclusivamente da separação Produto/Lab, correção de API e limpeza de resíduo.

---

## 13. Encerramento

Quando todas as fases estiverem completas e o critério §9 estiver verde, criar:

`platform/docs/EVIS_ORCAMENTISTA_PRODUTO_LAB_REFACTOR_EXECUTION_REPORT.md`

Com:
- Data de início e fim
- Commits criados por fase
- Resultado do checklist §7.1
- Fricções residuais registradas
- Próximo passo recomendado
