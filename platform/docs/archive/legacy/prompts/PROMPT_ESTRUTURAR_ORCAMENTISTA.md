# PROMPT: ESTRUTURAR PROJETO ORÇAMENTISTA

> **Destinatário:** GPT (agente dedicado ao orçamentista)  
> **Objetivo:** Organizar estrutura completa do projeto orçamentista

---

## CONTEXTO

Você está trabalhando no **Projeto Orçamentista**, que é SEPARADO do EVIS Obra.

Este projeto acontece **ANTES** da obra começar. O orçamentista usa este projeto para:
1. Desenvolver orçamentos conversando com IA
2. Gerar JSON padronizado
3. Entregar JSON para importação no EVIS Obra

**Estrutura atual:**
```
orcamentista/
├── README.md
└── skills/
    └── orcamento-evis/
        └── SKILL.md
```

---

## TAREFA

Organize o projeto orçamentista completamente, criando a seguinte estrutura:

```
orcamentista/
├── README.md (atualizar)
├── COMO_USAR.md (criar)
├── skills/
│   └── orcamento-evis/
│       └── SKILL.md (já existe)
├── templates/
│   ├── TEMPLATE_ORCAMENTO_COMPLETO_V3.json
│   ├── TEMPLATE_IMPORT_OBRA_V2.json
│   └── TEMPLATE_IMPORTACAO_OBRA.json
├── docs/
│   ├── PROMPT_PADRONIZACAO_ORCAMENTO.md
│   ├── SCHEMA_EVIS.md (criar - versão simplificada)
│   └── REGRAS_DE_NEGOCIO.md (criar)
└── exemplos/
    ├── exemplo-simples.md (criar)
    └── exemplo-complexo.md (criar)
```

---

## INSTRUÇÕES DETALHADAS

### 1. Consolidar arquivos dentro de orcamentista/

**Mover para `orcamentista/templates/`:**
- `orcamentista/templates/TEMPLATE_ORCAMENTO_COMPLETO_V3.json`
- `orcamentista/templates/TEMPLATE_IMPORT_OBRA_V2.json`
- `orcamentista/templates/TEMPLATE_IMPORTACAO_OBRA.json`

**Mover para `orcamentista/docs/`:**
- `orcamentista/docs/PROMPT_PADRONIZACAO_ORCAMENTO.md`

### 2. Atualizar `orcamentista/README.md`

Expandir o README atual com:
- Descrição clara do projeto
- Diferença entre orçamentista e EVIS Obra
- Estrutura de pastas explicada
- Como usar o projeto (resumo)
- Link para COMO_USAR.md

### 3. Criar `orcamentista/COMO_USAR.md`

Guia passo a passo para o orçamentista:

```markdown
# Como Usar o Projeto Orçamentista

## Passo 1: Preparação
[Como preparar ambiente, abrir Claude, etc]

## Passo 2: Usar a Skill
[Como colar a skill, desenvolver orçamento]

## Passo 3: Gerar JSON
[Como pedir JSON final]

## Passo 4: Validar
[Checklist de validação antes de entregar]

## Passo 5: Entregar para EVIS
[Como o gestor importa no EVIS Obra]
```

### 4. Criar `orcamentista/docs/SCHEMA_EVIS.md`

Versão SIMPLIFICADA do schema para o orçamentista (não técnico):

- Explicar o que é cada tabela (obras, serviços, equipes)
- Campos obrigatórios vs opcionais (linguagem simples)
- Não incluir DDL técnico (isso fica no EVIS Obra)

### 5. Criar `orcamentista/docs/REGRAS_DE_NEGOCIO.md`

Regras críticas que o orçamentista DEVE saber:

- Como gerar IDs (obra-{nome}-{ano}, SRV-001, EQ-OBR-01)
- Categorias válidas de serviços
- Tipos de equipes e códigos
- Como criar aliases
- Relacionamento serviço ↔ equipe
- Status válidos

### 6. Criar `orcamentista/exemplos/exemplo-simples.md`

Exemplo real de uso da skill com orçamento SIMPLES:

```markdown
# Exemplo: Reforma Loja ABC

## Entrada (bruto)
[Texto do orçamento não estruturado]

## Conversa com a IA
[Exemplo de interação]

## JSON Final
[JSON completo pronto para importar]

## Como Importar
[Passo a passo visual]
```

### 7. Criar `orcamentista/exemplos/exemplo-complexo.md`

Exemplo real de uso da skill com orçamento COMPLEXO:

- Múltiplas equipes (8+)
- Múltiplos serviços (20+)
- Cronograma detalhado
- Aliases ricos

---

## REGRAS IMPORTANTES

### ✅ FAZER:
- Linguagem simples para não-técnicos
- Exemplos visuais e práticos
- Passo a passo claro
- Separar conceitos (orçamentista vs EVIS Obra)
- Documentar o "como fazer", não o "como funciona por dentro"

### ❌ NÃO FAZER:
- Misturar documentação do EVIS Obra
- Incluir detalhes técnicos de backend
- Assumir que orçamentista sabe programar
- Criar dependências com arquivos do EVIS Obra (apenas referências quando necessário)

---

## OBJETIVO FINAL

Criar um projeto orçamentista que seja:
1. **Autocontido** - Tudo que o orçamentista precisa está aqui
2. **Simples** - Não-técnico consegue usar
3. **Completo** - Cobre todo o fluxo
4. **Separado** - Não depende do EVIS Obra (apenas entrega JSON)
5. **Pronto para extração** - Pode virar repositório próprio depois

---

## CHECKLIST DE CONCLUSÃO

Antes de finalizar, verificar:

- [ ] Estrutura de pastas criada
- [ ] Arquivos movidos de docs/
- [ ] README.md atualizado e expandido
- [ ] COMO_USAR.md criado (guia passo a passo)
- [ ] SCHEMA_EVIS.md criado (versão simplificada)
- [ ] REGRAS_DE_NEGOCIO.md criado
- [ ] exemplo-simples.md criado (completo)
- [ ] exemplo-complexo.md criado (completo)
- [ ] Linguagem não-técnica em todos os docs
- [ ] Projeto autocontido (não depende do EVIS)
- [ ] Pronto para orçamentista usar imediatamente

---

**AGORA ORGANIZE O PROJETO ORÇAMENTISTA COMPLETAMENTE!**
