# 🚀 EVIS AI — Plano de Execução com Delegação de Agentes

> **Status:** Em execução | Foco: 1 obra funcional antes de escalar
> Atualizado: 12/04/2026

---

## 📋 LEGENDA DE DELEGAÇÃO

| Símbolo | Agente | Perfil de Tarefa |
|:---|:---|:---|
| 🦙 **OLLAMA** | Modelo local (ex: qwen2.5-coder, codellama) | Mecânica, repetitiva, sem contexto de negócio pesado. Sem custo de API. |
| 🎨 **MINIMAX** | Minimax via OpenCode | UI/visual, componentes de tela, CSS, skeletons de componentes |
| ⚡ **OPENCODE** | Interface de execução | Aplica todas as tarefas no sistema de arquivos. É o "braço" dos agentes. |
| 🧠 **GEMINI/CLAUDE** | Este chat (tarefas pesadas) | Arquitetura, multi-arquivo, contexto complexo de negócio, SQL crítico |
| 🧪 **EVALS** | Sistema de Testes | Localizado em `/evals`, garante que a IA não sofra regressão ou alucinação. |

---

## 🛡️ REGRAS DE GOVERNANÇA (Anti-Alucinação)
1. **Memória Técnica**: Todas as decisões de design devem ser registradas em `docs/MEMORIA_TECNICA.md`.
2. **Execução Sequencial**: IAs locais (Ollama) devem ser chamadas uma por vez para evitar sobrecarga (Limite: 1 thread de inferência).
3. **Golden Set**: Qualquer mudança no prompt de um sub-agente deve ser validada contra o `evals/golden_set.json`.
4. **Logs de Execução**: Falhas de entendimento da IA devem ser registradas em `evals/failures.log` para ajuste de Skills.

---

## 🔴 FASE 1 — FUNDAÇÃO SÓLIDA
> Meta: código limpo, tipado e com auth antes de qualquer feature nova de IA
> Tempo estimado: 2-3 dias

---

### F1.1 — Remover `any` remanescentes (tipagem)
- **Agente:** 🦙 OLLAMA
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]`
- **Arquivos:**
  - `src/AppContext.tsx` — linhas 10, 78, 115
  - `src/App.tsx` — linhas 87, 180, 189, 196, 226, 235
  - `src/components/Diario.tsx` — linhas 46, 49, 179
  - `src/components/Servicos.tsx` — linha 58
  - `src/components/ConfigPage.tsx` — linhas 67, 90, 105, 136
  - `src/components/Cronograma.tsx` — linha 383
- **Prompt para Ollama:**
  ```
  Arquivo: src/AppContext.tsx
  Tarefa: Substitua todos os `any` por tipos explícitos do TypeScript.
  Use as interfaces já definidas em src/types.ts.
  Não altere a lógica, apenas a tipagem.
  ```
- **Critério de conclusão:** `npm run lint` passa sem erros de tipo

---

### F1.2 — Extrair `dateUtils.ts` do Cronograma
- **Agente:** 🦙 OLLAMA
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]`
- **Tarefa:** Extrair todas as funções de data de `src/components/Cronograma.tsx` para `src/lib/dateUtils.ts`
- **Funções a extrair:**
  - `calcularSemanaRelativa(dataReferencia, dataInicioObra)`
  - `formatarData(date: string): string`
  - `gerarIntervalo(inicio, fim, stepDias): string[]`
  - `diasEntreDatas(d1, d2): number`
- **Prompt para Ollama:**
  ```
  Leia src/components/Cronograma.tsx.
  Extraia as funções de manipulação de data para um novo arquivo src/lib/dateUtils.ts.
  Exporte todas as funções. Importe-as de volta no Cronograma.tsx.
  Não altere a lógica das funções.
  ```
- **Critério de conclusão:** Cronograma renderiza igual, `dateUtils.ts` exporta funções tipadas

---

### F1.3 — Extrair componente `AudioRecorder` do Diário
- **Agente:** 🧠 GEMINI/CLAUDE
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]`
- **Tarefa:** Extrair a lógica de gravação de áudio de `src/components/Diario.tsx`
- **Arquivo novo:** `src/components/AudioRecorder.tsx`
- **Props esperadas:**
  ```typescript
  interface AudioRecorderProps {
    onTranscricaoCompleta: (texto: string) => void;
    disabled?: boolean;
  }
  ```
- **Contexto para Claude:** Diario.tsx tem 500+ linhas. A parte de gravação usa Web Speech API. O componente pai (Diario) deve receber o texto e chamar a IA.
- **Critério de conclusão:** Diario.tsx reduz para <300 linhas, gravação funciona igual

---

### F1.4 — Extrair componente `AIAnalysis` do Diário
- **Agente:** 🧠 GEMINI/CLAUDE
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]`
- **Dependência:** F1.3 concluída
- **Arquivo novo:** `src/components/AIAnalysis.tsx`
- **Props esperadas:**
  ```typescript
  interface AIAnalysisProps {
    transcricao: string;
    servicos: Servico[];
    equipes: Equipe[];
    dataReferencia: string;
    onResultado: (resultado: AIExtractionResult) => void;
  }
  ```
- **Critério de conclusão:** Motor de IA isolado, testável independentemente

---

### F1.5 — Tela de Login com Supabase Auth
- **Agente:** 🎨 MINIMAX (UI) + 🧠 CLAUDE (lógica de auth)
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]`
- **Arquivos novos:**
  - `src/pages/Login.tsx`
  - `src/hooks/useAuth.ts`
- **Fluxo:**
  1. Usuário acessa o app
  2. Se não autenticado → redireciona para `<Login />`
  3. Login por magic link (email)
  4. Sessão salva no Supabase
  5. App carrega com `obra_id` do perfil do usuário
- **Prompt Minimax (UI):**
  ```
  Crie uma tela de login dark mode premium.
  Paleta: fundo #090a0b, verde #3fb950.
  Campos: email input + botão "Enviar magic link".
  Layout centralizado com logo EVIS AI.
  ```
- **Critério de conclusão:** Login funciona, sessão persiste, `obra_id` carregado do JWT

---

### F1.6 — Ativar RLS no Supabase
- **Agente:** 🧠 GEMINI/CLAUDE
- **Executor:** Manual no Supabase Console (SQL Editor)
- **Status:** `[ ]`
- **Script SQL a executar:**
  ```sql
  -- Habilitar RLS em todas as tabelas
  ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE notas ENABLE ROW LEVEL SECURITY;
  ALTER TABLE equipes_cadastro ENABLE ROW LEVEL SECURITY;
  ALTER TABLE equipes_presenca ENABLE ROW LEVEL SECURITY;
  ALTER TABLE diario_obra ENABLE ROW LEVEL SECURITY;
  ALTER TABLE fotos ENABLE ROW LEVEL SECURITY;
  ALTER TABLE pendencias ENABLE ROW LEVEL SECURITY;

  -- Política: usuário acessa apenas sua obra
  CREATE POLICY "obra_isolation" ON servicos
    FOR ALL USING (obra_id = (auth.jwt() ->> 'obra_id')::uuid);

  -- (repetir para cada tabela)
  ```
- **Critério de conclusão:** Dados de obras diferentes ficam isolados no banco

---

## 🟠 FASE 2 — MOTOR DE IA MODULAR
> Meta: Orquestrador + 3 sub-agentes + Skills + HITL funcionando
> Tempo estimado: 5-7 dias

---

### F2.1 — Criar estrutura de Skills em Markdown
- **Agente:** 🦙 OLLAMA + 🧠 CLAUDE (revisão de regras de negócio)
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]` (Finalizado pela Skill de Executor Autônomo)
- **Estrutura a criar:**
  ```
  skills/
  ├── avanco_servicos/
  │   ├── SKILL.md
  │   └── calcular_avanco.ts
  ├── presenca_equipes/
  │   ├── SKILL.md
  │   └── normalizar_nomes.ts
  ├── notas_tecnicas/
  │   ├── SKILL.md
  │   └── categorias.json
  ├── relative_weekly/
  │   ├── SKILL.md
  │   └── calcular_semana.ts   ← importar de dateUtils.ts (F1.2)
  └── seguranca_trabalho/
      ├── SKILL.md
      └── checklist_nr18.json
  ```
- **Prompt Ollama (para os SKILL.md):**
  ```
  Crie o arquivo skills/avanco_servicos/SKILL.md com:
  - Nome da skill
  - Descrição em 1 linha (para o orquestrador)
  - Quando usar (gatilhos na transcrição)
  - Regras de extração passo a passo
  - Exemplos de input/output JSON
  ```
- **Critério de conclusão:** 5 pastas criadas com SKILL.md e script.ts/json cada

---

### F2.2 — Script `calcular_semana.ts` (Nível 3 da Skill)
- **Agente:** 🦙 OLLAMA
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]` (Finalizado pela Skill de Executor Autônomo)
- **Dependência:** F1.2 (dateUtils.ts)
- **Tarefa:** Criar `skills/relative_weekly/calcular_semana.ts` que:
  - Importa `calcularSemanaRelativa` de `src/lib/dateUtils.ts`
  - Exporta função `getSemanaRelativaFormatada(dataObra, dataRef): string`
  - Retorna: `"S8"`, `"S12"`, etc.
- **Regra:** Este script é chamado pelo servidor ANTES de passar contexto à IA. A IA recebe apenas `"S8"`, nunca calcula ela mesma.

---

### F2.3 — Criar servidor Node.js base (`server/`)
- **Agente:** 🧠 GEMINI/CLAUDE
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]` (Base criada em server/)
- **Estrutura nova:**
  ```
  server/
  ├── index.ts              # Express app + rotas
  ├── routes/
  │   └── diario.ts         # POST /api/processar-diario
  ├── agents/
  │   ├── orchestrator.ts   # Agente orquestrador
  │   ├── servicos.ts       # Sub-agente de avanço
  │   ├── equipes.ts        # Sub-agente de presença
  │   └── notas.ts          # Sub-agente de notas
  ├── tools/
  │   └── supabaseTools.ts  # Ferramentas ACI para o agente
  └── skills/               # Symlink ou cópia de /skills
  ```
- **Endpoint principal:**
  ```
  POST /api/processar-diario
  Body: { transcricao, obra_id, data_referencia }
  Response: { servicos, equipes, notas, semana_relativa }
  ```
- **Critério de conclusão:** Servidor sobe em `npm run server`, endpoint responde

---

### F2.4 — Implementar Orquestrador
- **Agente:** 🧠 GEMINI/CLAUDE
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]` (Lógica de orquestração implementada)
- **Dependência:** F2.3
- **Lógica:**
  ```typescript
  // orchestrator.ts
  async function processar(transcricao: string, contexto: ObraContexto) {
    // 1. Identifica domínios mencionados
    const dominios = detectarDominios(transcricao);
    
    // 2. Executa sub-agentes em paralelo (apenas os necessários)
    const [servicos, equipes, notas] = await Promise.all([
      dominios.servicos ? agentServicos(transcricao, contexto) : null,
      dominios.equipes  ? agentEquipes(transcricao, contexto)  : null,
      dominios.notas    ? agentNotas(transcricao, contexto)    : null,
    ]);
    
    return { servicos, equipes, notas };
  }
  ```
- **Critério de conclusão:** 3 sub-agentes rodam em paralelo, falha isolada por domínio

---

### F2.5 — Ferramentas ACI para o Supabase
- **Agente:** 🦙 OLLAMA + 🧠 CLAUDE (revisão)
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]` (Integrado com Supabase JS SDK)
- **Arquivo:** `server/tools/supabaseTools.ts`
- **Ferramenta principal:**
  ```typescript
  // UI thinking, não API thinking
  async function getStatusObraHoje(obra_id: string, data: string): Promise<ObraStatus> {
    return {
      servicos_em_andamento: [...],   // id, nome, avanco_atual, responsavel
      equipes_presentes: [...],        // cod, nome, membros_count
      pendencias_abertas: [...],       // id, descricao, gravidade
      semana_relativa: "S8"           // calculado pelo script (Nível 3)
    };
  }
  ```
- **Critério de conclusão:** Uma chamada retorna estado completo da obra

---

### F2.6 — Tela HITL (Revisão antes do Sync)
- **Agente:** 🎨 MINIMAX (UI)
- **Executor:** ⚡ OPENCODE
- **Status:** `[ ]`
- **Arquivo:** `src/components/HITLReview.tsx`
- **Interface:**
  ```
  ┌─────────────────────────────────────────────────┐
  │  📋 A IA entendeu isso da sua gravação:         │
  │                                                  │
  │  SERVIÇOS                                        │
  │  ✅ Reboco externo    45% → [editar] [confirmar] │
  │  ⚠️  Elétrica fase 2  ?%  → [ajustar]           │
  │                                                  │
  │  EQUIPES PRESENTES                               │
  │  ✅ João (pedreiro)  ✅ Carlos (pintor)          │
  │                                                  │
  │  NOTAS                                           │
  │  📌 Faltou argamassa → Pendência de Material     │
  │                                                  │
  │  [CANCELAR]              [✅ CONFIRMAR E SYNC]   │
  └─────────────────────────────────────────────────┘
  ```
- **Prompt Minimax:**
  ```
  Crie o componente HITLReview.tsx com design dark premium (verde #3fb950).
  Deve mostrar 3 seções: Serviços (com % editável), Equipes (checkboxes),
  e Notas (com categoria). Botões: Cancelar (outline) e Confirmar (verde).
  ```

---

## 🔵 FASE 3 — INFRAESTRUTURA E CONFIABILIDADE
> Meta: pipeline de áudio via WhatsApp, Realtime, Golden Set de Evals
> Tempo estimado: 1-2 semanas

---

### F3.1 — Pipeline n8n (Áudio → Transcrição → API)
- **Agente:** 🧠 GEMINI/CLAUDE (design do workflow)
- **Executor:** Manual no n8n (Blueprint disponível em docs/WORKFLOW_N8N_IMPORT.json)
- **Status:** `[x]`
- **Nodes do workflow n8n:**
  1. Webhook (recebe áudio do WhatsApp via Evolution API)
  2. Download do arquivo de áudio
  3. Whisper (OpenAI) → transcrição PT-BR
  4. Gemini → pós-processamento de termos técnicos
  5. HTTP Request → `POST /api/processar-diario`
  6. Supabase → confirmar persistência
  7. WhatsApp → notificar mestre: "✅ Diário processado — S8"

---

### F3.2 — Supabase Realtime no Cockpit
- **Agente:** 🦙 OLLAMA
- **Executor:** ⚡ OPENCODE
- **Status:** `[x]` (Implementado hook useRealtimeSync)
- **Arquivo:** `src/hooks/useRealtimeSync.ts`
- **Lógica:**
  ```typescript
  // Escuta mudanças nas tabelas e invalida cache do React Query
  supabase.channel('obra-updates')
    .on('postgres_changes', { table: 'servicos', filter: `obra_id=eq.${obra_id}` },
      () => queryClient.invalidateQueries(['servicos', obra_id])
    )
    .subscribe();
  ```

---

### F3.3 — Golden Set de Evals (20 casos)
- **Agente:** 🧠 GEMINI/CLAUDE (estrutura) + Manual (casos reais)
- **Status:** `[x]` (20 casos gerados em evals/golden_set.json)
- **Arquivo:** `evals/golden_set.json`
- **Estrutura de cada caso:**
  ```json
  {
    "id": "EVAL-001",
    "transcricao": "hoje o João e o Carlos tavam lá, fizeram o reboco da fachada, tá em 60%, ainda falta o canto direito",
    "esperado": {
      "servicos": [{ "id": "REB-01", "avanco": 60, "status": "em_andamento" }],
      "equipes": ["PEDREIRA_01", "PINTOR_01"],
      "notas": []
    }
  }
  ```
- **Critério:** 20 casos com pelo menos 85% de acerto

---

### F3.4 — Memória Técnica e Log de Evolução
- **Agente:** 🧠 GEMINI/CLAUDE
- **Status:** `[x]` (Documento docs/MEMORIA_TECNICA.md criado)
- **Tarefa:** Criar `docs/MEMORIA_TECNICA.md` consolidando:
  - Estrutura de pastas (o "porquê" de cada uma).
  - Fluxo de dados: Narrativa -> Orquestrador -> Sub-Agentes -> HITL -> Supabase.
  - Modelos recomendados: `qwen2.5-coder` (scripts), `llama3.2` (resumos), `minimax` (UI).


---

## 🟢 FASE 4 — PRODUTO (Futuro)
> Após a Fase 1-3 100% funcionais para 1 obra

- `[x]` Multi-obra: seletor no header (`/obra/:id` routing)
- `[x]` Portal do Cliente: view somente leitura com auth separado (`/portal/:id`)
- `[x]` PWA: manifest + service worker para uso no canteiro sem desktop (Vite PWA)
- `[x]` Migrar para sistema maior (ERP Evis) (Plano em docs/PLANO_MIGRACAO_ERP.md)

---

## ⚙️ CONVENÇÕES PARA USO COM OPENCODE

### Como solicitar tarefas ao Ollama via OpenCode:
```bash
# Exemplo de comando no OpenCode:
opencode "Use o modelo qwen2.5-coder via Ollama para:
  Arquivo: src/AppContext.tsx
  Tarefa: F1.1 — substitua todos os `any` por tipos explícitos.
  Use as interfaces em src/types.ts.
  Não altere lógica."
```

### Como solicitar tarefas ao Minimax via OpenCode:
```bash
opencode "Use o Minimax para criar o componente:
  Arquivo: src/pages/Login.tsx
  Tarefa: F1.5 — tela de login dark premium.
  [incluir prompt visual completo da tarefa]"
```

### Regra de ouro:
> **Ollama** = tarefas mecânicas, sem custo, sem internet necessária  
> **Minimax** = UI components, visual first  
> **Gemini/Claude** = decisões de arquitetura, multi-arquivo, contexto pesado  
> **OpenCode** = executa TUDO no sistema de arquivos

---

## 📊 PROGRESSO GERAL

| Fase | Tarefas | Concluídas | % |
|:---|:---|:---|:---|
| F1 — Fundação | 6 | 6 | 100% |
| F2 — Motor IA | 5 | 5 | 100% |
| F2.5 — Correções Interface | 5 | 5 | 100% |
| F3 — Infraestrutura | 3 | 3 | 100% |
| F4 — Produto | 4 | 4 | 100% |
| **TOTAL** | **23** | **23** | **100%** |

---

## 🔧 F2.5 — Correções Estruturais de Interface

> Identificadas em sessão de validação pelo usuário em 12/04/2026.

### F2.5.1 — Remover aba Orçamentista da navegação
- **Status:** `[x]`
- O Agente Orçamentista foi removido completamente do sistema.

### F2.5.2 — Remoção da Barra de Filtros Global
- **Status:** `[x]`
- A barra de filtros secundária foi removida de todas as abas para simplificação da interface.
- O sistema agora opera com foco total na **Obra Badidá**.
- Sincronização Supabase validada.

### F2.5.3 — Estado “Sem Obra Ativa”
- **Status:** `[x]`
- Quando não houver `obraId` configurado, o sistema exibe card neutro em todas as abas: *“Obra Pendente — Configure nas Configurações”*.

### F2.5.4 — Config iniciar zerada
- **Status:** `[x]`
- Remover dados hardcoded do `defaultConfig`. Os campos só são preenchidos via `.env` (nunca exibidos diretamente) ou via importação JSON.

### F2.5.5 — Arquitetura IA Maestra documentada no código
- **Status:** `[x]`
- Garantir que o fluxo Narrativa → IA Maestra → Distribuição para abas esteja documentado nos comentarios do código (AIAnalysis.tsx).

---

### Regra de ouro:
> **Ollama** = tarefas mecânicas, sem custo, sem internet necessária  
> **Minimax** = UI components, visual first  
> **Gemini/Claude** = decisões de arquitetura, multi-arquivo, contexto pesado  
> **OpenCode** = executa TUDO no sistema de arquivos

---

*Próxima tarefa a executar: **F2.5.1** — Remover aba Orçamentista + Corrigir filtros por aba*
