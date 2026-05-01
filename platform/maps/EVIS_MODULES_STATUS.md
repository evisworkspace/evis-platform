# EVIS Modules Status

Classificacao viva dos modulos oficiais e adjacentes do EVIS.

| Modulo | Status | Evidencia atual | Proximo passo natural |
|---|---|---|---|
| Dashboard | Implementado | Hub em `/` e `/dashboard` com cards para modulos | Evoluir para comando central com indicadores reais |
| Oportunidades | Implementado | MVP funcional com Supabase para `contacts` e `opportunities` | Conectar eventos, arquivos e Orçamentista |
| Orçamentista IA | Parcial | Chat, workspace, upload, Reader/Planner, HITL e etapas visuais | Persistir vinculo com oportunidade e completar quantitativos/custos |
| Orcamentos | Parcial | `orcamentos` e `orcamento_itens` usados no frontend | Reconciliar schema oficial e conectar ao fluxo comercial |
| Propostas | Parcial | Rota e tela visual a partir de JSON | Persistencia, relacionamento com oportunidade/orcamento e geracao controlada |
| Obras | Implementado | Modulo operacional preservado em `/obras` e `/obras/:obraId` | Separar criacao pos-fechamento e fortalecer contratos de dados |
| Diario de Obra | Parcial | IA operacional com revisao HITL no frontend | Consolidar auditoria persistida e contratos backend |
| Financeiro | Planejado | Conceito no blueprint; sem modulo completo dedicado | Definir entidades de custos, pagamentos, medicoes e fluxo de caixa |
| Relatorios | Parcial | Aba de relatorios existe; `relatorios_semanais` ausente no schema reconciliado | Criar contrato persistido e reconciliar tabela |
| Cadastros | Parcial | Equipes e configuracoes existem dentro de Obras | Separar cadastros globais de cadastros por obra |
| Configuracoes | Implementado | Tela `ConfigPage` configura Supabase, obra e chaves | Migrar gradualmente para configuracao segura por usuario/empresa |

## Legenda

| Status | Significado |
|---|---|
| Implementado | Existe fluxo utilizavel no frontend atual |
| Parcial | Existe parte funcional, mas faltam persistencia, contrato, automacao ou integracao |
| Placeholder | Rota/tela existe sem fluxo produtivo |
| Planejado | Conceito mapeado, ainda sem implementacao principal |
| Bloqueado | Depende de decisao, schema ou infraestrutura antes de evoluir |

