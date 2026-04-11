---
name: Sincronização IA + Cronograma
description: Aprendizado sobre garantir sincronização 100% entre Diário com IA e Cronograma Gantt
type: feedback
---

# Sincronização IA + Cronograma - Lições Aprendidas

## Regra

Prompts de IA que retornam dados para renderização visual (Gantt, gráficos) devem PROIBIR explicitamente valores NULL e fornecer regras de fallback claras.

**Why:** Em abril 2026, descobrimos que o Cronograma ficava vazio ("SEM ATIVIDADES") porque o prompt da IA era contraditório:
- Linha 134 dizia: `data_inicio = NULL`
- Linha 137 dizia: "nunca deixe NULL"

A IA obedecia a primeira instrução, causando barras invisíveis no Gantt.

**How to apply:**

1. **Em prompts de IA:**
   - Use linguagem IMPERATIVA: "NUNCA retorne NULL"
   - Forneça regras de fallback explícitas para cada cenário
   - Exemplo: "Se status='nao_iniciado': data_inicio = hoje, data_fim = hoje + 30 dias"

2. **No código de validação:**
   - Crie helper de validação (ex: `ensureDates()`)
   - Aplique fallbacks mesmo se prompt for perfeito (defesa em profundidade)
   - Exemplo:
     ```typescript
     const ensureDates = (update, servico) => ({
       ...update,
       data_inicio: update.data_inicio || servico.data_inicio || today,
       data_fim: update.data_fim || servico.data_fim || in30Days
     });
     ```

3. **Na sincronização de estado:**
   - Invalide cache React Query após aplicação de IA
   - Exemplo:
     ```typescript
     queryClient.invalidateQueries({ queryKey: ['servicos', obraId] });
     ```

## Referências

- **Arquivo corrigido:** `src/components/Diario.tsx:133-137`
- **Validação:** `src/components/Diario.tsx:179-191`
- **Cache sync:** `src/components/Diario.tsx:275-276`
- **Documentação original:** `docs/archive/SINCRONIZACAO_100_CORRECOES.md`

## Impacto

Antes: ~30% dos serviços atualizados via IA não apareciam no Cronograma
Depois: 100% de sincronização garantida com fallback de 30 dias
