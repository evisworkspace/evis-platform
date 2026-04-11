# ❓ QUESTIONÁRIO DE APRESENTAÇÃO - EVIS AI
## Para Grupo de Auditoria (Supabase & SQL)

**Data:** 11 de abril de 2026  
**Público:** Especialistas em Supabase e SQL  
**Objetivo:** Auditoria e validação 100/100  
**Duração Estimada:** 1-2 horas

---

## 🎤 APRESENTAÇÃO INICIAL (10 min)

### Pergunta de Abertura
**"O EVIS AI é um sistema inteligente de acompanhamento de obras que conecta narrativas diárias de obra com processamento de IA para sincronização automática de cronogramas. Vamos explorar como funciona a integração Frontend-Supabase?"**

---

## 📊 SEÇÃO 1: ARQUITETURA GERAL (15 min)

### 1.1 Stack Tecnológico
**Pergunta:** Qual é a stack completa do sistema?

**Resposta Esperada:**
- Frontend: React 19 + TypeScript + Tailwind CSS
- State Management: React Context + React Query v5
- IA: Gemini (pré-processamento) + MiniMax/OpenRouter (processamento)
- Backend: Supabase (PostgreSQL + REST API)
- Cache: React Query com invalidation automática
- Persistência: localStorage + Supabase

**Pontos-chave a explorar:**
- Por que React Query? (para evitar boilerplate de cache)
- Por que localStorage? (sync offline-first)
- Estratégia de fallback entre APIs de IA?

---

### 1.2 Fluxo de Dados Principal
**Pergunta:** Como os dados fluem do usuário ao banco de dados?

**Resposta Esperada:**
```
Usuário (Diário)
  → Narrativa (textarea)
  → runIA() (chamar Gemini)
  → confirmIA() (validar + aplicar)
  → syncToSupabase() (PATCH/POST)
  → Cronograma (atualiza)
```

**Pontos-chave a explorar:**
- Há validação em cada camada?
- Como é tratado erro de IA?
- Rollback é possível?

---

## 🗄️ SEÇÃO 2: BANCO DE DADOS (20 min)

### 2.1 Estrutura de Tabelas
**Pergunta:** Quantas tabelas temos e qual é o relacionamento entre elas?

**Resposta Esperada:**
```
8 Tabelas:
1. obras (raiz)
2. servicos (FK → obras)
3. diario_obra (FK → obras)
4. equipes_cadastro (FK → obras)
5. equipes_presenca (FK → obras)
6. pendencias (FK → obras)
7. notas (FK → obras)
8. fotos (FK → obras)

Relacionamento (Star Schema):
        ┌─────┐
        │obras│
        └────┬┘
      ┌─────┴──────┬────────┬──────┬─────────┐
      │            │        │      │         │
  servicos    diario_obra equipes_ pendencias notas fotos
              cadastro
```

**Pontos-chave a explorar:**
- Todas as tabelas têm CASCADE delete?
- Há índices em todas as chaves estrangeiras?
- Falta alguma tabela para auditoria?

---

### 2.2 Campos Críticos
**Pergunta:** Quais são os campos mais críticos e por quê?

**Resposta Esperada:**

**Tabela `servicos` (CRÍTICA):**
- `data_inicio` (YYYY-MM-DD) - Raiz do Cronograma
- `data_fim` (YYYY-MM-DD) - Raiz do Cronograma
- `avanco_atual` (0-100) - KPI principal
- `status_atual` (enum) - Estado do serviço

**Problemas históricos:**
- ❌ Antes: IA retornava NULL em data_inicio/data_fim
- ✅ Solução: ensureDates() com fallback 30 dias
- ✅ Validação: CHECK constraint no banco

**Pontos-chave a explorar:**
- Como você trataria NULL em data_inicio?
- Qual seria seu critério de fallback?
- Como auditar mudanças históricas?

---

### 2.3 Constraints & Validação
**Pergunta:** Quais constraints você implementaria no banco?

**Resposta Esperada:**

```sql
-- Constraints já implementadas:
1. CHECK avanco_atual: 0-100
2. CHECK status_atual: IN ('nao_iniciado', 'em_andamento', 'concluido')
3. CHECK data_fim >= data_inicio
4. UNIQUE equipes_presenca(obra_id, equipe_cod, data_presenca)
5. FOREIGN KEY (obra_id) ON DELETE CASCADE

-- Constraints sugeridos para auditoria:
6. CHECK data_inicio <= data_fim (redundante com 3?)
7. Audit trigger: registrar mudanças
8. RLS policies: multi-tenancy
9. Soft delete em pendencias?
```

**Pontos-chave a explorar:**
- Implementar versionamento de servicos?
- Histórico de mudanças?
- Backup automático?

---

## 🔄 SEÇÃO 3: SINCRONIZAÇÃO 100% (20 min)

### 3.1 Problema Original
**Pergunta:** Qual era o problema que causava desincronização?

**Resposta Esperada:**

**Cenário do Bug:**
1. Usuário grava: "Pintura 50% pronto"
2. IA retorna: `{ id_servico: "SRV-001", avanco_novo: 50 }`
3. ❌ data_inicio: NULL, data_fim: NULL
4. Cronograma lê: NULL valores → "SEM ATIVIDADES"
5. ❌ DESINCRONIZADO

**Raiz do problema:**
- Prompt IA não era explícito sobre obrigatoreidade de datas
- Validação do frontend era fraca
- React Query cache não invalidava

---

### 3.2 Solução Implementada (3 Correções)

**Pergunta:** Como você implementaria uma solução robusta?

**Resposta Esperada:**

**CORREÇÃO 1: Prompt IA (Servidor)**
```
Novo prompt força IA a sempre retornar data_inicio + data_fim
com lógica temporal específica:
- nao_iniciado: data_fim = hoje + 30 dias
- em_andamento: data_inicio = hoje - 1, data_fim = hoje + 30
- concluido: data_fim = hoje
```

**CORREÇÃO 2: Validação Frontend**
```typescript
const ensureDates = (update, servico) => {
  const today = new Date().toISOString().split('T')[0];
  const in30Days = new Date(Date.now() + 30*86400000).split('T')[0];
  
  return {
    data_inicio: update.data_inicio || servico.data_inicio || today,
    data_fim: status==='concluido' ? today : (update.data_fim || in30Days)
  };
};
```

**CORREÇÃO 3: Cache Invalidation**
```typescript
queryClient.invalidateQueries({ queryKey: ['servicos', obraId] });
```

**Pontos-chave a explorar:**
- Implementar isso no banco com TRIGGER?
- PostgreSQL pode fazer validação de IA?
- Versionar as correções no CHANGELOG?

---

### 3.3 Validação da Sincronização
**Pergunta:** Como você testaria que está 100% sincronizado?

**Resposta Esperada:**

**Cenários de Teste:**
1. ✅ Novo serviço sem data → Fallback 30 dias
2. ✅ Serviço "concluido" → data_fim = hoje
3. ✅ Editar no Cronograma → Diário refetch
4. ✅ IA com datas explícitas → Usar valores IA
5. ✅ Offline → Sync quando online

**Teste Manual:**
```
1. Diário → Gravar "Pintura 50%"
2. ★ Processar com IA
3. ✓ Confirmar
4. SEM RECARREGAR → Ir para Cronograma
5. ✅ Deve mostrar barra com 50% nos próximos dias
```

**Pontos-chave a explorar:**
- E2E tests (Cypress/Playwright)?
- Performance: quanto tempo leva sync?
- Conflitos de merge offline?

---

## 🔐 SEÇÃO 4: SEGURANÇA & PERFORMANCE (15 min)

### 4.1 Row Level Security (RLS)
**Pergunta:** Como você implementaria multi-tenancy segura?

**Resposta Esperada:**

**Status Atual:** RLS não está ativado (prototipo)

**Recomendação:**
```sql
-- Tabela de relacionamento usuario-obra
CREATE TABLE usuario_obra (
  user_id UUID,
  obra_id UUID,
  role VARCHAR(20),  -- 'admin', 'supervisor', 'viewer'
  PRIMARY KEY (user_id, obra_id)
);

-- RLS policies
CREATE POLICY "Users see assigned obras"
ON servicos
FOR ALL
USING (
  obra_id IN (
    SELECT obra_id FROM usuario_obra 
    WHERE user_id = auth.uid()
  )
);
```

**Pontos-chave a explorar:**
- Que roles precisa? (admin, supervisor, operario)
- Auditoria de quem mudou o quê?
- Rate limiting por usuário?

---

### 4.2 Performance & Índices
**Pergunta:** Quais índices são críticos?

**Resposta Esperada:**

**Índices Implementados:**
```sql
-- Críticos (queries frequentes)
idx_servicos_obra_id            -- Filtro principal
idx_servicos_data_inicio        -- Cronograma
idx_servicos_data_fim           -- Cronograma
idx_servicos_status             -- Filtro de status

-- Secundários
idx_diario_created_at           -- Ordenação
idx_presenca_obra_data          -- Range query
```

**Pontos-chave a explorar:**
- Composite index em (obra_id, data_inicio, data_fim)?
- Estatísticas de tabela atualizadas?
- Query explain plan?
- Cache de queries em Redis?

---

### 4.3 Backup & Recovery
**Pergunta:** Qual é a estratégia de backup?

**Resposta Esperada:**

**Status Atual:** Supabase backup automático (14 dias)

**Recomendação:**
- Backup diário no S3
- Point-in-time recovery
- Teste de restore mensal
- Documentar RTO/RPO

**Pontos-chave a explorar:**
- PITR (Point-In-Time Recovery)?
- Replicação para múltiplas regiões?
- Compliance LGPD/GDPR?

---

## 🎯 SEÇÃO 5: VALIDAÇÕES & CÁLCULOS (15 min)

### 5.1 Validação de Avanço Percentual
**Pergunta:** Como você garante que avanco_atual ≤ 100?

**Resposta Esperada:**

**Validação em 3 camadas:**

1. **Frontend:**
```typescript
if (avanco_novo > 100 || avanco_novo < 0) {
  throw new Error('Avanço deve estar entre 0 e 100');
}
```

2. **API (sbFetch):**
```typescript
// Validação antes de enviar
if (body.avanco_atual > 100) {
  throw new Error('Avanço inválido');
}
```

3. **Banco de Dados:**
```sql
ALTER TABLE servicos ADD CONSTRAINT check_avanco 
  CHECK (avanco_atual >= 0 AND avanco_atual <= 100);
```

**Pontos-chave a explorar:**
- Check constraint é suficiente?
- E se API retornar valor inválido?
- Alertar ou silenciar?

---

### 5.2 Cálculos de KPI
**Pergunta:** Como você calcula % de conclusão?

**Resposta Esperada:**

```typescript
// Frontend (Diario.tsx)
const pctConcluido = Math.round(
  (servicos.filter(s => s.status === 'concluido').length / total) * 100
);

// Opção: Calcular no Banco
SELECT 
  COUNT(CASE WHEN status_atual = 'concluido' THEN 1 END) * 100 / 
  COUNT(*) as pct_concluido
FROM servicos
WHERE obra_id = $1;
```

**Pontos-chave a explorar:**
- Calcular no frontend ou no banco?
- Usar aggregate functions (COUNT, AVG)?
- Caching de resultados?
- Atualizar em tempo real ou batch?

---

### 5.3 Cronograma (Gantt)
**Pergunta:** Como você renderizaria cronograma com 1000+ serviços?

**Resposta Esperada:**

**Algoritmo Atual:**
```typescript
const dailyTasks = dates.map(date => 
  servicos.filter(s => 
    date >= s.data_inicio && date <= s.data_fim
  )
);
// O(n*m) = lento para grandes volumes
```

**Otimização Recomendada:**
```sql
-- View para pré-calcular
CREATE VIEW servicos_gantt AS
SELECT 
  s.id,
  s.nome,
  s.data_inicio,
  s.data_fim,
  generate_series(s.data_inicio, s.data_fim, '1 day'::interval)::date as dia
FROM servicos s
WHERE s.obra_id = $1;

-- Query
SELECT * FROM servicos_gantt WHERE dia = '2026-04-11';
-- O(1) lookup
```

**Pontos-chave a explorar:**
- Materialized view vs view?
- Refresh automático?
- Índice em (obra_id, dia)?

---

## 🚀 SEÇÃO 6: ROADMAP P3 (10 min)

### 6.1 Próximas Tarefas
**Pergunta:** O que falta para chegar a 100/100?

**Resposta Esperada:**

| Tarefa | Impacto | Complexidade | Tempo |
|--------|---------|--------------|-------|
| P3.1: README Docs | Usabilidade | Baixa | 1-1.5h |
| P3.2: Vitest Tests | Qualidade | Média | 3-3.5h |
| P3.3: Supabase Auth | Segurança | Alta | 3.5-4h |
| P3.4: WCAG A11y | Acessibilidade | Média | 45-60m |

**Score Estimado:**
- 91-92/100 (atual)
- +1 → 92-93 (P3.1)
- +2 → 94-95 (P3.2)
- +1 → 95-96 (P3.3)
- +1 → 96-97 (P3.4)
- **Meta: 95-97/100**

---

### 6.2 Sugestões do Grupo?
**Pergunta:** O que vocês sugeriram?

**Resposta Esperada (espaço para discussão):**
- Refactoring de tabelas?
- Denormalização para performance?
- Event sourcing?
- GraphQL em vez de REST?
- Exemplo: "Implementar audit_log table"

---

## 📝 SEÇÃO 7: PERGUNTAS FINAIS (10 min)

### 7.1 Para o Grupo
**"Existem gaps críticos que precisamos preencher para atingir 100/100?"**

**Possiblidades:**
1. ❌ Falta audit trail
2. ❌ Falta soft deletes
3. ❌ Falta versionamento
4. ❌ Falta compliance (LGPD/GDPR)
5. ✅ Tudo ok, só implementar P3

---

### 7.2 Próximos Passos
**"Qual seria o plano de execução recomendado?"**

**Esperado:**
1. Semana 1-2: Implementar recomendações grupo
2. Semana 3: Completar P3 (Tests + Auth + A11y)
3. Semana 4: UAT (User Acceptance Testing)
4. Semana 5: Deploy produção

---

## 📊 DOCUMENTO DE REFERÊNCIA

Todos os detalhes técnicos estão em: **`DESCRITIVO_TECNICO_AUDITORIA.md`**

### Seções:
1. ✅ Stack tecnológico
2. ✅ Estrutura de dados (SQL DDL)
3. ✅ Fluxo operacional (Diário → Sincronização)
4. ✅ Conexão HTML → Supabase (3 camadas)
5. ✅ Validações e cálculos
6. ✅ Segurança (RLS)
7. ✅ React Query (cache)
8. ✅ Tipos TypeScript
9. ✅ Pontos críticos para auditoria
10. ✅ Checklist de auditoria

---

## ✅ CHECKLIST: Preparação para Reunião

- [ ] Ler DESCRITIVO_TECNICO_AUDITORIA.md
- [ ] Preparar ambiente para demonstração
- [ ] Ter acesso ao código-fonte (GitHub/GitLab)
- [ ] Ter acesso ao Supabase dashboard
- [ ] Preparar exemplos de queries
- [ ] Documentar problemas históricos (bugs)
- [ ] Ter contato do Supabase support pronto
- [ ] Confirmar agenda com grupo

---

**Data da Auditoria:** [A confirmar]  
**Duração:** 1-2 horas  
**Grupo:** Especialistas Supabase & SQL  
**Objetivo:** Validação 100/100 e plano de execução

