# EVIS AI — Prompt de Execução Autônoma (Claude Sonnet)

> Prompt completo e autocontido. Leia tudo antes de executar qualquer linha.
> Working directory: `c:\Users\User\Evis AI`

---

## CONTEXTO DO PROJETO

EVIS AI é um sistema de gestão de obras com IA. Stack: React 19 + TypeScript + Vite + Supabase + Tailwind v4.

**Arquivos de padrão obrigatório — leia ANTES de qualquer código:**
- `platform/docs/CODING_STANDARDS.md` — padrões completos
- `src/types.ts` — todos os tipos
- `src/lib/api.ts` — sbFetch (NUNCA usar fetch direto)
- `src/AppContext.tsx` — useAppContext (NUNCA usar props manuais para config)

---

## MISSÃO

Reorganizar o UX do EVIS para seguir o padrão VOBI: uma entidade = uma tela com tabs sequenciais. O resultado deve ser um app funcional, limpo e testável localmente amanhã.

Modelo de referência: plataforma.vobi.com.br — blocos sequenciais, sem jargão técnico, IA invisível na navegação.

---

## ESTADO ATUAL (auditado em 2026-05-17)

### Obra Detalhe (`src/App.tsx` — componente `Main`)

Rota: `/obras/:obraId`

**Tabs atuais (8 tabs):**
```
Diário    → <Diario />
Equipes   → <Equipes />
Orçamento → <OrcamentoTab />
Cronograma → <Cronograma />
Notas     → <Notas />
Fotos     → <Fotos />
Relatórios → <Relatorios />
Config    → <ConfigPage />
```

**Tabs alvo (7 tabs — modelo VOBI):**
```
Visão Geral  → <ObraVisaoGeral />     ← CRIAR
Planejamento → <Cronograma />         ← renomear label
Diário       → <Diario />             ← manter
Equipes      → <Equipes />            ← manter
Financeiro   → <OrcamentoTab />       ← renomear label
Documentos   → <DocumentosTab />      ← CRIAR (merge Fotos + Notas)
Relatórios   → <Relatorios />         ← manter
```

"Config" sai das tabs de produto (move para rodapé ou mantém oculto — não deletar o componente).

---

### Oportunidade Detalhe (`src/pages/OportunidadeDetalhePage.tsx`)

**Estado atual:** layout de duas colunas, SEM tabs. Coluna esquerda = dados. Coluna direita = sidebar de atividades.

**Target (4 tabs):**
```
Resumo      → conteúdo atual da coluna esquerda (dados gerais)
Orçamento IA → status do orçamento + botão "Abrir Orçamentista" → /oportunidades/:id/orcamentista
Proposta    → conteúdo existente de proposta (PropostaTab inline ou link)
Atividades  → conteúdo atual da sidebar de atividades
```

**Header da Oportunidade — botões de ação:**
```
[ORÇAMENTO COM IA]  [ORÇAMENTO]  [GERAR PROPOSTA]  [GANHAR / ABRIR OBRA →]
```
GANHAR já está implementado. Verificar e manter comportamento existente.

---

## FASES DE EXECUÇÃO

Execute em ordem. Não avance para a próxima fase antes de concluir a atual.

---

### FASE 1 — Criar `ObraVisaoGeral` component

**Arquivo a criar:** `src/components/ObraVisaoGeral.tsx`

Interface do componente:
```typescript
interface Props {
  obraId: string;
}
```

**Dados a exibir (todos via hooks/sbFetch existentes):**
1. **Avanço geral:** média de `avanco_atual` dos serviços (query: `servicos?obra_id=eq.${obraId}`)
2. **Dias em obra:** se obra tiver `created_at`, calcular `Math.floor((Date.now() - new Date(obra.created_at).getTime()) / 86400000)`
3. **Serviços:** `X concluídos` de `Y total` (status === 'concluido')
4. **Última entrada no diário:** query `diario?obra_id=eq.${obraId}&order=dia.desc&limit=1`
5. **Próximas tarefas:** serviços com `status !== 'concluido'` e `data_prevista`, ordenados por data
6. **Alertas:** serviços com `data_prevista < hoje` e `status !== 'concluido'`

**Padrão visual (dark theme obrigatório):**
```
┌─ AVANÇO GERAL ─────┐  ┌─ SERVIÇOS ──────────┐  ┌─ DIÁRIO ───────────┐
│  ████████░░  78%   │  │  5/8 concluídos     │  │  Última: hoje      │
└────────────────────┘  └─────────────────────┘  └────────────────────┘

┌─ PRÓXIMAS TAREFAS ─────────────────────────────────────────────────────┐
│  • Alvenaria 2º pav    data_prevista: 20/05   status: em_andamento    │
│  • Instalação elétrica  data_prevista: 25/05   status: nao_iniciado   │
└────────────────────────────────────────────────────────────────────────┘

┌─ ALERTAS ──────────────────────────────────────────────────────────────┐
│  ⚠ Reboco externo — prazo vencido (15/05)                             │
└────────────────────────────────────────────────────────────────────────┘
```

Cores: `text-green-400` para avanço, `text-amber-400` para alertas, padrão dark do projeto.

**Usar `useAppContext()` para config. Usar `sbFetch` da lib/api. Sem fetch direto.**

---

### FASE 2 — Criar `DocumentosTab` component

**Arquivo a criar:** `src/components/DocumentosTab.tsx`

Simplesmente renderiza os dois componentes existentes empilhados:
```typescript
import Fotos from './Fotos';
import Notas from './Notas';

export default function DocumentosTab() {
  return (
    <div className="flex flex-col gap-6">
      <Fotos />
      <Notas />
    </div>
  );
}
```

Verificar as props que `<Fotos />` e `<Notas />` esperam — passá-las corretamente.

---

### FASE 3 — Reorganizar tabs da Obra em `src/App.tsx`

**Localizar** a definição de tabs no componente `Main` (por volta das linhas 361-370).

**Substituir** pela nova ordem:
```typescript
const tabs = [
  { id: 'visao_geral',  label: 'Visão Geral',  component: <ObraVisaoGeral obraId={obraId} /> },
  { id: 'planejamento', label: 'Planejamento', component: <Cronograma /> },
  { id: 'diario',       label: 'Diário',       component: <Diario /> },
  { id: 'equipes',      label: 'Equipes',      component: <Equipes /> },
  { id: 'financeiro',   label: 'Financeiro',   component: <OrcamentoTab /> },
  { id: 'documentos',   label: 'Documentos',   component: <DocumentosTab /> },
  { id: 'relatorios',   label: 'Relatórios',   component: <Relatorios /> },
];
```

**Remover** "Config" e "Notas" e "Fotos" como tabs separadas.

**Tab ativa default:** `planejamento` na primeira visita (ou `visao_geral` se preferir). Verificar se há lógica de persistência de tab ativa e adaptar.

**Adicionar imports** para ObraVisaoGeral e DocumentosTab no topo do App.tsx.

---

### FASE 4 — Adicionar tabs na Oportunidade Detalhe

**Arquivo:** `src/pages/OportunidadeDetalhePage.tsx`

**Estratégia:** Manter o conteúdo existente — apenas envolver em sistema de tabs. Não reescrever lógica de dados.

**Passo 4.1 — Adicionar estado de tab ativa:**
```typescript
const [activeTab, setActiveTab] = useState<'resumo' | 'orcamento_ia' | 'proposta' | 'atividades'>('resumo');
```

**Passo 4.2 — Adicionar navegação de tabs** (abaixo do header, acima do conteúdo):
```typescript
const tabs = [
  { id: 'resumo',       label: 'Resumo' },
  { id: 'orcamento_ia', label: 'Orçamento IA' },
  { id: 'proposta',     label: 'Proposta' },
  { id: 'atividades',   label: 'Atividades' },
];
```

Estilo das tabs (padrão do projeto):
```
Tab ativa:   border-b-2 border-green-400 text-white font-medium
Tab inativa: text-white/50 hover:text-white/80
```

**Passo 4.3 — Reorganizar conteúdo:**
- `activeTab === 'resumo'` → atual coluna esquerda (dados gerais da oportunidade)
- `activeTab === 'orcamento_ia'` → novo: mostrar status do orçamento + botão verde "Abrir Orçamentista" que navega para `/oportunidades/${id}/orcamentista`
- `activeTab === 'proposta'` → conteúdo de proposta existente (se houver) ou placeholder "Em breve"
- `activeTab === 'atividades'` → atual sidebar de atividades (remover do layout lateral, colocar aqui)

**Passo 4.4 — Layout:** Remover o layout de duas colunas. Virar layout de coluna única com tabs no topo.

---

### FASE 5 — Verificar build sem erros

```bash
cd "c:\Users\User\Evis AI"
npm run build
```

Se houver erros de TypeScript:
- Não use `any` para resolver
- Corrija o tipo correto (consultar src/types.ts)
- Nunca use `// @ts-ignore`

Se build passar: execute `npm run dev` e confirme que a UI carrega em `localhost:5173`.

---

## REGRAS ABSOLUTAS

1. **NUNCA** `fetch` direto — sempre `sbFetch` de `src/lib/api.ts`
2. **NUNCA** tipos inventados — consultar `src/types.ts`
3. **NUNCA** `useAppContext()` → apenas para obter `config` e `toast`
4. **NUNCA** `@apply` com classes inexistentes no Tailwind v4
5. **NUNCA** links Markdown dentro de expressões TypeScript: `[texto](url)`
6. **NUNCA** deletar componentes existentes — apenas reorganizar
7. **NUNCA** modificar lógica de dados (queries, mutations) — apenas UI e estrutura de tabs
8. **NUNCA** tocar nas rotas `/orcamentista` e `/orcamentista/lab` — já estão corretas
9. **NUNCA** modificar banco de dados — apenas frontend

## CRITÉRIOS DE SUCESSO

- [ ] `/obras/:id` tem 7 tabs na ordem correta com labels em português
- [ ] Tab "Visão Geral" exibe avanço, serviços, última entrada do diário
- [ ] Tab "Documentos" mostra fotos + notas juntos
- [ ] "Config" sumiu das tabs de produto
- [ ] `/oportunidades/:id` tem 4 tabs: Resumo | Orçamento IA | Proposta | Atividades
- [ ] Tab "Orçamento IA" tem botão que navega para `/oportunidades/:id/orcamentista`
- [ ] `npm run build` passa sem erros TypeScript
- [ ] App roda em `localhost:5173` sem console errors
