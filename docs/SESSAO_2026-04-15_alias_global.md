# Sessão 2026-04-15 — Alias Global & Resolução de Entidades em 3 Níveis

## Contexto e Problema Identificado

O sistema de resolução de entidades da Camada 3 do `orchestrator.ts` fazia buscas de aliases sempre filtradas por `obra_id`:

```ts
supabase.from('servicos')
  .contains('aliases', [termo])
  .eq('obra_id', obra_id)   // ← aliases presos à obra
```

Isso criava um problema crítico de escopo: cada obra nova começava com aliases completamente vazios. O conhecimento semântico acumulado ("marceneiros = Marcenaria", "ac = Ar-condicionado") precisava ser reconfigurado do zero para cada projeto, o que não faz sentido em um sistema que deve escalar para múltiplas obras.

---

## Arquitetura Implementada

### Nova tabela global `alias_conhecimento`

Tabela sem `obra_id`, que armazena conhecimento semântico reutilizável entre todas as obras:

```sql
CREATE TABLE public.alias_conhecimento (
  id         UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  alias      TEXT    NOT NULL,
  categoria  TEXT    NOT NULL,   -- 'Marcenaria', 'Elétrica', 'PPCI'...
  tipo       TEXT    NOT NULL DEFAULT 'servico',  -- 'servico' | 'equipe'
  confianca  FLOAT   NOT NULL DEFAULT 0.80,
  exemplos   TEXT[]  DEFAULT '{}'
);
```

### Resolução em 4 níveis (serviços) e 3 níveis (equipes)

| Nível | Fonte | Confiança | Método no código |
|-------|-------|-----------|-----------------|
| 1 | Nome exato via `ilike` na obra | 0.95 | `exato` |
| 2 | `aliases[]` próprio do registro na obra | 0.85 | `alias` |
| 3 | `alias_conhecimento` global → categoria → obra | 0.80 | `alias_global` |
| 4 | Match semântico na primeira palavra (só serviços) | 0.65 | `semantico` |

Se nenhum nível resolver: `{ entidade_id: null, confianca: 0.0, metodo: 'nao_resolvido' }`.

---

## Arquivos Criados / Modificados

### 1. `docs/04_ALIAS_CONHECIMENTO_GLOBAL.sql` — **NOVO**

Migration completa para rodar no Supabase SQL Editor. Contém:

- **DDL**: `CREATE TABLE alias_conhecimento` com índice único `(alias, tipo)` e índice em `categoria`
- **RLS**: leitura pública (`SELECT` para todos), escrita restrita ao `service_role`
- **Seed de serviços** (~80 termos) nas categorias:
  - Administração (vistoria, entrega de obra)
  - Ar-condicionado (ac, climatização, infra ac, cassete, fancoil, câmara fria…)
  - Demolições (demolição, quebrar parede, tirar piso…)
  - Drywall / Forro (forro, drywall, gesso acartonado, tarugamento…)
  - Elétrica (elétrica, fiação, quadro elétrico, luminárias, tomadas…)
  - Limpeza (limpeza, limpeza pós-obra, faxina…)
  - Marcenaria (marcenaria, marceneiros, móveis, lambri…)
  - Pintura (pintura, emassamento, massa corrida, lixamento, demão…)
  - PPCI (ppci, sprinkler, hidrante, detector de fumaça…)
  - Preliminares (mobilização, tapume, canteiro de obras…)
  - Revestimento (porcelanato, azulejo, cerâmica, rejunte…)
- **Seed de equipes** (~30 termos) nas categorias:
  - Ar-condicionado (equipe do ar, pessoal do ar, refrigeração…)
  - Civil (pedreiros, empreiteiro civil, pessoal da obra…)
  - Elétrica (eletricistas, equipe elétrica, os da elétrica…)
  - Limpeza (equipe de limpeza, faxineiros, limpadores…)
  - Marcenaria (equipe de marcenaria, os da marcenaria…)
  - PPCI (equipe ppci, pessoal do ppci…)
  - Som (equipe de som, sonorização, pessoal do som…)
- `ON CONFLICT DO UPDATE` — idempotente, seguro para re-executar

### 2. `server/agents/orchestrator.ts` — **MODIFICADO**

**Interface `EntidadeResolvida`** — adicionado novo valor ao union type:
```ts
// Antes:
metodo: 'exato' | 'alias' | 'semantico' | 'nao_resolvido'

// Depois:
metodo: 'exato' | 'alias' | 'alias_global' | 'semantico' | 'nao_resolvido'
```

**Função `resolverEntidades()`** — Bloco `servico` reestruturado com os 4 níveis:
```ts
// Nível 3 — novo
const { data: global } = await supabase
  .from('alias_conhecimento')
  .select('categoria, confianca')
  .eq('alias', termo)
  .eq('tipo', 'servico')
  .single();

if (global) {
  const { data: porCategoria } = await supabase
    .from('servicos')
    .select('id, nome')
    .eq('obra_id', obra_id)
    .ilike('categoria', `%${global.categoria}%`)
    .limit(1);
  // ...
}
```

Bloco `equipe` também atualizado com os 3 níveis:
```ts
// Nível 3 — novo (busca por funcao)
const { data: globalEquipe } = await supabase
  .from('alias_conhecimento')
  .select('categoria, confianca')
  .eq('alias', termo)
  .eq('tipo', 'equipe')
  .single();

if (globalEquipe) {
  const { data: porFuncao } = await supabase
    .from('equipes_cadastro')
    .select('id, nome, funcao')
    .eq('obra_id', obra_id)
    .ilike('funcao', `%${globalEquipe.categoria}%`)
    .limit(1);
  // ...
}
```

---

## Comparativo de Comportamento

| Cenário | Antes | Depois |
|---------|-------|--------|
| Obra nova | aliases vazios → tudo `nao_resolvido` | resolve automaticamente via global |
| "marceneiros" em qualquer obra | só funciona se a obra tiver o alias | resolve sempre via `alias_conhecimento` → Marcenaria |
| Alias específico do cliente | único mecanismo disponível | nível 1 e 2 têm prioridade sobre o global |
| Aprendizado novo termo | atualizar serviço específico por ID | inserir em `alias_conhecimento` → beneficia todas as obras |
| Confiança rastreável | binário (achou/não achou) | float graduado 0.65 → 0.95 com `metodo` auditável |

---

## Como Ativar

1. Rodar `docs/04_ALIAS_CONHECIMENTO_GLOBAL.sql` no Supabase SQL Editor
2. Verificar na query de checagem ao final do script:
   ```sql
   SELECT tipo, categoria, COUNT(*) AS total
   FROM public.alias_conhecimento
   GROUP BY tipo, categoria
   ORDER BY tipo, categoria;
   ```
3. O orchestrator já está atualizado — nenhuma outra alteração necessária

---

## Regra de Manutenção Futura

- **Novos sinônimos de domínio** → inserir em `alias_conhecimento` (beneficia todas as obras)
- **Override específico de cliente/obra** → inserir no `aliases[]` do serviço/equipe (nível 2, prioridade sobre o global)
- **Aliases legados por ID** (`docs/03_ALIASES_SEMANTICOS.sql`) → continuam funcionando como nível 2 para a obra específica daqueles registros
