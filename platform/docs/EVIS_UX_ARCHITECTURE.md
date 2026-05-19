# EVIS — Arquitetura de UX

> Documento de referência obrigatório para qualquer agente ou desenvolvedor que toque no frontend.
> Define estrutura de páginas, tabs, sequência de blocos e padrões de navegação.
> Modelo de referência: VOBI (plataforma.vobi.com.br).

---

## Princípios inegociáveis

1. **Uma entidade, uma tela** — quando o usuário está dentro de uma Oportunidade ou Obra, tudo sobre aquela entidade está disponível em tabs na mesma página. Nunca navega para fora para acessar dados relacionados.
2. **Blocos sequenciais** — as tabs têm ordem implícita da esquerda para a direita. O usuário naturalmente progride.
3. **Sem jargão técnico na navegação** — nenhuma label de tab usa termos de backend, banco ou código.
4. **IA invisível na navegação** — o agente não tem tab própria. Ele aparece dentro das tabs onde faz sentido (botão "Analisar com IA", resultado inline, HITL inline).
5. **Status sempre visível** — cada entidade tem um badge de status no header da página.

---

## 1. Estrutura de Navegação Global

### Sidebar (sempre visível)

```
EVIS
─────────────────
Dashboard
─────────────────
Oportunidades       ← CRM / pré-venda
Propostas
─────────────────
Obras               ← execução / pós-venda
─────────────────
EM BREVE
  Financeiro
  Relatórios
  Cadastros
  Configurações
─────────────────
v1.0 · ALPHA
```

### Breadcrumb padrão (todas as páginas internas)

```
← [Módulo pai]  /  [Nome da entidade]  /  [Tab ativa]
```

Exemplos:
```
← Oportunidades  /  Obra Rita e Bruno
← Obras  /  Vila Mariana  /  Diário
```

---

## 2. Dashboard

**Rota:** `/`

**Propósito:** cockpit de status — o usuário vê o que precisa de atenção hoje, não apenas links para módulos.

### Layout atual (estado atual — menu estático)

3 cards: Oportunidades | Propostas | Gestão da Obra

### Layout alvo (próxima iteração — cockpit vivo)

```
EVIS — Boa tarde, [nome]

┌─ ATENÇÃO HOJE ──────────────────────────────────────────┐
│  2 obras sem diário nos últimos 3 dias                  │
│  1 proposta aguardando resposta há 7 dias               │
│  Obra Vila Mariana: avanço não registrado esta semana   │
└─────────────────────────────────────────────────────────┘

┌─ OBRAS ATIVAS ────┐  ┌─ OPORTUNIDADES ───┐  ┌─ PROPOSTAS ──────┐
│  3 em andamento   │  │  5 abertas        │  │  2 enviadas      │
│  → Ver obras      │  │  → Ver funil      │  │  → Ver propostas │
└───────────────────┘  └───────────────────┘  └──────────────────┘
```

**Status:** Dashboard atual é menu estático. Cockpit vivo é próxima iteração — NÃO implementar agora.

---

## 3. Módulo Oportunidades

### 3.1 Lista de Oportunidades

**Rota:** `/oportunidades`

**Colunas da tabela:**
Título | Status | Origem | Prioridade | Cliente | Telefone | Valor | Metragem | Criada em

**Status possíveis** (badges coloridos):
- `novo` → azul
- `em_orcamento` → âmbar
- `proposta_enviada` → roxo
- `negociacao` → laranja
- `ganha` → verde
- `perdida` → vermelho
- `arquivada` → cinza

**Ações do header:**
- `+ Nova Oportunidade` (botão primário verde)

---

### 3.2 Detalhe da Oportunidade

**Rota:** `/oportunidades/:id`

**Header da página:**
```
← Oportunidades

[Nome da Oportunidade]
[badge status]  [badge prioridade]  [data criação]

[ORÇAMENTO COM IA]  [ORÇAMENTO]  [GERAR PROPOSTA]  [GANHAR]
```

**Tabs:**

| # | Tab | Conteúdo | Status |
|---|-----|----------|--------|
| 1 | **Resumo** | Dados gerais, origem, cliente, telefone, email, endereço, tipo de obra, metragem, valor estimado | ✅ existe (seção "Detalhes Gerais") |
| 2 | **Orçamento IA** | OrcamentistaProductView (upload memorial → IA → HITL → itens oficiais) | ✅ existe em rota separada |
| 3 | **Proposta** | Geração e visualização da proposta comercial | ✅ existe parcialmente |
| 4 | **Atividades** | Histórico de eventos, registros de contato, próximo passo | ✅ existe (seção lateral "Resumo de Atividades") |

**Regra de transição:**
- Botão `GANHAR` → cria Obra automaticamente → vincula orçamento → navega para `/obras/:id`
- Se já tem `obra_id`: botão muda para `ABRIR OBRA →`

---

### 3.3 Orçamentista IA

**Rota:** `/oportunidades/:id/orcamentista`

**Header:**
```
← Voltar ao HUB                    Diagnóstico técnico ↗

ORÇAMENTISTA IA
[Nome da Oportunidade]              [badge: Aguardando memorial]
```

**Blocos sequenciais (de cima para baixo):**

```
1. MEMORIAL DESCRITIVO
   [Drag & drop ou "Enviar arquivo"]
   [Lista de arquivos enviados]

2. ITENS DO ORÇAMENTO
   [Tabela: Código | Descrição | Un | Qtd | Valor Unit. | Total]
   [Nenhum item ainda — aguardando análise IA ou adição manual]

   [+ Adicionar item manual]

3. ANÁLISE IA  (aparece após upload)
   [Analisar com IA]
   → resultado: lista de itens propostos para HITL

4. PROPOSTA COMERCIAL
   [Nenhuma proposta gerada — adicione itens primeiro]
```

**Status do badge (topo direito):**
- `Aguardando memorial`
- `Pronto para análise`
- `Em análise...`
- `Revisão pendente`
- `Aprovado`
- `Proposta gerada`

---

## 4. Módulo Propostas

**Rota:** `/propostas`

**Propósito:** visualizar e gerenciar propostas comerciais geradas a partir dos orçamentos.

**Status:** existe, manter como está por ora.

---

## 5. Módulo Obras

### 5.1 Lista de Obras

**Rota:** `/obras`

**Colunas:**
Nome | Status | Cliente | Data início | Avanço geral | Última entrada no diário

**Status possíveis:**
- `ATIVA` → verde
- `PAUSADA` → âmbar
- `CONCLUÍDA` → azul
- `CANCELADA` → vermelho

---

### 5.2 Detalhe da Obra — ESTRUTURA CENTRAL DO PRODUTO

**Rota:** `/obras/:id`

**Header da página:**
```
← Obras

[Nome da Obra]
[badge status]  [badge cliente]  [data início]

[Avanço geral: ██████░░░░ 60%]
```

**Tabs — blocos sequenciais (modelo VOBI):**

| # | Tab | Conteúdo | Equivalente VOBI | Status |
|---|-----|----------|-----------------|--------|
| 1 | **Visão Geral** | KPIs da obra: avanço, dias em obra, próximas tarefas, alertas | Geral | ⚠️ precisa criar |
| 2 | **Planejamento** | Serviços com WBS, % avanço, status, datas, responsáveis | Obra → Planejamento | ✅ existe (Servicos.tsx) |
| 3 | **Diário** | Narrativa do dia + botão "Analisar com IA" + HITL de atualizações | Obra → Diário de Obra | ✅ base existe (Diario.tsx) — falta IA |
| 4 | **Equipes** | Equipes vinculadas + registro de presença por dia | Tarefas (parcial) | ✅ existe (Equipes.tsx) |
| 5 | **Financeiro** | Orçamento oficial + custos realizados + BDI | Compras + Financeiro | ✅ existe (Orcamento/) |
| 6 | **Documentos** | Fotos, notas, arquivos | Arquivos + Anotações | ✅ existe (Fotos.tsx, Notas.tsx) |
| 7 | **Relatórios** | Geração de relatório de avanço + envio por email/WhatsApp | — | ✅ existe (Relatorios.tsx) |

**Tab ativa default:** `Planejamento` na primeira visita, `Diário` nas visitas subsequentes.

---

### 5.3 Tab Diário — Fluxo com IA (próxima construção)

Esta é a tab mais importante do produto. O fluxo completo:

```
DIÁRIO DE OBRAS — [Data de hoje]

┌─ REGISTRAR ENTRADA ─────────────────────────────────────────┐
│                                                              │
│  [textarea: O que aconteceu hoje na obra?]                  │
│                                                              │
│  "Concluímos 40m² de alvenaria no 2º pavimento.             │
│   Equipe Pedreiro A trabalhou dia cheio.                     │
│   Material de cimento está acabando."                        │
│                                                              │
│  [🎤 Gravar áudio]          [Salvar + Analisar com IA →]    │
└──────────────────────────────────────────────────────────────┘

─── ANÁLISE IA ────────────────────────────────────────────── ↓ aparece após envio

┌─ EVIS identificou 3 atualizações ──────────────────────────┐
│                                                             │
│  ✦ Alvenaria — avanço: 40% → 55%          [✓] [✗] [editar]│
│  ✦ Presença: Equipe Pedreiro A — hoje      [✓] [✗]         │
│  ✦ Alerta: estoque de cimento baixo        [✓ ciente]       │
│                                                             │
│                          [Aprovar tudo]  [Revisar um a um] │
└─────────────────────────────────────────────────────────────┘

─── HISTÓRICO ─────────────────────────────────────────────── ↓ entradas anteriores

  17/05/26  "Concluímos 40m²..."         ✅ aprovado · 3 updates
  16/05/26  "Chuva no período da tarde..." ✅ aprovado · 1 update
  15/05/26  "Início da alvenaria..."       ✅ aprovado · 2 updates
```

**O que a IA lê para gerar as atualizações:**
- Texto da narrativa
- `servicos` da obra (nome, categoria, avanco_atual, status)
- `equipes` vinculadas (cod, nome, funcao)
- `presenca` já registrada no dia

**O que a IA propõe:**
- Atualizações de `avanco_atual` em serviços mencionados
- Registros de `presenca` para equipes mencionadas
- Mudanças de `status` em serviços (inicio, conclusao)
- Alertas (material, risco, atraso) — não atualizam banco, só notificam

**Regra de segurança:** nenhuma atualização é aplicada sem aprovação explícita do usuário. HITL obrigatório.

---

## 6. Fluxo Completo do Ciclo de Vida

```
Dashboard
    ↓
Oportunidades (lista)
    ↓
Oportunidade Detalhe
  Tab 1: Resumo         → preenche dados do lead
  Tab 2: Orçamento IA   → sobe memorial → IA extrai → HITL → itens oficiais
  Tab 3: Proposta       → gera proposta a partir do orçamento
  Tab 4: Atividades     → registra contatos, negociação
    ↓
  [GANHAR] → cria Obra automaticamente + migra orçamento
    ↓
Obra Detalhe
  Tab 1: Visão Geral    → KPIs e alertas
  Tab 2: Planejamento   → serviços, WBS, datas
  Tab 3: Diário         → narrativa diária → IA → HITL → auto-update ← DIFERENCIAL
  Tab 4: Equipes        → equipes, presença
  Tab 5: Financeiro     → orçamento, custos realizados
  Tab 6: Documentos     → fotos, notas, arquivos
  Tab 7: Relatórios     → gera e envia relatório de avanço
```

---

## 7. Padrões de Navegação

### Botão voltar
- Sempre no topo esquerdo: `← [Nome do módulo pai]`
- Nunca usa o botão nativo do browser como única forma de voltar

### Breadcrumb
- Formato: `← Oportunidades  /  Obra Rita e Bruno  /  Diário`
- Todos os segmentos são clicáveis exceto o atual

### Tabs
- Sempre horizontal no topo do conteúdo, abaixo do header da entidade
- Tab ativa: underline verde (`border-b-2 border-green-400 text-white`)
- Tab inativa: `text-white/50 hover:text-white/80`
- Nunca mais de 7 tabs em uma página

### Status badges
- Verde: ativo, aprovado, ganha, concluído
- Âmbar: em andamento, pendente, em orçamento
- Vermelho: bloqueado, rejeitado, perdida, crítico
- Cinza: rascunho, arquivado, inativo
- Roxo: proposta enviada, aguardando resposta

### Ações primárias
- Sempre botão verde (`bg-green-500`)
- No máximo 1 ação primária por tela
- Ações secundárias: `border border-white/20` com hover

---

## 8. Nomenclatura oficial (PT-BR, sem jargão)

| Termo técnico | Label exibido ao usuário |
|---|---|
| `opportunities` / `oportunidades` | Oportunidades |
| `obras` | Obras |
| `orcamento_itens` | Itens do orçamento |
| `avanco_atual` | Avanço |
| `presenca` | Presença |
| `diario` | Diário |
| `servicos` | Serviços |
| `equipes` | Equipes |
| `staging` / `lab` | (invisível ao usuário) |
| `HITL` | Revisão / Aprovação |
| `payload` | (invisível ao usuário) |
| `pipeline` | (invisível ao usuário) |

---

## 9. O que NÃO pertence à navegação principal

Os itens abaixo são funcionalidades de engenharia — ficam no Modo Lab (`/orcamentista/lab`) ou em rotas de diagnóstico. Nunca aparecem no produto para o usuário:

- Pipeline IA legado
- Safety gates
- Dispatch para agentes
- Contexto validado/pendente/bloqueado
- Payload simulado
- Scores de confiança numéricos
- IDs de agente, IDs de evidência
- Qualquer label com `MOCK`, `LAB`, `STAGING`, `FASE X`

---

## 10. Estado de implementação

| Página / Tab | Estado |
|---|---|
| Dashboard (menu estático) | ✅ existe |
| Dashboard (cockpit vivo) | ⏳ próxima iteração |
| Oportunidades — lista | ✅ existe |
| Oportunidade — Resumo | ✅ existe |
| Oportunidade — Orçamento IA | ✅ existe (ProductView) |
| Oportunidade — Proposta | ✅ existe parcialmente |
| Oportunidade — Atividades | ✅ existe (sidebar) |
| Obras — lista | ✅ existe |
| Obra — Visão Geral | ⚠️ precisa criar |
| Obra — Planejamento | ✅ existe (Servicos.tsx) |
| Obra — Diário (base) | ✅ existe (Diario.tsx) |
| Obra — Diário + IA | 🔴 próxima construção |
| Obra — Equipes | ✅ existe |
| Obra — Financeiro | ✅ existe |
| Obra — Documentos | ✅ existe |
| Obra — Relatórios | ✅ existe |
