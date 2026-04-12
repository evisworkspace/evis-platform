# 🏗️ EVIS AI — Visão Técnica Completa

> **Documento de referência para mentoria e planejamento estratégico**
> Última atualização: Abril de 2026 — **v2 com decisões arquiteturais definidas**

---

## 🎯 O Problema que o Evis AI Resolve

Mestres de obras e engenheiros perdem horas por semana preenchendo diários de obra manualmente, enquanto a informação crítica fica presa em conversas de WhatsApp ou na memória das pessoas. O resultado: cronogramas imprecisos, equipes mal alocadas e clientes no escuro sobre o andamento da obra.

O **Evis AI** transforma a voz do mestre de obras em dados estruturados, atualizando automaticamente cronograma, presença de equipes e notas técnicas — tudo em tempo real, sincronizado na nuvem.

---

## 1. ESTADO ATUAL — O QUE JÁ FOI CONSTRUÍDO

### 1.1 Stack Tecnológico

| Camada | Tecnologia | Versão | Decisão |
|:---|:---|:---|:---|
| **UI Framework** | React | 19 | Hooks modernos, Concurrent Mode |
| **Linguagem** | TypeScript | 5.8 | Strict Mode ativo (`noImplicitAny`) |
| **Build Tool** | Vite | 6 | Hot-reload instantâneo no canteiro |
| **Estilização** | Tailwind CSS | v4 | Variáveis OKLCH, CSS Layers, design system premium |
| **Backend / DB** | Supabase | 2.x | PostgreSQL + PostgREST + Realtime |
| **Cache de Servidor** | TanStack React Query | v5 | `staleTime: 5min`, invalidação inteligente |
| **Estado Global UI** | AppContext (React) | — | Pending Changes, filtros globais |
| **IA Principal** | Google Gemini | `@google/genai` | Transcrição + extração estruturada |
| **Upload de Fotos** | ImgBB | — | Armazenamento externo de imagens |
| **Animações** | Motion | 12.x | Micro-animações de UI |

---

### 1.2 Estrutura de Arquivos

```
Evis AI/
├── src/
│   ├── App.tsx                  # Orquestrador principal — roteamento de abas + sync
│   ├── AppContext.tsx            # Estado global (dados, pendências, configuração)
│   ├── main.tsx                 # Setup do React Query (QueryClientProvider)
│   ├── types.ts                 # Interfaces: Servico, Equipe, Nota, Foto, Pendencia
│   ├── initialData.ts           # Dados seed para desenvolvimento
│   ├── index.css                # Design system (tokens OKLCH, @layer base/components/utilities)
│   │
│   ├── components/
│   │   ├── Diario.tsx           # ⚠️ Monolítico (500+ linhas) — REFATORAR
│   │   ├── Cronograma.tsx       # ⚠️ Monolítico (500+ linhas) — REFATORAR
│   │   ├── Equipes.tsx          # Gestão de times e presença diária
│   │   ├── Servicos.tsx         # Gestão de serviços e avanço físico
│   │   ├── Notas.tsx            # Notas categorizadas por IA
│   │   ├── Fotos.tsx            # Galeria de fotos de progresso
│   │   ├── Relatorios.tsx       # Snapshots semanais da obra
│   │   └── ConfigPage.tsx       # Configuração de Supabase, Gemini, obra_id
│   │
│   ├── hooks/
│   │   └── useSupabaseQuery.ts  # Wrapper React Query com logging automático
│   │
│   ├── services/
│   │   ├── geminiService.ts     # Cliente do Google Gemini AI
│   │   └── logger.ts            # Logger centralizado (desativado em produção)
│   │
│   └── lib/
│       ├── api.ts               # sbFetch — cliente HTTP para PostgREST
│       └── supabase.ts          # Instância do cliente Supabase
│
└── docs/                        # Documentação organizada do projeto
```

---

### 1.3 Módulos do Sistema (Abas do Cockpit)

| Módulo | Função | Tabela no Supabase |
|:---|:---|:---|
| **Diário de Obra** | Voz → transcrição → extração via IA | `diario_obra` |
| **Equipes** | Cadastro de times + marcação de presença | `equipes_cadastro`, `equipes_presenca` |
| **Orçamento/Serviços** | Acompanhamento de avanço físico por serviço | `servicos` |
| **Cronograma** | Gantt com lógica "Relative Weekly" (S1, S2...) | `servicos` (calculado) |
| **Notas** | Notas técnicas categorizadas por IA | `notas` |
| **Fotos** | Registro fotográfico do progresso | `fotos` |
| **Relatórios** | Snapshot semanal consolidado | `relatorios_semanais` |

---

### 1.4 Arquitetura de Estado — Modelo Híbrido

```
┌────────────────────────────────────────────────────────────┐
│                      ESTADO GLOBAL                          │
│                                                             │
│  AppContext                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ • servicos, notas, equipes, fotos (dados locais)    │   │
│  │ • pendingChanges[] → fila de sync com Supabase      │   │
│  │ • globalFilter     → referenceDate + periodDays     │   │
│  │ • config           → URL, keys, obra_id             │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↕                                 │
│  React Query (TanStack v5)                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ queries com cache de 5 minutos:                     │   │
│  │   ['servicos', obra_id]    ['notas', obra_id]       │   │
│  │   ['pendencias', obra_id]  ['fotos', obra_id]       │   │
│  │   ['diario_obra', obra_id] ['equipes_*', obra_id]   │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘
```

---

### 1.5 Fluxo de Sincronização (Offline-First / Draft Pattern)

```
[Usuário edita dado]
        │
        ▼
[AppContext: dado salvo localmente via setState()]
        │
        ▼
[markPending(table, data) → fila pendingChanges[]]
        │
        ▼
[Header: badge "3 PENDENTES" com animação amber]
        │
        ▼ (usuário clica SYNC)
[Loop: sbFetch() para cada tabela com PATCH/POST]
        │
        ├─ SUCESSO → ok++
        └─ FALHA   → fail++, logger.error()
        │
        ▼
[pendingChanges limpo + queryClient.invalidateQueries()]
        │
        ▼
[React Query refetch → dados frescos do Supabase]
        │
        ▼
[AppContext atualizado via useEffect()]
```

> **Decisão de design:** permite uso em conexões instáveis de canteiro de obra. O mestre registra o dia todo offline e sincroniza quando tiver sinal.

---

### 1.6 Motor de IA Atual (Workflow Linear)

```
[Voz do mestre] → [Web Speech API] → [Transcrição em texto]
        │
        ▼
[geminiService.ts envia prompt único com:]
  • Transcrição bruta
  • Lista completa de serviços cadastrados
  • Data de referência atual
  • Lista de equipes
        │
        ▼
[Gemini retorna JSON estruturado]
  {
    servicos_atualizados: [...],
    presenca_equipes: [...],
    notas_extraidas: [...]
  }
        │
        ▼
[App.tsx parseia → markPending() → SYNC manual]
```

**Limitação conhecida:** um único prompt "gordão" que mistura domínios distintos (equipes x cronograma x notas). O contexto cresce a cada requisição.

---

### 1.7 Lógica "Relative Weekly"

Em vez de ISO calendar weeks, o sistema usa semanas relativas ao início da obra:

```
S1 = Primeira semana da obra (não semana 1 do ano)
S2 = Segunda semana da obra
...

semana_relativa = Math.ceil((data_referencia - data_inicio_obra) / 7) + 1
```

---

## 2. DIREÇÃO ESTRATÉGICA — RECOMENDAÇÕES DO MENTOR

### 2.1 Princípio Fundamental: Simplicidade Antes de Autonomia

> *"Não use um bazooka para matar uma mosca."*

| Tipo | Quando Usar | Exemplo no Evis AI |
|:---|:---|:---|
| **Prompt simples** | Tarefa determinística | Gerar relatório semanal formatado |
| **Workflow (Prompt Chain)** | Sequência de passos fixos | Áudio → Transcrição → Extração → Sync |
| **Agente autônomo** | Tarefa aberta e ambígua | "Analise 30 dias e identifique riscos de atraso" |

**Regra:** Comece como Workflow. Adicione autonomia somente onde a ambiguidade da obra exige.

---

### 2.2 Evolução do Motor: Linear → Orquestrador-Trabalhadores

**Arquitetura alvo:**
```
Transcrição bruta
    │
    ▼
[Agente Orquestrador]
  • recebe transcrição
  • decide quais domínios foram mencionados
  • despacha para sub-agentes em paralelo
    │
    ├──── [Agente: Avanço de Serviços]
    │       prompt: regras de % e status
    │       output: → tabela `servicos`
    │
    ├──── [Agente: Presença de Equipes]
    │       prompt: regras de identificação de nome
    │       output: → tabela `equipes_presenca`
    │
    └──── [Agente: Notas Técnicas]
            prompt: regras de categorização
            output: → tabela `notas`
```

**Benefícios:** separação de contextos, execução paralela, falha isolada por domínio.

---

### 2.3 Engenharia de Contexto — Agent Skills com Disclosure Progressiva

**Decisão definida:** Skills como arquivos `.md` em 3 níveis. RAG (banco de vetores) reservado apenas para dados massivos como catálogo SINAPI.

#### Estrutura de Pastas das Skills

```
skills/
├── avanco_servicos/
│   ├── SKILL.md                  # NÍVEL 1+2: metadados + instruções completas
│   └── calcular_avanco.ts        # NÍVEL 3: script determinístico de cálculo
│
├── presenca_equipes/
│   ├── SKILL.md
│   └── normalizar_nomes.ts       # Corrige: "João Pedreiro" → cod: "PEDREIRA_01"
│
├── notas_tecnicas/
│   ├── SKILL.md
│   └── categorias.json           # Enum: Observação | Pendência | Nota | Material
│
├── relative_weekly/
│   ├── SKILL.md
│   └── calcular_semana.ts        # Lógica determinística: não deixar para a IA calcular
│
└── seguranca_trabalho/
    ├── SKILL.md
    └── checklist_nr18.json       # Itens NR-18 para verificação automática
```

#### Os 3 Níveis de Disclosure Progressiva

| Nível | Conteúdo | Quando Carregado | Objetivo |
|:---|:---|:---|:---|
| **Nível 1 — Metadados** | Nome, descrição 1 linha, quando usar | Sempre (system prompt) | Orquestrador sabe quais Skills existem |
| **Nível 2 — Instruções** | Passo a passo detalhado, regras, exemplos | Quando a Skill é acionada | Agente trabalhador sabe o que fazer |
| **Nível 3 — Scripts** | Código TypeScript/JSON executável | Quando a lógica é determinística | Precisão matemática sem risco de alucinação |

> **Regra crítica:** O cálculo de "Relative Weekly" e o mapeamento de IDs de serviço **nunca devem ser feitos pela IA sozinha**. Esses valores devem ser calculados por scripts (Nível 3) e apenas o resultado é passado para o modelo.

**Princípio JIT (Just-In-Time) Context:**
```
❌ ATUAL:  envia lista completa de 50+ serviços em CADA requisição

✅ ALVO:   Nível 1: envia apenas IDs + nomes curtos dos serviços ativos HOJE
           Nível 2: agente pede detalhes de "REB-07" → busca só esse registro
           Nível 3: cálculo de % de avanço rodado em script, resultado passado à IA
```

---

### 2.4 ACI — Agent-Computer Interface (Ferramentas como UI)

**Decisão definida:** Ferramentas para o agente interagir com o Supabase devem ser desenhadas como **UI consolidada**, não como endpoints técnicos.

```
❌ ERRADO (API thinking):
  get_servico_id(id)           → retorna linha crua do banco
  get_equipe_cod(cod)          → retorna linha crua do banco
  get_presenca_dia(obra, data) → retorna lista crua
  (agente faz 3 chamadas para entender 1 situação)

✅ CORRETO (UI thinking):
  get_status_obra_hoje(obra_id, data)
  → retorna objeto consolidado:
  {
    servicos_em_andamento: [{ id, nome, avanco, responsavel }],
    equipes_presentes: [{ cod, nome, membros_count }],
    pendencias_abertas: [{ id, descricao, gravidade }],
    semana_relativa: "S8"
  }
```

**Documentação "Poka-yoke" para as ferramentas:**
- Descrever como se fosse orientar um **estagiário júnior**
- Incluir: o que a ferramenta faz, quando usar, quando NÃO usar, exemplos de saída
- Parâmetros obrigatórios com nomes autoexplicativos (`obra_id`, não `id`)

---

### 2.5 Infraestrutura de Áudio com n8n

Para lidar com conectividade instável de obra e integração via WhatsApp:

```
[Áudio no WhatsApp]
        │
        ▼
[n8n: Webhook de entrada]
        │
        ▼
[n8n: Whisper (OpenAI)] → Transcrição PT-BR com termos técnicos
        │
        ▼
[n8n: Pós-processamento Gemini] → Corrige siglas e jargões de engenharia
        │
        ▼
[n8n: Chama API Evis AI] → JSON estruturado para Supabase
        │
        ▼
[Supabase: dados salvos + Realtime broadcast → todos os Cockpits]
```

**Vantagem crítica:** n8n gerencia retentativas automáticas sem código custom.

---

### 2.6 Segurança — RLS no Supabase

```sql
-- Política por obra_id + user autenticado
CREATE POLICY "Acesso restrito por obra" ON servicos
  USING (obra_id = auth.jwt() ->> 'obra_id');
```

Combinado com **Supabase Auth** (magic link ou email/senha) garante isolamento completo entre obras e segurança jurídica dos registros.

---

### 2.7 Human-in-the-Loop (HITL)

Ponto de validação obrigatório antes do sync — garante segurança jurídica:

```
[IA extrai dados]
        │
        ▼
[UI: Tela de revisão para o mestre]
  ┌────────────────────────────────────────┐
  │ ✅ "Reboco externo: 45% → confirmar?"  │
  │ ✅ "Pedreiro João presente → OK?"      │
  │ ⚠️  "Pendência elétrica → revisar?"    │
  └────────────────────────────────────────┘
        │ (mestre aprova)
        ▼
[SYNC → Supabase com carimbo "validado_por: mestre"]
```

---

### 2.8 Framework de Evals (LLM-as-Judge)

**Decisão definida:** Começar imediatamente com ~20 casos reais. Não esperar framework gigante.

```
Golden Set (~20 transcrições reais de obra + JSON esperado)
        │
        ▼
[Motor de IA: extração automática]
        │
        ▼
[Gemini 1.5 Pro avalia output vs. esperado]
  ✅ JSON correto? → Aprovado
  ❌ Serviço errado? → Bloqueia merge no CI/CD
```

**Foco:** avaliar o **estado final no banco**, não cada passo intermediário.

---

### 2.9 Controle de Custos e Observabilidade

- Token budget por sessão (evitar loops custosos em multi-agente)
- Log estruturado de cada chamada: entrada, saída, tokens usados, latência
- Dashboard simples de consumo por `obra_id`
- ⚠️ Sistemas multi-agente podem custar **até 15x mais tokens** que um chat simples
- "Context Rot": resumir/compactar periodicamente o contexto da sessão para manter precisão

---

## 3. ROADMAP PRIORIZADO

### Fase 1 — Fundação Sólida (2-3 semanas)
*Completar antes de qualquer nova feature de IA*

- [ ] Refatorar `Diario.tsx` → extrair `AudioRecorder`, `AIAnalysis`, `DiarioEditor`
- [ ] Refatorar `Cronograma.tsx` → extrair `dateUtils.ts`
- [ ] Implementar Supabase Auth → tela de login + proteção de rotas
- [ ] Ativar RLS no Supabase → políticas por `obra_id` + `user_id`
- [ ] Remover `any` remanescentes → tipar payloads do Supabase explicitamente

### Fase 2 — Motor de IA Modular (3-4 semanas)
*Evoluir de Workflow Linear para Orquestrador-Trabalhadores*

- [ ] Criar Skills em Markdown por domínio de negócio
- [ ] Implementar Agente Orquestrador (roteamento de domínio)
- [ ] Criar 3 sub-agentes especializados (Serviços / Equipes / Notas)
- [ ] Implementar JIT Context (busca lazy de detalhes de serviços)
- [ ] Implementar HITL (tela de revisão antes do sync)

### Fase 3 — Infraestrutura e Confiabilidade (4-6 semanas)
*Tornar o sistema resiliente para uso no canteiro*

- [ ] Setup n8n → pipeline de áudio via WhatsApp
- [ ] Supabase Realtime → broadcast para múltiplos Cockpits
- [ ] Framework de Evals com Golden Set (20 casos)
- [ ] Dashboard de consumo de tokens por obra

### Fase 4 — Produto (Ongoing)
*Escalabilidade para múltiplas obras*

- [ ] Multi-obra → seletor de obra no header
- [ ] Portal do Cliente → view somente leitura com diário e fotos
- [ ] App Mobile → PWA ou React Native para uso no canteiro
- [ ] Integração SINAPI → comparação de custos de mão de obra

---

## 4. DECISÕES ARQUITETURAIS DEFINIDAS

> Estas decisões foram deliberadas com o mentor e **não devem ser revertidas** sem nova análise.

| Questão | ✅ Decisão Tomada | Justificativa |
|:---|:---|:---|
| **Onde rodar os agentes?** | **Servidor Node.js dedicado** | Segurança das API Keys; resiliência com Rainbow Deployments; recursos consistentes |
| **Transport de áudio** | **WhatsApp → n8n → Whisper** | Conectividade instável do canteiro; retentativas automáticas; pós-processamento de termos técnicos |
| **Skills** | **Arquivos `.md` com 3 níveis** | RAG apenas para dados massivos (SINAPI). Skills `.md` são mais precisas para lógica procedural |
| **Multi-tenancy** | **Por `obra_id` no Supabase + RLS** | Mais simples, escala bem até dezenas de obras; RLS garante isolamento no nível do banco |
| **Frontend Multi-obra** | **Roteamento `/obra/:id`** | Sem complexidade de DNS; auth mais simples via Supabase JWT com claim `obra_id` |
| **Cálculos críticos** | **Scripts TypeScript (Nível 3)** | Relative Weekly e mapeamento de IDs nunca delegados à IA — risco de alucinação é alto |
| **Evals** | **Começar com 20 casos agora** | Não esperar framework elaborado; LLM-as-judge escala a validação sem custo de engenharia |

### Arquitetura Alvo Consolidada (Visão Completa)

```
[WhatsApp/App] → [n8n: Whisper PT-BR] → [n8n: Pós-proc. Gemini]
                                                │
                                                ▼
                                    [API Node.js — Servidor]
                                                │
                              ┌─────────────────┼─────────────────┐
                              ▼                 ▼                 ▼
                    [Skill: Serviços]  [Skill: Equipes]  [Skill: Notas]
                    [Script Nível 3]   [Script Nível 3]  [Categorias]
                              └─────────────────┼─────────────────┘
                                                │
                                                ▼
                                    [HITL: Mestre revisa]
                                                │
                                                ▼
                              [Supabase: SYNC com RLS + Realtime]
                                                │
                                                ▼
                              [React Cockpit: atualizado via broadcast]

---

## 5. GLOSSÁRIO DO PROJETO

| Termo | Definição no contexto do Evis AI |
|:---|:---|
| **Obra** | Projeto de construção civil — identificado por `obra_id` no banco |
| **Mestre** | Mestre de obras — usuário primário do Diário de Voz |
| **Relative Weekly** | Sistema S1, S2... relativo ao início da obra, não ao calendário ISO |
| **Pending Changes** | Fila local de alterações aguardando sincronização com o Supabase |
| **Cockpit** | Interface principal do sistema (painel de controle da obra) |
| **Skill** | Pacote de instruções modulares em `.md` + scripts, carregado pelo agente sob demanda |
| **Disclosure Progressiva** | Padrão de 3 níveis: Metadados → Instruções → Scripts. Economiza contexto |
| **HITL** | Human-in-the-Loop: validação humana antes de persistir dados da IA |
| **Eval** | Avaliação sistemática do output da IA contra casos de referência conhecidos |
| **JIT Context** | Enviar apenas IDs leves ao agente, que busca detalhes sob demanda |
| **LLM-as-judge** | Usar modelo superior para avaliar output de outro modelo |
| **sbFetch** | Função utilitária interna para chamadas HTTP ao PostgREST do Supabase |
| **Golden Set** | Conjunto de casos de teste "padrão-ouro" com entrada e saída esperada |
| **ACI** | Agent-Computer Interface: ferramentas desenhadas como UI consolidada, não como endpoints crus |
| **Context Rot** | Degradação da IA por acúmulo de informação irrelevante ou contraditória no contexto |
| **Rainbow Deployment** | Técnica de deploy que mantém agentes em execução enquanto nova versão sobe |
| **Poka-yoke** | Documentação à prova de erro para ferramentas da IA (como orientar um estagiário) |
| **RAG** | Retrieval-Augmented Generation: busca em banco de vetores. Usar apenas para dados massivos (SINAPI) |

---

*Documento gerado em Abril de 2026 | Projeto EVIS AI — Berti Construtora*
*v2 — Decisões arquiteturais finalizadas após sessão de mentoria em 12/04/2026*
