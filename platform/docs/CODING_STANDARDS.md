# EVIS AI — Padrões de Código para Motores de IA

Este documento é **obrigatório** para qualquer motor (Claude, Gemini, GPT) que gere código neste projeto.
Leia este arquivo antes de escrever qualquer linha de código.

---

## 1. STACK OFICIAL

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | React | 19 |
| Linguagem | TypeScript | 5.8 |
| Bundler | Vite | 6 |
| Estilo | Tailwind CSS | v4 |
| Estado Global | React Context (AppContext) | - |
| Cache/Fetch | TanStack React Query | v5 |
| Banco de Dados | Supabase (REST via sbFetch) | v2 |
| Roteamento | React Router DOM | v7 |
| IA | Google Gemini (@google/genai) | v1 |
| Ícones | lucide-react | - |
| Animações | motion/react | - |

---

## 2. ESTRUTURA DE PASTAS

```
src/
├── components/         ← Componentes React por tab/módulo
│   └── Orcamento/      ← Subpastas para módulos complexos
├── hooks/              ← Hooks customizados (useOrcamento.ts, etc.)
├── lib/                ← Utilitários puros (api.ts, dateUtils.ts, etc.)
├── pages/              ← Páginas completas (Login.tsx, PortalCliente.tsx)
├── services/           ← Serviços (logger.ts, geminiService.ts)
├── AppContext.tsx       ← Estado global + Provider
├── types.ts            ← TODOS os tipos TypeScript do projeto
└── main.tsx            ← Entry point
```

---

## 3. TIPOS OFICIAIS DO PROJETO

**NUNCA** invente tipos. Todos os tipos estão em `src/types.ts`.
Antes de criar um componente, leia os tipos existentes.

### Tipos principais:

```typescript
// Serviço de obra
type Servico = {
  id?: string;
  id_servico: string;  // identificador legado
  nome: string;
  categoria: string;
  avanco_atual: number;
  status: string;
  data_prevista?: string;
  data_conclusao?: string;
  responsavel?: string;
  equipe?: string;
  unidade?: string;
  quantidade?: number;
  valor_unitario?: number;
  valor_total?: number;
  custo_mao_obra?: number;
  custo_material?: number;
  obra_id?: string;
};

// Orçamento (módulo Orcamentista)
type Orcamento = {
  id: string;
  obra_id: string;
  nome: string;
  cliente?: string;
  status: OrcamentoStatus;  // 'rascunho' | 'aprovado' | 'importado'
  bdi: number;
  total_bruto: number;
  total_final: number;
  observacoes?: string;
  created_at?: string;
  updated_at?: string;
};

// Item de orçamento
type OrcamentoItem = {
  id: string;
  orcamento_id: string;
  codigo?: string;          // campo é 'codigo', NÃO 'codigo_referencia'
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  origem: 'manual' | 'sinapi' | 'ia';
  created_at?: string;
};
```

---

## 4. PADRÃO DE API — sbFetch

**NUNCA** use fetch direto. Sempre use `sbFetch` de `src/lib/api.ts`.

```typescript
// CORRETO
import { sbFetch } from '../lib/api';
const data = await sbFetch('orcamentos?obra_id=eq.xyz', {}, config);

// ERRADO
const res = await fetch(`${config.url}/rest/v1/orcamentos`);
```

### Operações REST com sbFetch:

```typescript
// GET (listagem)
sbFetch('tabela?campo=eq.valor&order=created_at.desc&limit=100', {}, config)

// POST (criar)
sbFetch('tabela', { method: 'POST', body: JSON.stringify(payload) }, config)

// PATCH (atualizar)
sbFetch('tabela?id=eq.uuid', { method: 'PATCH', body: JSON.stringify(patch) }, config)

// DELETE
sbFetch('tabela?id=eq.uuid', { method: 'DELETE', prefer: 'return=minimal' }, config)
```

---

## 5. PADRÃO DE HOOKS

Todo hook de dados segue este padrão:

```typescript
// src/hooks/useNomeModulo.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sbFetch } from '../lib/api';
import { TipoX, Config } from '../types';

// Cache keys organizados
export const nomeKeys = {
  all: (obraId: string) => ['nome_tabela', obraId] as const,
  one: (id: string) => ['nome_tabela_item', id] as const,
};

// Hook de leitura
export function useNomeModulo(obraId: string, config: Config) {
  return useQuery<TipoX[]>({
    queryKey: nomeKeys.all(obraId),
    queryFn: async () => {
      const data = await sbFetch(
        `tabela?obra_id=eq.${obraId}&order=created_at.desc&limit=100`,
        {},
        config
      );
      return data as TipoX[];
    },
    enabled: !!(config.url && config.key && obraId),
    staleTime: 1000 * 60 * 5,
  });
}
```

---

## 6. PADRÃO DE COMPONENTES

Todo componente segue esta estrutura:

```typescript
// src/components/Modulo/NomeComponente.tsx
import React, { useState } from 'react';
import { IconeX } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { TipoX } from '../../types';
import { useHookX } from '../../hooks/useHookX';

interface Props {
  prop1: string;
  prop2?: number;
  onCallback: (valor: string) => void;
}

export default function NomeComponente({ prop1, prop2, onCallback }: Props) {
  const { config, toast } = useAppContext();
  const [estado, setEstado] = useState(false);

  // ...lógica...

  return (
    <div className="flex flex-col h-full">
      {/* conteúdo */}
    </div>
  );
}
```

---

## 7. PADRÃO DE ESTILO (Tailwind v4)

**Dark theme** é o padrão do projeto. Use sempre:

```
Fundos:       bg-white/5, bg-white/8, bg-[#16191e], bg-[#0d1117]
Bordas:       border border-white/10, border-white/20
Texto:        text-white, text-white/60, text-white/40, text-white/30
Primário:     text-green-400, bg-green-500, hover:bg-green-400
Perigo:       text-red-400, bg-red-500/10
Alerta:       text-amber-400, bg-amber-500/10
Info:         text-blue-400, bg-blue-500/10
Arredondado:  rounded-lg, rounded-xl, rounded-2xl
```

**NUNCA** use classes Tailwind v3 que não existem no v4:
- ❌ `leading-relaxed` (não existe no v4 com @apply)
- ❌ `shadow-sm` dentro de @apply em arquivos .css separados
- ✅ Use Tailwind diretamente no JSX como className

---

## 8. COMO OBTER CONTEXT E CONFIG

**SEMPRE** use `useAppContext()` para acessar config, toast e estado:

```typescript
const { config, toast, state, setState, markPending } = useAppContext();
const obraId = config.obraId;  // ID da obra ativa
```

Config contém: `url`, `key`, `obraId`, `gemini`, `model`, `imgbbKey`

---

## 9. SCHEMA DO SUPABASE

### Tabelas existentes:

| Tabela | Campos principais |
|--------|------------------|
| `servicos` | id, id_servico, nome, categoria, avanco_atual, status, obra_id |
| `equipes` | id, cod, nome, funcao, telefone, ativo |
| `notas` | id, tipo, texto, data_nota, autor |
| `fotos` | id, url, thumb, legenda, data_foto |
| `diario` | id, dia, texto, confirmado, obra_id |
| `presenca` | id, dia, equipe_cod, obra_id |
| `orcamentos` | id, obra_id, nome, cliente, status, bdi, total_bruto, total_final |
| `orcamento_itens` | id, orcamento_id, codigo, descricao, unidade, quantidade, valor_unitario, valor_total, origem |

### Regras RLS:
- Todas as tabelas têm RLS habilitado
- Política atual: acesso livre (`USING (true)`) — será restrito com Auth no futuro

---

## 10. ANTI-PADRÕES — NUNCA FAÇA

```typescript
// ❌ ERRADO: fetch direto sem sbFetch
const res = await fetch(`${url}/rest/v1/tabela`);

// ❌ ERRADO: tipo não existente em types.ts
type MinhaInterface = { codigo_referencia: string }; // use 'codigo'

// ❌ ERRADO: SQL do Supabase com FK para obras sem confirmar que tabela existe
obra_id UUID REFERENCES public.obras(id)  // obras pode não existir

// ❌ ERRADO: @apply com classes que não existem no Tailwind v4
.classe { @apply leading-relaxed; }  // erro no build

// ❌ ERRADO: usar estado local para dados que vêm do Supabase
const [itens, setItens] = useState([]);  // use useQuery

// ❌ ERRADO: campo 'codigo_referencia' — o campo correto é 'codigo'
{ codigo_referencia: 'SINAPI-001' }  // use { codigo: 'SINAPI-001' }
```

---

## 11. REGRA DE ENTREGA DE CÓDIGO

Ao entregar código:
1. **Entregue apenas blocos de código** delimitados por ``` — nunca texto misturado com código
2. **Referencie propriedades diretamente**: `objeto.propriedade` — NUNCA como link Markdown
3. **Um arquivo por bloco** — não misture arquivos no mesmo bloco
4. **Declare todos os imports** no topo do arquivo
5. **Teste mental**: leia o código e confirme que não há links `[x](url)` dentro de expressões TypeScript

---

## 12. EXEMPLO DE PROMPT CORRETO PARA MOTORES

Ao receber uma tarefa de desenvolvimento, o motor deve:

1. Ler este arquivo (CODING_STANDARDS.md)
2. Ler `src/types.ts` para verificar tipos existentes
3. Verificar se o hook necessário já existe em `src/hooks/`
4. Seguir os padrões acima rigorosamente
5. Entregar código limpo sem markdown dentro de expressões TypeScript
