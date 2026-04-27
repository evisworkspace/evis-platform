# EVIS — Estrutura de Reestruturação do Sistema Híbrido de Orçamentação

## Objetivo

Este documento define a reestruturação funcional do EVIS para operar **sempre em modo híbrido**.

O sistema **não deve ser autônomo**.
Ele deve funcionar como um motor de orçamentação assistida por IA, com validação humana obrigatória, checkpoint por etapa, auditoria cruzada e rastreabilidade documental.

---

## Princípio Central

O EVIS deve operar como um **orquestrador técnico com HITL obrigatório**.

Isso significa:

- a IA pode ler, organizar, calcular, sugerir, cruzar e consolidar;
- a IA **não pode avançar livremente** quando houver conflito, lacuna relevante, inferência sensível ou atualização documental;
- toda etapa relevante deve exigir um `DE ACORDO` humano antes da consolidação;
- todo dado crítico deve carregar origem e nível de confiabilidade.

---

## Diagnóstico do Estado Atual

A arquitetura de tipos do arquivo atual já prevê uma estrutura robusta com `ReaderOutput`, `PlannerOutput`, saídas de especialistas, quantitativos, composição, auditoria e `MultiAgentAnalysis`, o que mostra uma boa base conceitual para o EVIS. Entretanto, a implementação atual executa de fato apenas o `Reader` e um `Planner` genérico; os blocos de especialistas, quantitativos, composição e auditoria ainda são preenchidos com valores vazios/default. Além disso, o `Planner` é chamado com um prompt fixo e não é alimentado diretamente pelo resultado completo do `Reader`. fileciteturn11file11 fileciteturn11file13 fileciteturn11file14

No piloto Rita e Bruno, o fluxo validado funcionou bem justamente por ser híbrido: houve releitura de regras, correção de quantitativos, atualização de checkpoint JSON, ajuste de composição, confirmação de BDI, cronograma e consolidação final. Também ficou claro que regras de negócio como códigos `N.M`, equipes obrigatórias e aliases no JSON passaram a ser mandatórias após releitura dos arquivos de apoio. fileciteturn11file1 fileciteturn11file5 fileciteturn11file9

---

## Diretriz de Reestruturação

A correção do sistema deve seguir esta lógica:

1. **Parar de tratar o EVIS como resposta única**.
2. **Transformar o EVIS em pipeline híbrido com estado persistente**.
3. **Fazer o Planner nascer do Reader real**.
4. **Executar especialistas reais por disciplina**.
5. **Separar quantitativo, composição, auditoria e checkpoint**.
6. **Impedir avanço sem validação humana quando necessário**.

---

## Arquitetura-Alvo do EVIS

### 1. Camada de Sessão / Estado

Criar uma camada de estado persistente por projeto/sessão.

Essa camada deve armazenar:

- `project_id`
- `session_id`
- `status_geral`
- `etapa_atual`
- `versao_checkpoint`
- `documentos_ativos`
- `documentos_substituidos`
- `premissas_aprovadas`
- `premissas_pendentes`
- `conflitos_abertos`
- `perguntas_hitl_abertas`
- `quantitativos_aprovados`
- `composicoes_aprovadas`
- `bdi_aprovado`
- `cronograma_aprovado`
- `json_exportado`
- `historico_eventos`

### 2. Camada de Ingestão Documental

Responsável por:

- receber anexos;
- classificar tipo de documento;
- identificar disciplina;
- detectar revisão;
- marcar documento como novo, repetido, atualizado ou substituído;
- registrar evidências por arquivo/página/trecho;
- invalidar parcialmente etapas já calculadas quando houver nova revisão.

### 3. Camada Reader

Responsável por leitura técnica inicial.

Saída mínima obrigatória:

- resumo executivo;
- lista de documentos detectados;
- disciplinas detectadas;
- inconsistências iniciais;
- lacunas documentais;
- itens críticos;
- evidências por arquivo.

Regra:

- o Reader deve diferenciar claramente `fato`, `hipótese`, `lacuna` e `conflito`.

### 4. Camada Planner

Responsável por planejar a execução técnica do orçamento **com base no Reader real**.

O Planner deve receber como entrada:

- output integral do Reader;
- status da sessão;
- documentos ativos;
- regras de negócio vigentes.

Saída mínima:

- disciplinas priorizadas;
- tarefas por disciplina;
- especialistas a acionar;
- dependências entre tarefas;
- estratégia de auditoria;
- pontos obrigatórios de HITL;
- risco de prosseguir com base insuficiente.

**Regra crítica:**
O Planner não pode usar roteiro fixo genérico. O roteiro deve nascer do contexto documental efetivo.

### 5. Camada de Especialistas de Disciplina

Executar especialistas reais por domínio.

Sugestão mínima de especialistas:

- fundação / solo
- estrutura
- arquitetura
- alvenaria / vedação
- cobertura
- esquadrias
- revestimentos
- impermeabilização
- hidráulica
- elétrica
- SPDA
- urbanização / externos
- acabamentos especiais

Saída mínima de cada especialista:

- escopo lido;
- achados;
- conflitos;
- quantitativos candidatos;
- itens orçamentários candidatos;
- premissas;
- perguntas HITL;
- evidências críticas;
- confiança.

### 6. Camada de Quantitativos

Essa camada deve consolidar as leituras dos especialistas e aplicar regras formais de medição.

Cada quantitativo deve possuir:

- `item`
- `disciplina`
- `unidade`
- `quantidade`
- `metodo_origem`
- `formula_aplicada`
- `origem_documental`
- `premissas`
- `nivel_confianca`
- `status_validacao`

#### Classificação obrigatória da origem do quantitativo

- `extraido_documento`
- `calculado_regra`
- `inferido`
- `estimado`

#### Regra obrigatória de segurança

Antes de devolver qualquer quantidade, o agente de quantitativos deve declarar:

1. fórmula usada;
2. documentos usados;
3. o que foi exato;
4. o que foi estimado;
5. o que depende de validação humana.

#### Regras que devem virar skill explícita

O piloto mostrou que o maior erro estrutural do processo foi quantitativo sem regra formal, especialmente em paredes, pintura e itens derivados. A própria auditoria do piloto concluiu que o erro de perímetro de parede afetou múltiplas categorias e deveria ter sido evitado com regra documentada na skill. fileciteturn11file10

Portanto, a skill de quantitativos deve obrigar formalmente:

- perímetro × pé-direito quando aplicável;
- desconto de vãos;
- separação entre área construída, área coberta, área útil e área de acabamento;
- distinção entre parede interna, externa, molhada, box e fachada;
- distinção entre quantitativo exato e quantitativo por estimativa técnica.

### 7. Camada de Composição de Custos

Separar a composição de custos da etapa de quantitativos.

Cada composição deve possuir:

- `codigo_servico`
- `descricao_servico`
- `categoria`
- `equipe_responsavel`
- `unidade`
- `quantidade_base`
- `origem_preco`
- `codigo_referencia`
- `material`
- `mao_de_obra`
- `equipamento`
- `custo_unitario`
- `custo_total`
- `observacoes`
- `pendencias`

#### Fontes de custo com prioridade

1. **Catálogo Berti / histórico próprio**
2. **Supabase EVIS**
3. **SINAPI / referência pública**
4. **cotação externa validada**
5. **estimativa manual sinalizada**

O piloto mostrou que a base pública não cobre bem vários grupos essenciais, como drywall, porcelanato, pintura, pontos elétricos/hidráulicos, esquadrias, telha sanduíche, estrutura metálica e estacas por execução, exigindo catálogo próprio ou complementação validada. fileciteturn11file1 fileciteturn11file2

#### Regra obrigatória

Nenhuma composição pode passar como “válida” se:

- não houver origem explícita do preço;
- for `vb` sem observação de composição manual;
- não houver equipe associada;
- não respeitar o formato de código e schema oficial.

### 8. Camada de BDI

Camada separada e bloqueada por validação.

Entrada:

- custos diretos consolidados;
- regime tributário;
- taxa de gerenciamento;
- encargos;
- despesas indiretas;
- riscos;
- lucro.

Saída:

- memória de cálculo;
- percentual final;
- composição do BDI;
- valor final da obra.

No piloto, o BDI foi consolidado com 15% de gerenciamento + 5% Simples Nacional, totalizando 20%, e passou a compor o checkpoint final. fileciteturn11file5

### 9. Camada de Cronograma

Entrada:

- serviços validados;
- dependências;
- produtividade;
- equipe;
- data de início;
- restrições.

Saída:

- cronograma por serviço;
- marcos;
- curva física;
- curva financeira;
- desembolso mensal.

No piloto, o cronograma final consolidou início em 04/05/2026 e entrega em 09/01/2027, com resumo financeiro e curva de desembolso incluídos no checkpoint final. fileciteturn11file5

### 10. Camada de Auditoria

Essa camada é obrigatória antes do avanço para próxima fase.

Deve auditar:

- conflito entre documentos;
- itens ausentes;
- duplicidade;
- unidade incompatível;
- composição sem base;
- quantitativo excessivamente inferido;
- divergência entre memorial, prancha, lista de equipamentos e revisão;
- falta de equipe;
- falta de alias;
- uso indevido de códigos antigos.

Saída:

- `status`
- `score_consistencia`
- `divergencias`
- `omissoes`
- `riscos`
- `recomendacao`
- `perguntas_hitl`

### 11. Camada HITL (Human-in-the-loop)

Essa camada não é opcional. É parte do produto.

O sistema deve parar e exigir validação humana quando houver:

- conflito documental;
- revisão nova de projeto;
- quantitativo inferido acima de limiar;
- composição com valor manual;
- divergência entre memorial e lista de equipamentos;
- mudança de escopo;
- item especial fora do catálogo;
- BDI ainda não aprovado;
- cronograma com dependência crítica incerta.

#### Eventos de avanço possíveis

- `de_acordo`
- `corrigir_e_reprocessar`
- `bloquear_etapa`
- `aprovar_com_ressalva`

### 12. Camada de Checkpoint

A cada avanço validado, gerar checkpoint persistente.

Tipos de checkpoint sugeridos:

- `checkpoint_reader`
- `checkpoint_planner`
- `checkpoint_quantitativos`
- `checkpoint_composicao`
- `checkpoint_bdi`
- `checkpoint_cronograma`
- `checkpoint_final`

Cada checkpoint deve conter:

- versão;
- timestamp;
- etapa;
- dados consolidados;
- pendências abertas;
- hash ou assinatura da versão documental;
- observações do usuário.

O piloto mostrou que essa lógica de checkpoint foi decisiva para manter consistência após correções e releituras. O arquivo final consolidado registrou quantitativos corrigidos, ajustes de mão de obra, substituição de composição específica, BDI, cronograma e status finalizado. fileciteturn11file5 fileciteturn11file7

### 13. Camada de Exportação

Deve exportar:

- JSON EVIS oficial;
- planilha técnica;
- resumo executivo;
- proposta HTML;
- relatórios visuais.

Regra:

- template visual deve ser separado do conteúdo;
- o sistema injeta dados no template, não recria layout do zero.

---

## Regras de Negócio Obrigatórias

As regras abaixo devem ser impostas transversalmente em todo o fluxo:

### Regras de schema e codificação

- usar `codigo_servico` como campo oficial;
- migrar definitivamente de `SRV-*` para formato `N.M`;
- todo serviço deve ter categoria;
- todo serviço deve ter equipe obrigatória;
- equipes devem seguir padrão `EQ-{TIPO}-{NN}`;
- aliases obrigatórios no JSON.

Essas regras foram absorvidas na releitura dos arquivos de apoio e precisam sair do nível de “prompt” para nível de validação estrutural do sistema. fileciteturn11file1 fileciteturn11file9

### Regras de validação documental

- documento novo invalida o que ele impacta;
- revisão mais nova não pode coexistir silenciosamente com revisão antiga;
- conflito entre memorial e lista de equipamentos deve abrir pergunta HITL;
- ausência de projeto complementar deve ser marcada como estimativa, nunca como leitura exata.

### Regras de custos

- separar material e mão de obra quando aplicável;
- sinalizar custo derivado de catálogo próprio;
- sinalizar custo derivado de SINAPI;
- sinalizar custo manual;
- impedir composição aprovada sem origem.

### Regras de segurança operacional

- não inventar dado ausente;
- não ocultar conflito;
- não fechar item crítico por média implícita;
- não avançar etapa com pendência crítica aberta.

---

## Fluxo Operacional Recomendado

### Etapa 0 — Ingestão

- receber anexos
- classificar documentos
- detectar revisão
- atualizar estado da sessão

### Etapa 1 — Reader

- leitura técnica
- mapa documental
- conflitos iniciais
- lacunas
- criticidades

### Etapa 2 — Planner

- montar plano técnico real
- definir disciplinas
- definir especialistas
- definir dependências
- definir checkpoints

### Etapa 3 — HITL de Escopo

- confirmar escopo
- confirmar exclusões
- confirmar base documental válida

### Etapa 4 — Especialistas por disciplina

- leitura segmentada
- achados
- conflitos
- quantitativos candidatos

### Etapa 5 — Consolidação de Quantitativos

- aplicar regras formais
- classificar origem das quantidades
- abrir dúvidas obrigatórias

### Etapa 6 — HITL de Quantitativos

- aprovar ou corrigir
- gerar checkpoint

### Etapa 7 — Composição de Custos

- mapear referências
- compor custos
- vincular equipe
- separar MAT/MO quando aplicável

### Etapa 8 — Auditoria de Custos

- validar composições
- identificar lacunas
- abrir pendências

### Etapa 9 — HITL de Custos

- aprovar ou corrigir
- gerar checkpoint

### Etapa 10 — BDI

- aplicar estrutura aprovada
- consolidar preço final

### Etapa 11 — Cronograma

- gerar cronograma físico-financeiro
- curva S
- desembolso

### Etapa 12 — Exportação Final

- JSON
- proposta
- relatórios
- visuais

---

## Correções Prioritárias para o Engenheiro

### Prioridade 1 — Estrutural

1. Fazer o `Planner` consumir o output integral do `Reader`.
2. Remover o planner genérico fixo.
3. Implementar execução real dos especialistas.
4. Implementar camada de estado persistente.
5. Implementar checkpoints por etapa.

### Prioridade 2 — Governança

6. Implementar bloqueio HITL por regra.
7. Implementar detecção de revisão documental.
8. Implementar invalidação parcial de etapas impactadas.
9. Implementar validação estrutural de `codigo_servico`, categoria, equipe e aliases.

### Prioridade 3 — Precisão técnica

10. Criar skill rígida de quantitativos com fórmula obrigatória.
11. Criar classificação formal do nível de origem das quantidades.
12. Separar quantitativos de composição.
13. Separar composição de BDI.
14. Criar auditoria obrigatória antes de avanço.

### Prioridade 4 — Base de custo

15. Priorizar Catálogo Berti / Supabase como fonte principal.
16. Tratar SINAPI como fallback referencial.
17. Marcar itens fora da base como pendência de cotação ou composição manual.

### Prioridade 5 — Produto final

18. Separar template HTML do conteúdo.
19. Criar exportadores padronizados.
20. Padronizar artefatos finais por projeto.

---

## Estrutura de Artefatos Recomendada

```text
/projects/{project_id}/
  /inputs/
    /documentos/
    /revisoes/
  /state/
    session_state.json
    checkpoint_reader.json
    checkpoint_planner.json
    checkpoint_quantitativos.json
    checkpoint_composicao.json
    checkpoint_bdi.json
    checkpoint_cronograma.json
    checkpoint_final.json
  /outputs/
    orcamento_final.json
    resumo_executivo.md
    proposta.html
    curva_s.json
    desembolso_mensal.json
  /logs/
    auditoria.json
    hitl_events.json
```

---

## Critérios de Aceite

A reestruturação só deve ser considerada concluída quando o sistema:

- operar explicitamente em modo híbrido;
- impedir avanço sem validação quando necessário;
- registrar evidência documental de forma rastreável;
- separar leitura, quantitativo, composição, auditoria e checkpoint;
- respeitar `codigo_servico` em formato `N.M`;
- exigir equipe por serviço;
- invalidar automaticamente etapas impactadas por revisão nova;
- consolidar checkpoint por etapa;
- exportar JSON e proposta a partir de estado confiável.

---

## Veredito Executivo

O processo validado no piloto mostrou que o EVIS funciona muito bem como **motor híbrido de orçamentação assistida**, com checkpoint, auditoria e entrega comercial forte. O que falta não é conceito; é alinhar a implementação ao protocolo que já se mostrou vencedor no uso real. O código atual ainda representa principalmente leitura + planejamento inicial, enquanto o processo validado no piloto já exige especialistas reais, checkpoint por etapa, codificação oficial `N.M`, equipe obrigatória e consolidação final orientada por HITL. fileciteturn11file5 fileciteturn11file9 fileciteturn11file13
