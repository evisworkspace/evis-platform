# Plano de Execução Autônoma Contínua

## Objetivo

Definir o regime contínuo de execução do EVIS Orçamentista sem depender de redefinição estratégica a cada rodada.

Este plano existe para responder sempre:

- o que fazer agora
- o que vem depois
- quando promover um especialista
- quando bloquear uma frente
- quando uma nova ferramenta realmente merece entrar

## Regra-mãe

O projeto entra em regime de execução contínua com esta ordem fixa:

1. contrato disciplinar
2. microcasos ouro
3. baseline do especialista atual
4. avaliação automatizada
5. gate de promoção
6. validação em projeto real
7. só depois: novos repositórios, pré-processadores ou RAG

## Filosofia operacional

### O que não fazer

- não trocar de stack por ansiedade
- não subir RAG completo antes de estabilizar disciplina
- não adicionar conhecimento sem medir ganho
- não promover especialista “porque parece bom”
- não transformar hipótese em fato

### O que fazer sempre

- medir especialista por disciplina
- registrar erro por classe
- manter HITL quando houver dúvida
- usar projeto real como juiz final
- documentar regressão antes de seguir

## Loop contínuo oficial

Cada disciplina passa sempre por este ciclo:

### Etapa 1 - Definição

- congelar schema JSON
- congelar taxonomia de erro
- congelar critérios mínimos de aprovação

### Etapa 2 - Dataset

- criar microcasos ouro
- criar casos médios
- separar projetos completos de validação

### Etapa 3 - Baseline

- rodar especialista atual sem intervenção extra
- registrar score inicial
- listar falhas recorrentes

### Etapa 4 - Intervenção

- ajustar skill
- ajustar referência
- ajustar prompt
- ajustar camada de busca/referência
- ajustar schema ou bloqueio

### Etapa 5 - Reavaliação

- rodar novamente os mesmos casos
- medir melhora ou regressão
- registrar resultado

### Etapa 6 - Promoção

- se bater meta: promove
- se não bater meta: volta para intervenção

### Etapa 7 - Projeto real

- validar em obra real
- observar falhas não cobertas por microcasos
- transformar novas falhas em microcasos

## Ordem contínua das disciplinas

### Trilha 1 - Estrutural / fundações

1. estrutural
2. geotecnico_fundacoes

### Trilha 2 - Instalações

3. hidraulica_sanitaria
4. eletrica

### Trilha 3 - Consolidação civil

5. civil_execucao
6. custos_orcamentacao

## Critério para abrir nova frente

Uma nova frente só pode ser aberta quando a frente anterior estiver em um destes estados:

- `promovida`
- `bloqueada conscientemente`
- `delegada para backlog técnico`

## Definição de promovido

Um especialista é promovido quando:

- schema válido = 100%
- omissão crítica <= meta
- falso positivo <= meta
- HITL correto >= meta
- projeto real não revelou erro impeditivo novo

## Definição de bloqueado

Uma frente é bloqueada quando:

- depende de base externa ainda inexistente
- depende de decisão de produto
- depende de fonte documental ainda não ingerida
- depende de correção estrutural do core

## O que entra como intervenção válida

- melhorar skill
- melhorar documento de referência
- melhorar aliases de busca
- melhorar composição EVIS/SINAPI
- melhorar normalização de saída
- melhorar auditoria
- melhorar schema

## O que não conta como progresso real

- adicionar ferramenta sem benchmark
- mudar modelo sem medição
- aumentar contexto sem reduzir erro
- gerar documentação sem fechar teste

## Política de ferramentas

### Permitido agora

- skills e referências locais
- EVIS + SINAPI + MCP
- melhorias de prompt e schema
- microcasos
- DeepEval

### Permitido depois

- Docling
- Marker
- Instructor
- Ragas
- RAG semântico

### Proibido por enquanto

- fine-tuning de modelo-base
- refatoração ampla para nova orquestração sem necessidade comprovada
- stack nova sem caso de uso mensurável

## Cadência contínua recomendada

### Ciclo curto

- criar ou ajustar microcasos
- rodar baseline
- aplicar correção pequena
- rerodar

### Ciclo médio

- fechar uma disciplina
- promover ou bloquear
- atualizar quadro de maturidade

### Ciclo longo

- validar em projeto real
- coletar falhas novas
- alimentar dataset

## Resultado esperado

Ao operar por este plano, o sistema passa a evoluir por confiabilidade comprovada, e não por sensação de avanço.

Esse é o trilho oficial de execução contínua do EVIS Orçamentista.
