# EVIS Routes Map

Rotas atuais observadas em `src/App.tsx`.

```mermaid
flowchart TB
    Root["/"]
    Dashboard["/dashboard"]
    Opportunities["/oportunidades<br/>MVP funcional"]
    OpportunityDetail["/oportunidades/:id<br/>Detalhe da oportunidade"]
    Estimator["/orcamentista<br/>funcional parcial"]
    Proposals["/propostas<br/>sem persistencia completa"]
    Works["/obras<br/>operacional preservado"]
    WorkById["/obras/:obraId<br/>obra ativa"]

  Root --> Dashboard
  Dashboard --> Opportunities
  Opportunities --> OpportunityDetail
  Dashboard --> Estimator
  Dashboard --> Proposals
  Dashboard --> Works
  Works --> WorkById
```

## Status por Rota

| Rota             | Componente          | Status                                                                |
| ---------------- | ------------------- | --------------------------------------------------------------------- |
| `/`              | `DashboardPage`     | Hub implementado                                                      |
| `/dashboard`     | `DashboardPage`     | Hub implementado                                                      |
| `/oportunidades` | `OportunidadesPage` | MVP funcional com listagem/criacao via Supabase                       |
| `/oportunidades/:id` | `OportunidadeDetalhePage` | Rota funcional com dados da oportunidade, linha do tempo e evento manual |
| `/orcamentista`  | `OrcamentistaChat`  | Funcional parcial, ainda ligado a workspace/obra                      |
| `/propostas`     | `PropostaPage`      | Funcional (persistência de proposta) - ainda aceita upload JSON |
| `/obras`         | `Main`              | Modulo operacional preservado                                         |
| `/obras/:obraId` | `Main`              | Modulo operacional com obra ativa pela URL                            |
