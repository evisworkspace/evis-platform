# EVIS — Plano do Orçamentista Mínimo Funcional (MVP)

> **Data:** 2026-05-15 | **Modo:** Somente leitura — nenhum código alterado

---

## 1. Veredito do Estado Atual

| Componente | Estado | Evidência |
|:---|:---|:---|
| Criação de orçamento pré-obra | ✅ FUNCIONAL | `criarOrcamentoParaOportunidade()` → `orcamentos` |
| CRUD de itens manuais | ✅ FUNCIONAL | `criarItemManual/atualizarItemManual/removerItemManual` → `orcamento_itens` |
| Upload/seleção de arquivos | ✅ FUNCIONAL | `useOpportunityFiles` → `opportunity_files` |
| Extração de texto (.txt/.csv/.json/.md) | ✅ FUNCIONAL | `fileTextExtraction.ts` → endpoint `/analyze` |
| Download de arquivos do Storage | ✅ FUNCIONAL | `downloadOpportunityFile()` com limit 10MB |
| Endpoint `/analyze` | ✅ FUNCIONAL | `orcamentista.ts` L152-382 — retorna evidências reais |
| Hook `useAnalyzeOpportunity` | ✅ FUNCIONAL | `POST /api/orcamentista/opportunities/:id/analyze` |
| Snapshot de contexto | ✅ FUNCIONAL | `persistContextSnapshot()` → `orc_context_snapshots` |
| Workspace filesystem | ✅ FUNCIONAL | `workspaces.ts` — criação, listagem, attachments |
| UI — Seções 1-2 (Arquivos + Análise) | ✅ FUNCIONAL | `OrcamentistaContextStatePanel` + `OrcamentistaInternalActionPanel` |
| UI — Seção 7 (Itens oficiais) | ✅ FUNCIONAL | `OrcamentistaManualItemsPanel` |
| UI — Seção 8 (Proposta) | ✅ FUNCIONAL | Link para proposta existente |
| Gemini gerar itens preview | ⚠️ STUB | L306-321: retorna 1 item hardcoded quando AI=true |
| UI — Seções 3-6 (Evidências/Preview/HITL) | ❌ PLACEHOLDER | `StagePlaceholder` sem funcionalidade |
| 12 mocks em `src/lib/orcamentista/` | ❌ MOCK | Dados fabricados, congelados no Lab |
| 13 painéis LAB (colapsados) | ❌ LAB | Dentro de `<details>` — não operam dados reais |
| Prompt real para Gemini | ❌ AUSENTE | Endpoint não monta prompt estruturado |

**Veredito: PRONTO PARA MVP COM 3 AJUSTES** — a infra existe. Faltam: (A) prompt real para Gemini, (B) UI de preview/HITL para itens IA, (C) ação de aprovar→persistir.

---

## 2. Objetivo do Orçamentista MVP

### ENTRA no MVP

1. Seleção de arquivos reais da oportunidade
2. Extração de texto local (formatos já suportados)
3. Envio de contexto extraído para Gemini com prompt estruturado
4. Recebimento de itens sugeridos pela IA (JSON tipado)
5. Exibição em tabela de preview com confiança e origem
6. HITL manual: aprovar / editar / descartar cada item
7. Persistência dos itens aprovados via `criarItemManual()` existente
8. Totalização e link para gerar proposta

### NÃO ENTRA no MVP

- PDF parsing (manter como futuro)
- DWG/plantas
- Agentes especialistas (12 mocks congelados)
- RAG / pgvector
- Fine-tuning
- Composições SINAPI completas
- Novos painéis ou telas
- Portal do cliente
- Novas tabelas ou migrations
- Automações avançadas

---

## 3. Fluxo Operacional MVP

```
OPORTUNIDADE (existente)
  │
  ├── 1. Arquivos reais listados via opportunity_files       ✅ EXISTE
  │
  ├── 2. Selecionar arquivos + clicar "Analisar"             ✅ EXISTE
  │      └── POST /api/orcamentista/opportunities/:id/analyze
  │          └── Download do Storage + Extração de texto      ✅ EXISTE
  │          └── Montar prompt + Enviar para Gemini           🔧 IMPLEMENTAR
  │          └── Parsear resposta JSON → AnalyzePreviewItem[] 🔧 IMPLEMENTAR
  │          └── Retornar items[] ao frontend                 ✅ EXISTE (estrutura)
  │
  ├── 3. UI: Tabela de Preview IA                            🔧 IMPLEMENTAR
  │      └── Cada item com: descrição, unidade, qtd, valor, confiança, origem
  │      └── Ações por item: ✅ Aprovar | ✏️ Editar | ❌ Descartar
  │
  ├── 4. HITL Manual                                          🔧 IMPLEMENTAR
  │      └── Item aprovado/editado → criarItemManual()        ✅ EXISTE
  │      └── Item descartado → removido do preview
  │      └── Todos aprovados → preview limpo
  │
  ├── 5. Itens oficiais (orcamento_itens)                    ✅ EXISTE
  │      └── OrcamentistaManualItemsPanel já exibe
  │
  └── 6. Proposta                                            ✅ EXISTE
         └── Gerar proposta via OportunidadeDetalhePage
```

---

## 4. Chat vs Cockpit

| Área | Tipo | Decisão |
|:---|:---|:---|
| Seleção de arquivos | **Cockpit** — workflow guiado | Seção 1 existente |
| Botão "Analisar" | **Cockpit** — ação explícita | Seção 2 existente |
| Preview de itens IA | **Cockpit** — tabela de validação | Substituir `StagePlaceholder` das seções 3-4 |
| Aprovar/Editar/Descartar | **Cockpit** — HITL manual | Substituir `StagePlaceholder` das seções 5-6 |
| Itens oficiais | **Cockpit** — tabela real | Seção 7 existente |
| Proposta | **Cockpit** — link/ação | Seção 8 existente |
| Chat Gemini livre | **Chat** — auxiliar secundário | Permanece no Lab colapsado |
| Mocks/simulações | **Lab** — não faz parte do fluxo | Permanece colapsado |

**Regra:** O chat não substitui o cockpit. O cockpit é a jornada principal.

---

## 5. Arquivos que Precisam ser Alterados

| Arquivo | Alteração | Risco | Observação |
|:---|:---|:---|:---|
| `server/routes/orcamentista.ts` | Substituir items hardcoded (L306-321) por chamada real ao Gemini com prompt estruturado | Médio | Função nova isolada, sem quebrar fluxo existente |
| `src/pages/Oportunidade/OrcamentistaTab.tsx` | Substituir `StagePlaceholder` das seções 3-6 por painel de preview IA real | Baixo | Mesma aba, mesma hierarquia |
| `src/hooks/useAnalyzeOpportunity.ts` | Sem alteração na interface — já retorna `items[]` | Zero | Já preparado |
| `src/hooks/useOportunidadeOrcamento.ts` | Sem alteração — `criarItemManual()` já existe | Zero | Reutilizar |

**Arquivo novo provável:**

| Arquivo | Função |
|:---|:---|
| `server/services/geminiOrcamentista.ts` | Montar prompt + chamar Gemini + parsear resposta JSON |
| `src/pages/Oportunidade/OrcamentistaAiReviewPanel.tsx` | Tabela de preview IA com ações de aprovar/editar/descartar |

---

## 6. Arquivos que NÃO Devem ser Alterados

| Arquivo/Diretório | Motivo |
|:---|:---|
| Todos os `*Mock.ts` (12 arquivos) | Congelados — Lab |
| `server/agents/orchestrator.ts` | Diário de Obra — domínio separado |
| `server/agents/servicos.ts`, `equipes.ts`, `notas.ts` | Subagentes do Diário |
| `server/routes/diario.ts` | Diário de Obra |
| `src/pages/OportunidadeDetalhePage.tsx` | Funcional — conversão/proposta |
| `src/pages/PropostaPage.tsx` | Funcional |
| `src/hooks/useOrcamento.ts` | Legado de Obra |
| `src/hooks/useOportunidades.ts` | Funcional |
| `src/hooks/usePropostas.ts` | Funcional |
| Todos os painéis Lab (13 em `src/pages/Oportunidade/`) | Congelados |

---

## 7. Contrato de Dados Esperado

```typescript
/** Item retornado pela IA para preview/HITL */
type OrcamentistaPreviewItem = {
  descricao: string;           // Obrigatório
  unidade: string;             // Ex: m², un, vb, kg
  quantidade: number;          // Estimativa da IA
  valor_unitario: number;      // Estimativa da IA
  valor_total: number;         // quantidade * valor_unitario
  categoria: string | null;    // Ex: "Estrutural", "Hidráulica"
  codigo: string | null;       // Código sugerido ou null
  origem: 'ia_gemini';         // Fixo no MVP
  confianca: number;           // 0.0–1.0 retornado pela IA
  evidencia: string | null;    // Trecho do texto que fundamenta o item
  observacoes: string | null;  // Notas da IA
};
```

**Resposta do Gemini esperada (JSON schema no prompt):**

```json
{
  "items": [
    {
      "descricao": "Demolição de alvenaria",
      "unidade": "m²",
      "quantidade": 120,
      "valor_unitario": 35,
      "categoria": "Demolição",
      "confianca": 0.82,
      "evidencia": "Memorial descritivo, p.3: demolir paredes internas",
      "observacoes": null
    }
  ],
  "resumo": "Identificados 8 itens a partir do memorial descritivo.",
  "alertas": ["Valores unitários são estimativas. Validar com SINAPI."]
}
```

---

## 8. HITL — Regras de Decisão

| Confiança | Ação default | UI |
|:---|:---|:---|
| ≥ 0.85 | Pré-selecionar como "Aprovar" | Badge verde |
| 0.60 – 0.84 | Sugerir "Revisar" | Badge amarelo |
| < 0.60 | Sugerir "Descartar" | Badge vermelho |

**Ações do usuário:**

| Ação | Resultado |
|:---|:---|
| ✅ Aprovar | `criarItemManual()` com `origem: 'ia_gemini'` |
| ✏️ Editar | Abre campos inline → usuário ajusta → aprovar |
| ❌ Descartar | Remove do preview — não persiste |
| 🔄 Re-analisar | Novo POST `/analyze` — substitui preview anterior |

**Regra:** Nenhum item vai para `orcamento_itens` sem ação explícita do usuário.

---

## 9. Persistência

| Aspecto | Detalhe |
|:---|:---|
| Tabela destino | `orcamento_itens` (existente) |
| Função | `criarItemManual(payload)` existente em `useOportunidadeOrcamento` |
| Campos mínimos | `orcamento_id`, `descricao`, `unidade`, `quantidade`, `valor_unitario`, `valor_total`, `origem` |
| Campo `origem` | `'ia_gemini'` (novo valor — campo é texto livre, sem constraint) |
| Relação | Via `orcamento_id` do orçamento vinculado à oportunidade |
| Duplicidade | Verificar descrição+unidade+quantidade antes de inserir (warning, não bloqueio) |
| Rastreabilidade | `observacoes` do item pode conter referência à evidência |
| Migration | **Nenhuma necessária** — `orcamento_itens` já aceita todos os campos |

---

## 10. UX Mínima Necessária

```
┌──────────────────────────────────────────────────────────┐
│ ORÇAMENTISTA IA — [Título da Oportunidade]               │
│                                                          │
│ [Orçamento: VINCULADO] [Itens: 5] [Proposta: RASCUNHO]  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ § 1. ARQUIVOS DA OPORTUNIDADE                    ✅ EXISTE│
│   [✓] Memorial.txt  [✓] Especificações.csv               │
│                                                          │
│ § 2. DIAGNÓSTICO E ANÁLISE                       ✅ EXISTE│
│   [Analisar arquivos selecionados]                       │
│                                                          │
│ § 3-4. PREVIEW IA                               🔧 NOVO │
│   ┌────────┬─────┬─────┬────────┬──────┬───────┐        │
│   │Descrição│Unid │Qtd  │V.Unit  │Conf. │Ação   │        │
│   │Demolição│m²   │120  │R$35    │0.82  │✅❌✏️ │        │
│   │Alvenari.│m²   │200  │R$85    │0.91  │✅❌✏️ │        │
│   │Elétrica │vb   │1    │R$12000 │0.55  │✅❌✏️ │        │
│   └────────┴─────┴─────┴────────┴──────┴───────┘        │
│   [Aprovar todos selecionados]                           │
│                                                          │
│ § 7. ITENS OFICIAIS (orcamento_itens)            ✅ EXISTE│
│   Tabela com CRUD manual + itens aprovados da IA         │
│                                                          │
│ § 8. PROPOSTA                                    ✅ EXISTE│
│   [Abrir proposta →]                                     │
│                                                          │
│ ▼ LABORATÓRIO AVANÇADO (colapsado)               ✅ EXISTE│
│   13 painéis mock/lab                                    │
└──────────────────────────────────────────────────────────┘
```

**Nota:** Seções 5-6 (Pendências HITL e Aprovação) são absorvidas pelo painel de Preview IA (seções 3-4 unificadas) — o HITL acontece inline na própria tabela.

---

## 11. O que Fica Fora do MVP

| Item | Motivo |
|:---|:---|
| PDF parsing | Complexo — manter como Fase 2 |
| DWG / plantas | Fora do escopo |
| Quantitativos automáticos complexos | Requer agentes especializados |
| Composições SINAPI completas | Requer base de dados externa |
| Fine-tuning | Sem dados suficientes |
| RAG / pgvector | Requer infra adicional |
| Novos agentes especialistas | 12 mocks congelados |
| Portal do cliente | Fora do fluxo |
| Novas tabelas / migrations | Reutilizar `orcamento_itens` |
| Automações avançadas | Pós-MVP |
| Chat como interface principal | Chat é auxiliar no Lab |
| Persistência de evidências em tabela dedicada | Melhoria futura (orc_evidences) |
| Persistência de decisões HITL em tabela dedicada | Melhoria futura (orc_hitl_decisions) |

---

## 12. Plano de Implementação

```
MICRO-ETAPA 1 — Serviço Gemini Orçamentista (backend)
  → Criar server/services/geminiOrcamentista.ts
  → Montar prompt estruturado com contexto extraído
  → Definir JSON schema esperado na resposta
  → Parsear resposta com fallback seguro
  → Retornar OrcamentistaPreviewItem[]
  → Testes manuais com texto de exemplo

MICRO-ETAPA 2 — Conectar no endpoint /analyze (backend)
  → Substituir items hardcoded (L306-321) pela chamada real
  → Manter flag EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE
  → Se flag=false → items=[] (comportamento atual)
  → Se flag=true → chamar geminiOrcamentista → items reais
  → Snapshot continua sendo gravado

MICRO-ETAPA 3 — Painel de Preview IA (frontend)
  → Criar OrcamentistaAiReviewPanel.tsx
  → Receber items[] do resultado da análise
  → Tabela com colunas: descrição, unidade, qtd, valor, confiança, ação
  → Badges de confiança (verde/amarelo/vermelho)
  → Checkbox de seleção por item
  → Edição inline (campos editáveis)
  → Botão "Aprovar selecionados"

MICRO-ETAPA 4 — Conectar HITL → Persistência (frontend)
  → Ao aprovar: chamar criarItemManual() para cada item selecionado
  → origem = 'ia_gemini'
  → Remover item aprovado do preview
  → Invalidar cache de itens
  → Feedback de sucesso/erro

MICRO-ETAPA 5 — Integrar no OrcamentistaTab (frontend)
  → Substituir StagePlaceholder das seções 3-6
  → Inserir OrcamentistaAiReviewPanel
  → Manter seção 7 (itens oficiais) e seção 8 (proposta)
  → Lab colapsado inalterado

MICRO-ETAPA 6 — Validação ponta a ponta
  → Testar: upload arquivo → analisar → preview → aprovar → item oficial → proposta
  → Documentar resultado
  → Build + typecheck passando
```

---

## 13. Critério de Sucesso

O Orçamentista MVP é considerado **FUNCIONAL** quando:

- [ ] Selecionar arquivos reais da oportunidade
- [ ] Clicar "Analisar" e receber itens da IA (com EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE=true)
- [ ] Ver itens em tabela de preview com confiança e evidência
- [ ] Aprovar/editar/descartar itens individualmente
- [ ] Itens aprovados aparecem em `orcamento_itens` com `origem: 'ia_gemini'`
- [ ] Totalização atualizada
- [ ] Proposta pode ser gerada a partir dos itens (existente)
- [ ] Build passando
- [ ] Typecheck passando
- [ ] Mocks/Lab continuam congelados e colapsados
- [ ] Nenhuma regressão no fluxo canônico

---

## 14. Riscos

| # | Risco | Classificação | Mitigação |
|:---|:---|:---|:---|
| R1 | Gemini retornar JSON mal-formado | P1 | Parser com fallback + try/catch + warning ao usuário |
| R2 | Gemini retornar valores absurdos | P2 | Badge de confiança + HITL obrigatório |
| R3 | Rate limit do Gemini | P2 | Flag de controle + cache de resultado por análise |
| R4 | Custo de API Gemini | P2 | Limitar tamanho do prompt (MAX_EXTRACTED_CHARS=20000 já existe) |
| R5 | Duplicidade ao aprovar mesmos itens | P3 | Warning visual (não bloqueio) |
| R6 | Campo `origem` não aceitar 'ia_gemini' | P3 | Campo text livre — sem constraint |

---

## 15. Próximo Passo

### Recomendação: **Implementar direto**

O plano tem 6 micro-etapas bem definidas. A infra existe. Os riscos são gerenciáveis. Não é necessário blueprint UX adicional — a estrutura da aba já está definida com seções numeradas.

**Ordem:**
1. Micro-etapa 1 (backend: serviço Gemini)
2. Micro-etapa 2 (backend: conectar no endpoint)
3. Micro-etapa 3 (frontend: painel preview)
4. Micro-etapa 4 (frontend: HITL → persistência)
5. Micro-etapa 5 (frontend: integrar na aba)
6. Micro-etapa 6 (validação)

**Estimativa:** 2-3 sessões de trabalho focado.

---

> **Nenhum arquivo funcional foi alterado. Nenhum commit realizado.**
