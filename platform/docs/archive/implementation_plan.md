# 📋 IMPLEMENTATION PLAN - Sincronização 100% Cronograma + IA

**Data:** 11 de Abril de 2026  
**Status:** ⏳ Em revisão com Gemini 3 Flash  
**Objetivo:** Sincronizar Diário, IA e Cronograma em tempo real

---

## 🎯 Visão Geral da Estratégia

### Problema-Raiz
- IA gera atualizações de serviços SEM `data_inicio` e `data_fim`
- Cronograma lê vazios → não desenha barras
- React Query cache não invalida → dados desincronizados

### Solução 3 Camadas
```
1. PROMPT IA (Força geração)  →  IA SEMPRE retorna datas
2. VALIDAÇÃO (Fallback)       →  confirmIA() preenche NULLs
3. CACHE (Sincronização)      →  React Query refetch automático
```

---

## 🔧 Implementação Detalhada

### **FASE 1: Melhorar Prompt IA**

**Arquivo:** `src/components/Diario.tsx`  
**Linhas:** 112-151

**Mudança Atual:**
```typescript
// Linha ~128-133 (ANTES)
3. Se um serviço mencionado não tiver data_inicio, defina uma data razoável com base no contexto (formato YYYY-MM-DD).
4. Os status válidos são: nao_iniciado, em_andamento, concluido.
```

**Mudança Proposta:**
```typescript
// NOVO - mais assertivo
3. OBRIGATÓRIO: Retorne data_inicio e data_fim (string YYYY-MM-DD) para CADA serviço em servicos_atualizar.
   - Se explícito no relato: use datas mencionadas
   - Se implícito: data_inicio = data do relato (${currentDay}), data_fim = data do relato + 30 dias
   - Se status="concluido": data_fim deve ser ≤ data do relato
4. Validação de status: apenas nao_iniciado, em_andamento, concluido (sem variações)
```

**Impacto:** 
- ✅ IA SEMPRE retorna datas (0% chance de NULL)
- ✅ Datas lógicas baseadas em status
- ✅ Cronograma tem dados garantidos

---

### **FASE 2: Validação em confirmIA()**

**Arquivo:** `src/components/Diario.tsx`  
**Linhas:** 172-252 (função `confirmIA`)

**Adicionar Helper Function (antes de confirmIA):**
```typescript
// Nova função (insira antes de confirmIA())
const ensureDateRange = (
  update: IAResult['servicos_atualizar'][0],
  servico: Servico
): {
  data_inicio: string;
  data_fim: string;
  avanco_novo: number;
  status_novo: string;
} => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const in30Days = new Date(today.getTime() + 30 * 86400000)
    .toISOString()
    .split('T')[0];

  const dataInicio = update.data_inicio || servico.data_inicio || todayStr;
  const dataFim = update.data_fim || servico.data_fim || in30Days;

  // Validação lógica: data_fim não pode ser antes de data_inicio
  const validFim = dataFim >= dataInicio ? dataFim : dataInicio;

  return {
    avanco_novo: update.avanco_novo,
    status_novo: update.status_novo,
    data_inicio: dataInicio,
    data_fim: validFim,
  };
};
```

**Modificar Lógica de Atualização (linhas ~176-189):**
```typescript
// ANTES
(ia.servicos_atualizar || []).forEach(u => {
  const idx = newServicos.findIndex(x => x.id_servico === u.id_servico);
  if (idx >= 0) {
    newServicos[idx] = { 
      ...newServicos[idx], 
      avanco_atual: u.avanco_novo, 
      status_atual: u.status_novo,
      ...(u.data_inicio ? { data_inicio: u.data_inicio } : {}),
      ...(u.data_fim ? { data_fim: u.data_fim } : {}),
    };
    markPending('servicos', newServicos[idx]);
  }
});

// DEPOIS
(ia.servicos_atualizar || []).forEach(u => {
  const idx = newServicos.findIndex(x => x.id_servico === u.id_servico);
  if (idx >= 0) {
    const validated = ensureDateRange(u, newServicos[idx]);
    newServicos[idx] = { 
      ...newServicos[idx], 
      avanco_atual: validated.avanco_novo,
      status_atual: validated.status_novo,
      data_inicio: validated.data_inicio,  // ← OBRIGATÓRIO
      data_fim: validated.data_fim,        // ← OBRIGATÓRIO
    };
    markPending('servicos', newServicos[idx]);
  }
});
```

**Impacto:**
- ✅ 100% dos serviços têm datas válidas
- ✅ data_fim sempre >= data_inicio
- ✅ Fallback automático se IA falhar
- ✅ Cronograma SEMPRE tem dados para desenhar

---

### **FASE 3: Invalidar React Query Cache**

**Arquivo:** `src/components/Diario.tsx`

**Step 1: Adicionar Import (topo do arquivo, ~linha 2)**
```typescript
// ADICIONAR após imports existentes
import { useQueryClient } from '@tanstack/react-query';
```

**Step 2: Usar Hook em Diario (função):**
```typescript
// Dentro da função Diario(), após outros hooks (~linha 11-20)
export default function Diario() {
  const { state, setState, config, markPending, toast } = useAppContext();
  const queryClient = useQueryClient();  // ← ADICIONAR AQUI
  const [isRecording, setIsRecording] = useState(false);
  // ... resto do código
}
```

**Step 3: Invalidar em confirmIA() (fim da função, ~linha 249)**
```typescript
// No final de confirmIA(), APÓS setState e toast:
const confirmIA = () => {
  // ... código existente ...
  
  setState(prev => {
    const nd = { ...prev.diario };
    nd[currentDay].confirmado = true;
    const nn = { ...prev.narrativas, [currentDay]: ia.narrativa || '' };
    return { 
      ...prev, 
      servicos: newServicos, 
      pendencias: newPendencias, 
      notas: newNotas, 
      diario: nd, 
      narrativas: nn,
      presenca: { ...prev.presenca, [currentDay]: currentPresenca }
    };
  });
  
  // ADICIONAR ISSO AQUI:
  queryClient.invalidateQueries({ 
    queryKey: ['servicos', config.obraId] 
  });
  
  toast('Aplicado e presença atualizada automativamente! Clique em Sync para enviar.', 'success');
};
```

**Impacto:**
- ✅ React Query refetch automático (0ms)
- ✅ Cronograma vê dados NOVOS imediatamente
- ✅ Sincronização em tempo real
- ✅ Todas abas atualizam juntas

---

## ✅ Ordem de Implementação

```
1️⃣  FASE 1: Prompt IA
   └─ Editar linhas 128-133 em Diario.tsx
   └─ Tempo: 5 min
   └─ Validar: IA gera datas

2️⃣  FASE 2: Validação
   └─ Adicionar ensureDateRange() function
   └─ Modificar loop forEach
   └─ Tempo: 15 min
   └─ Validar: npm run lint (sem erros)

3️⃣  FASE 3: Cache Invalidation
   └─ Adicionar import useQueryClient
   └─ Usar hook em Diario()
   └─ Invalidate em confirmIA()
   └─ Tempo: 10 min
   └─ Validar: npm run build (sucesso)
```

**Tempo Total: 30 minutos**

---

## 🧪 Plano de Teste

### Teste 1: Build Validation
```bash
npm run lint      # ✅ Sem erros TypeScript
npm run build     # ✅ Build sucesso
```

### Teste 2: Fluxo Manual
1. Abrir app em `npm run dev`
2. Ir para **Diário**
3. Gravar áudio/texto: _"Começamos a pintura da sala 1. Pintura está 50% pronta. Equipe Valdeci presente."_
4. Clicar **"Rodar IA"**
5. Verificar que `ia.servicos_atualizar` tem `data_inicio` e `data_fim`
6. Clicar **"Aplicar IA"**
7. Notar que toast mostra "Aplicado"
8. Ir para **Cronograma**
9. **✅ Esperar:** Barras de Gantt aparecerem com "50%" para Pintura
10. Ir para **outra aba** (Fotos, Notas, etc.)
11. **✅ Esperar:** Dados sincronizados (não desaparecer)
12. Voltar para **Cronograma**
13. **✅ Esperar:** Dados ainda sincronizados (React Query cache)

### Teste 3: Verificar Logs
```javascript
// No console do navegador (F12), buscar:
// "Query successful: servicos/..."  ← Logger mostra refetch
// "React Query invalida servicos"   ← Confirmação de cache clear
```

---

## 📊 Checklist de Implementação

- [ ] FASE 1 completa (Prompt IA)
  - [ ] Linhas 128-133 editadas
  - [ ] Nova instrução OBRIGATÓRIA adicionada
  
- [ ] FASE 2 completa (Validação)
  - [ ] Função `ensureDateRange()` criada
  - [ ] Loop forEach atualizado
  - [ ] TypeScript sem erros
  
- [ ] FASE 3 completa (Cache)
  - [ ] Import `useQueryClient` adicionado
  - [ ] Hook usado em Diario()
  - [ ] `invalidateQueries()` em confirmIA()
  
- [ ] Testes passaram
  - [ ] `npm run lint` ✅
  - [ ] `npm run build` ✅
  - [ ] Teste manual ✅
  
- [ ] Documentação
  - [ ] Comentários adicionados ao código
  - [ ] Documento de validação criado

---

## 🚀 Resultado Esperado

```
ANTES (❌ Problema)
┌────────────────────────────┐
│ Diário → IA → confirmIA()  │
│   ↓                        │
│ Cronograma: "SEM ATIVIDADES"
└────────────────────────────┘

DEPOIS (✅ Solução)
┌────────────────────────────────────────┐
│ Diário → IA (COM DATAS)                │
│   ↓                                    │
│ confirmIA() valida + React Query       │
│   ↓                                    │
│ Cronograma: Barras de Gantt aparecem   │
│   ↓                                    │
│ Todas abas sincronizadas 100%          │
└────────────────────────────────────────┘
```

---

## 📝 Notas Importantes

1. **Não mude `types.ts`** - tipos já estão certos
2. **Não delete código antigo** - apenas estenda com validação
3. **Teste sempre com `npm run build`** antes de confirmar
4. **Logger.ts já está integrado** - erro será loggado automaticamente
5. **React Query v5** já está instalado - use conforme esperado

---

## 📞 Próximos Passos

✅ Você tem 3 opções:

1. **Implementar agora** - Usar este plano + Gemini plan
2. **Aguardar Gemini** - Comparar os 2 planos e mesclar
3. **Perguntar dúvidas** - Esclarecer qualquer seção

**Qual você prefere?**

---

**Criado:** 11/04/2026 12:15  
**Versão:** 1.0 (Pré-Gemini)  
**Status:** ⏳ Aguardando validação Gemini 3 Flash

