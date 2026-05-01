# EVIS Product Flow

Fluxo principal previsto para conectar entrada comercial, engenharia, proposta, fechamento e execucao.

```mermaid
flowchart LR
  Dashboard["Dashboard"]
  Opportunities["Oportunidades<br/>MVP funcional<br/>lista + criacao rapida"]
  OpportunityDetail["Detalhe da Oportunidade<br/>dados + linha do tempo"]
  Estimator["Orcamentista IA<br/>proxima integracao"]
  Budget["Orcamento<br/>itens + BDI<br/>funcional"]
  Proposal["Proposta<br/>MVP funcional"]
  Closing["Fechamento<br/>ganha / perdida"]
  PreWork["Pre-Obra<br/>mobilizacao"]
  Works["Obras<br/>proxima integracao comercial"]

  subgraph Operations["Gestao operacional"]
    Daily["Diario"]
    Schedule["Cronograma"]
    Measurements["Medicoes"]
    Finance["Financeiro"]
    Reports["Relatorios"]
  end

  Dashboard --> Opportunities
  Opportunities --> OpportunityDetail
  OpportunityDetail --> Estimator
  OpportunityDetail --> Budget
  OpportunityDetail --> Proposal
  OpportunityDetail --> Works
  Estimator --> Budget
  Budget --> Proposal
  Proposal --> Obras // funcional - conversão cria obra e preenche opportunities.obra_id
  Closing --> PreWork
  PreWork --> Works
  Works --> Daily
  Works --> Schedule
  Works --> Measurements
  Works --> Finance
  Works --> Reports

  Daily -->|"IA operacional + HITL"| Works
  Schedule --> Works
  Measurements --> Finance
  Reports --> Dashboard
```

## Estado do Fluxo

| Etapa | Papel no produto | Estado |
|---|---|---|
| Dashboard | Comando central e entrada dos modulos | Implementado como hub |
| Oportunidades | Registro comercial antes de obra, com lista, criacao rapida e detalhe | Módulo inicial funcional do fluxo comercial |
| Detalhe da Oportunidade | Consulta dos dados da oportunidade e linha do tempo manual | MVP funcional, usando `opportunity_events` |
| Orçamentista IA | Leitura tecnica, planner e HITL | Parcial funcional; proxima integracao a partir da oportunidade |
| Orcamento | Estrutura de itens e totais | Funcional |
| Proposta | Apresentação comercial a partir de JSON | MVP Funcional |
| Fechamento | Conversao comercial | Planejado |
| Pre-Obra | Preparacao entre venda e execucao | Planejado |
| Obras | Funcional | Modulo operacional preservado em `/obras` e `/obras/:obraId` | Separar criacao pos-fechamento e fortalecer contratos de dados |
| Diario/Cronograma/Medicoes/Financeiro/Relatorios | Operacao e controle | Diario e cronograma parciais; financeiro/medicoes planejados |
* Conversão de oportunidade para obra cria registro em `public.obras` e popula `opportunities.obra_id`.
