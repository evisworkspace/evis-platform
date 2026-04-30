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
  -> Oportunidades
  -> Orçamentista IA
  -> Orçamento
  -> Proposta
  -> Fechamento
  -> Projeto
  -> Pré-Obra
  -> Obra
  -> Diário / Cronograma / Medições / Financeiro / Relatórios
  -> Pós-Obra
```

A Gestão da Obra atual não deve ser tratada como home definitiva da plataforma. Ela é o protótipo funcional da IA operacional em obra. A home futura deve ser um Dashboard / Comando Central que conecta todos os módulos.

O Orçamentista também não deve ser tratado como uma home isolada. Ele é um motor comercial e técnico em construção, conectado ao ciclo de oportunidade, orçamento, proposta e fechamento.

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

A arquitetura atual deve ser documentada em três camadas. O status abaixo descreve o estado técnico observado no código, sem promover protótipos a produção.

### A. EVIS Obra / Diário

Status geral: **parcialmente implementado / funcional no frontend**.

Esta camada cobre a IA aplicada à execução de obra, principalmente por meio do Diário de Obra. O usuário registra narrativa, a IA interpreta o conteúdo, o humano revisa e o sistema aplica atualizações a serviços, pendências, notas e presença.

Implementado:

- Interface de Diário de Obra com narrativa e acionamento de IA.
- Ponte `AIAnalysis` chamando o orquestrador backend do diário.
- Adaptação de resposta da IA para `IAResult`.
- Revisão HITL antes de sincronizar dados.
- Aplicação de resultado validado em serviços, pendências, notas e presença.
- Invalidação de cache de serviços após confirmação.

Parcial:

- O comentário de "orquestrador de 8 camadas" existe no frontend, mas a implementação completa do backend não é formalizada neste blueprint.
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

### B. EVIS Orçamentista

Status geral: **em construção, com Reader/Planner reais e etapas posteriores parciais**.

Esta camada cobre a IA comercial e técnica antes da obra: leitura documental, estruturação de escopo, roteiro de orçamentação, perguntas HITL, quantitativos, composição de custos e consolidação do orçamento.

O Orçamentista não é apenas chat. O chat é uma interface para um motor que deve operar com workspace, documentos, contratos de saída, especialistas, checkpoints e revisão humana.

Implementado:

- Interface conversacional com workspace, upload, stream e status de execução.
- Bloqueio de input quando existe HITL pendente.
- Card de validação humana para roteiro técnico.
- Contratos de domínio para Etapa 0, Reader, Planner e Quantitativos.
- Reader conectado ao Gemini para leitura documental.
- Planner conectado ao Gemini para roteiro técnico.
- Provider documental com suporte a Vertex/Gemini.
- Persistência e organização de workspace em backend.

Parcial:

- `multiagent.ts` atualmente pausa em `AGUARDANDO_ETAPA_0` e declara o motor automático desligado para honestidade operacional.
- `graphEtapa0.ts` descreve a linha de montagem, mas ainda usa mocks para cache/extração.
- `QuantitativosAgent.ts` retorna dados fixos, não quantitativos reais derivados de documentos.
- Especialistas e catálogos existem como base estrutural, mas a execução completa por disciplina ainda não deve ser assumida como produção.

Conceitual:

- Execução multiagente completa por disciplinas.
- Checkpoints duráveis por etapa.
- Retomada real após HITL com estado persistido.
- Auditoria cruzada completa antes de composição final.
- Exportação final confiável de orçamento e proposta a partir de estado validado.

Arquivos de referência:

- `src/pages/OrcamentistaChat.tsx`
- `platform/server/orcamentista/contracts.ts`
- `platform/server/orcamentista/engine.ts`
- `platform/server/orcamentista/multiagent.ts`
- `platform/server/orcamentista/graphEtapa0.ts`
- `platform/server/orcamentista/engine/ReaderAgent.ts`
- `platform/server/orcamentista/engine/PlannerAgent.ts`
- `platform/server/orcamentista/engine/QuantitativosAgent.ts`
- `platform/server/orcamentista/providers/VertexDocumentRuntimeProvider.ts`
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
- Obras não é descartável: é o protótipo funcional da IA operacional.
- Orçamentista não é apenas chat: é motor comercial/técnico em construção.
- Nenhuma rota deve prometer funcionalidade multiagente completa antes da etapa estar implementada.
- Cada módulo deve evoluir independente, conectado por entidades centrais.
- IA nunca deve persistir alterações críticas sem validação humana.
- Contratos e arquivos de referência devem ser atualizados antes de expandir rotas públicas.
- Protótipos devem ser marcados como parciais ou conceituais até terem execução real, teste e trilha de auditoria.

## 8. Fronteira Atual

O EVIS atual tem uma base real de IA operacional no Diário de Obra e uma base em construção para IA comercial no Orçamentista. O blueprint deve proteger essa distinção.

Não se deve descartar o módulo Obras por parecer menos estratégico que o Orçamentista. Ele é o laboratório funcional onde o ciclo de IA operacional já acontece.

Também não se deve promover o Orçamentista a produto final apenas pela existência de chat, Reader, Planner e contratos. O motor precisa completar Etapa 0, HITL, quantitativos, composição, auditoria e exportação antes de ser tratado como multiagente completo.
