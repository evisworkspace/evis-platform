# Status de Execução Contínua

## Estado atual

### Núcleo do sistema

- chat operacional
- multiagente operacional
- Gemini na leitura multimodal
- Claude Sonnet na auditoria
- catálogo EVIS funcionando
- busca SINAPI melhorada
- MCP operacional

### Regime de validação

- plano disciplinar criado
- contrato disciplinar criado
- template de microcaso criado
- lote 01 estrutural criado
- baseline estrutural executada
- relatório estrutural gerado
- lote 01 geotécnico/fundações criado
- baseline geotécnico/fundações executada
- relatório geotécnico/fundações gerado
- lote 01 hidráulica/sanitária criado
- baseline hidráulica/sanitária executada
- relatório hidráulica/sanitária gerado
- lote 01 elétrica criado
- baseline elétrica executada
- relatório elétrica gerado
- lote 01 civil/execução criado
- baseline civil/execução executada
- relatório civil/execução gerado
- lote 01 custos/orçamentação criado
- baseline custos/orçamentação executada
- relatório custos/orçamentação gerado

## Fila oficial de execução

### Agora

- consolidar ajustes finos transversais do Phase 1
- estrutural: ajustar representação de lacunas quantitativas (`null` vs `0`)
- estrutural/geotécnico/hidráulica/elétrica/civil/custos: separar checks positivos de checks negativos no judge
- ampliar microcasos dos especialistas já aprovados de 6 para 20
- preparar rodada 02 do Phase 1 após ajustes finos

### Em seguida

- plugar DeepEval na esteira de baseline
- definir score mínimo de promoção por disciplina

### Depois

- validar especialistas em projeto real assistido
- transformar falhas reais em novos microcasos

### Depois disso

- consolidar gates de promoção
- abrir Phase 2 de maturidade semântica / RAG mínimo

## Critério de passagem por disciplina

Cada disciplina só avança quando:

- microcasos mínimos criados
- baseline rodada
- falhas mapeadas
- primeira correção aplicada
- reavaliação registrada

## Checkpoint de hoje

### Concluído

- contrato disciplinar Fase 1
- plano de execução disciplinar
- template de microcaso
- lote inicial estrutural
- baseline estrutural rodada com 6/6 aprovados
- score médio estrutural inicial = 96,7
- relatório salvo em `orcamentista/exemplos/microcasos/estrutural/results`
- lote inicial geotécnico/fundações
- baseline geotécnico/fundações rodada com 6/6 aprovados
- score médio geotécnico/fundações inicial = 95,8
- relatório salvo em `orcamentista/exemplos/microcasos/geotecnico_fundacoes/results`
- lote inicial hidráulica/sanitária
- baseline hidráulica/sanitária rodada com 6/6 aprovados
- score médio hidráulica/sanitária = 95,8
- relatório salvo em `orcamentista/exemplos/microcasos/hidraulica_sanitaria/results`
- lote inicial elétrica
- baseline elétrica rodada com 6/6 aprovados
- score médio elétrica = 95,8
- relatório salvo em `orcamentista/exemplos/microcasos/eletrica/results`
- lote inicial civil/execução
- baseline civil/execução rodada com 6/6 aprovados
- score médio civil/execução = 95,8
- relatório salvo em `orcamentista/exemplos/microcasos/civil_execucao/results`
- lote inicial custos/orçamentação
- baseline custos/orçamentação rodada com 6/6 aprovados
- score médio custos/orçamentação = 95,8
- relatório salvo em `orcamentista/exemplos/microcasos/custos_orcamentacao/results`

### Em progresso

- regime contínuo de execução
- endurecimento do regime de avaliação do Phase 1

### Próxima entrega concreta

- rodada 02 do Phase 1 com microcasos ampliados e judge endurecido

## Riscos ativos

- ainda não existe DeepEval plugado
- RAG ainda não existe como camada madura

## Regra de foco

Enquanto o Phase 1 não estiver com gate de promoção documentado, não abrir:

- RAG completo
- notebook de benchmark
- refatoração grande de stack

## Próxima decisão permitida

A próxima decisão técnica aceitável é:

- ampliar lote dos especialistas já aprovados
- plugar DeepEval
- iniciar validação em projeto real assistido

Não é aceitável agora:

- adicionar novo framework sem medir

## Observações da baseline estrutural

- 6 microcasos executados
- 6 aprovados
- score médio de 96,7
- comportamento forte em:
  - conflito de FCK
  - quadro de armaduras
  - conflito de revisão
  - dependência geotécnica
- ajuste fino identificado:
  - quantitativos ainda usam `0` para lacuna em alguns casos; o ideal é representar ausência como `null`
  - alguns checks do juiz são negativos por natureza, como `escolha_silenciosa`; precisam ser nomeados de forma menos ambígua no relatório

## Observações da baseline geotécnico/fundações

- 6 microcasos executados
- 6 aprovados
- score médio de 95,8
- comportamento forte em:
  - conflito de tipologia de fundação
  - ausência de SPT
  - profundidade indefinida de estaca
  - risco geotécnico com água e solo mole
- ajuste fino identificado:
  - em alguns casos o especialista abre perguntas HITL extras além do mínimo necessário
  - ainda aparece `0` como marcador de quantitativo candidato em vez de `null`
  - alguns cenários estruturados vieram com confiança mais baixa do que o ideal

## Observações da baseline hidráulica/sanitária

- 6 microcasos executados
- 6 aprovados
- score médio de 95,8
- comportamento forte em:
  - separação de sistemas por tipo
  - pluvial vs esgoto sanitário
  - arquitetura como base candidata quando falta planta hidráulica
  - composição residencial por ponto
- ajuste fino identificado:
  - consolidar `quantitativos_chave` por tipo quando a base estiver fechada foi necessário e já foi incorporado na skill

## Observações da baseline elétrica

- 6 microcasos executados
- 6 aprovados
- score médio de 95,8
- comportamento forte em:
  - separação entre TUG, TUE e iluminação
  - postura conservadora sem quadro de cargas
  - pontos especiais
  - infraestrutura elétrica não omitida
- ajuste fino identificado:
  - alguns casos ainda usam `0` como marcador de lacuna em quantitativos candidatos

## Observações da baseline civil/execução

- 6 microcasos executados
- 6 aprovados
- score médio de 95,8
- comportamento forte em:
  - área líquida vs área bruta
  - vãos e descontos
  - separação entre camadas executivas
  - prevenção de dupla contagem
- ajuste fino identificado:
  - manter a disciplina conservadora em esquadrias e áreas molhadas quando faltar quadro ou detalhe de sistema

## Observações da baseline custos/orçamentação

- 6 microcasos executados
- 6 aprovados
- score médio de 95,8
- comportamento forte em:
  - prioridade SINAPI para estrutura/fundação
  - prioridade EVIS para instalações residenciais por ponto
  - item sem referência permanece pendente
  - duplicidade entre disciplinas é sinalizada
- ajuste fino identificado:
  - o contrato do microcaso 001 precisou ser alinhado ao runtime real para incluir snapshot de referência com código e competência
