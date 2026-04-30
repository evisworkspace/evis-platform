# EVIS AI — Contexto Automático do Projeto

@platform/docs/CODING_STANDARDS.md

## Projeto
Sistema de gestão de obras com IA. React 19 + TypeScript + Vite + Supabase + Tailwind v4.

## Regras inegociáveis
- Tipos: SEMPRE ler src/types.ts antes de criar qualquer componente
- API: SEMPRE usar sbFetch de src/lib/api.ts — nunca fetch direto
- Config: SEMPRE obter via useAppContext() — nunca props manuais
- Campo do item de orçamento: `codigo` (não `codigo_referencia`)
- obra_id nas tabelas: tipo TEXT (não UUID com FK)
- Tailwind v4: não usar @apply com classes que não existem (ex: leading-relaxed)
- Código entregue: zero links Markdown dentro de expressões TypeScript

## Arquivos críticos para ler antes de qualquer tarefa
- src/types.ts — todos os tipos do projeto
- src/hooks/useOrcamento.ts — padrão de hook com React Query
- src/components/Orcamento/index.tsx — padrão de componente
- platform/docs/CODING_STANDARDS.md — padrão completo

## Estado atual do módulo Orcamentista
- Tabelas criadas no Supabase: orcamentos, orcamento_itens
- Hook pronto: src/hooks/useOrcamento.ts
- Lista pronta: src/components/Orcamento/index.tsx
- Pendente: src/components/Orcamento/OrcamentoEditor.tsx
