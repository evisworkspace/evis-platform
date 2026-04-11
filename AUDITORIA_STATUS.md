# 📊 AUDITORIA EVIS AI - STATUS E TAREFAS

**Data da Auditoria:** 11 de Abril de 2026  
**Status Geral:** ⚠️ 78/100 - Funcional com melhorias necessárias  
**Última Atualização:** 11/04/2026

---

## 🎯 RESUMO EXECUTIVO

| Métrica | Status |
|---------|--------|
| **Build** | ✅ Sem erros |
| **TypeScript Lint** | ✅ Pass |
| **Componentes** | ✅ 8 bem estruturados |
| **Stack** | ✅ React 19 + TS 5.8 + Tailwind 4 |
| **Segurança** | ⚠️ Credenciais expostas |
| **Performance** | ⚠️ Sem cache de dados |
| **Tipagem** | ⚠️ 49 'any' encontrados |
| **Testes** | ❌ Nenhum teste automatizado |

---

## 🔴 P0 - CRÍTICO (Hoje - Segurança)

### ✋ P0.1 - Remover credenciais do .env e regenerar API keys
- **Arquivo:** `.env`
- **Problema:** Credenciais expostas podem ser roubadas se repo for público
- **Ações necessárias:**
  1. Regenerar `VITE_GEMINI_API_KEY` no Google AI Studio
  2. Regenerar `VITE_SUPABASE_ANON_KEY` no Supabase Console
  3. Regenerar `VITE_IMGBB_API_KEY` no ImgBB
  4. Regenerar `VITE_OPENROUTER_API_KEY` no OpenRouter
  5. Atualizar `.env` com novas chaves
  6. Fazer commit das mudanças
- **Arquivo a editar:** `C:\Users\User\Evis AI\.env`
- **Comando verificação:** `cat .env | grep VITE_`
- **Agente recomendado:** Qualquer um (tarefa manual principalmente)
- **Tempo estimado:** 15-20 minutos

---

### ✋ P0.2 - Proteger .env no .gitignore
- **Arquivo:** `.gitignore`
- **Problema:** `.env` pode ser acidentalmente commitado
- **Ações necessárias:**
  1. Verificar se `.env` está em `.gitignore`
  2. Adicionar `.env` se não estiver
  3. Manter `.env.example` sem valores sensíveis
  4. Commit da mudança
- **Arquivo a editar:** `C:\Users\User\Evis AI\.gitignore`
- **Comando verificação:** `grep ".env" .gitignore`
- **Agente recomendado:** Qualquer um (trivial)
- **Tempo estimado:** 2 minutos

---

## 🟠 P1 - ALTA PRIORIDADE (Esta Semana - Performance/Qualidade)

### 👨‍💻 P1.1 - Criar logger centralizado e remover console.logs
- **Arquivos afetados:** 5 arquivos
  - `src/App.tsx:143`
  - `src/components/Fotos.tsx:54,57`
  - `src/services/geminiService.ts:9,45`
- **Problema:** console.logs expostos em produção, sem controle centralizado
- **Ações necessárias:**
  1. Criar `src/services/logger.ts` com níveis (error, warn, info, debug)
  2. Adicionar timestamp e contexto
  3. Suportar logger remoto (opcional)
  4. Substituir todos `console.*` por `logger.*`
  5. Testar que logs não aparecem em produção
- **Arquivo novo:** `src/services/logger.ts`
- **Arquivos a editar:** 5 arquivos acima
- **Agente recomendado:** `general` ou você mesmo
- **Tempo estimado:** 30 minutos
- **Exemplo:**
  ```typescript
  // Criar src/services/logger.ts
  export const logger = {
    error: (msg: string, err?: any) => console.error(`[ERROR] ${msg}`, err),
    warn: (msg: string) => console.warn(`[WARN] ${msg}`),
    info: (msg: string) => console.log(`[INFO] ${msg}`),
    debug: (msg: string) => console.debug(`[DEBUG] ${msg}`)
  };
  ```

---

### 👨‍💻 P1.2 - Implementar @tanstack/react-query para cache
- **Problema:** Sem cache - cada aba recarrega dados completos
- **Ações necessárias:**
  1. Instalar `npm install @tanstack/react-query`
  2. Configurar QueryClient em `main.tsx`
  3. Envolver app com `<QueryClientProvider>`
  4. Converter chamadas Supabase em `useQuery` hooks
  5. Definir staleTime: 5 minutos para listagens
  6. Testar que dados em cache não recarregam
- **Arquivos a criar:** `src/hooks/useSupabaseQuery.ts`
- **Arquivos a editar:** `src/main.tsx`, `src/App.tsx`, componentes
- **Agente recomendado:** `general` (conhecer React Query)
- **Tempo estimado:** 2 horas
- **Priority:** Alta - impacto performance

---

### 👨‍💻 P1.3 - Adicionar @layer components ao CSS
- **Arquivo:** `src/index.css`
- **Problema:** CSS cascade incompleto, sem @layer components e utilities
- **Ações necessárias:**
  1. Adicionar `@layer components { }` após @layer base
  2. Mover estilos customizados para @layer components
  3. Adicionar `@layer utilities { }` para animações
  4. Definir `@keyframes fade-in` referenciada em JSX
  5. Testar que estilos aplicam corretamente
- **Arquivo a editar:** `src/index.css`
- **Agente recomendado:** Qualquer um (CSS simples)
- **Tempo estimado:** 20 minutos
- **Exemplo:**
  ```css
  @layer components {
    .card-hover {
      @apply transition-all hover:shadow-lg;
    }
  }
  
  @layer utilities {
    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .animate-fade-in {
      animation: fade-in 0.3s ease-in-out;
    }
  }
  ```

---

### 👨‍💻 P1.4 - Aumentar tsconfig para noImplicitAny
- **Arquivo:** `tsconfig.json`
- **Problema:** 49 ocorrências de 'any' reduzem segurança de tipos
- **Ações necessárias:**
  1. Adicionar `"noImplicitAny": true` em tsconfig.json
  2. Rodar `npm run lint` para ver todos os erros
  3. Decidir: corrigir todos ou em fases
  4. Se corrigir: ver tarefas P2.1
- **Arquivo a editar:** `tsconfig.json`
- **Agente recomendado:** `general` (pode encontrar 49 erros)
- **Tempo estimado:** 5 minutos (apenas config) ou 4 horas (se corrigir)
- **Dependência:** Ver P2.1 para corrigir os 49 'any'

---

## 🟡 P2 - MÉDIA PRIORIDADE (Próximas 2 Semanas - Qualidade)

### 👨‍💻 P2.1 - Remover 49 ocorrências de 'any' com tipos explícitos
- **Arquivos afetados:** Múltiplos (9 arquivos)
  - `src/App.tsx` (11 any)
  - `src/components/Diario.tsx` (8 any)
  - `src/components/Equipes.tsx` (6 any)
  - `src/components/Servicos.tsx` (5 any)
  - `src/components/Notas.tsx` (4 any)
  - Outros (15 any)
- **Problema:** Reduz segurança de tipos, dificulta refatoração
- **Ações necessárias:**
  1. Rodar `npm run lint -- --noImplicitAny` (após P1.4)
  2. Identificar cada `any` e seu contexto
  3. Criar tipos específicos (interfaces/types)
  4. Substituir `any` por tipos corretos
  5. Testar que lint passa
- **Agente recomendado:** `general` (grande tarefa)
- **Tempo estimado:** 4 horas
- **Exemplo:**
  ```typescript
  // ANTES
  const handleUpdate = (idOrSrvId: string, field: string, value: any) => { }
  
  // DEPOIS
  interface UpdateField {
    id?: string;
    srvId?: string;
    field: keyof Servico;
    value: string | number | boolean;
  }
  const handleUpdate = (props: UpdateField) => { }
  ```

---

### 👨‍💻 P2.2 - Refatorar Diario.tsx em 3 componentes
- **Arquivo:** `src/components/Diario.tsx` (497 linhas - MUITO GRANDE)
- **Problema:** Múltiplas responsabilidades: gravação, transcrição, IA, UI
- **Ações necessárias:**
  1. Extrair `<AudioRecorder />` (gravação de áudio)
  2. Extrair `<DiarioEditor />` (edição de texto)
  3. Extrair `<AIAnalysis />` (análise com IA)
  4. Manter `<Diario />` como orquestrador
  5. Testar que funcionalidade não quebra
- **Arquivos a criar:**
  - `src/components/AudioRecorder.tsx`
  - `src/components/DiarioEditor.tsx`
  - `src/components/AIAnalysis.tsx`
- **Arquivo a refatorar:** `src/components/Diario.tsx`
- **Agente recomendado:** `general` (refatoração complexa)
- **Tempo estimado:** 2 horas
- **Resultado:** 3 componentes < 200 linhas cada

---

### 👨‍💻 P2.3 - Refatorar Cronograma.tsx e extrair utils de date
- **Arquivo:** `src/components/Cronograma.tsx` (386 linhas)
- **Problema:** Lógica complexa de datas misturada com UI
- **Ações necessárias:**
  1. Extrair funções de date em `src/lib/dateUtils.ts`
  2. Funções: formatearData, calcularDias, gerarTimeline, etc
  3. Simplificar Cronograma.tsx para apenas UI
  4. Adicionar testes para dateUtils
  5. Testar que Gantt chart ainda funciona
- **Arquivos a criar:** `src/lib/dateUtils.ts`
- **Arquivo a refatorar:** `src/components/Cronograma.tsx`
- **Agente recomendado:** `general` (extrair utils)
- **Tempo estimado:** 1.5 horas
- **Benefício:** Reutilizar dateUtils em outros componentes

---

### 👨‍💻 P2.4 - Adicionar sanitização de entrada com sanitize-html
- **Problema:** Sem sanitização - possível XSS em notas/comentários
- **Ações necessárias:**
  1. Instalar `npm install sanitize-html`
  2. Criar `src/lib/sanitizeUtils.ts` com wrapper
  3. Aplicar sanitização em:
     - `src/components/Notas.tsx` (notas, narrativas)
     - `src/components/Diario.tsx` (transcrição)
     - Qualquer campo que seja renderizado
  4. Testar com HTML malicioso
- **Arquivo novo:** `src/lib/sanitizeUtils.ts`
- **Arquivos a editar:** Notas.tsx, Diario.tsx, outros
- **Agente recomendado:** Qualquer um (implementation simples)
- **Tempo estimado:** 45 minutos
- **Exemplo:**
  ```typescript
  import sanitizeHtml from 'sanitize-html';
  
  export const sanitize = (text: string) => {
    return sanitizeHtml(text, { allowedTags: ['b', 'i', 'em', 'strong'] });
  };
  ```

---

### 👨‍💻 P2.5 - Resolver status enum inconsistente nos Serviços
- **Arquivo:** `src/components/Servicos.tsx`, `src/initialData.ts`, `src/types.ts`
- **Problema:** Status enum tem valores diferentes em locais diferentes
  - Serviços.tsx:20 tem: `em_andamento`, `concluido`, `atencao`, `pendente`, `nao_iniciado`
  - initialData.ts:28 tem: `a_executar`, `pausado` (não mapeados)
  - Resultado: Serviços com status desconhecido não têm cor/label
- **Ações necessárias:**
  1. Definir único enum Status em `src/types.ts`
  2. Atualizar stMap em Servicos.tsx com todos os valores
  3. Validar initialData.ts usa apenas valores válidos
  4. Testar que todos status têm cores/labels
- **Arquivos a editar:**
  - `src/types.ts` (adicionar enum)
  - `src/components/Servicos.tsx` (atualizar stMap)
  - `src/initialData.ts` (validar valores)
- **Agente recomendado:** Qualquer um (simples, validação)
- **Tempo estimado:** 30 minutos

---

## 🔵 P3 - BAIXA PRIORIDADE (Mensal - Features & Docs)

### 📚 P3.1 - Documentação: Melhorar README.md
- **Arquivo:** `README.md`
- **Problema:** README minimalista, falta info de setup/componentes
- **Ações necessárias:**
  1. Adicionar seção de Setup com `npm install && npm run dev`
  2. Documentar cada componente principal
  3. Adicionar exemplos de uso
  4. Documentar variáveis de ambiente
  5. Adicionar guia de contribuição
- **Arquivo a editar:** `README.md`
- **Agente recomendado:** Qualquer um (apenas documentação)
- **Tempo estimado:** 1 hora

---

### ✅ P3.2 - Adicionar testes com Vitest
- **Problema:** Nenhum teste automatizado
- **Ações necessárias:**
  1. Instalar `npm install -D vitest @testing-library/react`
  2. Configurar `vitest.config.ts`
  3. Criar testes para:
     - `src/lib/dateUtils.ts` (se P2.3 feito)
     - `src/lib/sanitizeUtils.ts` (se P2.4 feito)
     - Supabase sync logic (App.tsx:78-149)
     - IA response parsing (geminiService.ts)
  4. Rodar `npm run test`
  5. Documentar em README
- **Arquivos a criar:**
  - `vitest.config.ts`
  - `src/__tests__/` (testes)
- **Agente recomendado:** `general` (setup complex)
- **Tempo estimado:** 3 horas

---

### 🔐 P3.3 - Implementar autenticação com Supabase Auth
- **Problema:** Sem autenticação - qualquer um pode acessar dados
- **Ações necessárias:**
  1. Habilitar Supabase Auth no Console
  2. Criar componente `<Login />`
  3. Integrar `useAuth()` hook
  4. Proteger rotas por `obra_id` + `user_id`
  5. Adicionar logout
  6. Testar fluxo de login
- **Arquivos a criar:**
  - `src/pages/Login.tsx`
  - `src/hooks/useAuth.ts`
- **Arquivos a editar:** `src/App.tsx`, types, AppContext
- **Agente recomendado:** `general` (autenticação)
- **Tempo estimado:** 4 horas

---

### 🎨 P3.4 - Melhorar contraste de cores na paleta Dark Mode
- **Arquivo:** `src/index.css`
- **Problema:** Background `#090a0b` vs Surface `#121417` muito próximo
- **Ações necessárias:**
  1. Aumentar delta L entre background e s1
  2. Verificar WCAG AA compliance (contraste 4.5:1)
  3. Testar com ferramentas de accessibility
  4. Atualizar variáveis CSS
- **Arquivo a editar:** `src/index.css` (variáveis oklch)
- **Agente recomendado:** Qualquer um (design/CSS)
- **Tempo estimado:** 45 minutos

---

## 📋 CHECKLIST GERAL

### ✅ Verificações Feitas
- [x] Build e compilação
- [x] TypeScript lint
- [x] Estrutura de arquivos
- [x] Dependências npm
- [x] Conformidade com stack EVIS
- [x] Integração de serviços (Supabase, Gemini, ImgBB)
- [x] Análise de performance (bundle size)
- [x] Análise de segurança (credenciais, XSS, CSRF)

### ⏳ Próximas Verificações
- [ ] Testes automatizados (após P3.2)
- [ ] Análise de acessibilidade (após P3.4)
- [ ] Performance profiling (após P1.2)
- [ ] Security audit completo (após P0 + P1.3)

---

## 🚀 ROADMAP DE EXECUÇÃO

### 📅 Hoje (P0)
```
2 tarefas - 20-30 minutos
├─ P0.1: Regenerar API keys
└─ P0.2: Proteger .env
```

### 📅 Esta Semana (P1)
```
4 tarefas - 4-5 horas
├─ P1.1: Logger (30 min)
├─ P1.2: React Query (2 h)
├─ P1.3: CSS Layers (20 min)
└─ P1.4: noImplicitAny config (5 min)
```

### 📅 Próximas 2 Semanas (P2)
```
5 tarefas - 8-9 horas
├─ P2.1: Remover 49 'any' (4 h)
├─ P2.2: Refatorar Diario.tsx (2 h)
├─ P2.3: Refatorar Cronograma.tsx (1.5 h)
├─ P2.4: Sanitizar entrada (45 min)
└─ P2.5: Status enum (30 min)
```

### 📅 Mensal (P3)
```
4 tarefas - 8-10 horas
├─ P3.1: README docs (1 h)
├─ P3.2: Vitest setup (3 h)
├─ P3.3: Autenticação (4 h)
└─ P3.4: Contraste cores (45 min)
```

---

## 👤 MATRIZ DE RESPONSABILIDADES

| Tarefa | Agente | Conhecimento | Tempo |
|--------|--------|--------------|-------|
| P0.1 | Manual | API keys | 20 min |
| P0.2 | Qualquer | Git | 2 min |
| P1.1 | general | Logger, TS | 30 min |
| P1.2 | general | React Query, Hooks | 2 h |
| P1.3 | Qualquer | CSS, Tailwind | 20 min |
| P1.4 | Qualquer | TypeScript | 5 min |
| P2.1 | general | TypeScript, Types | 4 h |
| P2.2 | general | React, Refactor | 2 h |
| P2.3 | general | Date logic, Utils | 1.5 h |
| P2.4 | Qualquer | Security, HTML | 45 min |
| P2.5 | Qualquer | Enums, Maps | 30 min |
| P3.1 | Qualquer | Markdown, Docs | 1 h |
| P3.2 | general | Vitest, Testing | 3 h |
| P3.3 | general | Auth, Supabase | 4 h |
| P3.4 | Qualquer | CSS, A11y | 45 min |

---

## 📞 CONTATO & PRÓXIMOS PASSOS

**Para iniciar uma tarefa:**
```
OpenCode: [Inicie a tarefa P1.1 - Logger centralizado]
```

**Para relatar bloqueios:**
```
OpenCode: [Relatar bloqueio em P2.2 - linha 156 de Diario.tsx]
```

**Para atualizar status:**
```
OpenCode: [Marcar P1.1 como completo e gerar novo status]
```

---

**Gerado por:** OpenCode Auditor  
**Próxima revisão:** 11/05/2026 (30 dias)  
**Score Baseline:** 78/100  
**Meta:** 90/100 em 30 dias
