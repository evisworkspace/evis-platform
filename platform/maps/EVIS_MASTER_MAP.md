# EVIS Master Map

Mapa vivo do organismo EVIS, separando produto, inteligência, dados e interfaces.

```mermaid
flowchart TB
  EVIS["EVIS AI<br/>Plataforma comercial e operacional"]

  subgraph Brain["Cerebro — dois motores de IA"]
    subgraph EngineCommercial["Motor 1: Orcamentista IA\n(antes da obra existir)"]
      OrqC["Orquestrador comercial"]
      Reader["Reader / Planner"]
      HitlC["HITL comercial"]
      BudgetItems["orcamento_itens"]
    end

    subgraph EngineOperational["Motor 2: Diario de Obra IA\n(depois da obra existir)"]
      OrqO["Orquestrador operacional"]
      Agents["Subagentes por dominio"]
      HitlO["HITL operacional"]
      WorkState["Estado da obra"]
    end

    Rules["Regras de dominio"]
  end

  subgraph Nervous["Sistema nervoso"]
    Supabase["Supabase"]
    Routes["Rotas React"]
    Hooks["Hooks"]
    APIs["APIs / Backend"]
    Events["Eventos / cache / sync"]
  end

  subgraph Muscles["Musculos"]
    Dashboard["Dashboard"]
    Opportunities["Oportunidades\nfuncional"]
    OpportunityDetail["Oportunidade\nhistorico de atividades"]
    Estimator["Orcamentista IA\nmotor tecnico-comercial"]
    Budget["Orcamento\nfuncional"]
    Proposals["Propostas\nfuncional"]
    Works["Obras\nfuncional"]
    Finance["Financeiro"]
  end

  subgraph Memory["Memoria"]
    Database["Banco"]
    Workspace["Workspace local\nde documentos"]
    History["Historicos"]
    Logs["Logs / auditoria"]
  end

  subgraph Eyes["Olhos"]
    Dashboards["Dashboards"]
    Reports["Relatorios"]
    Alerts["Alertas"]
    Reviews["Revisoes humanas"]
  end

  EVIS --> Brain
  EVIS --> Nervous
  EVIS --> Muscles
  EVIS --> Memory
  EVIS --> Eyes

  OrqC --> Reader
  Reader --> HitlC
  HitlC -->|"aprovado"| BudgetItems
  OrqO --> Agents
  Agents --> HitlO
  HitlO -->|"aprovado"| WorkState
  Rules --> HitlC
  Rules --> HitlO

  Routes --> Dashboard
  Routes --> Opportunities
  Routes --> OpportunityDetail
  Routes --> Estimator
  Routes --> Proposals
  Routes --> Works

  Hooks --> Supabase
  APIs --> Supabase
  Events --> Supabase

  Opportunities --> OpportunityDetail
  OpportunityDetail --> Estimator
  OpportunityDetail --> Budget
  OpportunityDetail --> Proposals
  Estimator -->|"itens validados"| Budget
  Budget --> Proposals
  Proposals -->|"ganhar — cria obra"| Works
  Works --> History
  Estimator --> Workspace
  BudgetItems --> Supabase
  WorkState --> Supabase

  Database --> Dashboards
  History --> Reports
  Logs --> Alerts
  HitlC --> Reviews
  HitlO --> Reviews
```

## Leitura Rapida

| Camada | Funcao | Estado atual |
|---|---|---|
| Cerebro | Dois motores de IA (Orcamentista e Diario), regras e HITL | Motor Diario parcial funcional; Motor Orcamentista com Reader/Planner/HITL reais, gravacao em orcamento_itens pendente |
| Sistema nervoso | Supabase, rotas, hooks, APIs, eventos e cache | Implementado em partes, contratos em reconciliacao |
| Musculos | Modulos de produto que executam fluxos do usuario | Dashboard, Oportunidades, Orcamentista, Orcamento, Proposta e Obras funcionais; demais modulos parciais |
| Memoria | Banco, workspace de documentos, historicos e logs | Supabase e workspace local; auditoria ainda fragmentada |
| Olhos | Dashboards, relatorios, alertas e revisoes humanas | Parcial; relatorios e alertas precisam consolidacao |

Conversao de oportunidade em obra: cria registro em `public.obras` e popula `opportunities.obra_id`.
