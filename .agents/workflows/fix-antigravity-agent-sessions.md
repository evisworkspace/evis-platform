# Fix Antigravity Agent Sessions

Use este workflow quando o Antigravity parar de responder, quando os motores nativos ficarem anulados ou quando aparecer erro relacionado a `agentSessions UNKNOWN`.

## Objetivo

Verificar e corrigir a configuração Git local que pode desabilitar o Agent Manager do Antigravity.

## Comandos

Rodar:

```bash
git config --get extensions.worktreeConfig
```

Se retornar `true`, rodar:

```bash
git config --unset extensions.worktreeConfig
```

Depois solicitar ao usuário:

1. Fechar totalmente o Antigravity.
2. Reabrir o workspace.
3. Testar: Responda apenas: `motor ok`

## Restrições
- Não alterar arquivos do EVIS.
- Não fazer commit.
- Não fazer push.
- Não mexer em `.env`.
- Não diagnosticar login/quota/modelo antes dessa checagem.
