# ⚡ QUICK START - Comece em 5 Minutos

## 🎯 O que você tem

```
✅ Briefing completo           → BRIEFING_TAREFAS_COM_MOTORES.md
✅ Audítoria                   → AUDITORIA_STATUS.md
✅ Automação                   → run-tasks.js
✅ Roteamento de motores      → task-router.json
✅ Dashboard                   → task-dashboard.js
✅ Manual completo             → MANUAL_EXECUCAO_AUTOMATIZADA.md
✅ Quick start                 → Este arquivo
```

---

## 🚀 3 Passos Para Começar

### Passo 1: Regenerar API Keys (20 min - Você)

Abra o arquivo: `BRIEFING_TAREFAS_COM_MOTORES.md`

Procure por **P0.1 - Regenerar API Keys**

Siga as instruções para regenerar:
- [ ] VITE_GEMINI_API_KEY
- [ ] VITE_SUPABASE_ANON_KEY
- [ ] VITE_IMGBB_API_KEY
- [ ] VITE_OPENROUTER_API_KEY

Atualize `.env` com as novas chaves.

**Comando de teste:**
```bash
npm run dev
```
Se não tiver erro de API, você completou P0.1! ✅

---

### Passo 2: Executar Tarefas (5-10 min)

**Terminal 1 - Executor:**
```bash
node run-tasks.js --priority P0
```

Será perguntado se quer prosseguir. Responda `y`.

**Resultado esperado:**
```
✅ P0.1 completado
✅ P0.2 completado

Taxa de sucesso: 100%
```

---

### Passo 3: Ver Progresso (em tempo real)

**Terminal 2 - Dashboard:**
```bash
node task-dashboard.js --watch
```

Vai mostrar a evolução em tempo real! 📊

---

## 📋 Próximos Passos (Escolha Um)

### Opção A: Fazer P1 Hoje (4-5 horas)

```bash
# Fechar terminal anterior
node run-tasks.js --priority P1
```

Vai chamar automaticamente:
- MiniMax para P1.1, P1.3, P1.4 (gratuito)
- Claude para P1.2 (React Query)

### Opção B: Fazer Tudo de Uma Vez

```bash
node run-tasks.js --all
```

Vai executar todas 15 tarefas em sequência.
Tempo total: **20-24 horas** (mas com pausas)

### Opção C: Só Simular (Modo Dry-Run)

```bash
node run-tasks.js --dry-run
```

Mostra tudo que seria executado sem fazer nada.

---

## 🤖 Entendendo os Motores

### 👤 Manual (Você) - P0.1
**Você faz:** Regenerar API keys manualmente
**Tempo:** 20 min
**Custo:** Grátis

### 🤖 MiniMax (Gratuito) - 8 tarefas
**Ele faz:** P0.2, P1.1, P1.3, P1.4, P2.4, P2.5, P3.1, P3.4
**Tempo:** 3-4 horas
**Custo:** Grátis! 🎉

### 🧠 Claude (Pago) - 6 tarefas
**Ele faz:** P1.2, P2.1, P2.2, P2.3, P3.2, P3.3
**Tempo:** 11-13 horas
**Custo:** ~$3.60 (60% economia vs tudo Claude)

---

## 📊 Cronograma Recomendado

```
DIA 1 (Hoje)
├─ P0.1: Regenerar keys (20 min, você)
├─ P0.2: Proteger .env (5 min, MiniMax)
└─ TOTAL: 25 min ✅

DIAS 2-3 (Esta semana)
├─ P1.1: Logger (30 min, MiniMax)
├─ P1.2: React Query (2h, Claude)
├─ P1.3: CSS @layers (20 min, MiniMax)
├─ P1.4: TypeScript config (5 min, MiniMax)
└─ TOTAL: 4.5 horas ✅

SEMANAS 2-3 (Próximas semanas)
├─ P2.1: Remove 49 'any' (4h, Claude)
├─ P2.2: Refatorar Diario (2h, Claude)
├─ P2.3: DateUtils (1.5h, Claude)
├─ P2.4: Sanitização (45 min, MiniMax)
├─ P2.5: Status enum (30 min, MiniMax)
└─ TOTAL: 8.5 horas ✅

MÊS 1 (Última semana)
├─ P3.1: README (1h, MiniMax)
├─ P3.2: Vitest testes (3h, Claude)
├─ P3.3: Autenticação (4h, Claude)
├─ P3.4: Contraste cores (45 min, MiniMax)
└─ TOTAL: 8.75 horas ✅
```

**TOTAL: ~21 horas de trabalho automático**

---

## 🎬 Começar Agora

### Copy/Paste Pronto Para Usar:

```bash
# 1. Regenerar keys (você abre BRIEFING_TAREFAS_COM_MOTORES.md manualmente)

# 2. Executar P0 (segurança)
node run-tasks.js --priority P0

# 3. Ver progresso
node task-dashboard.js --watch

# 4. (Opcional) Executar P1 depois
node run-tasks.js --priority P1

# 5. (Opcional) Ver tudo
node task-dashboard.js
```

---

## 🆘 Se Algo Não Funcionar

### "run-tasks.js não reconhecido"
```bash
# Tentar com Node.js explícito
node run-tasks.js --priority P0

# Ou PowerShell
pwsh -Command "node run-tasks.js --priority P0"
```

### "task-dashboard.js não abre"
```bash
# Verificar se Node.js está instalado
node --version

# Tentar
node task-dashboard.js

# Se não funcionar, reportar
```

### "MiniMax não responde"
```bash
# Verificar internet
ping openrouter.ai

# Ver logs detalhados
node run-tasks.js --log-level DEBUG
```

### "Preciso parar no meio"
```bash
# Pressione Ctrl+C
# Depois retome com:
node run-tasks.js --resume P1.2
```

---

## 📚 Próximos Passos

1. **Agora:** Execute `node run-tasks.js --priority P0`
2. **Depois:** Leia `MANUAL_EXECUCAO_AUTOMATIZADA.md` para opções avançadas
3. **Depois:** Veja `BRIEFING_TAREFAS_COM_MOTORES.md` para detalhes técnicos
4. **Depois:** Consulte `AUDITORIA_STATUS.md` para contexto do projeto

---

## ✅ Checklist Rápido

- [ ] Regenerei as 4 API keys manualmente
- [ ] Atualizei `.env` com novas chaves
- [ ] Rodei `npm run dev` sem erros
- [ ] Executei `node run-tasks.js --priority P0`
- [ ] Vi `node task-dashboard.js`
- [ ] Decidi executar P1, P2, P3 também

---

## 🎯 Meta Final

```
Score Atual:  78/100
Meta (30 dias): 90+/100

Com este sistema você vai conseguir! 🚀
```

---

**Criado por:** OpenCode  
**Última atualização:** 11/04/2026

---

## 🎬 Começar Agora!

```bash
# Abra um terminal e cole:
node run-tasks.js --priority P0
```

Depois nos próximos dias:
```bash
node run-tasks.js --priority P1
node run-tasks.js --priority P2
node run-tasks.js --priority P3
```

**Pronto! Sistema automatizado funcionando!** ✨
