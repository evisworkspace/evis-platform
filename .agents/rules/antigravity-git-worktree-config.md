# REGRA CRÍTICA — ANTIGRAVITY / GIT WORKTREE CONFIG

Esta regra vale para todos os agentes, motores e modelos operando no workspace EVIS pelo Antigravity.

## Problema recorrente

O Antigravity pode parar de responder corretamente, gerar erro `agentSessions UNKNOWN`, anular motores nativos ou deixar agentes sem execução real quando o arquivo local:

`.git/config`

contém:

```ini
[extensions]
    worktreeConfig = true
```

Essa configuração é incompatível com a operação estável do Agent Manager neste workspace.

## Regra obrigatória antes de qualquer tarefa

Antes de diagnosticar qualquer problema de agente, modelo, quota, login, provider, cache, .env, workspace ou código do EVIS, verificar primeiro:

```bash
git config --get extensions.worktreeConfig
```

Se retornar:

```
true
```

corrigir imediatamente com:

```bash
git config --unset extensions.worktreeConfig
```

Depois fechar e reabrir o Antigravity.

## Proibições
- Não adicionar `[extensions] worktreeConfig = true` ao `.git/config`.
- Não executar comandos Git que ativem `extensions.worktreeConfig` sem autorização explícita do usuário.
- Não diagnosticar esse erro como problema de conta, crédito, quota, .env, provider ou modelo antes dessa verificação.
- Não alterar código do EVIS para resolver esse problema.
- Não reinstalar Antigravity antes dessa verificação.

## Procedimento padrão quando motor nativo parar
1. Rodar:
   ```bash
   git config --get extensions.worktreeConfig
   ```
2. Se retornar `true`, rodar:
   ```bash
   git config --unset extensions.worktreeConfig
   ```
3. Fechar totalmente o Antigravity.
4. Reabrir o workspace: `C:\Users\User\Evis AI`
5. Testar no Agent Manager: Responda apenas: `motor ok`

## Diagnóstico correto

Se `extensions.worktreeConfig=true` estiver presente, o problema deve ser tratado como falha de compatibilidade entre Git worktree config e Agent Manager do Antigravity.

Não tratar como:
- erro do EVIS
- erro de autenticação
- erro de quota
- erro de modelo
- erro de .env
- erro de Supabase
- erro de Node/Vite
