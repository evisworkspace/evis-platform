# SCHEMA GAP REPORT - EVIS AI

> Tipo: auditoria curta de divergencia entre schema documentado, codigo atual e necessidade do modulo Oportunidades  
> Status: documento de orientacao, sem execucao de SQL  
> Escopo: nao altera banco, nao cria migration, nao implementa tela

## 1. Objetivo

Registrar oficialmente os gaps entre:

- schema oficial documentado;
- tabelas assumidas pelo codigo atual;
- entidades necessarias para o MVP de Oportunidades;
- decisoes arquiteturais antes da implementacao do fluxo comercial.

Este documento deve orientar a reconciliacao do Supabase antes de qualquer migration ou tela nova.

## 2. Tabelas Confirmadas No Schema Oficial

As tabelas abaixo aparecem no schema oficial documentado em `docs/SCHEMA_OFICIAL_V1.sql`:

```text
obras
servicos
equipes_cadastro
equipes_presenca
diario_obra
notas
pendencias
fotos
alias_conhecimento
_schema_version
```

Leitura pratica:

- `obras` e a entidade operacional principal do EVIS Obra.
- `servicos`, `equipes_cadastro`, `equipes_presenca`, `diario_obra`, `notas`, `pendencias` e `fotos` dependem de `obra_id`.
- `alias_conhecimento` e uma base global de reconhecimento sem dependencia direta de obra.
- `_schema_version` registra versao do schema documentado.

## 3. Tabelas Usadas Pelo Codigo Mas Ausentes No Schema Oficial

As tabelas abaixo sao usadas ou assumidas pelo codigo/documentacao operacional, mas nao aparecem no schema oficial base:

```text
orcamentos
orcamento_itens
brain_narrativas
relatorios_semanais
sinapi_composicoes
catalogo_servicos_evis
servicos_referencia_origem
composicoes_modelo
precos_referencia_historico
cotacoes_reais
snapshot_orcamento_itens
sugestoes_catalogo
vw_referencias_servicos_evis
```

Leitura pratica:

- `orcamentos` e `orcamento_itens` sao usados pelo modulo de orcamento no frontend.
- `brain_narrativas` e `relatorios_semanais` aparecem no fluxo de sincronizacao do app.
- As tabelas e view de catalogo/referencias sustentam a camada EVIS/SINAPI.
- A ausencia dessas entidades no schema oficial cria risco de desenvolvimento sobre contrato incompleto.

## 4. Riscos Atuais

Antes de criar Oportunidades, os principais riscos sao:

- criar foreign keys para tabelas que talvez nao existam no banco real;
- duplicar cliente em `contacts`, `obras`, `orcamentos` e JSON de proposta sem regra clara;
- criar `obra` cedo demais para leads ainda nao fechados;
- acoplar o Orçamentista em `obra_id` antes de existir uma oportunidade comercial;
- criar `proposta_id` sem tabela real e persistida de propostas;
- aumentar a divergencia entre codigo, documentos e Supabase.

Risco adicional observado:

- ha codigo que consulta estruturas nao alinhadas ao schema documentado, como `pendencias.resolvido`, enquanto o schema oficial usa `pendencias.status`.

## 5. Modelo Recomendado Para Oportunidades

O MVP de Oportunidades deve comecar enxuto, com uma entidade central e historico:

```text
contacts
opportunities
opportunity_events
opportunity_files
opportunity_statuses
```

Uso recomendado:

- `contacts`: pessoas ou empresas relacionadas a oportunidades.
- `opportunities`: registro mestre do lead/oportunidade.
- `opportunity_events`: linha do tempo comercial, tecnica e operacional.
- `opportunity_files`: arquivos recebidos antes da obra existir.
- `opportunity_statuses`: opcional; usar se os status precisarem ser configuraveis. Para MVP, um enum/check constraint em `opportunities.status` pode ser suficiente.

## 6. Relacao De IDs

A relacao correta entre as entidades deve seguir este fluxo:

```text
contact_id
  -> opportunity_id
    -> orcamentista_workspace_id
    -> orcamento_id
    -> proposta_id
    -> project_id
    -> obra_id
```

Definicao de cada ID:

- `contact_id`: identifica o cliente, arquiteto, parceiro ou responsavel comercial.
- `opportunity_id`: identifica a oportunidade como origem do ciclo comercial.
- `orcamentista_workspace_id`: identifica o workspace local/operacional usado pelo Orçamentista.
- `orcamento_id`: identifica o orcamento estruturado, quando existir tabela reconciliada.
- `proposta_id`: identifica proposta comercial persistida, quando a tabela existir.
- `project_id`: entidade futura ou intermediaria de pre-obra/projeto, se o produto separar projeto de obra operacional.
- `obra_id`: identifica a obra operacional no EVIS Obra, criada apenas apos fechamento.

Regra de nascimento:

```text
contact_id e opportunity_id nascem cedo.
orcamentista_workspace_id nasce quando a oportunidade abre analise tecnica.
orcamento_id nasce quando ha orcamento salvo.
proposta_id nasce quando a proposta e persistida.
project_id nasce apenas se houver fase formal de pre-obra.
obra_id nasce apenas apos fechamento.
```

## 7. Decisao Arquitetural

As decisoes abaixo devem guiar a implementacao:

- Lead/Oportunidade nasce antes de obra.
- Obra so nasce depois de fechamento.
- Orçamentista deve se conectar a oportunidade, nao diretamente a obra.
- Supabase e a fonte unica da verdade para entidades de produto.
- Dados incompletos sao permitidos no inicio do lead.

Consequencia pratica:

- Oportunidades nao deve exigir cadastro completo.
- `obras` nao deve ser usada como CRM.
- `cliente` textual em tabelas antigas deve ser tratado como snapshot ou compatibilidade, nao como fonte principal futura.
- O fluxo comercial deve preservar rastreabilidade ate a obra operacional.

## 8. Ordem Segura De Execucao

A ordem segura antes de implementar o modulo e:

A. Validar schema real do Supabase.  
B. Reconciliar schema oficial.  
C. Criar migration de Oportunidades.  
D. Criar types/hooks.  
E. Implementar tela Oportunidades.  
F. Conectar Orçamentista a oportunidade.

## 9. Primeiro Patch Seguro Recomendado

O primeiro patch funcional, apos esta documentacao, deve ser pequeno:

- adicionar tipos TypeScript para `Contact`, `Opportunity`, `OpportunityEvent` e `OpportunityFile`;
- criar hooks read-only ou preparados para CRUD de oportunidades;
- manter a tela de Oportunidades sem fluxo produtivo ate a migration existir;
- nao criar FK para `orcamentos`, `propostas` ou `project_id` antes da reconciliacao do schema real.

## 10. Conclusao

O modulo Oportunidades e o proximo passo correto para transformar o EVIS em um SaaS mais competitivo, mas ele deve entrar como origem do ciclo de vida comercial, nao como extensao improvisada de `obras`.

A prioridade imediata e alinhar o contrato de dados: schema real do Supabase, schema oficial e codigo precisam apontar para as mesmas entidades antes da implementacao.
