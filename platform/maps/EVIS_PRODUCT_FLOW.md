# EVIS Product Flow

Fluxo principal previsto para conectar entrada comercial, engenharia, proposta, fechamento e execucao.

```mermaid
flowchart LR
  Dashboard["Dashboard"]
  Opportunities["Oportunidades<br/>lead / demanda"]
  Estimator["Orcamentista IA<br/>documentos + HITL"]
  Budget["Orcamento<br/>itens + BDI"]
  Proposal["Proposta<br/>documento comercial"]
  Closing["Fechamento<br/>ganha / perdida"]
  PreWork["Pre-Obra<br/>mobilizacao"]
  Works["Obras<br/>execucao"]

  subgraph Operations["Gestao operacional"]
    Daily["Diario"]
    Schedule["Cronograma"]
    Measurements["Medicoes"]
    Finance["Financeiro"]
    Reports["Relatorios"]
  end

  Dashboard --> Opportunities
  Opportunities --> Estimator
  Estimator --> Budget
  Budget --> Proposal
  Proposal --> Closing
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
| Oportunidades | Registro comercial antes de obra | Módulo inicial funcional do fluxo comercial |
| Orçamentista IA | Leitura tecnica, planner e HITL | Parcial funcional |
| Orcamento | Estrutura de itens e totais | Parcial implementado |
| Proposta | Apresentacao comercial a partir de JSON | Parcial, sem persistencia completa |
| Fechamento | Conversao comercial | Planejado |
| Pre-Obra | Preparacao entre venda e execucao | Planejado |
| Obras | Execucao operacional preservada | Implementado/parcial |
| Diario/Cronograma/Medicoes/Financeiro/Relatorios | Operacao e controle | Diario e cronograma parciais; financeiro/medicoes planejados |

