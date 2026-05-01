# EVIS AI Pipeline

Mapa dos dois motores de IA em evolucao: comercial/tecnico e operacional.

```mermaid
flowchart TB
  subgraph Commercial["Motor Comercial / Orcamentista IA"]
    Files["Arquivos"]
    Reader["Reader"]
    Planner["Planner"]
    HitlCommercial["HITL"]
    Quantities["Quantitativos"]
    Costs["Custos"]
    Budget["Orcamento"]
    Proposal["Proposta"]

    Files --> Reader
    Reader --> Planner
    Planner --> HitlCommercial
    HitlCommercial --> Quantities
    Quantities --> Costs
    Costs --> Budget
    Budget --> Proposal
  end

  subgraph Operational["Motor Operacional / Obras IA"]
    Diary["Diario"]
    Normalize["Normalizacao"]
    Events["Eventos"]
    Domains["Dominios"]
    Entities["Entidades"]
    Actions["Acoes"]
    Impacts["Impactos"]
    Dispatch["Dispatch"]
    HitlOperational["HITL"]

    Diary --> Normalize
    Normalize --> Events
    Events --> Domains
    Domains --> Entities
    Entities --> Actions
    Actions --> Impacts
    Impacts --> Dispatch
    Dispatch --> HitlOperational
  end

  HitlCommercial -->|"aprovado"| Budget
  HitlOperational -->|"aprovado"| Dispatch
  Dispatch -->|"servicos / pendencias / notas / presenca"| Supabase["Supabase"]
  Proposal --> Product["Fluxo comercial"]
```

## Principios

```text
IA propoe -> Humano valida -> Sistema registra
```

| Motor | Entrada | Saida esperada | Status atual |
|---|---|---|---|
| Comercial / Orçamentista IA | Workspace, arquivos, briefing e chat | Roteiro, quantitativos, custos, orcamento e proposta | Parcial: Reader/Planner/HITL reais; quantitativos/custos ainda incompletos |
| Operacional / Obras IA | Diario de obra e contexto operacional | Atualizacoes propostas para servicos, pendencias, notas e presenca | Parcial funcional no frontend com HITL |

