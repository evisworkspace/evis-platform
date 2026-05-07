# EVIS - Legacy Budgeter Write Quarantine

> Fase: 4A.R  
> Tipo: quarentena tecnica e documentacao  
> Escopo: caminho legado de geracao oficial de orcamento via chat do Orçamentista  
> Status: sem migration, sem SQL, sem alteracao de banco

## 1. Caminho quarentenado

Backend:

```text
POST /api/orcamentista/workspaces/:workspaceId/generate-official-budget
platform/server/routes/orcamentista.ts
```

Frontend:

```text
src/pages/OrcamentistaChat.tsx
funcao gerarOrcamentoOficial
botao "Gerar orçamento oficial"
```

## 2. Motivo da quarentena

Esse caminho legado podia transformar a previa do chat em orcamento oficial antes da persistencia canonica do novo fluxo Reader/Verifier/HITL/Gate.

O endpoint antigo podia:

- criar ou atualizar `orcamentos`;
- inserir diretamente em `orcamento_itens`;
- atualizar `opportunities.orcamento_id`;
- usar `workspaceId` ou `orcamentista_workspace_id` como `obra_id`;
- registrar `orcamento_oficial_gerado` somente depois da escrita;
- bypassar Reader persistido;
- bypassar Verifier persistido;
- bypassar divergencias resolvidas;
- bypassar HITL persistido;
- bypassar gate de consolidacao auditavel.

## 3. Regra arquitetural violada

Reader, Verifier e HITL nao podem escrever diretamente em `orcamento_itens`.

Qualquer escrita oficial por IA em `orcamento_itens` deve ocorrer somente depois de:

```text
Reader persistido
  -> Verifier persistido
  -> comparacao Reader x Verifier
  -> divergencias registradas
  -> HITL resolvido
  -> gate de consolidacao aprovado
  -> autorizacao humana explicita
  -> escrita controlada em orcamento_itens
```

Tambem permanece proibido depender de `obra_id` como entidade principal em fluxo pre-obra. Orçamentos de oportunidade devem ficar vinculados por `opportunities.orcamento_id` ate a conversao real em Obra.

## 4. Implementacao da quarentena

### Backend

A rota `generate-official-budget` passa a retornar bloqueada por padrao antes de qualquer leitura ou escrita no Supabase.

Feature flag explicita:

```text
LEGACY_ORCAMENTISTA_OFFICIAL_WRITE_ENABLED=true
```

Mesmo com a flag ativa, o bypass fica bloqueado em `NODE_ENV=production`. Fora de producao, a rota registra warning forte no console antes de executar o comportamento legado.

### Frontend

O chat legado usa flag propria:

```text
VITE_LEGACY_ORCAMENTISTA_OFFICIAL_WRITE=true
```

Por padrao, o botao "Gerar orçamento oficial" fica desabilitado e a tela exibe aviso de quarentena. O chat, a previa e a aprovacao visual da previa continuam funcionando, mas nao acionam escrita oficial por padrao.

## 5. Fluxos que continuam funcionando

Continuam fora desta quarentena:

- criacao manual de orcamento da oportunidade;
- CRUD manual de itens em `orcamento_itens`;
- edicao manual de orcamento no modulo de Obra;
- geracao de proposta a partir de orcamento existente;
- conversao manual de oportunidade em obra;
- Diario de Obra e fluxos operacionais de `/obras`.

## 6. Caminho futuro correto

A geracao oficial por IA deve ser reintroduzida apenas como fase futura, consumindo dados persistidos e auditaveis:

```text
Reader persistido
  -> Verifier persistido
  -> comparacao
  -> divergencias
  -> HITL
  -> gate
  -> revisao humana
  -> escrita controlada em orcamento_itens
```

O evento `orcamento_oficial_gerado` pode continuar existindo como registro posterior, mas nao substitui a trilha auditavel previa de decisao humana, gate de consolidacao e autorizacao explicita.
