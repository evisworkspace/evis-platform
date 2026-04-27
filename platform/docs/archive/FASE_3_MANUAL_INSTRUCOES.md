# 🔐 FASE 3: DEPLOY P3.3 SQL - AÇÃO MANUAL NECESSÁRIA

**Status:** Pronto para Deploy  
**Tempo:** ~15-20 min (sua ação manual)  
**Responsabilidade:** VOCÊ (no Supabase dashboard)

---

## ⚠️ IMPORTANTE: Você precisa fazer isso no Supabase

Esta fase requer ação MANUAL sua no dashboard Supabase porque:
- ✅ Eu não tenho acesso direto ao Supabase
- ✅ SQL precisa rodar no Supabase (não localmente)
- ✅ Você é o único com credenciais

---

## 📋 PASSO 1: Preparar SQL Script

O arquivo `P3.3_SUPABASE_SCHEMA_CORRECTIONS.sql` está pronto na raiz.

**Ele contém 8 seções:**
1. ✅ Enable RLS (8 tabelas)
2. ✅ Check Constraints (9 constraints)
3. ✅ Foreign Keys (7 FKs)
4. ✅ Composite Indexes (6 indexes)
5. ✅ RLS Policies (32 policies)
6. ✅ UNIQUE Constraints (3)
7. ✅ Materialized View (1)
8. ✅ Verification Queries (3)

---

## 🚀 PASSO 2: Executar SQL no Supabase

### Instruções Passo a Passo

**1. Abra o Dashboard Supabase**
```
URL: https://supabase.com/dashboard
Login com sua conta
```

**2. Selecione seu projeto**
```
Procure: jwutiebpfauwzzltwgbb (ou seu projeto EVIS AI)
Clique nele
```

**3. Vá para SQL Editor**
```
No menu lateral: SQL Editor (ou SQL)
Clique em "New Query"
```

**4. Copie o SQL**
```
Abra: P3.3_SUPABASE_SCHEMA_CORRECTIONS.sql (na raiz do projeto)
Ctrl+A → Ctrl+C (select all + copy)
```

**5. Cole no Supabase**
```
Clique na query field do Supabase
Ctrl+V (paste)
Todo conteúdo vai aparecer
```

**6. Execute**
```
Clique no botão azul "Run" ou pressione Cmd/Ctrl+Enter
Aguarde 30-60 segundos
```

**7. Verifique se rodou sem erros**
```
Se vir "Success" ou "completed" → ✅ OK
Se vir erro vermelho → ❌ Anote o erro
```

---

## ✅ PASSO 3: Validar Implementação (Verification Queries)

Se SQL rodou ok, agora execute as 3 verification queries:

### Query 1: Verificar RLS Ativado
```sql
-- Deve mostrar 8 tabelas com rowsecurity = true
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('obras', 'servicos', 'diario_obra', 'pendencias', 
                    'equipes_cadastro', 'equipes_presenca', 'notas', 'fotos')
ORDER BY tablename;
```

**Resultado esperado:**
```
tablename           │ rowsecurity
────────────────────┼─────────────
obras               │ t
diario_obra         │ t
equipes_cadastro    │ t
equipes_presenca    │ t
fotos               │ t
notas               │ t
pendencias          │ t
servicos            │ t
(8 rows)
```

✅ **Se ver 8 com "t" (true):** Query 1 passou!

---

### Query 2: Verificar Constraints
```sql
-- Deve mostrar 9+ check constraints
SELECT 
  constraint_name, 
  table_name, 
  constraint_type 
FROM information_schema.table_constraints
WHERE table_schema = 'public'
  AND constraint_type IN ('CHECK', 'UNIQUE', 'PRIMARY KEY', 'FOREIGN KEY')
ORDER BY table_name, constraint_type;
```

**Resultado esperado:**
```
Deve mostrar linhas com:
- check_avanco (CHECK)
- check_status_enum (CHECK)
- check_datas_validas (CHECK)
- ... outras constraints
(9+ linhas totais)
```

✅ **Se ver 9+ constraints:** Query 2 passou!

---

### Query 3: Verificar Indexes
```sql
-- Deve mostrar 6+ composite indexes
SELECT 
  tablename, 
  indexname, 
  indexdef 
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('obras', 'servicos', 'diario_obra', 'pendencias', 
                    'equipes_cadastro', 'equipes_presenca', 'notas', 'fotos')
ORDER BY tablename, indexname;
```

**Resultado esperado:**
```
Deve mostrar indexes como:
- idx_servicos_obra_datas
- idx_servicos_status
- idx_diario_obra_created
- ... outros indexes
(6+ indexes no total)
```

✅ **Se ver 6+ indexes:** Query 3 passou!

---

## 🎯 RESUMO: O QUE VOCÊ VAI FAZER

1. ✅ Abrir https://supabase.com/dashboard
2. ✅ Ir para SQL Editor
3. ✅ Copiar P3.3_SUPABASE_SCHEMA_CORRECTIONS.sql
4. ✅ Colar no Supabase
5. ✅ Clicar "Run"
6. ✅ Aguardar sucesso (sem erros)
7. ✅ Rodar Query 1: Verificar RLS
8. ✅ Rodar Query 2: Verificar Constraints
9. ✅ Rodar Query 3: Verificar Indexes
10. ✅ Reportar "Tudo passou ✅"

---

## ⚠️ POSSÍVEIS ERROS

### Erro: "constraint_name already exists"
```
Causa: Constraint já foi criado em uma execução anterior
Solução: Tudo bem - script usa DROP IF EXISTS
Ação: Continue com as queries de verificação
```

### Erro: "permission denied"
```
Causa: Usuário Supabase sem permissão
Solução: Use a conta que criou o projeto
Ação: Logout e faça login com conta correta
```

### Erro: "table not found"
```
Causa: Tabelas não existem no banco
Solução: Algo errado com Supabase setup
Ação: Contacte suporte Supabase
```

---

## 📝 TEMPLATE: O QUE VOCÊ VAI RELATAR

Após completar FASE 3 manual, você dirá:

```
FASE 3 MANUAL COMPLETA ✅

✅ SQL rodou sem erros no Supabase
✅ Query 1: 8 tabelas com RLS=true
✅ Query 2: 9+ constraints verificadas
✅ Query 3: 6+ indexes verificados

Status: Pronto para FASE 3 Frontend (Claude Sonnet continua)
```

---

## 🔙 SE ALGO DER ERRADO

Se o SQL falhar ou queries não passarem:

```
Você reporta: "Erro em FASE 3: [descrição do erro]"

Eu:
1. Analiso o erro
2. Verifica se é esperado ou não
3. Corrige SQL se necessário
4. Re-dispara a execução
```

---

## ⏱️ TEMPO ESTIMADO

- Abrir Supabase: 1 min
- Copiar SQL: 30 seg
- Colar + executar: 1 min
- Aguardar: 30 seg a 1 min
- Rodar 3 queries: 2 min
- **Total: ~5-7 minutos**

---

## 🎬 PRÓXIMA AÇÃO

**Você faz:**

1. Vá a Supabase
2. Execute P3.3_SUPABASE_SCHEMA_CORRECTIONS.sql
3. Rode as 3 verification queries
4. Reporta resultado

**Mensagem esperada:**
```
"✅ FASE 3 MANUAL COMPLETA - SQL rodou sem erros, 
3 queries passaram, RLS + constraints + indexes verificados"
```

Quando você reportar sucesso, eu disparo **FASE 3 Frontend** (update em src/lib/api.ts).

---

**Estou aguardando você fazer isso no Supabase. Pode ir agora!**
