# Plano de Execução Disciplinar

## Objetivo

Colocar o EVIS Orçamentista em regime de validação disciplinar mensurável.

O projeto já saiu da fase de arquitetura-base. O próximo salto vem de:

- contratos rígidos por disciplina
- microcasos ouro
- avaliação automatizada
- gate de promoção
- validação em projeto real

## Princípio de decisão

Não vamos treinar modelo-base agora.

Vamos treinar o sistema:

- leitura
- extração
- interpretação
- composição
- auditoria
- bloqueio

## Prioridades executivas

### Prioridade 1

- congelar schema JSON por disciplina
- definir taxonomia de erro
- criar microcasos ouro
- medir saída por especialista

### Prioridade 2

- plugar DeepEval
- criar score mínimo por disciplina
- bloquear especialista abaixo da meta
- promover somente especialista aprovado

### Prioridade 3

- testar pré-processamento documental
- endurecer extração estruturada
- subir RAG semântico apenas depois de estabilidade

## Estado atual do sistema

### Já estruturado

- chat operacional
- workspace local
- leitura multimodal com Gemini
- auditoria com Claude Sonnet
- malha multiagente
- especialistas Fase 1
- catálogo EVIS + SINAPI
- HITL obrigatório

### Já validado

- estrutural em rodada real
- catálogo EVIS residencial com referências reais
- consulta MCP operacional
- busca técnica SINAPI melhorada para estrutura

### Ainda não maduro

- RAG completo
- avaliação automática disciplinar
- gate de promoção por especialista
- validação robusta de hidráulica, elétrica e geotécnica em projeto real

## Fase 1 - Execução imediata

### 1. Congelar contratos disciplinares

Entregáveis:

- schema final por disciplina
- campos obrigatórios
- campos candidatos
- campos de conflito
- campos de lacuna
- perguntas HITL obrigatórias

Disciplinas:

- civil_execucao
- estrutural
- geotecnico_fundacoes
- hidraulica_sanitaria
- eletrica
- custos_orcamentacao

### 2. Taxonomia de erro

Cada disciplina deve medir:

- omissao_critica
- falso_positivo
- inferencia_sem_lastro
- unidade_errada
- quantitativo_errado
- mapeamento_referencia_errado
- conflito_nao_sinalizado
- hitl_nao_acionado
- schema_invalido

### 3. Microcasos ouro

Volume inicial:

- 50 microcasos por disciplina
- 10 casos médios por disciplina
- 3 projetos completos por disciplina

Critério:

- microcaso deve isolar uma habilidade
- cada caso deve ter entrada, saída esperada, erros proibidos e regra de aprovação

### 4. Score e gate

Meta inicial recomendada por disciplina:

- preenchimento de campos obrigatórios >= 95%
- omissão crítica <= 2%
- falso positivo <= 5%
- schema válido = 100%
- escalonamento correto HITL >= 90%

Regra:

- especialista abaixo da meta não sobe de estágio
- especialista aprovado entra em piloto ampliado

## Fase 2 - Integração de avaliação

### DeepEval

Usar para:

- execução de suites por disciplina
- scoring automatizado
- regressão por especialista
- comparação entre versões de prompt/skill

### Ragas

Usar depois para:

- avaliação de retrieval
- cobertura de contexto
- grounding
- qualidade de RAG

## Fase 3 - Pré-processamento documental

Só depois da Fase 1 e 2 estabilizadas:

- testar Docling
- testar Marker
- decidir se algum deles melhora extração multimodal real

## Fase 4 - RAG real

Subir somente após disciplina estabilizada:

- manifesto de ingestão
- chunking semântico
- versionamento de fontes
- reranking
- regressão de retrieval

## Ordem recomendada de execução

### Bloco A

- estrutural
- geotecnico_fundacoes

### Bloco B

- hidraulica_sanitaria
- eletrica

### Bloco C

- civil_execucao
- custos_orcamentacao

## Resultado esperado

Ao final desse plano, o Orçamentista deve conseguir responder de forma mensurável:

- qual disciplina está madura
- qual especialista ainda falha
- qual erro está acontecendo
- quando deve escalar para HITL
- quando pode seguir para consolidação

## Decisão arquitetural

Regra oficial do projeto:

- menos empilhamento de stack
- mais validação disciplinar
- menos “parece inteligente”
- mais confiabilidade operacional mensurável
