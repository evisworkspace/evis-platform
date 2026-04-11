# 🔄 SINCRONIZAÇÃO 100% - CRONOGRAMA + IA + JSON

## Problema Identificado

O Cronograma não está sincronizando 100% porque:

1. **IA gera resultados em `state.diario[currentDay].iaResult`** mas não atualiza `data_inicio` e `data_fim` automaticamente em todos os casos
2. **Cronograma lê `data_inicio` e `data_fim`** para desenhar as barras de Gantt
3. **Falha de sincronização:** Quando a IA define apenas `avanco_novo` e `status_novo`, mas NÃO define `data_inicio` ou `data_fim`, o Cronograma mostra "SEM ATIVIDADES"

---

## Solução: 3 Correções Necessárias

### **CORREÇÃO 1: Melhorar Prompt da IA** ✅
**Arquivo:** `src/components/Diario.tsx` (linhas 112-151)

**Problema:** O prompt não força a IA a SEMPRE retornar `data_inicio` e `data_fim`

**Solução:**
```typescript
// ATUAL (linhas 128-133):
// 3. Se um serviço mencionado não tiver data_inicio, defina uma data razoável...
// 4. Os status válidos são: nao_iniciado, em_andamento, concluido.

// DEVERIA SER:
// 3. IMPORTANTE: SEMPRE retorne data_inicio e data_fim para cada serviço atualizado.
//    Se a data não for explícita, use lógica temporal:
//    - data_inicio: data do dia anterior se status="em_andamento" ou "concluido"
//    - data_fim: data de hoje se status for "concluido", senão 30 dias a partir de hoje
// 4. Os status válidos são: nao_iniciado, em_andamento, concluido.
```

**Impacto:** IA sempre retorna datas → Cronograma sempre mostra barras

---

### **CORREÇÃO 2: Validação em `confirmIA()`** ✅
**Arquivo:** `src/components/Diario.tsx` (linhas 172-252)

**Problema:** Quando `confirmIA()` aplica atualizações, não garante que `data_inicio` e `data_fim` sejam preenchidas

**Solução Adicionar:**
```typescript
// Em confirmIA(), antes de markPending('servicos', ...):

const fillMissingDates = (servico: Servico, update: any) => {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  
  return {
    ...update,
    data_inicio: update.data_inicio || servico.data_inicio || today,
    data_fim: update.data_fim || servico.data_fim || tomorrow
  };
};

// Depois aplicar:
newServicos[idx] = { 
  ...newServicos[idx], 
  ...fillMissingDates(newServicos[idx], {
    avanco_atual: u.avanco_novo, 
    status_atual: u.status_novo,
    ...(u.data_inicio ? { data_inicio: u.data_inicio } : {}),
    ...(u.data_fim ? { data_fim: u.data_fim } : {}),
  })
};
```

**Impacto:** Garante que TODOS os serviços atualizados têm datas

---

### **CORREÇÃO 3: Sincronização em Tempo Real** ✅
**Arquivo:** `src/App.tsx` (linhas 68-98)

**Problema:** React Query cache NÃO invalidava automaticamente quando IA atualizava serviços

**Solução:** Adicionar em `confirmIA()` (Diario.tsx):
```typescript
// Após setState final, adicionar:
import { useQueryClient } from '@tanstack/react-query';

// Em confirmIA():
const queryClient = useQueryClient(); // ← ADICIONAR HOOK
queryClient.invalidateQueries({ 
  queryKey: ['servicos', config.obraId] 
});

toast('Aplicado! Cronograma sincronizado automaticamente.', 'success');
```

**Impacto:** Cronograma refaz query React Query → vê dados atualizados IMEDIATAMENTE

---

## 📋 Ordem de Execução para 100% Sincronização

### Passo 1: Corrigir Prompt IA (Diario.tsx)
```diff
- 3. Se um serviço mencionado não tiver data_inicio, defina uma data razoável com base no contexto (formato YYYY-MM-DD).
+ 3. IMPORTANTE: SEMPRE retorne data_inicio (string YYYY-MM-DD) e data_fim para cada serviço.
+    - Se não explícito no relato, use: data_inicio = hoje, data_fim = hoje + 30 dias
+    - Sincronize com status: concluido → data_fim deve ser ≤ hoje
```

### Passo 2: Adicionar Validação de Datas (Diario.tsx)
```typescript
// Adicionar função helper:
const ensureDates = (update: IAResult['servicos_atualizar'][0], servico: Servico): any => {
  const today = new Date().toISOString().split('T')[0];
  const in30Days = new Date(Date.now() + 30*86400000).toISOString().split('T')[0];
  
  return {
    ...update,
    data_inicio: update.data_inicio || servico.data_inicio || today,
    data_fim: update.data_fim || servico.data_fim || in30Days
  };
};

// Em confirmIA(), linha 177-189:
(ia.servicos_atualizar || []).forEach(u => {
  const idx = newServicos.findIndex(x => x.id_servico === u.id_servico);
  if (idx >= 0) {
    const validated = ensureDates(u, newServicos[idx]);
    newServicos[idx] = { 
      ...newServicos[idx],
      avanco_atual: validated.avanco_novo,
      status_atual: validated.status_novo,
      data_inicio: validated.data_inicio,
      data_fim: validated.data_fim
    };
    markPending('servicos', newServicos[idx]);
  }
});
```

### Passo 3: Invalidar React Query Cache (Diario.tsx)
```typescript
// No topo de Diario.tsx, adicionar:
import { useQueryClient } from '@tanstack/react-query';

// Na função confirmIA():
const queryClient = useQueryClient();
// ... após setState final:
queryClient.invalidateQueries({ 
  queryKey: ['servicos', config.obraId] 
});
```

---

## ✅ Resultado Final

**Depois das 3 correções:**

```
┌─────────────────────────────────────────────┐
│ FLUXO 100% SINCRONIZADO                     │
├─────────────────────────────────────────────┤
│ 1. Usuário grava diário                     │
│ 2. IA analisa e SEMPRE retorna datas       │
│ 3. confirmIA() valida datas faltando       │
│ 4. React Query invalida cache              │
│ 5. Cronograma refetch & mostra barras      │
│ 6. TODAS as abas sincronizam               │
└─────────────────────────────────────────────┘
```

---

## 🎯 Teste Após Correções

```bash
# 1. Abrir Cronograma (verá vazio inicialmente)
npm run dev

# 2. Ir para Diário → Gravar texto:
"Começamos a pintura da sala 1 hoje. Equipe Valdeci presente. Serviço Pintura está 50% pronto."

# 3. Clicar em "Rodar IA"

# 4. Clicar em "Aplicar IA"

# 5. Voltar para Cronograma
# ✅ DEVE APARECER: Barra com "50%" nos próximos dias

# 6. Mudar para outra aba e voltar
# ✅ DEVE ESTAR SINCRONIZADO (React Query cache)

# 7. Atualizar avanço no Cronograma para 75%
# ✅ DEVE APARECER "PENDENTE" na badge azul no topo
```

---

## 📊 Comparação Antes vs Depois

### ANTES (Problema)
```
Diário → IA → servicos_atualizar = [{ id_servico: "SRV-001", avanco_novo: 50 }]
  ↓
App.tsx marca como pendente
  ↓
Cronograma lê: data_inicio = NULL, data_fim = NULL
  ↓
❌ Resultado: "SEM ATIVIDADES"
```

### DEPOIS (Solução)
```
Diário → IA → servicos_atualizar = [{ 
  id_servico: "SRV-001", 
  avanco_novo: 50,
  data_inicio: "2026-04-11",      ← GARANTIDO
  data_fim: "2026-05-11"          ← GARANTIDO
}]
  ↓
confirmIA() valida & React Query invalida
  ↓
Cronograma refetch & desenha barra
  ↓
✅ Resultado: Barra mostrando "50%" com datas corretas
```

---

## 🔧 Arquivos a Modificar

| Arquivo | Linhas | Mudanças |
|---------|--------|----------|
| `src/components/Diario.tsx` | 112-151 | Melhorar prompt IA |
| `src/components/Diario.tsx` | 170-190 | Adicionar validação de datas |
| `src/components/Diario.tsx` | 172-252 | Adicionar React Query invalidation |
| `src/types.ts` | 58-64 | Deixar `data_inicio` e `data_fim` OBRIGATÓRIAS (opcional) |

---

## 💡 Por que isso resolve 100%?

1. **IA sempre retorna datas** → Cronograma sempre tem dados para desenhar
2. **Validação garante fallback** → Mesmo se IA esqueça, preenchemos com lógica
3. **React Query invalida cache** → Cronograma vê dados NOVOS imediatamente
4. **Sincronização em tempo real** → Todas as abas refrescam juntas

---

## Próximos Passos

Você quer que eu:
1. **Implemente essas 3 correções?** (Vai levar ~1h)
2. **Ou prefere fazer manualmente** e depois testo?
3. **Ou quer entender melhor** alguma correção específica?

Me avise! 🚀

