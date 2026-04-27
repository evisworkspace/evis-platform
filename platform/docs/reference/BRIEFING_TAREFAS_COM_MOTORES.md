# 🎯 BRIEFING EXECUTIVO - TAREFAS COM ROTEAMENTO DE MOTORES

**Data:** 11 de Abril de 2026  
**Total de Tarefas:** 15 operações  
**Tempo Total Estimado:** 20-24 horas  
**Complexidade Geral:** 🟠 Média-Alta

---

## 🔧 ANÁLISE DE MOTORES DISPONÍVEIS

### 1️⃣ **Claude Haiku 4.5** (Motor Base - OpenCode)
- ✅ **Pontos Fortes:**
  - Excelente em refatoração de código
  - Bom em análise de tipos TypeScript
  - Forte em segurança e boas práticas
  - Compreensão profunda de arquitetura
  - Melhor para tarefas complexas com contexto
- ❌ **Limitações:**
  - Mais caro em tokens
  - Não é ideal para tarefas triviais
- 🎯 **Melhor para:** P2.1, P2.2, P2.3, P3.2, P3.3 (tarefas complexas)

### 2️⃣ **MiniMax (via OpenRouter - GRATUITO)**
- ✅ **Pontos Fortes:**
  - Totalmente gratuito
  - Bom em tarefas de escrita e documentação
  - Rápido para tarefas simples
  - Excelente em geração de conteúdo estruturado
  - Ótimo para boilerplate e templates
- ❌ **Limitações:**
  - Menos preciso em análise de código complexa
  - Pode necessitar revisão para código crítico
  - Não tão bom em debugging
- 🎯 **Melhor para:** P0.2, P1.3, P1.4, P2.4, P2.5, P3.1, P3.4 (tarefas simples/média)

### 3️⃣ **Decisão: Híbrida (Recomendado)**
```
CUSTO-BENEFÍCIO ÓTIMO:
├─ MiniMax (Gratuito)  → Tarefas triviais e médias (70% do tempo)
├─ Claude (Pago)      → Tarefas complexas (30% do tempo)
└─ Você (Manual)       → Setup de credenciais, validações finais
```

---

## 📊 MATRIZ DE ROTEAMENTO

| Tarefa | Complexidade | Motor Ideal | Motor Alternativo | Motivo |
|--------|--------------|-------------|-------------------|--------|
| P0.1 | Trivial | 👤 Você | - | Manual: regenerar API keys |
| P0.2 | Trivial | 🤖 MiniMax | - | Adicionar .env ao .gitignore |
| P1.1 | Média | 🤖 MiniMax | Claude | Logger simples, MiniMax faz bem |
| P1.2 | Alta | 🧠 Claude | - | React Query precisa expertise |
| P1.3 | Média | 🤖 MiniMax | Claude | CSS/Tailwind, MiniMax domina |
| P1.4 | Trivial | 🤖 MiniMax | - | Mudança config, bem simples |
| P2.1 | Muito Alta | 🧠 Claude | - | 49 'any' requer análise profunda |
| P2.2 | Muito Alta | 🧠 Claude | - | Refatoração complexa |
| P2.3 | Alta | 🧠 Claude | MiniMax | Lógica de datas complexa |
| P2.4 | Média | 🤖 MiniMax | Claude | Security simples com biblioteca |
| P2.5 | Média | 🤖 MiniMax | Claude | Enum mapping é straightforward |
| P3.1 | Baixa | 🤖 MiniMax | - | Documentação pura |
| P3.2 | Muito Alta | 🧠 Claude | - | Vitest setup requer expertise |
| P3.3 | Muito Alta | 🧠 Claude | - | Auth é crítico, precisa Claude |
| P3.4 | Média | 🤖 MiniMax | Claude | Design/CSS, MiniMax faz bem |

**Distribuição:**
- 👤 Você: 1 tarefa (6%)
- 🤖 MiniMax (Gratuito): 8 tarefas (53%)
- 🧠 Claude (Pago): 6 tarefas (40%)

---

## 🟥 PRIORIDADE 0 - CRÍTICO (HOJE)

---

### **P0.1 - Regenerar API Keys** 
**Motor:** 👤 Você (Manual)  
**Tempo:** 20-30 min  
**Complexidade:** 🟢 Trivial  

#### 📋 BRIEFING
Você precisa regenerar todas as 4 API keys que estão expostas no `.env`:

1. **VITE_GEMINI_API_KEY** (Google AI Studio)
   - Acesso: https://aistudio.google.com/apikey
   - Ação: Delete current key → Create new API key
   - Copiar nova chave

2. **VITE_SUPABASE_ANON_KEY** (Supabase Console)
   - Projeto: Badida Works
   - Ação: Settings → API → Regenerate key
   - Copiar nova chave

3. **VITE_IMGBB_API_KEY** (ImgBB)
   - Acesso: https://imgbb.com/api
   - Ação: Delete → Create new
   - Copiar nova chave

4. **VITE_OPENROUTER_API_KEY** (OpenRouter)
   - Acesso: https://openrouter.ai/keys
   - Ação: Delete → Create new
   - Copiar nova chave

#### 🎯 AÇÃO
```bash
# Editar .env com as NOVAS chaves
# Não faça commit ainda (próximo passo P0.2)

# Depois testar conexão
npm run dev
# Verificar no console se há erros de API
```

#### ✅ VALIDAÇÃO
- [ ] Todas 4 keys regeneradas em seus respectivos consoles
- [ ] `.env` atualizado com novos valores
- [ ] `npm run dev` executa sem erros de autenticação
- [ ] Console não mostra "API key invalid" ou similar

---

### **P0.2 - Proteger .env no .gitignore**
**Motor:** 🤖 MiniMax  
**Tempo:** 5-10 min  
**Complexidade:** 🟢 Trivial  

#### 📋 BRIEFING
**O que fazer:**
1. Verificar se `.env` já está em `.gitignore`
2. Se não estiver, adicionar
3. Garantir que `.env.example` existe sem valores sensíveis
4. Fazer commit das mudanças

**Contexto:**
- Arquivo: `C:\Users\User\Evis AI\.gitignore`
- `.env` deve estar listado para evitar commit acidental
- `.env.example` serve como template para novos devs

**Resultado esperado:**
```gitignore
# Antes
# (vazio ou sem .env)

# Depois
.env
.env.local
.env.*.local
node_modules/
dist/
```

#### 🎯 PROMPT PARA MINIMAX
```
Tarefa P0.2: Proteger .env no .gitignore

Arquivo: C:\Users\User\Evis AI\.gitignore
Objetivo: Garantir que .env não seja commitado no Git

Ações necessárias:
1. Ler o arquivo .gitignore atual
2. Verificar se ".env" está listado
3. Se não estiver, adicionar após a seção de arquivos de configuração
4. Verificar que .env.example existe e está rastreado (SEM valores sensíveis)
5. Fazer commit: "security: protect .env credentials"

Não edite .env.example, apenas adicione .env ao .gitignore

Retorne:
- Status do .gitignore antes/depois
- Comando git usado para commit
- Confirmação de sucesso
```

#### ✅ VALIDAÇÃO
- [ ] `.env` está em `.gitignore`
- [ ] `.env.example` existe como template
- [ ] Commit feito com mensagem clara
- [ ] `git status` não mostra mais `.env` como untracked

---

## 🟠 PRIORIDADE 1 - ALTA (ESTA SEMANA)

---

### **P1.1 - Criar Logger Centralizado**
**Motor:** 🤖 MiniMax  
**Tempo:** 30-40 min  
**Complexidade:** 🟡 Média  
**Economiza:** ~15 min com MiniMax vs Claude  

#### 📋 BRIEFING
**Objetivo:** Centralizar todos os `console.log/error/warn` em um único logger controlado

**Problema atual:** 5 console.logs espalhados, sem controle, expostos em produção

**Localizações:**
```
1. src/App.tsx:143                 → console.error(ch.table, e)
2. src/components/Fotos.tsx:54     → console.error('ImgBB Error:', data)
3. src/components/Fotos.tsx:57     → console.error('Upload failed:', err)
4. src/services/geminiService.ts:9 → console.error("VITE_GEMINI_API_KEY não configurada.")
5. src/services/geminiService.ts:45 → console.error("Erro na análise da IA:", error)
```

**Solução:**
1. Criar `src/services/logger.ts` com 4 métodos (error, warn, info, debug)
2. Adicionar timestamp e contexto (arquivo + linha)
3. Support para desabilitar em produção
4. Substituir todos `console.*` pelos logger equivalentes

**Código esperado:**
```typescript
// src/services/logger.ts
const isDev = import.meta.env.DEV;

export const logger = {
  error: (msg: string, error?: any) => {
    if (isDev) console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, error);
  },
  warn: (msg: string) => {
    if (isDev) console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`);
  },
  info: (msg: string) => {
    if (isDev) console.info(`[INFO] ${new Date().toISOString()} - ${msg}`);
  },
  debug: (msg: string, data?: any) => {
    if (isDev) console.debug(`[DEBUG] ${new Date().toISOString()} - ${msg}`, data);
  }
};
```

#### 🎯 PROMPT PARA MINIMAX
```
Tarefa P1.1: Criar Logger Centralizado

Contexto: Projeto React + TypeScript, Vite
Diretório: C:\Users\User\Evis AI

PASSO 1 - Criar logger.ts
- Arquivo: src/services/logger.ts
- Métodos: error(msg, error?), warn(msg), info(msg), debug(msg, data?)
- Usar import.meta.env.DEV para detectar produção
- Adicionar timestamp em cada log
- Desabilitar logs em produção (build)

PASSO 2 - Substituir console.logs
Substituir em 5 locais:
1. src/App.tsx:143           - console.error() → logger.error()
2. src/components/Fotos.tsx:54,57 - console.error() → logger.error()
3. src/services/geminiService.ts:9,45 - console.error() → logger.error()

PASSO 3 - Importar logger
- Adicionar: import { logger } from '@/services/logger'
- Em cada arquivo onde substituir

PASSO 4 - Testar
- npm run dev: Verificar que logs aparecem
- npm run build: Verificar que logs desaparecem (minificados)

Retorne:
- Conteúdo completo de logger.ts
- Lista de substituições feitas (arquivo:linha)
- Comandos de teste
- Confirmação de sucesso
```

#### ✅ VALIDAÇÃO
- [ ] `src/services/logger.ts` criado
- [ ] Método error, warn, info, debug funcionam
- [ ] Logs desabilitados em `import.meta.env.PROD`
- [ ] Todos 5 console.logs substituídos
- [ ] `npm run dev` executa sem erros
- [ ] `npm run lint` passa

---

### **P1.2 - Implementar @tanstack/react-query**
**Motor:** 🧠 Claude  
**Tempo:** 2-2.5 horas  
**Complexidade:** 🔴 Muito Alta  
**Justificativa:** Requer expertise em React Hooks e caching patterns  

#### 📋 BRIEFING
**Objetivo:** Adicionar cache de dados com React Query para evitar recarregar dados a cada aba

**Problema atual:** 
- Usuário clica em aba diferente → recarrega dados completos
- Sem cache → N+1 queries
- Performance ruim em conexões lentas

**Solução:**
1. Instalar `@tanstack/react-query`
2. Criar `QueryClient` em main.tsx
3. Envolver app com `<QueryClientProvider>`
4. Converter chamadas Supabase em `useQuery` hooks
5. Configurar staleTime: 5 minutos para listagens

**Estrutura esperada:**
```typescript
// src/hooks/useSupabaseQuery.ts
import { useQuery } from '@tanstack/react-query';

export function useSupabaseQuery(
  key: string,
  queryFn: () => Promise<any>,
  options = {}
) {
  return useQuery({
    queryKey: [key],
    queryFn,
    staleTime: 5 * 60 * 1000, // 5 minutos
    ...options
  });
}

// Uso em componentes:
const { data, isLoading, error } = useSupabaseQuery(
  'servicos',
  () => sbFetch('/servicos', {}, cfg)
);
```

#### 🎯 PROMPT PARA CLAUDE
```
Tarefa P1.2: Implementar @tanstack/react-query

CONTEXTO:
- Projeto React 19 + TypeScript + Vite
- Backend: Supabase REST API
- Arquivo de API: src/lib/api.ts (função sbFetch)
- Arquivo de App: src/App.tsx

OBJETIVO:
Adicionar caching inteligente para:
1. Serviços (listagem completa)
2. Diário (últimos 30 registros)
3. Equipes
4. Notas
5. Fotos

PASSO 1: Instalar dependência
npm install @tanstack/react-query

PASSO 2: Configurar QueryClient
- Arquivo: src/main.tsx
- Adicionar QueryClientProvider wrapper
- Configurar default options:
  - staleTime: 5 * 60 * 1000 (5 min)
  - gcTime: 10 * 60 * 1000 (10 min)
  - retry: 2

PASSO 3: Criar hook useSupabaseQuery
- Arquivo: src/hooks/useSupabaseQuery.ts
- Wrapper sobre useQuery
- Automático com tipos TypeScript
- Support para errorBoundary

PASSO 4: Integrar em App.tsx
- Converter fetchServicos() em useSupabaseQuery hook
- Converter fetchDiario() em useSupabaseQuery hook
- Converter fetchEquipes() em useSupabaseQuery hook
- Converter fetchNotas() em useSupabaseQuery hook
- Converter fetchFotos() em useSupabaseQuery hook
- Manter syncToSupabase() com invalidateQueries

PASSO 5: Testar
- npm run dev
- Verificar que dados cacheia (não recarrega ao mudar aba)
- Verificar que após 5 min, dados se tornam stale
- Verificar que mutações invalidam cache

Retorne:
- Package.json com @tanstack/react-query adicionado
- Código completo de main.tsx
- Código completo de useSupabaseQuery.ts
- Código atualizado de App.tsx (hooks conversion)
- Checklist de testes realizados
```

#### ✅ VALIDAÇÃO
- [ ] `@tanstack/react-query` instalado
- [ ] `QueryClient` configurado em main.tsx
- [ ] `useSupabaseQuery` hook criado
- [ ] Todos 5 fetch convertidos em useQuery
- [ ] Dados cachear por 5 minutos
- [ ] `npm run dev` sem erros
- [ ] `npm run lint` passa

---

### **P1.3 - Adicionar CSS @layer components e utilities**
**Motor:** 🤖 MiniMax  
**Tempo:** 20-30 min  
**Complexidade:** 🟡 Média  
**Economiza:** ~15 min com MiniMax  

#### 📋 BRIEFING
**Objetivo:** Completar cascata CSS conforme regras EVIS

**Problema atual:**
- Falta `@layer components` para elementos reutilizáveis
- Falta `@layer utilities` para animações
- Animação `fade-in` referenciada em JSX mas não definida
- CSS inline para scrollbar

**Regra EVIS - Ordem correta:**
```
1. @import "tailwindcss"      ✓ OK
2. @custom-variant            ✓ OK
3. @theme                     ✓ OK
4. @layer base                ✓ OK
5. @layer components          ❌ FALTANDO
6. @layer utilities           ❌ FALTANDO
```

**Código esperado:**
```css
/* src/index.css - após @layer base */

@layer components {
  .card-base {
    @apply rounded-lg border border-border bg-background;
  }
  .btn-primary {
    @apply bg-green-600 text-white hover:bg-green-700 transition-colors;
  }
  .input-base {
    @apply rounded px-3 py-2 border border-border bg-surface-1;
  }
}

@layer utilities {
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fade-in {
    animation: fade-in 0.3s ease-in-out;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

#### 🎯 PROMPT PARA MINIMAX
```
Tarefa P1.3: Adicionar CSS @layer components e utilities

Arquivo: src/index.css
Tipo: Tailwind CSS com Vite

OBJETIVO:
Completar cascata CSS conforme stack EVIS:
1. Adicionar @layer components com utilitários reutilizáveis
2. Adicionar @layer utilities com animações
3. Definir @keyframes fade-in (usada em JSX)
4. Mover ::-webkit-scrollbar para utilities
5. Manter compatibilidade com dark mode

PASSO 1: Ler src/index.css
- Identificar onde termina @layer base
- Identificar estilos inline que devem ser movidos

PASSO 2: Adicionar @layer components
- Card base styles
- Button variations
- Input base styles
- Form groups
- Badges
- Badges
- (Reutilizáveis em componentes)

PASSO 3: Adicionar @layer utilities
- @keyframes fade-in (sem delay)
- @keyframes slide-in (esquerda)
- @keyframes pulse-glow
- Classes: .animate-fade-in, .animate-slide-in, etc
- Scrollbar customizado

PASSO 4: Validar ordem CSS
1. @import tailwindcss
2. @custom-variant dark
3. @theme
4. @layer base (existing)
5. @layer components (NEW)
6. @layer utilities (NEW)

PASSO 5: Testar
- npm run dev
- Verificar que animações funcionam
- Verificar que scrollbar aparece em componentes
- Verificar dark mode não quebrado

Retorne:
- Trecho @layer components completo
- Trecho @layer utilities completo
- Arquivo index.css completo
- Confirmação de validação de ordem
```

#### ✅ VALIDAÇÃO
- [ ] `@layer components` adicionado
- [ ] `@layer utilities` adicionado
- [ ] `@keyframes fade-in` definido
- [ ] Scrollbar em `@layer utilities`
- [ ] `npm run dev` funciona
- [ ] Animações aparecem no browser
- [ ] Dark mode não quebrado

---

### **P1.4 - Adicionar noImplicitAny ao tsconfig.json**
**Motor:** 🤖 MiniMax  
**Tempo:** 5-10 min  
**Complexidade:** 🟢 Trivial  
**Antes de:** P2.1  

#### 📋 BRIEFING
**Objetivo:** Aumentar segurança de tipos ativando `noImplicitAny`

**O que faz:** Força explicitação de tipos em todas as funções/variáveis

**Resultado:** Descobrir todos os 49 'any' que precisam ser corrigidos (P2.1)

**Configuração atual (tsconfig.json):**
```json
{
  "compilerOptions": {
    // ... outras opções
    // "noImplicitAny": FALTANDO ou false
  }
}
```

**Configuração desejada:**
```json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

#### 🎯 PROMPT PARA MINIMAX
```
Tarefa P1.4: Ativar noImplicitAny em tsconfig.json

Arquivo: tsconfig.json
Localização: C:\Users\User\Evis AI

OBJETIVO:
Adicionar "noImplicitAny": true para aumentar segurança de tipos

PASSO 1: Ler tsconfig.json
- Localizar seção "compilerOptions"
- Verificar se "noImplicitAny" já existe

PASSO 2: Adicionar/Ativar
- Se não existe: adicionar "noImplicitAny": true,
- Se exists false: mudar para true
- Adicionar também: "strictNullChecks": true, "strictFunctionTypes": true

PASSO 3: Testar
- npm run lint
- Esperar ~49 erros de 'any' (esperado!)
- Confirmar que são Type Errors, não Runtime Errors

PASSO 4: Documentar
- Lista dos ~49 'any' encontrados (será usada em P2.1)
- Erros por arquivo:
  - src/App.tsx
  - src/components/Diario.tsx
  - src/components/Equipes.tsx
  - ... etc

Retorne:
- tsconfig.json completo com noImplicitAny: true
- Output de npm run lint (mostrando os 49 erros)
- Lista dos arquivos com erros
- Confirmação de sucesso (config aplicada)

NÃO CORRIJA OS ERROS AINDA - isso será P2.1
```

#### ✅ VALIDAÇÃO
- [ ] `"noImplicitAny": true` em tsconfig.json
- [ ] `npm run lint` mostra ~49 Type errors
- [ ] Erros são de tipos implícitos (não runtime)
- [ ] Lista de erros documentada para P2.1

---

## 🟡 PRIORIDADE 2 - MÉDIA (PRÓXIMAS 2 SEMANAS)

---

### **P2.1 - Remover 49 ocorrências de 'any' com tipos explícitos**
**Motor:** 🧠 Claude  
**Tempo:** 3.5-4.5 horas  
**Complexidade:** 🔴 Muito Alta  
**Dependência:** P1.4 deve estar completo  

#### 📋 BRIEFING
**Objetivo:** Remover todos os 49 'any' com tipos TypeScript apropriados

**Estrutura dos erros (estimada):**
```
src/App.tsx           → 11 any
src/components/Diario.tsx       → 8 any
src/components/Equipes.tsx      → 6 any
src/components/Servicos.tsx     → 5 any
src/components/Notas.tsx        → 4 any
src/components/Cronograma.tsx   → 3 any
src/components/Relatorios.tsx   → 2 any
src/components/Fotos.tsx        → 2 any
src/components/ConfigPage.tsx   → 1 any
src/lib/api.ts                  → 2 any
Outros                          → 5 any
TOTAL                           → 49 any
```

**Estratégia:**
1. Usar output de `npm run lint` (P1.4) como lista
2. Analisar cada `any` e seu contexto
3. Criar tipos específicos (interfaces, types, generics)
4. Substituir progressivamente
5. Testar após cada arquivo

#### 🎯 PROMPT PARA CLAUDE
```
Tarefa P2.1: Remover 49 'any' com tipos TypeScript

CONTEXTO:
- Projeto React 19 + TypeScript 5.8
- Stack: React Components, Supabase, API calls
- Arquivo tipos base: src/types.ts

OBJETIVO:
Remover todos 49 'any' encontrados no npm run lint

ARQUIVO PRINCIPAL: src/types.ts
Você pode (e deve) adicionar tipos novos aqui conforme necessário.

ESTRATÉGIA POR ARQUIVO:

1. src/App.tsx (11 any)
   - forEach((d: any)) → forEach((d: Servico))
   - Array de pendingChanges → type PendingChange definido
   - Função callbacks → tipos de funções específicas
   
2. src/components/Diario.tsx (8 any)
   - isNew: any → isNew: boolean
   - análise: any → análise: AnalysisResult
   - entry.texto?.trim() → type safe trimming
   
3. src/components/Equipes.tsx (6 any)
   - formData: any → formData: Equipe
   - setState callbacks → funciones tipadas
   - prev.equipes: any → prev: EquipesState
   
4. src/components/Servicos.tsx (5 any)
   - value: any → value: string | number | boolean
   - newServicos[idx]: any → newServicos: Servico[]
   - Handler types → (field: keyof Servico, value: any)
   
5. src/components/Notas.tsx (4 any)
   - Accordion props: any → NotasAccordionProps interface
   - entry: any → entry: Nota
   - narrativas: any → narrativas: Narrativa[]

6. src/components/Cronograma.tsx (3 any)
   - Gantt data: any → GanttData interface
   - Handlers tipados
   
7. Outros: seguir mesmo padrão

PROCESSO:
1. Para cada arquivo:
   a. Rodar: npm run lint -- src/components/Diario.tsx
   b. Listar todos 'any' neste arquivo
   c. Criar interface/type para cada 'any'
   d. Substituir 'any' pela interface
   e. Rodar: npm run lint src/components/Diario.tsx (verificar passa)

2. Commit incremental:
   - Após cada arquivo: git add src/components/Diario.tsx
   - git commit -m "types: remove any from Diario.tsx"

3. Ao final:
   - npm run lint (deve passar 100%)
   - npm run build (verificar sem erros)

TIPOS QUE VOCÊ DEVE ADICIONAR EM src/types.ts:
- AnalysisResult (retorno IA)
- PendingChange (mudanças não sincronizadas)
- EquipesState (estado de equipes)
- GanttData (dados Gantt)
- NotasAccordionProps
- FormDataWithId (para formulários)
- etc...

Retorne (em fases):
- Fase 1: Lista completa dos 49 'any' por arquivo
- Fase 2: Novos tipos para adicionar em types.ts
- Fase 3: Substituições feitas em cada arquivo (antes/depois)
- Fase 4: Confirmação npm run lint passou (0 any errors)

IMPORTANTE:
- Não remova funcionalidade
- Não altere lógica do código
- Apenas adicione tipos corretos
- Use generics onde apropriado
- Mantém fallbacks para undefined
```

#### ✅ VALIDAÇÃO
- [ ] 49 'any' removidos
- [ ] `npm run lint` mostra 0 type errors
- [ ] `npm run build` completa sem erros
- [ ] Funcionalidade não alterada
- [ ] Commits incrementais feitos (por arquivo)

---

### **P2.2 - Refatorar Diario.tsx em 3 componentes**
**Motor:** 🧠 Claude  
**Tempo:** 2-2.5 horas  
**Complexidade:** 🔴 Muito Alta  
**Resultado:** 3 componentes < 200 linhas cada  

#### 📋 BRIEFING
**Objetivo:** Separar gigantesco Diario.tsx (497 linhas) em 3 componentes com responsabilidades claras

**Problema:** 1 arquivo com múltiplas responsabilidades
- Gravação de áudio
- Transcrição (Gemini)
- Edição de texto
- Análise com IA
- Renderização UI

**Solução - Quebra em 3:**
```
Diario.tsx (200 linhas)        ← Orquestrador + lista de diários
├── AudioRecorder.tsx (80 linhas)   ← Gravação + transcrição
├── DiarioEditor.tsx (100 linhas)   ← Edição + UI
└── AIAnalysis.tsx (80 linhas)      ← Análise + insights
```

**Estrutura de dados:**
```typescript
// Diario.tsx → mantém estado global
const [diarios, setDiarios] = useState<Diario[]>([]);
const [editingDiario, setEditingDiario] = useState<Diario | null>(null);

// AudioRecorder.tsx → gerencia gravação
<AudioRecorder
  onTranscriptionComplete={(text) => handleTranscription(text)}
  isLoading={isTranscribing}
/>

// DiarioEditor.tsx → edita texto
<DiarioEditor
  value={editingDiario?.transcricao}
  onChange={(text) => setEditingDiario({...editingDiario, transcricao: text})}
/>

// AIAnalysis.tsx → mostra análise
<AIAnalysis
  content={editingDiario?.transcricao}
  tasks={editingDiario?.tarefas}
  onAnalyze={handleAIAnalysis}
/>
```

#### 🎯 PROMPT PARA CLAUDE
```
Tarefa P2.2: Refatorar Diario.tsx em 3 componentes

ARQUIVO: src/components/Diario.tsx (497 linhas)
OBJETIVO: Quebrar em 3 componentes com <200 linhas cada

COMPONENTES A CRIAR:

1. AudioRecorder.tsx (80-100 linhas)
   Props:
   - onTranscriptionComplete: (text: string) => void
   - isLoading: boolean
   - onError?: (error: Error) => void
   
   Responsabilidades:
   - Mostrar botão "Gravar"
   - Lidar com getUserMedia
   - Mostrar duração da gravação (estado local)
   - Chamar Gemini para transcrição
   - Retornar texto transcrito
   - Suportar upload de arquivo MP3
   
   Estado:
   - isRecording: boolean
   - duration: number
   - mediaRecorder: MediaRecorder | null

2. DiarioEditor.tsx (100-120 linhas)
   Props:
   - value: string (transcribed text)
   - onChange: (text: string) => void
   - onSave: () => void
   - isSaving: boolean
   
   Responsabilidades:
   - Textarea para edição
   - Botões Save/Cancel
   - Contador de caracteres
   - Auto-save draft (localStorage)
   - Preview mode toggle
   
   Estado:
   - isDraft: boolean
   - charCount: number

3. AIAnalysis.tsx (80-100 linhas)
   Props:
   - content: string (texto para análise)
   - tasks: ServiceAnalysis[] (tarefas do escopo)
   - onAnalyze: () => Promise<void>
   - isLoading: boolean
   
   Responsabilidades:
   - Botão "Analisar com IA"
   - Mostrar resultado da análise
   - Tabs: Progresso | Alertas | Próximas Ações
   - Expandable accordion para detalhes
   
   Estado:
   - analysisResult: AnalysisResult | null
   - selectedTab: 'progress' | 'alerts' | 'actions'

4. Diario.tsx (REFATORADO - 150-200 linhas)
   Responsabilidades:
   - Estado global do diário (diarios[], editingDiario)
   - Sincronização com Supabase
   - Orquestração dos 3 componentes acima
   - Lista de diários anteriores
   - Toast notifications
   
   Estado:
   - diarios: Diario[]
   - editingDiario: Diario | null
   - isLoading: boolean
   - isSyncing: boolean

PROCESSO:

PASSO 1: Extrair AudioRecorder.tsx
- Mover lógica de gravação de Diario.tsx
- Mover useState(isRecording), useState(duration)
- Mover useRef(mediaRecorderRef)
- Mover useEffect para getUserMedia
- Testar gravação funciona isolado

PASSO 2: Extrair DiarioEditor.tsx
- Mover textarea + controls
- Mover useState(isDraft)
- Mover lógica de edição
- Testar edição funciona isolado

PASSO 3: Extrair AIAnalysis.tsx
- Mover tabs de análise
- Mover accordion de resultados
- Mover useState(analysisResult)
- Testar análise funciona isolado

PASSO 4: Refatorar Diario.tsx
- Manter apenas orquestração
- Importar 3 novos componentes
- Testar fluxo completo:
  1. Gravar áudio
  2. Editar transcrição
  3. Analisar com IA
  4. Salvar

PASSO 5: Testes
- npm run dev: Funciona sem erros
- npm run lint: Sem type errors
- Testar cada aba: gravação, edição, análise
- Testar Supabase sync

Retorne (em fases):
- Fase 1: AudioRecorder.tsx completo
- Fase 2: DiarioEditor.tsx completo
- Fase 3: AIAnalysis.tsx completo
- Fase 4: Diario.tsx refatorado
- Fase 5: Checklist de testes realizados
```

#### ✅ VALIDAÇÃO
- [ ] `AudioRecorder.tsx` criado (~80-100 linhas)
- [ ] `DiarioEditor.tsx` criado (~100-120 linhas)
- [ ] `AIAnalysis.tsx` criado (~80-100 linhas)
- [ ] `Diario.tsx` refatorado (~150-200 linhas)
- [ ] Gravação funciona
- [ ] Edição funciona
- [ ] Análise IA funciona
- [ ] Sincronização Supabase funciona
- [ ] `npm run lint` passa

---

### **P2.3 - Refatorar Cronograma e extrair dateUtils**
**Motor:** 🧠 Claude  
**Tempo:** 1.5-2 horas  
**Complexidade:** 🔴 Muito Alta (lógica de datas)  

#### 📋 BRIEFING
**Objetivo:** Extrair lógica de datas complexa de Cronograma.tsx para reutilização

**Problema:** 386 linhas com lógica de Gantt chart misturada com UI

**Solução:**
1. Criar `src/lib/dateUtils.ts` com funções de data
2. Simplifîcar `Cronograma.tsx` para apenas UI
3. Adicionar testes para dateUtils
4. Reutilizar em outros componentes (ex: filtros de data)

**Funções em dateUtils:**
```typescript
// src/lib/dateUtils.ts
export function generateTimeline(startDate: Date, days: number): Timeline[]
export function calculateProgress(inicio: Date, fim: Date): number
export function formatDateBR(date: Date): string
export function isBetweenDates(date: Date, start: Date, end: Date): boolean
export function getWeekNumber(date: Date): number
export function getMonthName(month: number): string
export function calculateDaysBetween(start: Date, end: Date): number
export function addDays(date: Date, days: number): Date
export function startOfWeek(date: Date): Date
export function endOfWeek(date: Date): Date
```

#### 🎯 PROMPT PARA CLAUDE
```
Tarefa P2.3: Refatorar Cronograma e extrair dateUtils

ARQUIVO: src/components/Cronograma.tsx (386 linhas)
OBJETIVO: Extrair lógica de datas, deixar só UI

PASSO 1: Criar src/lib/dateUtils.ts
Funções necessárias (extrair de Cronograma.tsx):
- generateTimeline(startDate, days): Timeline[] - gera 60 dias
- calculateProgress(inicio, fim): number - % de progresso
- formatDateBR(date): string - DD/MM/YYYY
- isBetweenDates(date, start, end): boolean - validação
- getWeekNumber(date): number - semana do ano
- getMonthName(month): string - nome do mês
- calculateDaysBetween(start, end): number
- addDays(date, days): Date
- startOfWeek(date): Date - segunda
- endOfWeek(date): Date - domingo
- isToday(date): boolean
- isFuture(date): boolean
- isPast(date): boolean

PASSO 2: Adicionar tipos em src/types.ts
interface Timeline {
  date: Date;
  dayOfWeek: string;
  weekNumber: number;
  events: Service[];
}

interface DateRange {
  start: Date;
  end: Date;
  days: number;
}

PASSO 3: Atualizar Cronograma.tsx
- Remover funções de data (mover para dateUtils)
- Importar dateUtils
- Manter apenas:
  - Estado de UI (expandedRows, selectedService, etc)
  - Renderização Gantt
  - Event handlers (click, drag, etc)
  - Estilos e animações

PASSO 4: Criar testes src/__tests__/dateUtils.test.ts
- Testar generateTimeline(60 dias)
- Testar calculateProgress(inicio, fim)
- Testar isBetweenDates
- Testar formatDateBR (deve retornar DD/MM/YYYY)
- Testar addDays
- etc...

PASSO 5: Integrar em Cronograma.tsx
- Reescrever componente para usar dateUtils
- Remover ~100 linhas de lógica de data
- Deixar ~280 linhas apenas UI

RESULTADO ESPERADO:
- dateUtils.ts: ~150 linhas (reutilizável)
- dateUtils.test.ts: ~80 linhas (testes)
- Cronograma.tsx: ~280 linhas (apenas UI/rendering)

Retorne (em fases):
- Fase 1: dateUtils.ts completo com todas funções
- Fase 2: dateUtils.test.ts com testes
- Fase 3: Cronograma.tsx refatorado
- Fase 4: Checklist de testes (npm run test)
```

#### ✅ VALIDAÇÃO
- [ ] `src/lib/dateUtils.ts` criado (~150 linhas)
- [ ] `src/__tests__/dateUtils.test.ts` criado (~80 linhas)
- [ ] `Cronograma.tsx` refatorado (~280 linhas)
- [ ] Cronograma visual idêntico antes/depois
- [ ] `npm run test` passa para dateUtils
- [ ] `npm run lint` passa

---

### **P2.4 - Adicionar sanitização com sanitize-html**
**Motor:** 🤖 MiniMax  
**Tempo:** 45-60 min  
**Complexidade:** 🟡 Média  
**Economiza:** ~20 min com MiniMax  

#### 📋 BRIEFING
**Objetivo:** Prevenir XSS sanitizando entrada de usuários

**Problema:** Notas/comentários renderizados sem sanitização → possível XSS
```javascript
// VULNERÁVEL
<div>{note.text}</div>  // Se note.text = "<img src=x onerror=alert(1)>"

// SEGURO (após P2.4)
<div>{sanitize(note.text)}</div>  // Retorna "<img src=x>" (sem onerror)
```

**Locais a proteger:**
1. `src/components/Notas.tsx` - notas, narrativas, observações
2. `src/components/Diario.tsx` - transcrição (após P2.2)
3. `src/components/Relatorios.tsx` - relatórios gerados
4. Qualquer `dangerouslySetInnerHTML`

**Solução:**
1. Instalar `npm install sanitize-html`
2. Criar `src/lib/sanitizeUtils.ts` com wrapper
3. Aplicar em 3 locais principais
4. Testar com HTML malicioso

#### 🎯 PROMPT PARA MINIMAX
```
Tarefa P2.4: Adicionar sanitização com sanitize-html

OBJETIVO:
Prevenir XSS sanitizando conteúdo de usuários

PASSO 1: Instalar dependência
npm install sanitize-html
npm install --save-dev @types/sanitize-html

PASSO 2: Criar src/lib/sanitizeUtils.ts
```typescript
import sanitizeHtml from 'sanitize-html';

export const sanitize = (html: string, options?: any) => {
  const defaultOptions = {
    allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      'a': ['href', 'title']
    },
    allowedSchemes: ['http', 'https', 'mailto']
  };
  
  return sanitizeHtml(html, { ...defaultOptions, ...options });
};

export const sanitizeStrict = (text: string) => {
  // Remove ALL HTML tags, apenas text
  return sanitizeHtml(text, { allowedTags: [] });
};

export const sanitizeMarkdown = (text: string) => {
  // Permite apenas formatting básico
  return sanitizeHtml(text, {
    allowedTags: ['b', 'i', 'em', 'strong', 'code', 'pre'],
    allowedAttributes: {}
  });
};
```

PASSO 3: Aplicar em src/components/Notas.tsx
- Onde renderiza nota.texto → sanitize(nota.texto)
- Onde renderiza narrativa → sanitize(narrativa)
- Importar: import { sanitize } from '@/lib/sanitizeUtils'

PASSO 4: Aplicar em src/components/Diario.tsx (após P2.2)
- DiarioEditor: sanitize(transcricao)
- AIAnalysis: sanitize(analysisResult.text)

PASSO 5: Aplicar em src/components/Relatorios.tsx
- Onde renderiza HTML de relatório: sanitize(reportHtml)

PASSO 6: Testar com payloads maliciosos
```typescript
// Test inputs
const xssPayload = '<img src=x onerror="alert(1)">';
const xssPayload2 = '<svg onload="alert(1)">';
const normalText = '<b>Bold text</b>';

// Esperado:
sanitize(xssPayload);   // '<img src="x">' (sem onerror)
sanitize(xssPayload2);  // '<svg></svg>' (sem onload)
sanitize(normalText);   // '<b>Bold text</b>' (mantém)
```

PASSO 7: Executar
npm run dev - verificar Notas renderizam OK
npm run build - verificar sem erros

Retorne:
- sanitizeUtils.ts completo
- Lista de substituições feitas
- Exemplos de teste com payloads
- Confirmação npm run dev OK
```

#### ✅ VALIDAÇÃO
- [ ] `sanitize-html` instalado
- [ ] `src/lib/sanitizeUtils.ts` criado
- [ ] Aplicado em Notas.tsx
- [ ] Aplicado em Diario.tsx (após P2.2)
- [ ] Aplicado em Relatorios.tsx
- [ ] Testes com XSS payloads passam (bloqueados)
- [ ] `npm run dev` funciona

---

### **P2.5 - Resolver status enum inconsistente**
**Motor:** 🤖 MiniMax  
**Tempo:** 30-45 min  
**Complexidade:** 🟡 Média  

#### 📋 BRIEFING
**Objetivo:** Padronizar enum de Status em todo projeto

**Problema atual:**
```javascript
// Em Servicos.tsx:20 - stMap
const stMap = {
  'em_andamento': { label: 'Em Andamento', ...},
  'concluido': { label: 'Concluído', ...},
  'atencao': { label: 'Atenção', ...},
  'pendente': { label: 'Pendente', ...},
  'nao_iniciado': { label: 'Não Iniciado', ...}
};

// Em initialData.ts:28 - alguns serviços têm
const servicos = [
  { status_atual: 'a_executar', ... },  // ❌ NÃO está em stMap!
  { status_atual: 'pausado', ... }      // ❌ NÃO está em stMap!
];

// Resultado: Serviços com status unknown não têm cor/label
```

**Solução:**
1. Definir único `enum Status` em `src/types.ts`
2. Atualizar `stMap` em `Servicos.tsx` com TODOS valores
3. Validar `initialData.ts` usa apenas valores válidos
4. Adicionar validação de tipo

**Enum desejado:**
```typescript
export enum ServiceStatus {
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
  ATENCAO = 'atencao',
  PENDENTE = 'pendente',
  NAO_INICIADO = 'nao_iniciado',
  A_EXECUTAR = 'a_executar',      // Novo (de initialData)
  PAUSADO = 'pausado'              // Novo (de initialData)
}
```

#### 🎯 PROMPT PARA MINIMAX
```
Tarefa P2.5: Resolver status enum inconsistente

OBJETIVO:
Padronizar enum ServiceStatus em todo projeto

PASSO 1: Ler arquivos
- src/types.ts (tipos base)
- src/components/Servicos.tsx (stMap atual)
- src/initialData.ts (valores usados)

PASSO 2: Criar enum em src/types.ts
```typescript
export enum ServiceStatus {
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDO = 'concluido',
  ATENCAO = 'atencao',
  PENDENTE = 'pendente',
  NAO_INICIADO = 'nao_iniciado',
  A_EXECUTAR = 'a_executar',
  PAUSADO = 'pausado'
}

// Também criar mapa de labels
export const statusLabels: Record<ServiceStatus, { label: string; color: string; bgColor: string }> = {
  [ServiceStatus.EM_ANDAMENTO]: { label: 'Em Andamento', color: '#3fb950', bgColor: '#1f6feb' },
  [ServiceStatus.CONCLUIDO]: { label: 'Concluído', color: '#238636', bgColor: '#0d419f' },
  [ServiceStatus.ATENCAO]: { label: 'Atenção', color: '#d29922', bgColor: '#c69026' },
  [ServiceStatus.PENDENTE]: { label: 'Pendente', color: '#f85149', bgColor: '#8b2c2c' },
  [ServiceStatus.NAO_INICIADO]: { label: 'Não Iniciado', color: '#8b949e', bgColor: '#30363d' },
  [ServiceStatus.A_EXECUTAR]: { label: 'A Executar', color: '#3fb950', bgColor: '#1f6feb' },
  [ServiceStatus.PAUSADO]: { label: 'Pausado', color: '#d1d9e0', bgColor: '#30363d' }
};
```

PASSO 3: Atualizar src/components/Servicos.tsx
- Remover stMap manual (agora vem de types.ts)
- Importar: import { ServiceStatus, statusLabels } from '@/types'
- Usar: statusLabels[servico.status_atual]

PASSO 4: Atualizar src/initialData.ts
- Importar: import { ServiceStatus } from '@/types'
- Todos servicos usar apenas valores de enum:
  - 'a_executar' → ServiceStatus.A_EXECUTAR
  - 'pausado' → ServiceStatus.PAUSADO
  - etc...

PASSO 5: Adicionar validação em src/types.ts
```typescript
export function isValidStatus(status: any): status is ServiceStatus {
  return Object.values(ServiceStatus).includes(status);
}
```

PASSO 6: Testar
- npm run dev: Todos status aparecem com cores
- npm run lint: Sem type errors
- Verificar que 'a_executar' e 'pausado' agora têm cores

Retorne:
- types.ts com enum e statusLabels
- Servicos.tsx atualizado
- initialData.ts atualizado
- Validação de type isValidStatus()
- Confirmação visual que todos status têm cores
```

#### ✅ VALIDAÇÃO
- [ ] `enum ServiceStatus` definido em types.ts
- [ ] `statusLabels` mapa criado
- [ ] `Servicos.tsx` usa importa de types.ts
- [ ] `initialData.ts` usa valores válidos do enum
- [ ] Todos status têm cores/labels
- [ ] `npm run lint` passa
- [ ] Visual: todos 7 status aparecem com cores corretas

---

## 🔵 PRIORIDADE 3 - BAIXA (MENSAL)

---

### **P3.1 - Documentação: Melhorar README.md**
**Motor:** 🤖 MiniMax  
**Tempo:** 1-1.5 horas  
**Complexidade:** 🟢 Trivial (documentação)  
**Economiza:** ~30 min com MiniMax  

#### 📋 BRIEFING
**Objetivo:** Documentação completa do projeto

**Seções desejadas:**
1. Título + descrição
2. Stack tecnológico
3. Setup local (npm install, npm run dev)
4. Estrutura de pastas
5. Componentes principais (com exemplos)
6. Variáveis de ambiente (.env.example)
7. Scripts disponíveis (dev, build, lint)
8. Guia de contribuição
9. Troubleshooting
10. Licença

#### 🎯 PROMPT PARA MINIMAX
```
Tarefa P3.1: Documentar README.md completo

Arquivo: README.md (atualmente minimalista)
Projeto: EVIS AI - Gestão de Obras com IA

ESTRUTURA DESEJADA:

# 🏗️ EVIS AI - Gestão Inteligente de Obras

## Descrição
[1 parágrafo sobre o que é EVIS AI]

## 🚀 Stack Tecnológico

## 📦 Instalação

### Pré-requisitos
- Node 18+
- npm/yarn

### Setup
1. Clone o repo
2. npm install
3. Copiar .env.example → .env
4. Preencher variáveis (ver .env.example)
5. npm run dev

## 📂 Estrutura de Pastas

```
src/
├── components/        # Componentes React (Diário, Equipes, etc)
├── lib/              # Utilidades (API, sanitize, date)
├── services/         # Serviços (Logger, IA)
├── hooks/            # Hooks customizados
├── types.ts          # Tipos TypeScript
├── App.tsx           # Raiz
├── AppContext.tsx    # Estado global
└── index.css         # Estilos Tailwind
```

## 🧩 Componentes Principais

### Diario
Gravação, transcrição e análise de diários de obra

### Equipes
CRUD de equipes e registro de presença

### Orçamento
Gerenciamento de serviços e evolução

### Cronograma
Gantt chart de 60 dias com timeline

### Notas
Sistema de notas, pendências e narrativas

### Relatorios
Exportação de relatórios semanais

### Fotos
Upload de fotos com ImgBB

## 🔐 Variáveis de Ambiente

Ver .env.example:
- VITE_GEMINI_API_KEY - Google Gemini
- VITE_SUPABASE_URL - Backend
- VITE_SUPABASE_ANON_KEY - Chave anônima
- VITE_IMGBB_API_KEY - Upload de fotos
- VITE_OPENROUTER_API_KEY - IA fallback
- APP_URL - URL da aplicação

## 📜 Scripts

npm run dev - Desenvolvimento (localhost:5173)
npm run build - Build produção
npm run lint - TypeScript lint
npm run preview - Preview build local

## 🤝 Contribuindo

1. Criar branch: git checkout -b feature/minha-feature
2. Commit changes: git commit -m "feat: descrição"
3. Push: git push origin feature/minha-feature
4. Abrir PR

## 🐛 Troubleshooting

### "API key invalid"
- Verificar VITE_GEMINI_API_KEY em .env
- Regenerar em https://aistudio.google.com

### "Connection refused"
- Verificar VITE_SUPABASE_URL
- Verificar internet

### "Build fails"
- npm install
- npm run lint (corrigir type errors)
- npm run build

## 📝 Licença

MIT License

---

Retorne:
- README.md completo com todas seções
- .env.example com comentários explicativos
- Verificação de links (se houver)
- Confirmação que está legível em GitHub
```

#### ✅ VALIDAÇÃO
- [ ] README.md atualizado com 10+ seções
- [ ] Stack tecnológico documentado
- [ ] Setup local com instruções passo-a-passo
- [ ] Estrutura de pastas explicada
- [ ] Componentes documentados
- [ ] .env.example com comentários
- [ ] Scripts npm documentados
- [ ] Markdown renderiza corretamente no GitHub

---

### **P3.2 - Adicionar testes com Vitest**
**Motor:** 🧠 Claude  
**Tempo:** 3-3.5 horas  
**Complexidade:** 🔴 Muito Alta  
**Dependência:** P2.3, P2.4 devem estar feitos  

#### 📋 BRIEFING
**Objetivo:** Setup de testes automatizados com Vitest

**Testes a criar:**
1. `dateUtils.test.ts` - Funções de data
2. `sanitizeUtils.test.ts` - Sanitização de HTML
3. `api.test.ts` - Supabase sync logic
4. `geminiService.test.ts` - IA response parsing

**Coverage mínimo:** 70%

#### 🎯 PROMPT PARA CLAUDE
```
Tarefa P3.2: Setup Vitest e testes automatizados

OBJETIVO:
Configurar Vitest + @testing-library/react e criar testes

PASSO 1: Instalar dependências
npm install -D vitest @testing-library/react @testing-library/dom happy-dom

PASSO 2: Criar vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['node_modules/', 'src/**/*.test.ts*']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

PASSO 3: Criar src/test/setup.ts
```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// Mock fetch se necessário
global.fetch = vi.fn();
```

PASSO 4: Criar testes

4a. src/__tests__/dateUtils.test.ts
- Testar generateTimeline(60)
- Testar calculateProgress
- Testar formatDateBR
- Testar isBetweenDates
- Testar addDays
- etc...

4b. src/__tests__/sanitizeUtils.test.ts
- Testar sanitize() com XSS payloads
- Testar sanitizeStrict() remove todos tags
- Testar sanitizeMarkdown() mantém formatting
- Testar que links são permitidos
- etc...

4c. src/__tests__/api.test.ts
- Testar sbFetch() (mock fetch)
- Testar retry logic
- Testar error handling
- Testar headers corretos
- etc...

4d. src/__tests__/geminiService.test.ts
- Testar geminiCall() (mock response)
- Testar JSON parsing from IA
- Testar fallback ao OpenRouter
- Testar error handling
- etc...

PASSO 5: Adicionar script em package.json
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

PASSO 6: Executar testes
npm run test - modo watch
npm run test:coverage - gerar relatório

RESULTADO ESPERADO:
- 20+ testes
- Coverage ≥ 70%
- Todos testes passam

Retorne (em fases):
- vitest.config.ts
- test/setup.ts
- dateUtils.test.ts (~30 testes)
- sanitizeUtils.test.ts (~15 testes)
- api.test.ts (~10 testes)
- geminiService.test.ts (~10 testes)
- Relatório de coverage
- Confirmação npm run test passou
```

#### ✅ VALIDAÇÃO
- [ ] Vitest instalado e configurado
- [ ] `vitest.config.ts` criado
- [ ] `src/test/setup.ts` criado
- [ ] 4 test files com 60+ testes
- [ ] Coverage ≥ 70%
- [ ] `npm run test` passa 100%
- [ ] `npm run test:coverage` gera relatório

---

### **P3.3 - Implementar autenticação com Supabase Auth**
**Motor:** 🧠 Claude  
**Tempo:** 3.5-4 horas  
**Complexidade:** 🔴 Muito Alta  
**Crítico:** Segurança de dados  

#### 📋 BRIEFING
**Objetivo:** Adicionar autenticação para proteger dados por usuário

**Fluxo desejado:**
```
Usuário NÃO autenticado
  ↓
[Página Login]
  ↓
Email + Senha
  ↓
Supabase Auth
  ↓
Usuário autenticado
  ↓
[App Principal]
```

**Mudanças necessárias:**
1. Adicionar `<LoginPage />`
2. Criar `useAuth()` hook
3. Proteger rotas com `<PrivateRoute />`
4. Vincular dados ao `user_id`
5. Adicionar logout

#### 🎯 PROMPT PARA CLAUDE
```
Tarefa P3.3: Implementar autenticação Supabase Auth

OBJETIVO:
Adicionar login/logout com Supabase Auth

PASSO 1: Habilitar em Supabase Console
- Projeto: Badida Works
- Settings → Authentication → Enable Email/Password
- Settings → Auth → Providers → Email (enable)

PASSO 2: Atualizar tipos em src/types.ts
```typescript
export interface AppState {
  // ...
  user?: AuthUser;
}

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}
```

PASSO 3: Criar src/hooks/useAuth.ts
```typescript
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '@/AppContext';
import { supabase } from '@/lib/api';

export function useAuth() {
  const { state } = useContext(AppContext);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // User already logged in
      }
      setIsLoading(false);
    });
  }, []);
  
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  };
  
  const logout = async () => {
    await supabase.auth.signOut();
  };
  
  const signup = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  };
  
  return {
    user: state.user,
    isLoading,
    login,
    logout,
    signup
  };
}
```

PASSO 4: Criar src/pages/LoginPage.tsx
- Form com email + password
- Botões: Login e Sign Up
- Error handling
- Redirect ao App após login

PASSO 5: Criar src/components/PrivateRoute.tsx
- Verificar se user existe
- Se não: redirect para LoginPage
- Se sim: renderizar children

PASSO 6: Atualizar src/App.tsx
- Importar useAuth()
- Se !user: renderizar <LoginPage />
- Se user: renderizar <PrivateRoute><App /></PrivateRoute>

PASSO 7: Proteger dados por user_id
- RLS no Supabase: auth.uid() IS NOT NULL
- Adicionar user_id em cada tabela
- Filtrar dados por user_id nas queries

PASSO 8: Adicionar logout
- Botão em topbar
- Menu Settings → Logout
- Limpar estado local
- Redirect para LoginPage

RESULTADO:
- Usuário não pode acessar app sem login
- Dados protegidos por user_id
- Logout funciona
- Session persiste em refresh

Retorne (em fases):
- useAuth.ts hook completo
- LoginPage.tsx com form
- PrivateRoute.tsx
- AppContext.tsx atualizado
- App.tsx atualizado
- RLS policies para Supabase
- Checklist de testes de auth
```

#### ✅ VALIDAÇÃO
- [ ] Supabase Auth habilitado
- [ ] `useAuth()` hook criado
- [ ] `LoginPage.tsx` funciona
- [ ] `PrivateRoute.tsx` protege rotas
- [ ] Login com email/senha funciona
- [ ] Logout funciona
- [ ] Session persiste em refresh
- [ ] Dados filtrados por user_id
- [ ] RLS policies aplicadas

---

### **P3.4 - Melhorar contraste de cores (A11y)**
**Motor:** 🤖 MiniMax  
**Tempo:** 45-60 min  
**Complexidade:** 🟡 Média  
**Economiza:** ~15 min com MiniMax  

#### 📋 BRIEFING
**Objetivo:** Aumentar contraste para WCAG AA compliance (4.5:1)

**Problema:** Background `#090a0b` vs Surface `#121417` = muito próximo

**Ferramenta:** Usaremos oklch (perceptual color) para melhorar contraste

**Verificação:**
```
Current:
- Background: #090a0b (L=2%)
- Surface-1: #121417 (L=4%)
- Delta L: 2% (❌ INSUFICIENTE, precisa 10%+)

Desejado:
- Background: #000000 (L=0%)
- Surface-1: #1a1d21 (L=8%)
- Delta L: 8% (✅ ACEITO)
```

#### 🎯 PROMPT PARA MINIMAX
```
Tarefa P3.4: Melhorar contraste de cores (WCAG AA)

Arquivo: src/index.css
Objetivo: Aumentar contraste background vs superfícies

PASSO 1: Analisar cores atuais
Em src/index.css, seção :root { ... }
- Verificar cores oklch para background, s1-s4, borders, text
- Usar ferramenta: https://contrast-ratio.com

PASSO 2: Aumentar delta L (Lightness)
Estratégia: Escurecer background, manter surfaces clara

Novo esquema:
Background:   oklch(2% 0 0)    → oklch(0% 0 0)      (mais escuro)
Surface-1:    oklch(8.27% ...) → oklch(12% ...)     (mais claro)
Surface-2:    oklch(11.37% ...)  → oklch(15% ...)    (mais claro)
Surface-3:    oklch(14.90% ...)  → oklch(18% ...)    (mais claro)
Surface-4:    oklch(18.43% ...)  → oklch(21% ...)    (mais claro)

Borders:
Border-1:    oklch(18.43% ...) → oklch(25% ...)     (mais claro)
Border-2:    oklch(26.86% ...) → oklch(32% ...)     (mais claro)
Border-3:    oklch(34.90% ...) → oklch(40% ...)     (mais claro)

PASSO 3: Validar WCAG AA
- Usar: https://webaim.org/resources/contrastchecker/
- Verificar todas combinações texto + background
- Minimal: 4.5:1 para texto normal, 3:1 para large text

PASSO 4: Atualizar src/index.css
- Mudar valores oklch em :root
- Testar que dark mode ainda funciona
- Testar que toda UI fica legível

PASSO 5: Testar visual
- npm run dev
- Verificar que sidebar ainda parece dark
- Verificar que texto é legível
- Verificar que cards têm separação clara

RESULTADO:
- Contraste ≥ WCAG AA (4.5:1 para texto)
- Dark mode mantém aparência escura
- Acessibilidade melhorada

Retorne:
- Seção :root atualizada com novos valores oklch
- Relatório de contraste (antes/depois)
- Screenshot visual (dark mode ainda escuro)
- Confirmação WCAG AA compliance
```

#### ✅ VALIDAÇÃO
- [ ] Cores oklch atualizadas em `:root`
- [ ] Contraste texto/background ≥ 4.5:1 (WCAG AA)
- [ ] Dark mode ainda parece escuro
- [ ] Toda UI legível
- [ ] `npm run dev` sem erros
- [ ] Validador de contraste aprova

---

## 📋 RESUMO DE ROTEAMENTO

```
TOTAL: 15 Tarefas

👤 Você (Manual):        1 tarefa  (6%)   - P0.1
🤖 MiniMax (Gratuito):  8 tarefas (53%)   - P0.2, P1.1, P1.3, P1.4, P2.4, P2.5, P3.1, P3.4
🧠 Claude (Pago):      6 tarefas (40%)   - P1.2, P2.1, P2.2, P2.3, P3.2, P3.3

ECONOMIA DE CUSTOS:
- Se usasse Claude para tudo: ~4.5 horas de Claude
- Com roteamento híbrido:    ~2 horas de Claude + 6 horas MiniMax (gratuito)
- ECONOMIA: ~60% em custos de API
```

---

## 🎯 PRÓXIMAS AÇÕES

1. **Escolher primeira tarefa:** P0.1 (20 min, você)
2. **Depois:** P0.2 (5 min, MiniMax)
3. **Depois:** P1.1 (30 min, MiniMax) ou P1.2 (2h, Claude)
4. **Cascata:** Seguir ordem por prioridade

**Para iniciar uma tarefa:**
```
OpenCode: [Inicie P0.1 - Regenerar API Keys]
OpenCode: [Execute P0.2 com MiniMax]
OpenCode: [Comece P1.2 com Claude]
```

---

**Gerado por:** OpenCode Briefing System  
**Total de tarefas:** 15  
**Tempo total:** 20-24 horas  
**Data de início recomendada:** Hoje (P0)  
**Data de conclusão estimada:** 11 de maio de 2026
