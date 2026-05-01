# EVIS Blueprint

## 1. Visão Geral

O EVIS é uma plataforma operacional e comercial para construtora. Seu objetivo é conectar captação, orçamentação, proposta, fechamento, preparação de obra, execução, controle financeiro, relatórios e pós-obra em uma mesma espinha dorsal de dados.

A IA no EVIS não substitui o responsável técnico. Ela lê contexto, propõe interpretações, sugere atualizações e gera insumos. O humano valida as decisões críticas, e o sistema registra o que foi aprovado.

Princípio central:

```text
IA propõe -> Humano valida -> Sistema registra
```

## 2. Fluxo Macro Da Plataforma

```text
Dashboard
  -> Lead / Oportunidade
       -> Orçamentista IA          (motor técnico-comercial — antes da obra existir)
            -> Leitura de arquivos e projetos
            -> Quantitativos e composição de custos
            -> HITL etapa a etapa
            -> Orçamento estruturado
       -> Proposta comercial
       -> Ganhar / Fechamento
  -> Obra                          (criada após fechamento)
       -> Diário de Obra IA        (motor operacional — depois da obra existir)
            -> Captura diária: texto, áudio, foto, arquivo
            -> Classificação e subagentes
            -> HITL antes de gravar
            -> Atualização de serviços, pendências, notas, presença
       -> Cronograma / Medições / Financeiro / Relatórios
  -> Pós-Obra
```

Os dois motores de IA são distintos, com fronteira temporal clara:

- O **Orçamentista IA** atua antes de a obra existir. Ele converte arquivos técnicos e briefing em orçamento estruturado, proposta e base para fechamento.
- O **Diário de Obra IA** atua depois de a obra existir. Ele converte captura diária de campo em atualizações validadas no sistema.

A home futura deve ser um Dashboard / Comando Central que conecta todos os módulos.

## 3. Conceitos Centrais

**Oportunidade**

Registro comercial inicial. Representa uma possibilidade de obra antes de existir contrato, orçamento fechado ou projeto operacional estruturado.

**Projeto**

Conjunto técnico-comercial organizado para uma oportunidade ou obra. Pode conter documentos, escopo, premissas, arquivos, memória técnica e decisões de engenharia.

**Orçamentista**

Motor assistido por IA para leitura documental, levantamento de escopo, roteiro técnico, quantitativos, composições e perguntas de validação humana.

**Orçamento**

Objeto estruturado com itens, quantidades, unidades, valores, BDI, totais e status. Pode nascer manualmente ou a partir do Orçamentista IA.

**Proposta**

Documento comercial derivado do orçamento, com apresentação para cliente, escopo, valores, cronograma, condições e anexos.

**Pré-Obra**

Fase após fechamento e antes da execução. Converte o que foi vendido em plano de mobilização, compras, equipes, cronograma inicial, contratos e controles.

**Obra**

Ambiente operacional da execução. Centraliza serviços, equipes, diário, cronograma, pendências, fotos, financeiro, medições e relatórios.

**Diário de Obra**

Registro diário da execução. Hoje é a principal interface funcional da IA operacional: narrativa -> processamento -> revisão humana -> atualização de estado.

**Financeiro**

Controle de custos, desembolsos, compras, notas, medições, fluxo de caixa, DRE por obra e comparação orçado x realizado.

## 4. Módulos Oficiais

- Dashboard
- Oportunidades
- Projetos
- Orçamentista IA
- Propostas
- Pré-Obra
- Obras
- Diário
- Tarefas
- Compras
- Financeiro
- Relatórios
- Cadastros
- Configurações

Cada módulo deve evoluir de forma independente, mas conectado por entidades centrais como oportunidade, projeto, obra, orçamento, proposta, cliente, serviço, equipe e evento operacional.

## 5. Arquitetura De IA

A arquitetura de IA do EVIS é composta por dois motores distintos, com fronteira temporal entre si, mais uma camada transversal de governança. O status abaixo descreve o estado técnico observado no código, sem promover protótipos a produção.

### Separação dos motores

| Motor | Quando atua | Entrada principal | Saída esperada |
|---|---|---|---|
| Orçamentista IA | Antes da obra existir | Arquivos de projeto, briefing, especificações | Orçamento estruturado com itens, quantitativos, composição de custos e base para proposta |
| Diário de Obra IA | Depois da obra existir | Narrativa, áudio, foto, print, arquivos do dia | Atualizações validadas em serviços, pendências, notas e presença da obra |

Ambos usam HITL. Nenhum grava dados críticos sem validação humana explícita.

### A. Motor Comercial/Técnico — Orçamentista IA

Status geral: **em construção, com Reader/Planner reais e etapas posteriores parciais**.

O Orçamentista IA é o núcleo técnico-comercial do EVIS. Ele opera antes de a obra existir, a partir de uma oportunidade, e tem como objetivo converter arquivos de projeto, especificações e briefing em orçamento estruturado, composição de custos e base para proposta.

O Orçamentista não é um chat. A interface de chat é apenas o ponto de entrada de uma esteira técnica com etapas definidas, contratos de saída, especialistas por disciplina, checkpoints e revisão humana obrigatória em cada transição crítica.

Funções do motor:

- Leitura multimodal de projetos (PDF, imagem, planilha).
- Levantamento de quantitativos por disciplina.
- Cruzamento com SINAPI e base própria do usuário.
- Aprendizado com serviços de obras anteriores.
- Composição de custos com BDI.
- Orçamento estruturado com itens gravados em `orcamento_itens`.
- Validação humana etapa a etapa (HITL por checkpoint).
- Geração da base de dados para proposta comercial.

Fluxo interno:

```text
Arquivos / Briefing
  -> Reader (leitura documental multimodal)
  -> Planner (roteiro técnico por disciplina)
  -> HITL (aprovação do roteiro)
  -> Especialistas (quantitativos por disciplina)
  -> Composição de custos (SINAPI + base própria)
  -> HITL (revisão dos itens)
  -> Orçamento estruturado (orcamento_itens)
  -> Base para proposta comercial
```

Implementado:

- Interface conversacional com workspace, upload, stream e status de execução.
- Bloqueio de input quando existe HITL pendente.
- Card de validação humana para roteiro técnico.
- Contratos de domínio para Etapa 0, Reader, Planner e Quantitativos (`contracts.ts`).
- Reader conectado ao Gemini para leitura documental.
- Planner conectado ao Gemini para roteiro técnico.
- Provider documental com suporte a Vertex/Gemini.
- Persistência e organização de workspace em backend.
- Vínculo com oportunidade via `opportunity_id` e `orcamentista_workspace_id`.

Parcial:

- `multiagent.ts` atualmente pausa em `AGUARDANDO_ETAPA_0` — motor automático declarado desligado para honestidade operacional.
- `graphEtapa0.ts` descreve a linha de montagem, mas ainda usa mocks para cache e extração.
- `QuantitativosAgent.ts` retorna dados fixos, não quantitativos reais derivados de documentos.
- Especialistas e catálogos existem como base estrutural, mas execução completa por disciplina ainda não é produção.
- A gravação em `orcamento_itens` ainda não acontece automaticamente — o orçamento é criado manualmente ou via botão na oportunidade, sem leitura do resultado da IA.

Conceitual:

- Execução multiagente completa por disciplinas.
- Checkpoints duráveis por etapa com retomada real após HITL.
- Auditoria cruzada antes de composição final.
- Exportação automática e confiável para `orcamento_itens` a partir de estado validado.

Arquivos de referência:

- `src/pages/OrcamentistaChat.tsx`
- `platform/server/orcamentista/contracts.ts`
- `platform/server/orcamentista/engine.ts`
- `platform/server/orcamentista/multiagent.ts`
- `platform/server/orcamentista/graphEtapa0.ts`
- `platform/server/routes/orcamentista.ts`
- `skills/INDICE_VALIDACAO.md`

### B. Motor Operacional — Diário de Obra IA

Status geral: **parcialmente implementado / funcional no frontend**.

O Diário de Obra IA é o motor operacional do EVIS. Ele opera depois de a obra existir e tem como objetivo converter captura diária de campo em atualizações validadas no sistema.

O Diário de Obra não é um campo de texto. É o cockpit operacional da obra, onde o gestor registra acontecimentos do dia e a IA organiza, classifica e propõe atualizações estruturadas.

Funções do motor:

- Captura diária por texto, áudio, foto, print e arquivos.
- Normalização e organização do acumulado do dia.
- Classificação por domínio (cronograma, equipes, financeiro, pendências, cliente).
- Acionamento de subagentes especializados por domínio.
- Proposta de atualizações (serviços, pendências, notas, presença).
- Validação humana / HITL antes de qualquer gravação.
- População da obra no Supabase com dados confirmados.

Fluxo interno:

```text
Entrada bruta do dia (texto, áudio, foto, arquivo)
  -> Orquestrador
  -> Classificação por domínio
  -> Subagentes (Diário, Cronograma, Equipes, Pendências, Fotos, Financeiro, Cliente)
  -> Propostas de atualização
  -> HITL (usuário confirma)
  -> Gravação no Supabase (serviços, pendências, notas, presença)
  -> Dashboard atualizado
```

Implementado:

- Interface de Diário de Obra com narrativa e acionamento de IA.
- Ponte `AIAnalysis` chamando o orquestrador backend do diário.
- Adaptação de resposta da IA para `IAResult`.
- Revisão HITL antes de sincronizar dados.
- Aplicação de resultado validado em serviços, pendências, notas e presença.
- Invalidação de cache de serviços após confirmação.

Parcial:

- Feedback de correção HITL aparece como log local, não como trilha persistida de melhoria.
- O fluxo depende de contratos implícitos entre frontend e endpoint de processamento.

Conceitual:

- Aprendizado automático a partir das correções humanas.
- Score formal de confiança por sugestão operacional.
- Auditoria completa de cada decisão da IA no ciclo de obra.

Arquivos de referência:

- `src/components/Diario.tsx`
- `src/components/AIAnalysis.tsx`
- `src/components/HITLReview.tsx`
- `skills/INDICE_VALIDACAO.md`
- `CLAUDE.md`

### C. Governança De IA

Status geral: **parcial, com documentos e contratos já presentes**.

Esta camada define como a IA deve ser controlada: skills, contratos, regras de validação, HITL, score de confiança, limites operacionais e rastreabilidade.

Implementado:

- `CLAUDE.md` como contexto operacional para agentes.
- `skills/INDICE_VALIDACAO.md` como mapa de dependências e validação.
- Contratos TypeScript no Orçamentista.
- Documentação de padrões em `platform/docs/`.
- Conceito de HITL aplicado no Diário e no Orçamentista.

Parcial:

- Score de confiança aparece em interfaces e contratos, mas ainda não é um mecanismo uniforme de governança.
- Skills existem, mas a descoberta/aplicação automática por todos os fluxos ainda não está padronizada.
- A trilha de auditoria das decisões da IA ainda não está consolidada como entidade única.

Conceitual:

- Política formal de score mínimo por tipo de ação.
- Registro central de feedback humano.
- Evals obrigatórios por alteração de prompt/agente.
- Limites formais para o que IA pode sugerir, alterar ou bloquear.

Arquivos de referência:

- `skills/INDICE_VALIDACAO.md`
- `CLAUDE.md`
- `platform/server/orcamentista/contracts.ts`
- `platform/docs/CODING_STANDARDS.md`

## 6. HITL, Confiança E Registro

HITL é obrigatório para alterações críticas. Isso inclui, no mínimo:

- Alteração de avanço físico de serviços.
- Criação ou resolução de pendências relevantes.
- Inclusão de notas técnicas sensíveis.
- Aprovação de roteiro de orçamentação.
- Quantitativos inferidos ou estimados.
- Composições de custo que afetem proposta comercial.
- Divergências entre documentos técnicos.

O score de confiança deve orientar revisão humana. Baixa confiança não deve ser escondida; deve gerar pergunta, pendência ou bloqueio.

Regra:

```text
Alta confiança -> humano revisa de forma leve.
Média confiança -> humano valida explicitamente.
Baixa confiança -> sistema bloqueia ou pede informação adicional.
```

## 7. Regras Arquiteturais

- Gestão da Obra não deve ser home definitiva.
- Orçamentista não deve ser home isolada.
- A home futura deve ser Dashboard / Comando Central.
- Obras não é descartável: é o laboratório funcional onde o ciclo de IA operacional já acontece.
- **Orçamentista IA não é chat:** o chat é a interface de entrada de um motor técnico com etapas, contratos, especialistas e checkpoints.
- **Diário de Obra IA não é campo de texto:** é o cockpit operacional onde captura diária vira dado estruturado validado.
- **Os dois motores têm fronteira temporal:** Orçamentista atua antes da obra existir; Diário atua depois da obra existir.
- **Ambos usam HITL:** nenhum grava dados críticos sem validação humana explícita.
- Nenhuma rota deve prometer funcionalidade multiagente completa antes da etapa estar implementada.
- Cada módulo deve evoluir independente, conectado por entidades centrais.
- Contratos e arquivos de referência devem ser atualizados antes de expandir rotas públicas.
- Protótipos devem ser marcados como parciais ou conceituais até terem execução real, teste e trilha de auditoria.

## 8. Fronteira Atual

O EVIS atual tem uma base real de IA operacional no Diário de Obra e uma base em construção para IA comercial no Orçamentista. O blueprint deve proteger essa distinção.

Não se deve descartar o módulo Obras por parecer menos estratégico que o Orçamentista. Ele é o laboratório funcional onde o ciclo de IA operacional já acontece.

Também não se deve promover o Orçamentista a produto final apenas pela existência de chat, Reader, Planner e contratos. O motor precisa completar Etapa 0, HITL, quantitativos, composição, auditoria e exportação antes de ser tratado como multiagente completo.
