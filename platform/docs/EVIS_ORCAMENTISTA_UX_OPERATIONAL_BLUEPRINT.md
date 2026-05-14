# EVIS — UX/Layout Operacional do Orçamentista IA (Blueprint)

> **Data:** 2026-05-15 | **Etapa:** 6B  
> **Modo:** Somente leitura — nenhum arquivo funcional alterado  
> **Base:** `EVIS_ORCAMENTISTA_MVP_PLAN.md`, `OrcamentistaTab.tsx` (542 linhas, 8 seções + Lab)

---

## 1. Veredito UX Atual

### PARCIALMENTE CLARA — orientada demais a Lab e a etapas futuras

**Pontos positivos:**
- Seções numeradas 1–8 criam sequência lógica
- Lab colapsado em `<details>` — decisão correta
- StatusPills no cabeçalho (Orçamento, Itens, Proposta, Workspace) — úteis
- Itens manuais (seção 7) são funcionais e claros
- Proposta (seção 8) tem link direto

**Problemas:**
- **4 seções são `StagePlaceholder`** (3, 4, 5, 6) — o usuário vê 4 cartões amarelos com "EM CONSTRUÇÃO" antes de chegar aos itens reais. Isso gera sensação de produto inacabado.
- **Seção 2 (Análise)** é um painel técnico com métricas de pipeline em roxo. Parece ferramenta de dev, não ação do gestor.
- **Lab colapsado** tem 13 painéis internos — correto, mas o texto "Abrir laboratório" pode atrair cliques curiosos que confundem.
- **Chat** está dentro do Lab — decisão correta, mas invisível demais se o usuário quiser suporte da IA.
- **Seção 1 (Arquivos)** mistura arquivos da oportunidade com estado do workspace IA, sem separação visual clara entre "entrada" e "diagnóstico interno".

**Impacto:** Um gestor de obra que abrir a aba verá: cabeçalho → arquivos → painel técnico roxo → 4 cartões amarelos → tabela de itens. Os cartões amarelos **matam a credibilidade** antes do usuário chegar à parte funcional.

---

## 2. Princípio de Experiência

> **"O Orçamentista é um cockpit operacional com assistente auxiliar, não um chat genérico."**

### Como isso se traduz na tela:

1. **Ação principal é visível** — o botão "Analisar com IA" deve ser o CTA dominante quando há arquivos.
2. **Resultado da IA aparece como tabela de decisão** — não como mensagem de chat.
3. **Decisão do usuário é explícita** — cada item tem ações claras (aprovar/editar/descartar).
4. **Itens oficiais são o destino** — a tabela de `orcamento_itens` é a seção que importa, não um apêndice.
5. **Proposta é a saída** — link visível e contextualizado.
6. **Lab é secundário** — colapsado, rotulado como experimental.
7. **Chat é auxiliar** — colapsado ou lateral, nunca na jornada principal.

---

## 3. Hierarquia Visual Recomendada

### ANTES (atual — 10 áreas)

```
Cabeçalho + StatusPills
1. Arquivos da oportunidade          ← REAL
2. Diagnóstico + Análise técnica     ← REAL (visual técnico)
3. Evidências extraídas              ← PLACEHOLDER amarelo
4. Itens preliminares                ← PLACEHOLDER amarelo
5. Pendências HITL                   ← PLACEHOLDER amarelo
6. Aprovação humana                  ← PLACEHOLDER amarelo
7. Itens oficiais (orcamento_itens)  ← REAL
8. Proposta                          ← REAL
9. Laboratório avançado [colapsado]  ← LAB/MOCK
```

### DEPOIS (MVP — 6 áreas)

```
A. Cabeçalho + Stepper de progresso
B. Arquivos + Ação principal
C. Resultado IA (Preview + HITL inline)
D. Orçamento oficial (itens persistidos)
E. Proposta
F. Lab [colapsado]
```

**O que muda:**
- Seções 3, 4, 5, 6 (placeholders) → unificadas no bloco **C** (Preview + HITL real)
- Seção 2 (painel técnico) → absorvida pelo bloco **B** (ação principal no mesmo lugar dos arquivos)
- Stepper novo → comunica progresso visualmente sem placeholders
- Lab inalterado (continua colapsado)

---

## 4. Jornada Principal do Usuário

```
ESTADO ZERO ──────────────────────────────
│ Oportunidade sem orçamento
│ → Botão "Criar orçamento da oportunidade"
│ → Após criar, aba recarrega com stepper
│
PASSO 1: ARQUIVOS ────────────────────────
│ Lista de opportunity_files com checkboxes
│ Stepper: ● Arquivos ○ Análise ○ Revisão ○ Orçamento
│ CTA: [Analisar X arquivos selecionados com IA]
│ (desabilitado se nenhum selecionado)
│
PASSO 2: ANÁLISE ─────────────────────────
│ Loading spinner enquanto POST /analyze executa
│ Stepper: ✓ Arquivos ● Análise ○ Revisão ○ Orçamento
│ Resultado aparece abaixo:
│   → Se items > 0: tabela de preview
│   → Se items = 0: mensagem "Nenhum item identificado" + sugestão
│   → Se erro: mensagem de erro + retry
│
PASSO 3: REVISÃO (HITL) ─────────────────
│ Tabela de preview com colunas:
│ [✓] Descrição | Unid | Qtd | V.Unit | Confiança | Ação
│ Stepper: ✓ Arquivos ✓ Análise ● Revisão ○ Orçamento
│ Ações por item: Aprovar ✅ | Editar ✏️ | Descartar ❌
│ CTA: [Persistir X itens aprovados no orçamento]
│
PASSO 4: ORÇAMENTO ───────────────────────
│ OrcamentistaManualItemsPanel (já existe)
│ Stepper: ✓ Arquivos ✓ Análise ✓ Revisão ● Orçamento
│ Itens aparecem com origem: manual | ia_gemini
│ Total, CRUD, tudo funcional
│
SAÍDA: PROPOSTA ──────────────────────────
│ Link "Abrir proposta →" ou "Gere a proposta na página da oportunidade"
│ (já existe — seção 8 atual)
```

---

## 5. Wireframe Textual

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Oportunidade                                                  │
│ ORÇAMENTISTA IA                                                  │
│ [Título da Oportunidade]                                        │
│                                                                  │
│ Esteira de pré-obra: arquivos → análise IA → revisão humana →   │
│ orçamento oficial → proposta.                                    │
│                                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │Orçamento │ │Itens     │ │Proposta  │ │Workspace │            │
│ │VINCULADO │ │5 itens   │ │RASCUNHO  │ │PRÉVIA    │            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
│                                                                  │
│ ── PROGRESSO ─────────────────────────────────────────────────  │
│ ● Arquivos  ─── ○ Análise IA ─── ○ Revisão ─── ○ Orçamento    │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ § B. ARQUIVOS DA OPORTUNIDADE                                    │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [✓] Memorial_descritivo.txt          12 KB   text/plain    │ │
│ │ [✓] Especificacoes_tecnicas.csv      8 KB    text/csv      │ │
│ │ [ ] Foto_fachada.jpg                 2 MB    image/jpeg    │ │
│ │ [ ] Planta_baixa.pdf                 5 MB    application/pdf│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [▶ ANALISAR 2 ARQUIVOS SELECIONADOS COM IA]                │ │
│ │                                                             │ │
│ │ A IA vai extrair texto dos arquivos suportados (.txt, .csv, │ │
│ │ .json, .md) e sugerir itens de orçamento. Você aprova cada  │ │
│ │ item antes de ir para o orçamento oficial.                  │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ § C. RESULTADO DA ANÁLISE IA                                     │
│                                                                  │
│  Análise de 15/05/2026 · 2 arquivos · 3 itens sugeridos         │
│  ⚠ Valores são estimativas. Revise antes de aprovar.            │
│                                                                  │
│ ┌────┬──────────────────┬─────┬─────┬────────┬──────┬─────────┐│
│ │ ✓  │ Descrição        │Unid │ Qtd │V.Unit  │Conf. │ Ação    ││
│ ├────┼──────────────────┼─────┼─────┼────────┼──────┼─────────┤│
│ │[✓] │Demolição alvenar.│ m²  │ 120 │ R$35   │ 0.82 │✅ ✏️ ❌││
│ │    │                  │     │     │        │██░░░ │         ││
│ │    │📎 "demolir pared.│     │     │        │      │         ││
│ ├────┼──────────────────┼─────┼─────┼────────┼──────┼─────────┤│
│ │[✓] │Alvenaria nova    │ m²  │ 200 │ R$85   │ 0.91 │✅ ✏️ ❌││
│ │    │                  │     │     │        │████░ │         ││
│ │    │📎 "executar alve.│     │     │        │      │         ││
│ ├────┼──────────────────┼─────┼─────┼────────┼──────┼─────────┤│
│ │[ ] │Instalações elétr.│ vb  │ 1   │R$12000 │ 0.55 │✅ ✏️ ❌││
│ │    │                  │     │     │        │██░░░ │         ││
│ │    │📎 "quadro elétri.│     │     │        │      │         ││
│ └────┴──────────────────┴─────┴─────┴────────┴──────┴─────────┘│
│                                                                  │
│ Subtotal selecionado: R$ 21.200,00  (2 de 3 itens)              │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ [✅ APROVAR 2 ITENS SELECIONADOS → ORÇAMENTO OFICIAL]      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ § D. ORÇAMENTO OFICIAL                          GRAVADO NO BANCO │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ [OrcamentistaManualItemsPanel já existente]                  ││
│ │ Itens com origem: manual | ia_gemini                         ││
│ │ CRUD completo + totalização                                  ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ § E. PROPOSTA COMERCIAL                                          │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Proposta em rascunho · 5 itens · R$ 31.700 base              ││
│ │ [Abrir proposta →]                                           ││
│ └──────────────────────────────────────────────────────────────┘│
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ▼ LABORATÓRIO AVANÇADO — Simulações e componentes não conectados│
│   [colapsado por padrão — 13 painéis mock/LAB + chat auxiliar]  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Separação Real / Lab / Mock / Futuro

| Área da tela | Classificação | Visibilidade | Decisão UX |
|:---|:---|:---|:---|
| Cabeçalho + StatusPills | ✅ REAL | Sempre visível | Manter |
| Stepper de progresso | 🔧 NOVO | Sempre visível | Criar — substitui placeholders |
| Arquivos opportunity_files | ✅ REAL | Sempre visível | Manter (seção 1 atual) |
| Botão "Analisar com IA" | ✅ REAL | Sempre visível (com orçamento) | Unificar com arquivos |
| Preview IA (tabela de itens) | 🔧 NOVO | Após análise | Novo `OrcamentistaAiReviewPanel` |
| HITL (aprovar/editar/descartar) | 🔧 NOVO | Inline no preview | Dentro do mesmo painel |
| Itens oficiais | ✅ REAL | Sempre visível (com orçamento) | Manter `OrcamentistaManualItemsPanel` |
| Proposta | ✅ REAL | Sempre visível (com orçamento) | Manter (seção 8 atual) |
| Lab colapsado (13 painéis) | ❌ MOCK/LAB | Colapsado sempre | Manter inalterado |
| Chat auxiliar | ❌ LAB | Dentro do Lab | Manter dentro do Lab |
| StagePlaceholders (seções 3-6) | ❌ REMOVER | Eram visíveis | **Substituir pelo Preview IA real** |
| Painel técnico roxo (seção 2) | ⚠️ PARCIAL | Era visível | **Absorver no bloco B** — métricas viram resumo após análise |

---

## 7. Estados da Experiência

| Estado | Gatilho | Visual | Ação disponível |
|:---|:---|:---|:---|
| **Sem orçamento** | `!hasOrcamento` | Cartão + botão "Criar orçamento" | Criar orçamento |
| **Orçamento vazio, sem arquivos** | `hasOrcamento && files.length === 0` | Stepper no passo 1 + mensagem vazia | Upload na página da oportunidade |
| **Arquivos disponíveis** | `files.length > 0 && !analyzeResult` | Stepper no passo 1 + checkboxes + CTA | Selecionar + Analisar |
| **Análise em andamento** | `analyze.isPending` | Spinner + stepper passo 2 animado | Aguardar |
| **Análise concluída, com itens** | `analyzeResult.items.length > 0` | Tabela preview + stepper passo 3 | Aprovar/Editar/Descartar |
| **Análise concluída, sem itens** | `analyzeResult.items.length === 0` | Mensagem "Nenhum item" + sugestão | Re-analisar ou adicionar manual |
| **Erro na análise** | `analyze.isError` | Mensagem vermelha + retry | Tentar novamente |
| **Item aprovado (transitório)** | Clique ✅ em um item | Item some do preview → toast "Adicionado" | Continuar revisão |
| **Todos aprovados** | Preview fica vazio | Mensagem "Todos os itens foram processados" | Ver orçamento abaixo |
| **Item editado** | Clique ✏️ → campos inline → salvar | Campos editáveis → salvar como aprovado | Editar e aprovar |
| **Item descartado** | Clique ❌ | Item some do preview com fade | Continuar |
| **Orçamento com itens** | `itens.length > 0` | Tabela oficial com CRUD | Editar, adicionar manual, remover |
| **Pronto para proposta** | `itens.length > 0 && !temProposta` | Link "Gere a proposta" | Ir para detalhe da oportunidade |

---

## 8. Componente OrcamentistaAiReviewPanel

### Papel
Tabela de decisão humana sobre itens sugeridos pela IA. É a **peça central do MVP** — onde o gestor valida o que a IA encontrou.

### Props esperadas

```typescript
type OrcamentistaAiReviewPanelProps = {
  items: AnalyzePreviewItem[];           // Itens retornados pelo /analyze
  onApprove: (item: AnalyzePreviewItem) => Promise<void>;
  onApproveAll: (items: AnalyzePreviewItem[]) => Promise<void>;
  onDiscard: (index: number) => void;
  isApproving: boolean;                  // Loading state
  approvedCount: number;                 // Feedback
};
```

### Estrutura visual

```
┌─ Resultado da Análise IA ───────────────────────────────┐
│ Análise de [data] · [N] arquivos · [M] itens sugeridos  │
│ ⚠ Valores são estimativas da IA. Revise antes de aprovar│
│                                                          │
│ ┌─────────────────────────────────────────────────────┐  │
│ │ [✓] │ Descrição     │ Un │ Qtd │ V.Un │ Conf │ Ação│  │
│ │ ... │ ...           │ ...│ ... │ ...  │ ████ │✅✏❌│  │
│ └─────────────────────────────────────────────────────┘  │
│                                                          │
│ Subtotal: R$ XX.XXX  (N de M selecionados)               │
│                                                          │
│ [✅ APROVAR N ITENS → ORÇAMENTO OFICIAL]                 │
│                                                          │
│ Cada item aprovado será criado em orcamento_itens        │
│ com origem: ia_gemini. Nenhuma gravação automática.      │
└──────────────────────────────────────────────────────────┘
```

### Colunas da tabela

| Coluna | Conteúdo | Editável? |
|:---|:---|:---|
| ✓ | Checkbox de seleção | Sim |
| Descrição | `item.descricao` + evidência colapsável | Sim (edição inline) |
| Unidade | `item.unidade` | Sim |
| Quantidade | `item.quantidade` | Sim |
| V. Unitário | `item.valor_unitario` | Sim |
| V. Total | calculado | Auto |
| Confiança | Barra 0–1 + badge cor | Não |
| Ação | ✅ Aprovar · ✏️ Editar · ❌ Descartar | — |

### Badges de confiança

| Range | Cor | Label |
|:---|:---|:---|
| ≥ 0.85 | Verde | Alta |
| 0.60–0.84 | Amarelo | Média |
| < 0.60 | Vermelho | Baixa |

---

## 9. Onde Entra o Chat

| Aspecto | Decisão |
|:---|:---|
| É jornada principal? | ❌ NÃO |
| Pode auxiliar? | ✅ Sim — explicar análise, sugerir ajustes, tirar dúvidas |
| Grava orçamento? | ❌ NUNCA |
| Substitui HITL? | ❌ NUNCA |
| Posição no MVP | Dentro do **Lab colapsado** (posição atual — mantida) |
| Posição futura? | Pode virar painel lateral (Fase 2+), **nunca** acima dos itens oficiais |
| Rótulo | "Chat de análise livre — dados são staging" |

---

## 10. Laboratório Avançado

**Permanece colapsado em `<details>`.** Conteúdo inalterado:

| Painel | Classificação |
|:---|:---|
| Documentos mock | MOCK |
| Intake guiado | MOCK |
| Projetos ausentes | MOCK |
| Page processing | MOCK |
| Reader + Verifier | MOCK |
| HITL mock | MOCK |
| Agent dispatch | MOCK |
| Preview consolidado | MOCK |
| Gate de consolidação | MOCK |
| Payload review | MOCK |
| Sandbox real reader | LAB |
| Pipeline IA legado | MOCK |
| Prévia IA legada | MOCK |
| Chat de análise livre | LAB |

**Nenhum desses painéis deve competir visualmente com a jornada principal.**

---

## 11. Critérios de Aceite UX

A UX está **APROVADA** quando:

- [ ] Gestor leigo entende o próximo passo sem ajuda técnica
- [ ] Botão "Analisar" é o CTA dominante quando há arquivos
- [ ] Preview aparece **antes** da gravação — nenhum item é persistido sem ação explícita
- [ ] Nenhum `StagePlaceholder` amarelo aparece na jornada principal
- [ ] Nenhum mock parece funcional na jornada principal
- [ ] Lab não atrapalha — está colapsado e rotulado
- [ ] Chat não confunde com fluxo principal — está dentro do Lab
- [ ] Aprovação humana é explícita e individual
- [ ] Proposta aparece como etapa posterior natural
- [ ] Stepper de progresso comunica onde o usuário está
- [ ] Tabela de preview tem ações claras (✅ ✏️ ❌)
- [ ] Feedback de sucesso/erro após cada persistência
- [ ] `origem: 'ia_gemini'` aparece visualmente distinta de `origem: 'manual'` na tabela oficial

---

## 12. Riscos UX

| # | Risco | Probabilidade | Mitigação |
|:---|:---|:---|:---|
| U1 | Tela virar dashboard técnico | Média | Remover métricas de pipeline da jornada principal |
| U2 | Chat parecer produto principal | Baixa | Está dentro do Lab colapsado |
| U3 | Usuário aprovar item sem entender origem | Média | Badge de confiança + evidência visível + tooltip |
| U4 | Lab poluir jornada | Baixa | Colapsado, rotulado como "Simulações" |
| U5 | Mock parecer funcional | Baixa | Dentro de `<LabPanel>` com badge "MOCK / LAB" |
| U6 | Falta de feedback após persistência | Alta | Toast "Item adicionado ao orçamento" + counter |
| U7 | Mistura Orçamentista / Diário | Nula | São rotas e módulos separados |
| U8 | Preview e tabela oficial se confundirem | Média | Separação visual clara: preview tem fundo diferente e badge "IA" |

---

## 13. Recomendação Final

### ✅ BLUEPRINT APROVADO — pode avançar para implementação controlada

O blueprint define:
- **6 áreas** em vez de 10 (eliminando 4 placeholders)
- **Stepper de progresso** para comunicar estado
- **Painel único de Preview + HITL** (novo `OrcamentistaAiReviewPanel`)
- **Chat e Lab** confinados no colapsado
- **Jornada linear** clara: Arquivos → Analisar → Revisar → Orçamento → Proposta

### Ordem de implementação autorizada

```
1. Backend: geminiOrcamentista.ts (prompt + parse)
2. Backend: conectar no /analyze (substituir stub)
3. Frontend: OrcamentistaAiReviewPanel.tsx (preview + HITL)
4. Frontend: Stepper de progresso em OrcamentistaTab
5. Frontend: Remover StagePlaceholders (seções 3-6)
6. Frontend: Integrar preview + HITL na aba
7. Validação ponta a ponta
```

---

> **Nenhum arquivo funcional foi alterado. Nenhum commit realizado.**  
> **Blueprint pronto para autorização de implementação.**
