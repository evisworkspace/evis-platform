# EVIS Database Map

Mapa vivo das entidades relevantes para Oportunidades, Orcamentista, Orcamentos e Obras.

```mermaid
erDiagram
  contacts ||--o{ opportunities : "contact_id"
  opportunities ||--o{ opportunity_events : "opportunity_id"
  opportunities ||--o{ opportunity_files : "opportunity_id"
  opportunities }o--|| orcamentista_workspace : "orcamentista_workspace_id"
  opportunities }o--|| orcamentos : "orcamento_id"
  opportunities }o--|| propostas : "proposta_id"
  opportunities }o--|| obras : "obra_id"

  obras ||--o{ servicos : "obra_id"
  obras ||--o{ diario_obra : "obra_id"
  obras ||--o{ equipes_cadastro : "obra_id"
  obras ||--o{ equipes_presenca : "obra_id"
  obras ||--o{ fotos : "obra_id"
  obras ||--o{ notas : "obra_id"
  obras ||--o{ pendencias : "obra_id"
  obras ||--o{ relatorios_semanais : "obra_id"

  orcamentos ||--o{ orcamento_itens : "orcamento_id"
```

## Entidades e Status

| Entidade | Status | Observacao |
|---|---|---|
| `contacts` | Criada no Supabase | Base minima de contatos do MVP de Oportunidades |
| `opportunities` | Criada no Supabase | Lead/oportunidade antes de obra |
| `opportunity_events` | Criada no Supabase (já usada na tela de detalhe) |
| `opportunity_files` | Criada no Supabase | Arquivos de briefing/documentos iniciais |
| `orcamentista_workspace_id` | Parcial | Referencia textual para workspace do Orçamentista |
| `orcamentos` | Existe | Usado pelo modulo de Orcamento |
| `orcamento_itens` | Existe | Itens do orcamento estruturado |
| `propostas` / `projects` | Ainda nao existem | `proposta_id` fica sem FK no MVP |
| `obras` | Existe | Entidade operacional principal |
| `servicos` | Existe | Servicos da obra |
| `diario_obra` | Existe | Narrativas/transcricoes de obra |
| `equipes_cadastro` / `equipes_presenca` | Existe | Cadastro e presenca de equipes |
| `fotos` | Existe | Registro fotografico |
| `notas` | Existe | Notas da obra |
| `pendencias` | Existe | Pendencias operacionais |
| `relatorios_semanais` | Ausente | Citada no sync; precisa reconciliacao de schema |

## Relação Recomendada de IDs

```mermaid
flowchart LR
  Contact["contact_id"]
  Opportunity["opportunity_id"]
  Workspace["orcamentista_workspace_id"]
  Budget["orcamento_id"]
  Proposal["proposta_id"]
  Project["project_id futuro"]
  Work["obra_id"]

  Contact --> Opportunity
  Opportunity --> Workspace
  Opportunity --> Budget
  Opportunity --> Proposal
  Opportunity --> Project
  Project --> Work
  Proposal --> Work
```

