# EVIS — Verificação P0: `orcamentos.obra_id` Nullability

> **Data:** 2026-05-15  
> **Modo:** Somente leitura — nenhum arquivo funcional foi alterado

---

## 1. Veredito

### ✅ P0 DESCARTADO — Migration já aplicada em 2026-05-04

A constraint `NOT NULL` em `orcamentos.obra_id` **já foi removida**. O banco real aceita `obra_id = NULL`. O fluxo canônico pré-obra **não está bloqueado**.

---

## 2. Evidências Encontradas

### Evidência 1 — Migration SQL proposta e aplicada

**Arquivo:** `platform/docs/sql_proposals/ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql`

```sql
alter table public.orcamentos
  alter column obra_id drop not null;
```

- **Status no header:** `PROPOSTA — NÃO APLICADA` (label desatualizado)
- **Status real:** Aplicada em 2026-05-04 conforme SCHEMA_GAP_REPORT

### Evidência 2 — SCHEMA_GAP_REPORT §11.9.7 (teste manual)

> `SCHEMA_GAP_REPORT.md` L976:  
> *"Teste manual confirmou que `orcamentos.obra_id` possui constraint `NOT NULL` no banco real."*

Isso descreve o estado **antes** da migration (2026-05-04 pré-migration).

### Evidência 3 — SCHEMA_GAP_REPORT §11.9.9 (migration aplicada)

> `SCHEMA_GAP_REPORT.md` L1020-1023:  
> *"Status: **MIGRATION APLICADA NO BANCO REAL.**"*  
> *"Resultado: `orcamentos.obra_id` agora aceita `NULL`."*

Resultado dos pré-checks:
```
1.1: is_nullable = NO (baseline antes da migration)
1.2: sem FK relacional em obra_id (apenas coluna text)
1.3: policies com qual = true (sem filtro por obra_id)
1.4: sem triggers
1.5: idx_orcamentos_obra_id (btree, neutro)
1.6: 4 orçamentos, todos com obra_id preenchido
1.7: sem registros com obra_id = NULL antes da migration
```

Resultado pós-migration:
```
is_nullable = YES ← CONFIRMADO
total_orcamentos = 4, com_obra_id = 4, sem_obra_id = 0 ← legados intactos
```

### Evidência 4 — Teste funcional end-to-end (§11.9.9)

```
Criação do orçamento pela oportunidade: SUCESSO (obra_id = NULL aceito)
Adicionar item manual:                  SUCESSO (50 m2 x R$150 = R$7.500)
Editar item manual:                     SUCESSO (quantidade 50 → 60)
Remover item manual:                    CORRIGIDO
Legado de Obra (/obras/:obraId):        FUNCIONANDO (R$10.106.375 carregado)
```

Contagem final:
```
total_orcamentos = 5
com_obra_id      = 4  ← orçamentos de Obra, intactos
sem_obra_id      = 1  ← orçamento de Oportunidade (TESTE 03)
```

### Evidência 5 — SCHEMA_GAP_REPORT §11.9.8 (baseline SQL)

> `ORCAMENTISTA_002_BASELINE_ORCAMENTOS_ORCAMENTO_ITENS.sql` L31:  
> *"orcamentos.obra_id e text NULL, sem FK para public.obras(id)."*

Confirma que `obra_id` é `text` (não UUID) e não tem FK para `obras`.

### Evidência 6 — EVIS_READER_VERIFIER_HITL_SQL_HARDENING_REVIEW.md

> L67: *"`orcamentos.obra_id` | `text NULL` (nullable desde 2026-05-04)"*

### Evidência 7 — Código TypeScript

`src/types.ts` L20, L33, L165:
```typescript
obra_id?: string;  // opcional no TypeScript
```

`src/types.ts` L463:
```typescript
obra_id: string | null;  // nullable
```

### Evidência 8 — Guard no hook (ainda presente como proteção)

`src/hooks/useOportunidadeOrcamento.ts` L186-203:
```typescript
if (isSchemaBlocked) {
  return {
    status: 'blocked',
    reason: 'obra_id_required_in_db',
    message: 'Criação bloqueada: o banco de dados exige obra_id em orcamentos...'
  };
}
```

Este guard **continua no código** como proteção defensiva. Se a constraint fosse restaurada, o sistema detectaria e bloquearia graciosamente.

---

## 3. Estado Real de `orcamentos.obra_id`

| Aspecto | Estado |
|:---|:---|
| Tipo da coluna | `text` |
| Aceita NULL | ✅ **SIM** (desde 2026-05-04) |
| Foreign Key para `obras` | ❌ Não existe |
| Índice | `idx_orcamentos_obra_id` (btree, funciona com nullable) |
| RLS/Policies | `qual = true` (sem filtro por `obra_id`) |
| Triggers | Nenhum |
| Registros com NULL | ✅ 1 confirmado (TESTE 03) |

---

## 4. Impacto no Fluxo Canônico

### Fluxo desbloqueado ✅

```
Oportunidade
  → Criar orçamento (obra_id = NULL)        ✅ FUNCIONAL
  → Adicionar itens manuais                 ✅ FUNCIONAL
  → Gerar proposta a partir do orçamento    ✅ FUNCIONAL
  → Converter em obra (preenche obra_id)    ✅ FUNCIONAL
  → Legado de obra (/obras/:id)             ✅ PRESERVADO
```

**Nenhuma etapa do fluxo canônico está bloqueada por constraint de banco.**

---

## 5. Correção Recomendada

### Nenhuma migration necessária.

A migration já foi aplicada. Recomendações de manutenção:

1. **Atualizar label do SQL** — o header de `ORCAMENTISTA_001_ORCAMENTOS_OBRA_ID_NULLABLE.sql` ainda diz `Status: PROPOSTA — NÃO APLICADA`. Deveria refletir `APLICADA — 2026-05-04`.

2. **Manter o guard defensivo** em `useOportunidadeOrcamento.ts` — ele é uma proteção legítima caso alguém restaure a constraint.

3. **Considerar adicionar `opportunity_id`** em `orcamentos` como coluna futura (melhoria, não bloqueador). Atualmente o vínculo é feito via `opportunities.orcamento_id → orcamentos.id`.

---

## 6. Próximo Passo

### ✅ Pode avançar para validação do fluxo ponta a ponta.

O P0 está descartado. A recomendação é:

1. **Validar fluxo canônico completo em dev local** — criar oportunidade → criar orçamento → adicionar itens → gerar proposta → converter em obra → verificar Diário
2. **Avançar para Fase 1 da Arquitetura Canônica** — Orçamentista Mínimo Funcional (conectar Gemini ao endpoint `/analyze`)

**Nenhuma correção de schema é necessária antes de avançar.**

---

## 7. Atualização da Arquitetura Canônica

O documento `EVIS_CANONICAL_SYSTEM_ARCHITECTURE.md` deve ser atualizado para refletir:

- **P0 descartado** — `obra_id` já é nullable
- **Fase 0 concluída** — desbloqueio confirmado
- **Próxima ação** = Fase 1 (Orçamentista Mínimo Funcional)

---

> **Este documento é somente leitura. Nenhum arquivo funcional foi alterado.**
