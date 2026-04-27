# AUDITORIA DO REPOSITORIO EVIS AI

> Data da auditoria: 2026-04-16  
> Objetivo: separar produto ativo, material de apoio, histórico e candidatos a limpeza

## Diagnóstico executivo

O repositório já tem dois produtos bem reconhecíveis:

| Núcleo | Pasta principal | Situação |
| --- | --- | --- |
| `EVIS Obra` | `src/`, `server/`, `skills/` | ativo |
| `EVIS Orçamentista` | `orcamentista/` | ativo |

O problema atual não é falta de estrutura técnica. O problema era que a raiz virou uma mistura de:

- arquivos de operação
- prompts de trabalho
- diagnósticos temporários
- HTMLs utilitários
- SQLs avulsos
- histórico duplicado

## Inventário por zona

### 1. Núcleo de produto ativo

Manter como base principal:

- `src/`
- `server/`
- `skills/`
- `orcamentista/`
- `docs/reference/`
- `docs/learnings/`

### 2. Documentação viva

Manter, mas com melhor navegação:

- `docs/STATUS_EVIS_AI.md`
- `docs/AUDITORIA_REPOSITORIO_EVIS_AI.md`
- `CHECKPOINT.md`
- `docs/CONSOLIDACAO_FLUXO_EVIS.md`
- `docs/EVIS_AI_VISAO_TECNICA.md`

### 3. Histórico já arquivado

O histórico agora foi consolidado em uma área principal:

- `docs/archive/`

O conteúdo único que estava em `.archive/` foi preservado em:

- `docs/archive/legacy/`

### 4. Artefatos gerados automaticamente

Não devem poluir o versionamento:

- `dist/`
- `orcamentista/sinapi/logs/`
- `orcamentista/sinapi/__pycache__/`
- `node_modules/`

## Sinais concretos da bagunça atual

### Arquivos que foram removidos da raiz nesta fase

| Grupo | Destino atual |
| --- | --- |
| Prompts | `docs/prompts/` |
| SQL operacional | `docs/ops/` |
| HTML utilitário | `docs/ops/` |

### Duplicidades fora do fluxo ideal

| Arquivo | Localização |
| --- | --- |
| `PROMPT_PADRONIZACAO_ORCAMENTO.md` | migrou de `docs/` para `orcamentista/docs/` |
| guias React Query e Gemini | permaneceram somente em `docs/reference/` |
| histórico local antigo | foi consolidado em `docs/archive/legacy/` |
| `README.md` | existe na raiz, `docs/` e `orcamentista/` com funções diferentes |

## Candidatos fortes para reorganização

### Grupo A - prompts curados

Prompts mantidos como ativos em `docs/prompts/`:

- `PROMPT_BASE_CONHECIMENTO.md`
- `PROMPT_REVISAR_SISTEMA_ORCAMENTACAO.md`

Prompts arquivados em `docs/archive/legacy/prompts/`:

- `PROMPT_ATUALIZAR_DOCS.md`
- `PROMPT_CORRIGIR_DDL_SINAPI.md`
- `PROMPT_CRIAR_SKILL_ORCAMENTO.md`
- `PROMPT_CRIAR_TABELA_SINAPI.md`
- `PROMPT_ESTRUTURAR_ORCAMENTISTA.md`
- `PROMPT_EXEMPLO_SISTEMATICO.md`
- `PROMPT_REFATORAR_SKILL.md`

### Grupo B - ops curados

Utilitários mantidos como ativos em `docs/ops/`:

- `DIAGNOSTICO_SCHEMA.sql`
- `LIMPAR_BANCO.sql`

Utilitários removidos por obsolescência ou redundância:

- `schema-discovery.sql`
- `schema-completo.sql`
- `run_ddl.js`
- `INICIO-RAPIDO.html`
- `GUIA-OBRA-TESTE.html`
- `limpar-presenca.html`

### Grupo C - candidatos a exclusão depois de confirmar desuso

Não apagar automaticamente nesta auditoria:

- duplicados antigos já substituídos em `docs/archive/legacy/`
- templates antigos do `orcamentista` somente depois de confirmar qual virou oficial

## Organização alvo recomendada

```text
EVIS AI/
  README.md
  package.json
  CHECKPOINT.md
  src/
  server/
  skills/
  orcamentista/
  docs/
    STATUS_EVIS_AI.md
    AUDITORIA_REPOSITORIO_EVIS_AI.md
    reference/
    learnings/
    archive/
    prompts/
    ops/
```

## Regras de limpeza

1. Não apagar nada que ainda esteja servindo de referência ativa
2. Primeiro mover para o lugar certo
3. Só depois validar se o conteúdo ficou sem uso
4. Só então excluir com lista aprovada

## Ações imediatas seguras

| Prioridade | Ação | Risco |
| --- | --- | --- |
| Alta | usar `README.md` da raiz como entrada oficial do portfólio | baixo |
| Alta | manter `docs/STATUS_EVIS_AI.md` atualizado no fim do dia | baixo |
| Alta | centralizar a auditoria neste arquivo | baixo |
| Média | revisar a curadoria de `prompts/` | baixo |
| Média | revisar a curadoria de `ops/` | baixo |
| Média | revisar e podar `docs/archive/legacy/` | médio |
| Média | revisar exclusões reais de arquivos antigos | médio |

## Lista inicial de exclusão futura

Esta lista é apenas candidata e ainda depende de aprovação:

- prompts antigos que já geraram seus artefatos finais
- diagnósticos SQL pontuais depois que a fase de saneamento do banco encerrar
- conteúdo histórico em `docs/archive/legacy/` que não for mais necessário

## Conclusão

O repositório não está desorganizado por falta de trabalho. Ele está desorganizado porque evoluiu rápido e a camada operacional ficou misturada com a camada oficial.

A boa notícia é que a solução agora é administrativa, não estrutural:

- deixar a raiz leve
- tratar `src/server` como `EVIS Obra`
- tratar `orcamentista/` como produto separado
- usar `docs/STATUS_EVIS_AI.md` para visão diária
- usar esta auditoria para qualquer limpeza futura
