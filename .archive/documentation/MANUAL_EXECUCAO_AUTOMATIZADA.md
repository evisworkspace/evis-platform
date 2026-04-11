# 🚀 MANUAL - SISTEMA AUTOMATIZADO DE EXECUÇÃO DE TAREFAS

**Versão:** 1.0  
**Data:** 11 de Abril de 2026  
**Projeto:** EVIS AI - Audítoria e Correção Automatizada  

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquivos do Sistema](#arquivos-do-sistema)
3. [Como Usar](#como-usar)
4. [Exemplos Práticos](#exemplos-práticos)
5. [Comandos Disponíveis](#comandos-disponíveis)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O sistema automatizado permite executar as 15 tarefas de forma inteligente:

- ✅ **Motor Router Automático** - Direciona cada tarefa para o motor ideal
- ✅ **Tracking de Progresso** - Acompanha em tempo real
- ✅ **Resumível** - Pode parar e continuar depois
- ✅ **Otimizado por Custo** - Usa MiniMax grátis quando possível
- ✅ **Verificação de Dependências** - Executa na ordem correta

```
Você fornece API keys
        ↓
run-tasks.js (orquestrador)
        ↓
task-router.json (mapeamento de motores)
        ↓
┌─────────────────────────────────┐
│ P0.1 → Manual (Você)            │
│ P0.2 → MiniMax (Grátis)         │
│ P1.1 → MiniMax (Grátis)         │
│ P1.2 → Claude (Pago)            │
│ ... etc                         │
└─────────────────────────────────┘
        ↓
task-dashboard.js (visualização)
        ↓
Tarefas completas! Score ↑
```

---

## 📂 Arquivos do Sistema

### 1. **run-tasks.js** (Orquestrador Principal)
```bash
node run-tasks.js [opções]
```
- Executa tarefas em sequência
- Respeita dependências
- Salva estado em `.task-runner-state.json`
- Escreve logs em `task-runner.log`

**Responsabilidades:**
- Ler tarefas de `BRIEFING_TAREFAS_COM_MOTORES.md`
- Rotear para motor correto via `task-router.json`
- Persistir estado
- Interagir com usuário

### 2. **task-router.json** (Mapa de Motores)
```json
{
  "motores": { ... },
  "roteamento": { ... },
  "estrategia": { ... }
}
```

Mapeia cada tarefa ao motor ideal:
- 👤 Manual (você)
- 🤖 MiniMax (grátis via OpenRouter)
- 🧠 Claude (pago, expertise)

### 3. **task-dashboard.js** (Visualização)
```bash
node task-dashboard.js [--watch] [--json] [--export FILE]
```

Mostra progresso em tempo real:
- Barra de progresso
- Estatísticas por prioridade
- Timeline de execução
- Export para HTML

### 4. **BRIEFING_TAREFAS_COM_MOTORES.md**
Contém prompt completo para cada tarefa

### 5. **.task-runner-state.json** (Estado)
Auto-gerado, rastreia progresso das tarefas

---

## 💻 Como Usar

### Opção 1: Execução Manual (Recomendado para Primeira Vez)

```bash
# Terminal 1 - Executar tarefas
node run-tasks.js --priority P0

# Terminal 2 - Ver progresso
node task-dashboard.js --watch
```

### Opção 2: Sequencial (P0 → P1 → P2 → P3)

```bash
# Dia 1 - Crítico
node run-tasks.js --priority P0

# Dia 2 - Alta prioridade
node run-tasks.js --priority P1

# Semana 1-2 - Média prioridade
node run-tasks.js --priority P2

# Mensal - Baixa prioridade
node run-tasks.js --priority P3
```

### Opção 3: Tudo de Uma Vez

```bash
node run-tasks.js --all
```

### Opção 4: Dry-Run (Simular Sem Executar)

```bash
# Ver o que seria executado
node run-tasks.js --priority P1 --dry-run
```

---

## 🎬 Exemplos Práticos

### Exemplo 1: Começar Hoje (P0 - Segurança)

```bash
# Terminal 1: Executar tarefas críticas
$ node run-tasks.js --priority P0

🎯 EVIS AI - Automated Task Runner

📋 Total de tarefas: 2
🎯 Prioridade: P0
🏃 Modo: EXECUÇÃO

Tarefas a executar:
  P0.1 - Regenerar API Keys (🟢 Trivial)
  P0.2 - Proteger .env no .gitignore (🟢 Trivial)

Prosseguir com execução? (y/n) y

──────────────────────────────────────────────
Tarefa: P0.1 - Regenerar API Keys
Motor: manual | Tempo: 20-30 min | 🟢 Trivial
──────────────────────────────────────────────

📋 TAREFA MANUAL: P0.1

Regenerar VITE_GEMINI_API_KEY, SUPABASE_KEY, IMGBB_KEY, OPENROUTER_KEY

Ver BRIEFING_TAREFAS_COM_MOTORES.md para detalhes

P0.1 foi completado? (y/n) y
✅ P0.1 completado

──────────────────────────────────────────────
Tarefa: P0.2 - Proteger .env no .gitignore
Motor: minimax | Tempo: 5-10 min | 🟢 Trivial
──────────────────────────────────────────────

🤖 MINIMAX (GRATUITO): P0.2

Proteger .env no .gitignore
Tempo estimado: 5-10 min

Executar P0.2 com MiniMax? (y/n) y

[Executando com MiniMax...]

✅ P0.2 completado

═══════════════════════════════════════════════
RELATÓRIO FINAL
═══════════════════════════════════════════════

Total de tarefas: 2
✅ Completadas: 2
❌ Falhadas: 0
⏭️  Puladas: 0

Taxa de sucesso: 100%
```

**Terminal 2 (Em paralelo):**
```bash
$ node task-dashboard.js --watch

════════════════════════════════════════════════════════════════
          EVIS AI - Task Progress Dashboard
════════════════════════════════════════════════════════════════

Progresso Geral:
██████████░░░░░░░░░░░░░░░░░░ 100% (2/2)

Estatísticas:
  ✅ Completadas: 2
  ⏳ Pendentes: 0
  ❌ Falhadas: 0

Tarefas por Prioridade:

P0
  ✅ P0.1 20s
  ✅ P0.2 15s

Legenda:
  ✅ Completo    ❌ Falhado    ⏳ Executando    ⏸ Pendente

Timeline:
  Iniciado: 11/04/2026, 14:30:45
  Concluído: 11/04/2026, 14:36:00
  Duração: 5m 15s
```

---

### Exemplo 2: Retomar de Uma Tarefa

```bash
# Se parou no meio, continuar daqui
node run-tasks.js --resume P1.2
```

---

### Exemplo 3: Modo Debug

```bash
# Ver logs detalhados
node run-tasks.js --priority P1 --log-level DEBUG
```

---

### Exemplo 4: Export Progress para HTML

```bash
# Salvar progresso em arquivo HTML
node task-dashboard.js --export /tmp/progress.html

# Abrir no navegador
open /tmp/progress.html
```

---

## 🔧 Comandos Disponíveis

### run-tasks.js

```bash
# Executar tudo
node run-tasks.js --all

# Executar apenas P0 (crítico)
node run-tasks.js --priority P0

# Executar apenas P1 (alta)
node run-tasks.js --priority P1

# Executar apenas P2 (média)
node run-tasks.js --priority P2

# Executar apenas P3 (baixa)
node run-tasks.js --priority P3

# Simular execução sem fazer nada
node run-tasks.js --dry-run

# Retomar de onde parou
node run-tasks.js --resume P1.2

# Mostrar logs detalhados
node run-tasks.js --log-level DEBUG

# Mostrar help
node run-tasks.js --help
```

### task-dashboard.js

```bash
# Mostrar progresso (snapshot)
node task-dashboard.js

# Atualizar a cada 5 segundos
node task-dashboard.js --watch

# Output em JSON (para parsing)
node task-dashboard.js --json

# Exportar para HTML
node task-dashboard.js --export progress.html
```

---

## 📊 Fluxo de Uso Recomendado

### 📅 Hoje (1-2 horas)

```bash
# Manhã
node run-tasks.js --priority P0

# Verificar progresso
node task-dashboard.js
```

**Resultado:** Credenciais protegidas, .env seguro ✅

### 📅 Esta Semana (4-5 horas)

```bash
# Segunda
node run-tasks.js --priority P1 --log-level INFO

# Ao longo da semana - acompanhar
while true; do
  clear
  node task-dashboard.js
  sleep 5
done
```

**Resultado:** Performance melhorada, cache, CSS completo ✅

### 📅 Próximas 2 Semanas (8-9 horas)

```bash
# Segunda-feira
node run-tasks.js --priority P2

# Acompanhar progresso
node task-dashboard.js --watch --export weekly-report.html
```

**Resultado:** Código mais limpo, tipagem forte, refatoração ✅

### 📅 Mensal (8-10 horas)

```bash
# Última semana
node run-tasks.js --priority P3

# Relatório final
node task-dashboard.js --json > final-report.json
```

**Resultado:** Testes, documentação, autenticação ✅

---

## 🔍 Troubleshooting

### "API key invalid"
```bash
# Verificar que regenerou a chave manualmente
cat .env | grep VITE_GEMINI_API_KEY

# Se vazio ou errado, re-fazer P0.1
node run-tasks.js --priority P0
```

### "Tarefa travada"
```bash
# Ver estado atual
node task-dashboard.js

# Retomar
node run-tasks.js --resume <TASK_ID>
```

### "Preciso parar e voltar depois"
```bash
# Pressione Ctrl+C para interromper
# Estado será salvo em .task-runner-state.json

# Depois, retomar:
node run-tasks.js --resume <LAST_TASK>
```

### "Quero ver o que seria executado"
```bash
# Modo dry-run
node run-tasks.js --dry-run
```

### "Histórico de logs"
```bash
# Ver arquivo de log
cat task-runner.log

# Filtrar por erro
grep ERROR task-runner.log
```

---

## 📈 Monitoramento em Tempo Real

### Setup para Monitoramento Contínuo

**Terminal 1 - Executor:**
```bash
node run-tasks.js --all --log-level INFO
```

**Terminal 2 - Dashboard:**
```bash
node task-dashboard.js --watch
```

**Terminal 3 - Logs:**
```bash
tail -f task-runner.log | grep -E "ERROR|WARN|✅|❌"
```

---

## 🎓 Cenários Avançados

### Cenário 1: Executar P1 + P2 em paralelo

```bash
# Terminal 1
node run-tasks.js --priority P1

# Terminal 2 (em outro terminal)
node run-tasks.js --priority P2

# Terminal 3 (acompanhar)
node task-dashboard.js --watch
```

### Cenário 2: Automação CI/CD

```bash
#!/bin/bash
# run-all-tasks.sh

echo "🚀 Iniciando automação de tarefas..."

for priority in P0 P1 P2 P3; do
  echo "⏳ Executando $priority..."
  node run-tasks.js --priority $priority
  
  if [ $? -ne 0 ]; then
    echo "❌ Falha em $priority"
    exit 1
  fi
done

echo "✅ Todas as tarefas completadas!"
node task-dashboard.js --export final-report.html
echo "📊 Relatório: final-report.html"
```

```bash
chmod +x run-all-tasks.sh
./run-all-tasks.sh
```

### Cenário 3: Webhook de Notificação

```bash
# Após P0.2, notificar
node run-tasks.js --priority P0 && \
curl -X POST https://seu-webhook.com/progress \
  -d '{"status": "P0 completo", "timestamp": "'$(date)'"}'
```

---

## 📞 Suporte

### Problemas?
1. Ver `task-runner.log`
2. Tentar `--dry-run` para isolar problema
3. Usar `--log-level DEBUG` para mais detalhes
4. Reportar em: https://github.com/anomalyco/opencode

### Feedback
- Positivo? Deixe uma ⭐ no GitHub
- Melhorias? Abra uma Issue
- Bugs? Crie um relatório detalhado

---

## ✨ Checklist de Conclusão

- [ ] Run-tasks.js criado
- [ ] Task-router.json configurado
- [ ] Task-dashboard.js testado
- [ ] P0 executado (20 min)
- [ ] P1 executado (4-5 horas)
- [ ] P2 executado (8-9 horas)
- [ ] P3 executado (8-10 horas)
- [ ] Relatório final gerado
- [ ] Score final: 90+/100

---

**Criado por:** OpenCode  
**Última atualização:** 11/04/2026  
**Versão:** 1.0
