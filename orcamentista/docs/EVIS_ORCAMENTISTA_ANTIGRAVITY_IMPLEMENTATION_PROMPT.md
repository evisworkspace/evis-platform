# EVIS — ORÇAMENTISTA IA

## Antigravity Implementation Prompt — Prompt Técnico de Implementação

**Status:** Prompt operacional para implementação  
**Módulo:** Orçamentista IA  
**Área:** Pré-obra / Oportunidade / Proposta  
**Arquivo sugerido:** `orcamentista/docs/EVIS_ORCAMENTISTA_ANTIGRAVITY_IMPLEMENTATION_PROMPT.md`

---

## 1. Objetivo deste Prompt

Este documento deve ser usado como prompt técnico para orientar o Antigravity na implementação, revisão ou evolução do módulo **Orçamentista IA EVIS**.

O objetivo é transformar a documentação canônica do Orçamentista IA em ações práticas dentro do código, sem quebrar a arquitetura existente, sem misturar pré-obra com execução e sem alterar banco de dados ou migrations sem validação explícita.

---

## 2. Contexto Obrigatório do EVIS

O EVIS possui um fluxo canônico que deve ser preservado:

```
Lead / Oportunidade
→ Orçamentista IA
→ Proposta
→ Conversão em Obra
→ Diário de Obra IA
→ Medições / Execução / Relatórios
```

O **Orçamentista IA** pertence exclusivamente à fase de **Oportunidade / Pré-obra**.

- Ele não é o Diário de Obra.
- Ele não atua sobre execução real.
- Ele prepara tecnicamente o orçamento e a proposta antes da obra existir oficialmente.

---

## 3. Documentos que Devem Ser Lidos Primeiro

Antes de alterar qualquer código, leia e considere os seguintes documentos canônicos:

```
orcamentista/docs/EVIS_ORCAMENTISTA_IA_CANONICAL.md
orcamentista/docs/EVIS_ORCAMENTISTA_DOMAIN_AGENTS.md
orcamentista/docs/EVIS_ORCAMENTISTA_PIPELINE.md
orcamentista/docs/EVIS_ORCAMENTISTA_HITL_RULES.md
orcamentista/docs/EVIS_ORCAMENTISTA_DATA_MODEL.md
orcamentista/docs/EVIS_ORCAMENTISTA_AGENT_KNOWLEDGE_BASE.md
orcamentista/docs/EVIS_ORCAMENTISTA_AGENT_TECHNICAL_COMPETENCIES.md
orcamentista/docs/EVIS_ORCAMENTISTA_AGENT_TRAINING_AND_RAG_STRATEGY.md
orcamentista/docs/EVIS_ORCAMENTISTA_ANTIGRAVITY_IMPLEMENTATION_PROMPT.md
```

Se algum arquivo não existir, registre como pendência e não invente conteúdo.

---

## 4. Objetivo Técnico da Implementação

Implementar ou preparar a base funcional do **Orçamentista IA EVIS** como um motor técnico-comercial de pré-obra.

O módulo deve permitir:

- Criar orçamento dentro de uma oportunidade
- Anexar arquivos
- Registrar arquivos recebidos
- Classificar documentos por disciplina
- Executar análise inicial
- Acionar agentes de domínio
- Gerar serviços orçamentáveis
- Separar identificado, inferido e pendente
- Gerar quantitativos com origem
- Gerar custos com fonte
- Registrar score de confiança
- Gerar HITL
- Auditar riscos
- Gerar cronograma inicial
- Gerar base de proposta
- Manter versionamento
- Preparar futura conversão em obra somente após proposta aprovada

---

## 5. Regra Central de Arquitetura

O Orçamentista IA deve ser tratado como um módulo separado do Diário de Obra IA.

### Proibido misturar

```
Orçamentista IA
Diário de Obra IA
Medições
Execução real
Progresso físico real
Relatórios semanais de obra ativa
Pagamentos operacionais
Presença de equipe em campo
```

### Permitido no Orçamentista IA

O Orçamentista pode trabalhar com:

```
oportunidade
orçamento
arquivos de projeto
leituras técnicas
ambientes previstos
serviços previstos
quantitativos previstos
custos previstos
riscos
premissas
exclusões
HITL
cronograma inicial
base de proposta
versões de orçamento
```

---

## 6. Primeira Tarefa do Antigravity

Antes de implementar qualquer alteração, faça uma inspeção do projeto atual.

### Procurar por:

```
src/pages
src/components
src/features
src/services
src/lib
src/hooks
server
platform/docs
supabase
migrations
types
schemas
agents
orchestrator
orcamentista
opportunities
proposals
obras
diario
```

### Identificar:

- Onde está a tela de Oportunidade
- Onde está a estrutura de Proposta
- Onde está a estrutura de Obra
- Se já existe algo chamado Orçamentista
- Se já existe algum chat de orçamento
- Se já existe lógica de agentes
- Se já existe integração com Supabase
- Se já existem tipos TypeScript para oportunidade/orçamento/proposta
- Se já existe estrutura de arquivos/upload
- Se há componentes de HITL
- Se há componentes de revisão
- Se há serviço de IA já implementado

---

## 7. Relatório Inicial Obrigatório

Antes de alterar código, retornar um relatório com:

1. Arquivos relevantes encontrados
2. Componentes relacionados a oportunidade/proposta/obra
3. Serviços ou agentes existentes
4. Modelos/tipos existentes
5. Integrações Supabase existentes
6. Pontos onde o Orçamentista IA deve ser encaixado
7. Riscos de alteração
8. Plano de implementação proposto

**Atenção:** Não fazer commit, não criar migration, não alterar banco, não alterar fluxo de Obra, não alterar Diário de Obra.

---

## 8. Estrutura Recomendada de Arquivos

Se ainda não existir estrutura própria para o Orçamentista IA, criar ou propor estrutura semelhante a:

```
src/features/orcamentista/
├── components/
│   ├── OrcamentistaPanel.tsx
│   ├── OrcamentoFilesPanel.tsx
│   ├── OrcamentoPipelineStatus.tsx
│   ├── OrcamentoAgentRunsPanel.tsx
│   ├── OrcamentoServicesTable.tsx
│   ├── OrcamentoQuantitativosTable.tsx
│   ├── OrcamentoCustosTable.tsx
│   ├── OrcamentoHitlPanel.tsx
│   ├── OrcamentoRisksPanel.tsx
│   ├── OrcamentoCronogramaInicial.tsx
│   └── OrcamentoPropostaBase.tsx
├── hooks/
│   ├── useOrcamentos.ts
│   ├── useOrcamentoPipeline.ts
│   └── useOrcamentoHitl.ts
├── services/
│   ├── orcamentistaService.ts
│   ├── orcamentistaOrchestrator.ts
│   ├── agentRegistry.ts
│   └── hitlService.ts
├── schemas/
│   ├── orcamento.schema.ts
│   ├── agentOutput.schema.ts
│   └── hitl.schema.ts
├── types/
│   ├── orcamentista.types.ts
│   └── agent.types.ts
└── index.ts
```

A estrutura exata deve respeitar o padrão já existente no projeto. Não criar estrutura paralela incompatível.

---

## 9. Pipeline que Deve Ser Representado

O pipeline funcional do Orçamentista IA deve seguir esta ordem:

```
0. Criação do orçamento
1. Input Handler
2. Reader Multimodal
3. Classificador de Documentos
4. Planner Técnico
5. Agentes de Domínio
6. Agente Quantitativo
7. Agente de Custos
8. BDI / Encargos / Margem
9. Auditor Técnico-Orçamentário
10. HITL Review
11. Cronograma Inicial
12. Gerador de Proposta
13. Consolidação
14. Preparação para Conversão em Obra
```

Na primeira implementação, não precisa executar IA real em todas as etapas se isso ainda não estiver pronto. Pode implementar estados, schemas, mocks estruturados e pontos de integração.

---

## 10. Estados do Pipeline

Representar estados do pipeline com estes valores:

```
idle
recebendo_arquivos
arquivos_recebidos
em_leitura
leitura_concluida
classificando_documentos
planejando_escopo
acionando_agentes
quantificando
precificando
aplicando_bdi
auditando
aguardando_hitl
gerando_cronograma
gerando_proposta
consolidado
erro
cancelado
```

Se já existir nomenclatura de status no sistema, mapear sem quebrar compatibilidade.

---

## 11. Agentes Obrigatórios

O registro de agentes deve prever:

```
civil_arquitetonico
estrutural
eletrica_dados_automacao
hidrossanitario
impermeabilizacao
climatizacao_exaustao_ventilacao
ppci_incendio
marcenaria_mobiliario_tecnico
vidros_esquadrias_serralheria
acabamentos
documentacao_aprovacoes
administracao_gestao_obra
compatibilizacao_tecnica
comparativo_propostas
quantitativo
custos
bdi_margem
auditor
cronograma_inicial
gerador_proposta
hitl_review
```

Cada agente deve ter:

```
id
name
type
discipline
description
enabled
requiresRag
requiresHitl
outputSchema
```

---

## 12. Saída JSON Obrigatória dos Agentes

Cada agente deve retornar estrutura compatível com:

```json
{
  "agent_name": "string",
  "agent_type": "string",
  "orcamento_id": "string",
  "versao_orcamento": "string",
  "item_analisado": "string",
  "disciplina": "string",
  "status": "string",
  "confianca": 0.0,
  "origem": {
    "tipo": "string",
    "arquivo_id": "string",
    "pagina": "string",
    "referencia": "string"
  },
  "itens_identificados": [],
  "itens_inferidos": [],
  "servicos_sugeridos": [],
  "quantitativos_possiveis": [],
  "riscos": [],
  "hitl": [],
  "premissas": [],
  "exclusoes": [],
  "bloqueia_consolidacao": false,
  "observacoes_tecnicas": "string",
  "observacoes_internas": "string"
}
```

Criar schema TypeScript/Zod, se o projeto já usa validação por schema. Se não usa Zod, criar tipos TypeScript claros.

---

## 13. Score de Confiança

Cada análise deve conter score de confiança de 0.0 a 1.0.

### Escala

```
0.00 - 0.30 = baixa confiança
0.31 - 0.70 = média confiança
0.71 - 0.90 = alta confiança
0.91 - 1.00 = alta confiança com origem forte ou validação humana
```

### Regra

Score baixo com impacto relevante deve gerar HITL.

---

## 14. Regras de Bloqueio

O sistema deve impedir consolidação definitiva quando houver:

```
HITL crítico pendente
risco estrutural sem validação
PPCI crítico sem validação
quantidade principal sem origem
custo principal sem fonte
escopo principal indefinido
fornecimento principal indefinido
auditoria crítica aberta
margem/preço final não validado
documento essencial ausente
```

Esses bloqueios podem ser implementados inicialmente como função de validação lógica, sem necessidade de banco definitivo.

---

## 15. HITL

O módulo deve prever validações HITL com:

```
id
orcamento_id
versao_id
item_ref
tipo_item
hitl_type
disciplina
titulo
motivo
impacto_tecnico
impacto_financeiro
impacto_prazo
severidade
status
opcoes
decisao_usuario
comentario_usuario
created_by_agent
created_at
resolved_at
```

### Status HITL

```
pendente
em_revisao
aprovada
corrigida
rejeitada
convertida_em_verba
fora_do_escopo
aguardando_documento
bloqueada
resolvida
cancelada
```

### Severidade

```
baixa
media
alta
critica
```

---

## 16. Regras de Linguagem dos Agentes

Os agentes não podem afirmar:

```
Está conforme norma.
Está seguro.
Pode executar.
Não há risco.
Não precisa ART/RRT.
Aprovado pelo shopping.
Aprovado pelo Corpo de Bombeiros.
A estrutura suporta.
A carga é suficiente.
O quadro elétrico comporta.
O fornecimento está incluso.
O custo é definitivo sem fonte.
A quantidade é definitiva sem origem.
```

Os agentes devem usar:

```
Indício de possível risco técnico.
Informação não identificada nos arquivos.
Validação por responsável técnico necessária.
HITL obrigatório.
Não consolidar como definitivo.
Manter como pendência, verba ou premissa.
```

---

## 17. RAG e Treinamento dos Agentes

Não implementar fine-tuning neste momento.

A especialização dos agentes deve seguir:

```
prompt canônico
competências técnicas mínimas
RAG autorizado
few-shot examples reais
JSON obrigatório
score de confiança
bloqueios
HITL
auditoria cruzada
Supabase versionado
```

### RAG

Se houver implementação inicial de RAG, respeitar:

- Usar apenas documentos internos/autorizados
- Não indexar normas protegidas sem licença/autorização
- Separar base por disciplina
- Registrar metadados de licença/fonte
- Não depender de RAG irregular

### Stack

Manter o núcleo do EVIS em Node/TypeScript.

Python pode ser previsto apenas como serviço auxiliar futuro para:

```
RAG
embeddings
parsing pesado
processamento de documentos
LangChain/LlamaIndex
vector store
```

Não criar sistema paralelo em Python sem necessidade.

---

## 18. Modelo de Dados Conceitual

Não criar migrations sem autorização.

Mas preparar tipos e serviços considerando as entidades:

```
orcamentos
orcamento_versoes
orcamento_arquivos
orcamento_leituras
orcamento_agent_runs
orcamento_ambientes
orcamento_servicos
orcamento_quantitativos
orcamento_custos
orcamento_bdi_margens
orcamento_equipes_previstas
orcamento_cronograma_inicial
orcamento_riscos
orcamento_premissas
orcamento_exclusoes
orcamento_hitl_validacoes
orcamento_hitl_auditoria
orcamento_auditorias
orcamento_propostas_base
```

Se o projeto já possuir tabelas semelhantes, mapear equivalências e propor adaptação. Não duplicar entidade sem necessidade.

---

## 19. Interface Mínima Esperada

O módulo deve permitir uma interface com:

```
Resumo do orçamento
Status do pipeline
Arquivos recebidos
Disciplinas identificadas
Agentes acionados
Itens identificados
Itens inferidos
Itens pendentes
Serviços orçamentáveis
Quantitativos
Custos
Riscos
HITLs
Cronograma inicial
Base de proposta
Versões
```

A primeira implementação pode ser funcional e simples, sem refinamento visual avançado. Priorizar estrutura correta, rastreabilidade e separação de responsabilidades.

---

## 20. Ações do Usuário

O usuário deve poder:

- Criar orçamento dentro da oportunidade
- Anexar arquivos
- Rodar análise inicial
- Reexecutar etapa
- Validar HITL
- Corrigir item
- Rejeitar item
- Marcar item como verba
- Marcar item fora do escopo
- Alterar quantidade
- Alterar custo
- Aprovar versão
- Gerar base de proposta

Conversão em obra só deve existir após proposta aprovada.

---

## 21. O Que Não Deve Ser Feito

Não fazer:

```
não alterar banco/migrations sem autorização
não misturar Orçamentista com Diário de Obra
não atualizar avanço físico
não criar medição
não registrar equipe em campo
não criar pagamento operacional
não gerar relatório semanal de execução
não alterar fluxo de Obra Ativa
não remover documentos canônicos
não refatorar o sistema inteiro
não criar sistema Python paralelo
não indexar documentos protegidos sem licença
não permitir agente afirmar conformidade normativa definitiva
```

---

## 22. Implementação Recomendada por Etapas

### Etapa A — Mapeamento

Ler projeto e devolver relatório de arquitetura atual.

### Etapa B — Tipos e Schemas

Criar tipos TypeScript/schemas para:

```
orcamento
orcamento_versao
agent_output
hitl
pipeline_state
risk
premissa
exclusao
```

### Etapa C — Agent Registry

Criar registry dos agentes com metadados, sem IA real ainda se necessário.

### Etapa D — Pipeline Service

Criar serviço que representa as etapas do pipeline e status.

### Etapa E — HITL Service

Criar funções para criar, listar e resolver HITLs.

### Etapa F — UI Base

Criar painel do Orçamentista dentro da Oportunidade.

### Etapa G — Mock Inteligente

Criar simulação de análise com JSON estruturado para validar fluxo.

### Etapa H — Integração IA

Somente depois conectar LLM/RAG real.

### Etapa I — Persistência

Somente após validação, propor migrations/tabelas Supabase.

---

## 23. Critério de Aceite Técnico

A implementação estará correta quando:

- [ ] O Orçamentista existir dentro de Oportunidade
- [ ] Não houver mistura com Diário de Obra
- [ ] Pipeline estiver representado
- [ ] Agentes estiverem registrados
- [ ] Saída dos agentes tiver schema
- [ ] Score de confiança existir
- [ ] HITL existir
- [ ] Bloqueios críticos existirem
- [ ] Riscos forem registrados
- [ ] Serviços previstos forem separados de execução real
- [ ] Cronograma inicial for separado de cronograma executado
- [ ] Base de proposta for separada de proposta enviada
- [ ] Nenhuma migration for criada sem autorização
- [ ] Nenhuma lógica de obra ativa for alterada

---

## 24. Teste Funcional Mínimo

Criar ou simular este cenário:

1. Abrir uma oportunidade
2. Criar orçamento
3. Anexar ou simular arquivo arquitetônico
4. Rodar análise inicial
5. Classificar documento como arquitetura/layout
6. Acionar agente Civil / Arquitetônico
7. Gerar serviço inferido de proteção de piso
8. Gerar HITL para confirmar proteção
9. Gerar serviço de forro ou pintura
10. Gerar quantitativo preliminar
11. Aplicar custo manual/mock
12. Rodar auditoria
13. Mostrar bloqueios/pendências
14. Gerar cronograma inicial preliminar
15. Gerar base de proposta
16. Confirmar que nada foi gravado como execução de obra

---

## 25. Relatório Final Obrigatório do Antigravity

Ao finalizar a implementação ou revisão, retornar relatório com:

1. Arquivos lidos
2. Arquivos criados
3. Arquivos alterados
4. Componentes implementados
5. Serviços implementados
6. Tipos/schemas criados
7. Pontos pendentes
8. Riscos técnicos
9. O que não foi alterado
10. Como testar
11. Próximo passo recomendado

Também rodar:

```bash
git status --short --branch
```

Não fazer commit automaticamente.

---

## 26. Comando Principal para o Antigravity

### PROMPT

Você está trabalhando no projeto EVIS.

**Objetivo:** implementar a base funcional do módulo **Orçamentista IA**, respeitando rigorosamente a documentação canônica em `orcamentista/docs/`.

Antes de alterar qualquer código, leia os documentos:

- `EVIS_ORCAMENTISTA_IA_CANONICAL.md`
- `EVIS_ORCAMENTISTA_DOMAIN_AGENTS.md`
- `EVIS_ORCAMENTISTA_PIPELINE.md`
- `EVIS_ORCAMENTISTA_HITL_RULES.md`
- `EVIS_ORCAMENTISTA_DATA_MODEL.md`
- `EVIS_ORCAMENTISTA_AGENT_KNOWLEDGE_BASE.md`
- `EVIS_ORCAMENTISTA_AGENT_TECHNICAL_COMPETENCIES.md`
- `EVIS_ORCAMENTISTA_AGENT_TRAINING_AND_RAG_STRATEGY.md`

Depois, inspecione a arquitetura atual do projeto e identifique onde o Orçamentista IA deve ser encaixado dentro do fluxo de Oportunidade/Proposta.

### Regras obrigatórias:

1. O Orçamentista IA pertence à fase de Oportunidade/Pré-obra.
2. Não misturar com Diário de Obra IA.
3. Não criar medição, avanço físico, pagamento operacional ou relatório semanal de execução.
4. Não alterar banco de dados ou criar migrations sem autorização.
5. Não refatorar o sistema inteiro.
6. Não remover documentos canônicos.
7. Não criar sistema Python paralelo.
8. Não permitir que agentes afirmem conformidade normativa, segurança estrutural ou aprovação externa definitiva.
9. Todo agente deve retornar saída estruturada em JSON.
10. Todo item incerto relevante deve gerar HITL.
11. Todo item deve ter origem, status e confiança.
12. Consolidação deve ser bloqueada por HITL crítico pendente, risco estrutural, PPCI crítico, custo sem fonte, quantidade sem origem ou escopo principal indefinido.

### Tarefas:

1. Mapear arquivos existentes relacionados a Oportunidades, Propostas, Obras, IA, agentes e Supabase.
2. Criar ou propor a estrutura `src/features/orcamentista/`, respeitando o padrão do projeto.
3. Criar tipos/schemas para orçamento, pipeline, agent output e HITL.
4. Criar registry inicial dos agentes.
5. Criar serviço de pipeline do Orçamentista IA.
6. Criar serviço básico de HITL.
7. Criar UI base do Orçamentista dentro da Oportunidade ou ponto equivalente.
8. Criar mock estruturado de análise inicial para validar fluxo.
9. Garantir que nada seja tratado como execução de obra.
10. Entregar relatório final com arquivos alterados, pendências, riscos e instruções de teste.

Ao final, rode:

```bash
git status --short --branch
```

Não faça commit.

---

## 27. Frase Canônica Final

A implementação do Orçamentista IA no EVIS deve criar um motor técnico-comercial de pré-obra, estruturado por agentes, pipeline, dados versionados, HITL e auditoria, sem misturar orçamento com execução real.

**O Orçamentista IA prepara a obra para ser contratada corretamente.**

- Ele não executa obra.
- Ele não substitui responsável técnico.
- Ele estrutura, alerta, calcula preliminarmente, pede validação e prepara a proposta.
