# EVIS - Workflow Oportunidade -> Obra

## 1. Visao geral

O EVIS seguira uma estrutura visual e operacional similar entre Oportunidade e Obra, inspirada na organizacao pratica do Vobi, mas adaptada ao produto EVIS e ao uso de uma IA orquestradora.

A experiencia deve manter continuidade entre a etapa comercial e a etapa operacional. O usuario deve reconhecer a mesma logica de navegacao, a mesma linguagem de trabalho e uma ordem rigida de abas, evitando mudancas bruscas quando uma Oportunidade ganha passa a ser tratada como Obra.

A ordem das abas e parte da arquitetura de produto. Ela deve ser seguida estritamente para reduzir ambiguidades, facilitar treinamento, padronizar fluxos internos e permitir que a IA proponha atualizacoes dentro de uma estrutura previsivel.

## 2. Oportunidade

Oportunidade e o nucleo comercial do EVIS. Ela concentra a entrada inicial do cliente, a maturacao da demanda, o preparo do orcamento, a proposta comercial e as atividades necessarias ate ganhar ou arquivar a oportunidade.

Ordem oficial das abas da Oportunidade:

1. Geral
2. Orcamento
3. Tarefas
4. Obra
5. Arquivos
6. Propostas
7. Anotacoes
8. Pagamentos do cliente

Responsabilidades da Oportunidade:

- Cadastro inicial do cliente.
- Edicao progressiva dos dados comerciais e tecnicos.
- Orcamento manual ou apoiado por IA.
- Geracao de proposta.
- Organizacao das tarefas comerciais.
- Armazenamento de arquivos relacionados a venda.
- Registro de anotacoes comerciais.
- Controle de pagamentos do cliente quando aplicavel.
- Decisao de ganhar ou arquivar.

A aba Obra dentro de Oportunidade serve para antecipar informacoes operacionais relevantes ainda durante a fase comercial. Ela nao substitui a Obra formal, mas prepara a transicao quando a oportunidade for ganha.

## 3. Obra

Apos ganhar, a Oportunidade vira Obra. Essa transicao marca a mudanca de foco: a estrutura deixa de ser predominantemente comercial e passa a ser operacional.

A Obra mantem uma estrutura semelhante a Oportunidade para preservar familiaridade, mas reorganiza as abas conforme a rotina de execucao, acompanhamento, compras, financeiro e comunicacao.

Ordem oficial das abas da Obra:

1. Geral
2. Orcamento
3. Tarefas
4. Obra
5. Compras/Financeiro
6. Anotacoes
7. Arquivos
8. Propostas

Na aba Obra, as subabas operacionais previstas sao:

1. Planejamento
2. Medicoes
3. Fisico-Financeiro
4. Curva S
5. Diario de Obra

Responsabilidades da Obra:

- Consolidar dados aprovados na etapa comercial.
- Acompanhar execucao fisica e financeira.
- Controlar tarefas, pendencias, equipes e entregas.
- Registrar medicoes e evolucao do planejamento.
- Centralizar compras, despesas, recebimentos e impacto financeiro.
- Manter arquivos, propostas e anotacoes associados ao ciclo operacional.

## 4. Diario de Obra como cockpit de IA

O Diario de Obra nao e apenas um campo de texto ou um registro narrativo. No EVIS, ele deve funcionar como o cockpit operacional de IA da obra.

Ele e a entrada operacional principal da obra, onde o gestor registra acontecimentos, decisoes, problemas, avancos, fotos, comunicacoes, comprovantes, duvidas e observacoes do dia. A partir desse material, a IA organiza informacoes, identifica impactos e sugere atualizacoes nas areas corretas do sistema.

O Diario de Obra deve permitir que a rotina real da obra alimente o EVIS sem exigir que o gestor navegue por muitas telas no momento da captura.

## 5. Captura rapida / widget iOS

O EVIS deve prever entrada rapida de informacoes, especialmente por widget iOS ou experiencia equivalente de captura imediata.

Tipos de entrada previstos:

- Audio.
- Texto.
- Foto.
- Print.
- Arquivo.
- Observacao rapida.
- Conteudo encaminhado.

Objetivo: o gestor nao precisa guardar informacoes na cabeca durante o dia. Tudo pode ser capturado no momento em que acontece e depois organizado pela IA, com validacao humana antes de atualizar o sistema.

Essa captura deve ser simples, direta e voltada para a rotina de campo: registrar agora, organizar depois.

## 6. Os dois motores de IA do EVIS

O EVIS tem dois motores de IA distintos, com papeis e momentos de atuacao diferentes.

### 6.1 Orçamentista IA — motor tecnico-comercial

Atua antes da obra existir. Converte arquivos de projeto, especificacoes e briefing em orcamento estruturado e base para proposta.

Nao e um chat. A interface conversacional e a entrada de uma esteira tecnica com etapas, contratos e validacao humana em cada checkpoint.

```text
Lead / Oportunidade
-> Arquivos de projeto (PDF, planta, memoria, especificacao)
-> Reader (leitura multimodal dos documentos)
-> Planner (roteiro tecnico por disciplina)
-> HITL (aprovacao do roteiro)
-> Especialistas (quantitativos por disciplina)
-> Composicao de custos (SINAPI + base propria)
-> HITL (revisao dos itens)
-> Orcamento estruturado (gravado em orcamento_itens)
-> Base para proposta comercial
```

Fronteira: o Orcamentista IA encerra sua atuacao quando a obra e criada. O orcamento migra para a obra, mas o motor nao atua mais sobre a execucao.

### 6.2 Diario de Obra IA — motor operacional

Atua depois da obra existir. Converte captura diaria de campo em atualizacoes validadas na obra dentro do Supabase.

Nao e um campo de texto. E o cockpit operacional onde o gestor registra o dia e a IA organiza, classifica e propoe atualizacoes.

```text
Entrada bruta do dia (texto, audio, foto, print, arquivo)
-> Orquestrador
-> Classificacao por dominio
-> Subagentes especializados
-> Propostas de atualizacao
-> Validacao humana / HITL
-> Gravacao no Supabase (servicos, pendencias, notas, presenca)
-> Dashboard atualizado
```

Descricao do fluxo:

1. Entrada bruta do dia: conteudo capturado pelo gestor em texto, audio, foto, print, arquivo, observacao rapida ou material encaminhado.
2. Orquestrador: camada central de IA que interpreta o contexto da obra e decide como distribuir a informacao.
3. Classificacao por dominio: separacao da informacao por area de impacto, como cronograma, orcamento, equipes, pendencias ou cliente.
4. Subagentes especializados: agentes de IA analisam cada dominio com foco no seu tipo de decisao.
5. Propostas de atualizacao: a IA sugere mudancas, registros ou alertas para o sistema.
6. Validacao humana/HITL: o usuario revisa, ajusta e confirma antes de qualquer gravacao.
7. Gravacao no Supabase: somente apos aprovacao humana, as atualizacoes confirmadas sao registradas.
8. Dashboard atualizado: os paineis refletem as informacoes validadas e gravadas.

### 6.3 Regra de separacao

| Propriedade | Orcamentista IA | Diario de Obra IA |
|---|---|---|
| Momento | Antes da obra existir | Depois da obra existir |
| Entrada principal | Arquivos de projeto e briefing | Captura diaria de campo |
| Saida principal | Orcamento estruturado e proposta | Obra atualizada no Supabase |
| HITL | Obrigatorio por checkpoint tecnico | Obrigatorio antes de cada gravacao |
| Grava automaticamente | Nunca | Nunca |

## 7. Subagentes previstos para o Diario de Obra

Subagentes previstos para apoiar o fluxo operacional do Diario:

- Diario.
- Cronograma.
- Orcamento.
- Equipes.
- Pendencias.
- Fotos.
- Relatorios.
- Financeiro.
- Cliente.

Cada subagente deve atuar dentro de um dominio claro, sempre subordinado ao Orquestrador e sempre respeitando a validacao humana antes de qualquer atualizacao definitiva.

## 8. Regra de seguranca

A IA nunca grava automaticamente sem validacao humana.

Ela pode interpretar, classificar, resumir, cruzar informacoes e propor atualizacoes. No entanto, o usuario precisa confirmar antes que qualquer informacao seja usada para popular o sistema, alterar dados da obra, atualizar financeiro, modificar cronograma, registrar pendencias ou impactar dashboards.

Essa regra e obrigatoria para proteger a confiabilidade operacional do EVIS.

## 9. Regra de produto

A ordem das abas deve ser seguida estritamente.

Na Oportunidade, a ordem oficial e:

1. Geral
2. Orcamento
3. Tarefas
4. Obra
5. Arquivos
6. Propostas
7. Anotacoes
8. Pagamentos do cliente

Na Obra, a ordem oficial e:

1. Geral
2. Orcamento
3. Tarefas
4. Obra
5. Compras/Financeiro
6. Anotacoes
7. Arquivos
8. Propostas

Na aba Obra, a ordem oficial das subabas e:

1. Planejamento
2. Medicoes
3. Fisico-Financeiro
4. Curva S
5. Diario de Obra

A linguagem da interface deve ser comercial e operacional, inspirada no Vobi, evitando termos tecnicos que nao pertencem a rotina do usuario final.

Termos a evitar na interface:

- Payload.
- Workspace.
- Persistido.
- Evento.

Preferir termos claros de produto, como:

- Informacao.
- Obra.
- Cliente.
- Orcamento.
- Proposta.
- Atualizacao.
- Registro.
- Tarefa.
- Pendencia.
- Pagamento.
- Arquivo.
