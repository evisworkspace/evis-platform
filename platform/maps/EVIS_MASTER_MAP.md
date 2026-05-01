# EVIS Master Map

Mapa vivo do organismo EVIS, separando produto, inteligência, dados e interfaces.

```mermaid
flowchart TB
  EVIS["EVIS AI<br/>Plataforma comercial e operacional"]

  subgraph Brain["Cerebro"]
    Orq["Orquestrador"]
    AI["IA"]
    Rules["Regras de dominio"]
    HITL["HITL<br/>Humano valida"]
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
    Opportunities["Oportunidades<br/>MVP funcional"]
    OpportunityDetail["Detalhe da Oportunidade<br/>linha do tempo"]
    Estimator["Orcamentista IA<br/>proxima integracao"]
    Proposals["Propostas<br/>proxima integracao"]
    Works["Obras<br/>proxima integracao comercial"]
    Finance["Financeiro"]
  end

  subgraph Memory["Memoria"]
    Database["Banco"]
    Docs["Documentos"]
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

  Orq --> AI
  AI --> HITL
  Rules --> HITL
  HITL --> Events

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
  OpportunityDetail --> Proposals
  OpportunityDetail --> Works
  OpportunityDetail --> Events
  Opportunities --> Database
  Estimator --> Docs
  Works --> History
  AI --> Logs

  Database --> Dashboards
  History --> Reports
  Logs --> Alerts
  HITL --> Reviews
```

## Leitura Rapida

| Camada | Funcao | Estado atual |
|---|---|---|
| Cerebro | Orquestracao, IA, regras e validacao humana | Parcial, com HITL real em Diario e Orçamentista |
| Sistema nervoso | Supabase, rotas, hooks, APIs, eventos e cache | Implementado em partes, ainda com contratos em reconciliacao |
| Musculos | Modulos de produto que executam fluxos do usuario | Dashboard, Oportunidades (agora conecta Orçamento, Proposta e Obra), Estimador, Proposta, Obras; demais modulos parciais |
| Memoria | Banco, documentos, historicos e logs | Supabase e workspace local; auditoria ainda fragmentada |
| Olhos | Dashboards, relatorios, alertas e revisoes | Parcial; relatorios e alertas ainda precisam consolidacao |
# Note: Conversão de oportunidade para obra cria registro em public.obras e popula opportunities.obra_id
