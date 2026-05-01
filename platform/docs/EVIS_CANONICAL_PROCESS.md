# EVIS — Processo Cronológico Canônico

## Hierarquia documental

Este documento é a fonte canônica e inviolável da ordem cronológica oficial do EVIS.

Em caso de conflito entre este documento e qualquer outro — mapa, blueprint, prompt, checkpoint, CLAUDE.md ou rota — **este documento prevalece**.

Documentos descritivos, mapas e checkpoints podem ser atualizados. A ordem cronológica definida aqui não pode ser invertida, pulada ou misturada sem aprovação humana explícita e registro formal da decisão.

---

## A Regra-Mãe

A ordem cronológica oficial do EVIS é:

```
Lead/Oportunidade
  → Orçamentista IA
  → Proposta
  → Obra
  → Diário de Obra IA
```

Nenhum módulo, rota, tela, agente, automação, prompt ou integração deve inverter, pular ou misturar essas etapas sem aprovação humana explícita.

---

## Pré-condições invioláveis

| Etapa | Depende de |
|---|---|
| Orçamentista IA | Lead/Oportunidade deve existir |
| Proposta | Orçamentista IA deve ter gerado orçamento estruturado |
| Obra | Oportunidade deve ter sido ganha/fechada |
| Diário de Obra IA | Obra deve existir |

Qualquer fluxo que viole essas pré-condições é um erro de arquitetura, não uma feature.

---

## Etapa 1 — Lead/Oportunidade

A entrada comercial do EVIS. Representa uma possibilidade de obra antes de existir contrato, orçamento fechado ou projeto operacional estruturado.

A Oportunidade concentra:

- Cadastro inicial do cliente com nome, telefone, e-mail e dados de contato.
- Escopo preliminar: tipo de obra, metragem estimada, valor estimado, origem do lead.
- Histórico de atividades e contatos com o cliente.
- Arquivos relacionados à venda (projetos iniciais, briefings, referências).
- Anotações comerciais e técnicas.
- Tarefas da etapa comercial.
- Pagamentos do cliente quando aplicável.
- Início do orçamento: acesso ao Orçamentista IA ou criação manual.

A Oportunidade não é uma obra. Ela é o registro que precede e origina a obra quando o negócio é fechado.

---

## Etapa 2 — Orçamentista IA

O motor técnico-comercial do EVIS. Atua **antes de a obra existir**, a partir de uma Oportunidade, e tem como objetivo converter arquivos de projeto, especificações e briefing em orçamento estruturado e base para proposta.

**O Orçamentista IA não é um chat.** A interface conversacional é apenas o ponto de entrada de uma esteira técnica com etapas definidas, contratos de saída, especialistas por disciplina, checkpoints e revisão humana obrigatória em cada transição crítica.

Funções do motor:

- Leitura multimodal de projetos (PDF, planta, memória de cálculo, especificação, imagem).
- Interpretação de escopo a partir dos documentos técnicos.
- Levantamento de quantitativos por disciplina (estrutura, alvenaria, instalações, acabamentos, etc.).
- Cruzamento com tabela SINAPI para referências de custo.
- Cruzamento com base própria do usuário (catálogo de serviços anteriores).
- Aprendizado com novos serviços cadastrados pelo usuário ao longo do tempo.
- Composição de custos com BDI e encargos.
- Orçamento estruturado gravado em `orcamento_itens`.
- Validação humana etapa a etapa (HITL por checkpoint).
- Geração da base de dados para a proposta comercial.

Fluxo interno do motor:

```
Arquivos de projeto + Briefing
  → Reader (leitura multimodal dos documentos)
  → Planner (roteiro técnico por disciplina)
  → HITL (aprovação do roteiro pelo orçamentista)
  → Especialistas (quantitativos por disciplina)
  → Composição de custos (SINAPI + base própria)
  → HITL (revisão dos itens pelo orçamentista)
  → Orçamento estruturado (orcamento_itens gravado)
  → Base pronta para proposta
```

O Orçamentista IA encerra sua atuação quando a obra é criada. O orçamento migra para a obra, mas o motor não atua sobre a execução.

---

## Etapa 3 — Proposta

O documento comercial derivado do orçamento validado, enviado ao cliente para aprovação.

A Proposta:

- Nasce obrigatoriamente de um orçamento estruturado e validado.
- Contém escopo, itens, valores, BDI, cronograma previsto e condições comerciais.
- É o instrumento de fechamento — ganhar ou arquivar a oportunidade.
- Não deve existir antes de orçamento estruturado. Proposta sem orçamento validado é um erro de fluxo.

---

## Etapa 4 — Obra

O núcleo operacional do EVIS. A Obra só nasce após o ganho e fechamento da Oportunidade.

A Obra:

- É criada automaticamente quando a Oportunidade é marcada como ganha.
- Recebe o orçamento migrado da etapa comercial como base.
- Centraliza: serviços, cronograma, equipes, diário, medições, compras, financeiro, relatórios e arquivos de execução.
- Serviços, cronograma, equipes e medições dependem de validação própria dentro da obra — o orçamento migrado é ponto de partida, não verdade definitiva.
- É o ambiente onde o Diário de Obra IA passa a atuar.

A Obra não substitui a Oportunidade. A Oportunidade permanece como registro histórico do ciclo comercial.

---

## Etapa 5 — Diário de Obra IA

O motor operacional do EVIS. É um motor de IA separado do Orçamentista. Atua **depois de a obra existir** e tem como objetivo converter captura diária de campo em atualizações validadas na obra dentro do Supabase.

**O Diário de Obra IA não é um campo de texto.** É o cockpit operacional da obra, onde o gestor registra o que aconteceu no dia e a IA organiza, classifica, interpreta e propõe atualizações estruturadas.

Funções do motor:

- Captura por texto, áudio, foto, print e arquivos do dia.
- Inbox consolidado dos registros capturados.
- Análise do acumulado do dia com interpretação de contexto.
- Classificação por domínio: cronograma, equipes, pendências, financeiro, cliente, fotos.
- Acionamento de subagentes especializados por domínio.
- Propostas de atualização para serviços, pendências, notas e presença.
- HITL obrigatório antes de qualquer gravação.
- Gravação no Supabase somente após validação humana explícita.

Fluxo interno do motor:

```
Entrada bruta do dia (texto, áudio, foto, print, arquivo)
  → Orquestrador
  → Classificação por domínio
  → Subagentes (Diário, Cronograma, Equipes, Pendências, Fotos, Financeiro, Cliente)
  → Propostas de atualização
  → HITL (usuário confirma ou corrige)
  → Gravação no Supabase (serviços, pendências, notas, presença)
  → Dashboard atualizado
```

---

## Separação dos motores de IA

O EVIS tem dois motores de IA distintos. Eles não se misturam, não se substituem e não operam no mesmo momento do fluxo.

| Propriedade | Orçamentista IA | Diário de Obra IA |
|---|---|---|
| Momento de atuação | Antes da obra existir | Depois da obra existir |
| Entrada principal | Arquivos de projeto e briefing | Captura diária de campo |
| Saída principal | `orcamento_itens` + base para proposta | Obra atualizada no Supabase |
| HITL | Por checkpoint técnico (roteiro e itens) | Antes de cada gravação |
| Interface | Conversacional (entrada do motor técnico) | Cockpit operacional do diário |
| Grava automaticamente | Nunca | Nunca |
| Vinculado a | Oportunidade | Obra |

Qualquer desenvolvimento que tente usar o Orçamentista IA dentro de uma Obra ativa, ou o Diário de Obra IA dentro de uma Oportunidade sem obra, é uma violação desta separação e deve ser bloqueado ou revertido.

---

## Regras proibitivas

As seguintes ações são proibidas sem aprovação humana explícita e registro formal:

1. **Proibido iniciar Obra sem Oportunidade ganha.** Migração manual só é permitida com registro explícito de decisão e aprovação do responsável.

2. **Proibido tratar Orçamentista IA como chat.** O Orçamentista é um motor técnico com etapas, contratos e checkpoints. Reduzir sua interface conversacional ao papel de "chat geral" é um erro conceitual.

3. **Proibido misturar Orçamentista IA com Diário de Obra IA.** São motores distintos, com entradas, saídas e momentos de atuação diferentes. Nenhuma rota, tela ou automação deve combinar os dois sem camada de separação explícita.

4. **Proibido gerar Proposta sem orçamento validado.** Proposta derivada de estimativa livre, sem itens estruturados e HITL confirmado, não é uma Proposta EVIS válida.

5. **Proibido gravar dados críticos de IA sem validação humana.** Qualquer dado gerado pela IA — quantitativo, custo, serviço, pendência, avanço — deve passar por HITL antes de ser persistido no Supabase.

6. **Proibido pular etapas da ordem canônica** em qualquer implementação, automação ou integração, salvo com decisão documentada e aprovada.

---

## Regra para desenvolvimento

Antes de implementar qualquer novo módulo, rota, componente, agente ou integração, o agente de desenvolvimento deve verificar:

> Esta alteração respeita a ordem:
> `Lead/Oportunidade → Orçamentista IA → Proposta → Obra → Diário de Obra IA`?

Se a resposta for não, ou se houver dúvida, a implementação deve ser pausada e a decisão registrada antes de continuar.

Esta verificação é obrigatória. Não é opcional.

---

## Referências complementares

Os documentos abaixo descrevem, detalham e mapeiam o processo definido neste arquivo. Em caso de conflito, este documento prevalece.

- [platform/docs/EVIS_BLUEPRINT.md](./EVIS_BLUEPRINT.md) — Visão geral da plataforma, conceitos centrais e arquitetura de IA.
- [platform/docs/EVIS_WORKFLOW_OPORTUNIDADE_OBRA.md](./EVIS_WORKFLOW_OPORTUNIDADE_OBRA.md) — Workflow detalhado de Oportunidade e Obra, abas e pipeline de IA.
- [platform/maps/EVIS_PRODUCT_FLOW.md](../maps/EVIS_PRODUCT_FLOW.md) — Mapa do fluxo de produto com estado de cada etapa.
- [platform/maps/EVIS_AI_PIPELINE.md](../maps/EVIS_AI_PIPELINE.md) — Diagrama dos dois motores de IA e seus fluxos internos.
- [platform/docs/SCHEMA_GAP_REPORT.md](./SCHEMA_GAP_REPORT.md) — Auditoria de divergências entre schema documentado e código atual.
