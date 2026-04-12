# 🗺️ GUIA DE NAVEGAÇÃO: Como Usar Este Projeto

**Data:** 11 de abril de 2026  
**Objetivo:** Entender a estrutura e não duplicar esforços  
**Para:** Próximas iterações do projeto

---

## 🎯 Começo Rápido (5 minutos)

### 1️⃣ Você é novo no projeto?
→ Leia: **QUICK_START.md** (5 min)

### 2️⃣ Quer entender o que foi feito?
→ Leia: **INDEX.md** (10 min)

### 3️⃣ Quer ver o detalhe técnico?
→ Leia: **AUDIT_TRAIL.md** (15 min)

### 4️⃣ Pronto para começar novos desenvolvilmentos?
→ Vá para a seção **"🚀 Próximas Tarefas"** abaixo

---

## 📚 Arquivos Principais (RAIZ)

| Arquivo | Leia se... | Tempo |
|---------|-----------|-------|
| **INDEX.md** | Quer entender estrutura de arquivos | 10 min |
| **AUDIT_TRAIL.md** | Quer histórico completo de tarefas | 15 min |
| **QUICK_START.md** | Quer rodar app em 5 min | 5 min |
| **IMPLEMENTACAO_SINCRONIZACAO_COMPLETA.md** | Quer entender sincronização Cronograma+IA | 10 min |
| **SINCRONIZACAO_100_CORRECOES.md** | Quer ver as 3 correções técnicas | 5 min |
| **PROJETO_CONCLUIDO.md** | Quer sumário de P0-P2 | 10 min |
| **AUDITORIA_STATUS.md** | Quer ver as 15 tarefas originais | 5 min |
| **BRIEFING_TAREFAS_COM_MOTORES.md** | Quer detalhe completo (49 KB) | 30 min |

---

## 🗂️ Estrutura do Projeto

```
C:\Users\User\Evis AI\
│
├─ 📄 DOCUMENTAÇÃO ATIVA (Raiz)
│  ├─ INDEX.md ⭐ LEIA PRIMEIRO
│  ├─ AUDIT_TRAIL.md ⭐ DEPOIS LEIA ISTO
│  ├─ QUICK_START.md
│  ├─ IMPLEMENTACAO_SINCRONIZACAO_COMPLETA.md
│  └─ ...outros docs
│
├─ 🧠 SRC (Código-Fonte)
│  ├─ components/
│  │  ├─ Diario.tsx ⭐ SINCRONIZAÇÃO IMPLEMENTADA AQUI
│  │  ├─ Cronograma.tsx
│  │  ├─ App.tsx (React Query setup)
│  │  └─ 5 outros componentes
│  ├─ services/
│  │  ├─ logger.ts (P1.1)
│  │  └─ geminiService.ts
│  ├─ hooks/
│  │  └─ useSupabaseQuery.ts (P1.2 - React Query)
│  ├─ lib/
│  │  ├─ api.ts
│  │  └─ supabase.ts
│  ├─ types.ts (P2 - Tipos corrigidos)
│  ├─ AppContext.tsx (Estado global)
│  └─ main.tsx (Entry point)
│
└─ 📦 .ARCHIVE (Não mexer)
   ├─ diagnostics/ (Scripts de debug - descartável)
   ├─ tasks-completed/ (Relatórios de P0/P1/P2 - referência)
   └─ documentation/ (Docs técnicas - referência)
```

---

## ⚡ Tarefas Já Completadas (NÃO RE-FAZER)

### ✅ P0: Setup & Segurança
- [x] API Keys regeneradas
- [x] .env protegido
- **Arquivo:** `.archive/tasks-completed/P0_CONCLUIDO.txt`
- **Ação:** Não mexer. Se precisar entender, consulte o arquivo.

### ✅ P1: Qualidade de Código
- [x] Logger centralizado (P1.1)
- [x] React Query integration (P1.2)
- [x] CSS @layers verified (P1.3)
- [x] TypeScript strict mode (P1.4)
- **Arquivo:** `.archive/tasks-completed/P1_CONCLUIDO.md`
- **Ação:** Não re-implementar. Apenas manter funcionando.

### ✅ P2: Tipagem & Refatoração
- [x] 49 'any' types removidos
- [x] Diario.tsx refatorada
- [x] DateUtils extracted
- [x] HTML sanitization
- [x] Status enum sincronizado
- **Arquivo:** `.archive/tasks-completed/P2_CONCLUIDO.md`
- **Ação:** Não mexer. Tipos estão corretos.

### ✅ Sincronização 100%
- [x] Prompt IA com lógica temporal
- [x] Função ensureDates() implementada
- [x] Cache invalidation validada
- **Arquivo:** `IMPLEMENTACAO_SINCRONIZACAO_COMPLETA.md`
- **Ação:** Sistema está pronto. Testar antes de seguir.

---

## 🚀 Próximas Tarefas (P3)

### 📝 P3.1: README Docs (1-1.5h)
**O que fazer:**
1. Criar/atualizar README.md com:
   - Como rodar o projeto
   - Screenshots do Cronograma
   - Screenshots do Diário
   - Guia de troubleshooting

**Onde começar:**
- Leia: `QUICK_START.md`
- Modifique: `README.md`

**Checklist antes de commit:**
- [ ] `npm run lint` → ZERO ERRORS
- [ ] `npm run build` → SUCCESS
- [ ] README tem screenshots
- [ ] README tem troubleshooting

**Arquivo:** `PROJETO_P3.1_README.md` (criar quando começar)

---

### 🧪 P3.2: Vitest Tests (3-3.5h)
**O que fazer:**
1. Instalar Vitest
2. Criar testes para:
   - ensureDates() function
   - Validação de datas
   - React Query mocks
   - Cenários de falha IA

**Onde começar:**
- Leia: `.archive/documentation/REACT_QUERY_CACHE_GUIDE.md`
- Crie: `src/__tests__/` pasta
- Arquivo de teste: `src/__tests__/Diario.test.ts`

**Checklist antes de commit:**
- [ ] `npm run test` → TODOS PASSAM
- [ ] Coverage > 80%
- [ ] `npm run lint` → ZERO ERRORS
- [ ] `npm run build` → SUCCESS

**Arquivo:** `PROJETO_P3.2_TESTS.md` (criar quando começar)

---

### 🔐 P3.3: Supabase Auth (3.5-4h)
**O que fazer:**
1. Implementar autenticação de usuários
2. Adicionar roles e permissões
3. Sincronizar dados de usuário
4. Proteger rotas

**Onde começar:**
- Instale: `@supabase/auth-helpers-react`
- Crie: `src/services/authService.ts`
- Modifique: `App.tsx` com AuthProvider
- Proteja: `ConfigPage.tsx`

**Checklist antes de commit:**
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Dados sincronizados por usuário
- [ ] RLS policies ativas
- [ ] `npm run lint` → ZERO ERRORS
- [ ] `npm run build` → SUCCESS

**Arquivo:** `PROJETO_P3.3_AUTH.md` (criar quando começar)

---

### ♿ P3.4: WCAG Accessibility (45-60 min)
**O que fazer:**
1. Melhorar contraste de cores (WCAG AA)
2. Adicionar ARIA labels
3. Testar com screen reader
4. Mobile responsive

**Onde começar:**
- Use: Chrome DevTools → Lighthouse
- Modifique: `src/index.css` para cores
- Adicione: aria-label, role, tabIndex
- Teste: F12 → Accessibility → Color Contrast

**Checklist antes de commit:**
- [ ] Lighthouse Accessibility > 90
- [ ] Contraste WCAG AA
- [ ] Screen reader funciona
- [ ] Mobile responsivo
- [ ] `npm run lint` → ZERO ERRORS
- [ ] `npm run build` → SUCCESS

**Arquivo:** `PROJETO_P3.4_A11Y.md` (criar quando começar)

---

## 🔄 Workflow para Próximas Tarefas

### Cada vez que começar uma nova tarefa:

1. **Verificar status atual**
   ```bash
   npm run lint
   npm run build
   ```

2. **Ler documentação relevante**
   - Consulte `INDEX.md` para saber o que não mexer
   - Consulte `AUDIT_TRAIL.md` se tiver dúvidas

3. **Criar arquivo de rastreamento**
   ```markdown
   # 📋 PROJETO_P3.X_[NOME]

   **Data:** DD/MM/YYYY
   **Status:** ⏳ EM ANDAMENTO
   **Objetivo:** [O que precisa fazer]
   **Checklist:**
   - [ ] Implementação
   - [ ] npm run lint ZERO ERRORS
   - [ ] npm run build SUCCESS
   - [ ] Commit + push
   ```

4. **Implementar mudanças**
   - Trabalhe isolado
   - Teste a cada mudança
   - Não mexer em `.archive/`

5. **Validar antes de commit**
   ```bash
   npm run lint    # ZERO ERRORS
   npm run build   # SUCCESS
   git status      # Verificar mudanças
   ```

6. **Commit com mensagem clara**
   ```bash
   git commit -m "feat: P3.X - [descrição]"
   ```

7. **Atualizar AUDIT_TRAIL.md**
   - Mover relatório para `.archive/tasks-completed/`
   - Atualizar score no INDEX.md

---

## 🆘 Troubleshooting Rápido

### "Erro HTTP 400 em servicos"
→ Limpar cache do browser (Ctrl+Shift+Delete)

### "npm run lint tá falhando"
→ Verificar `.archive/tasks-completed/P1_CONCLUIDO.md` para ver como foi resolvido

### "React Query cache não atualiza"
→ Ler `.archive/documentation/REACT_QUERY_CACHE_GUIDE.md`

### "Dúvida sobre tipos TypeScript"
→ Consultar `.archive/tasks-completed/P2_CONCLUIDO.md`

### "Sincronização não funciona"
→ Verificar `IMPLEMENTACAO_SINCRONIZACAO_COMPLETA.md`

---

## 📊 Score Tracking

```
Baseline: 78/100

P0: +2   → 80/100
P1: +3   → 83/100
P2: +5   → 88/100
Sync: +3-4 → 91-92/100

P3.1: +1 → 92-93/100
P3.2: +2 → 94-95/100
P3.3: +1 → 95-96/100
P3.4: +1 → 96-97/100

FINAL: 96-97/100 ✅ (ALVO: 95+)
```

---

## 📞 Decisões Arquiteturais

### ✅ Por que React Query?
- Cache automático
- Invalidation simplificada
- Menos boilerplate
- Suporta SSR (futuro)

### ✅ Por que Logger centralizado?
- Debug mais fácil
- Consistência
- Desativa em produção
- Separação de concerns

### ✅ Por que ensureDates()?
- Validação em um lugar
- Fallback automático 30 dias
- Garante Cronograma nunca vazio
- Status "concluido" sempre correto

---

## 🎓 Princípios do Projeto

1. **DRY (Don't Repeat Yourself)**
   - Logger reutilizável
   - useSupabaseQuery reutilizável
   - ensureDates reutilizável

2. **SOLID (Single Responsibility)**
   - Cada serviço faz uma coisa bem
   - Componentes não duplicam lógica

3. **Type Safety**
   - TypeScript strict mode
   - Sem 'any' types
   - Tipos explícitos

4. **Performance**
   - React Query cache
   - Lazy loading
   - CSS @layers otimizado

5. **Manutenibilidade**
   - .archive/ mantém histórico
   - INDEX.md é guia
   - AUDIT_TRAIL.md é referência

---

## ✅ Checklist Antes de Novo Desenvolvimento

- [ ] Leu `INDEX.md`
- [ ] Leu `AUDIT_TRAIL.md`
- [ ] Verificou `npm run lint` (ZERO ERRORS)
- [ ] Verificou `npm run build` (SUCCESS)
- [ ] Consultou `.archive/` para contexto
- [ ] Não vai re-fazer nenhuma tarefa de P0/P1/P2
- [ ] Vai criar arquivo de rastreamento (`PROJETO_P3.X_[NOME].md`)
- [ ] Vai atualizar AUDIT_TRAIL.md ao terminar
- [ ] Vai mover relatório para `.archive/tasks-completed/` ao terminar

---

**Status Final:** ✅ Projeto 100% Organizado e Rastreável  
**Próximo Passo:** Começar P3.1 (README Docs)  
**Data:** 11 de abril de 2026

