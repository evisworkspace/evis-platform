# 🆘 EVIS AI — Guia de Recuperação Rápida

> **Use este guia quando o sistema parar de funcionar após reinício ou erro.**

---

## ✅ Checklist Rápido de Diagnóstico

Execute na ordem:

```bash
# 1. Backend está rodando?
curl http://localhost:3001/health
# Esperado: {"status":"ok","timestamp":"..."}
# Se falhar → vá para "Recuperação do Backend"

# 2. Frontend está rodando?
curl http://localhost:3000
# Esperado: HTML do React
# Se falhar → vá para "Recuperação do Frontend"

# 3. Tabela alias_conhecimento existe?
# Abra Supabase SQL Editor e execute:
SELECT COUNT(*) FROM alias_conhecimento;
# Esperado: 129 registros
# Se falhar → vá para "Recuperação do Banco"
```

---

## 🔧 Recuperação do Backend

### Sintoma: `curl http://localhost:3001/health` falha

```bash
# 1. Verificar se há processo rodando
netstat -ano | grep :3001
# Se vazio → backend não está rodando

# 2. Iniciar backend
cd "C:\Users\User\Evis AI"
npm run server

# 3. Validar
# Aguarde mensagem: "🚀 Servidor EVIS AI rodando em http://localhost:3001"
curl http://localhost:3001/health

# 4. Se falhar com erro de porta ocupada:
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3001 | xargs kill -9
```

### Erro Comum: "Cannot find module"

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install
npm run server
```

---

## 🎨 Recuperação do Frontend

### Sintoma: `curl http://localhost:3000` falha

```bash
# 1. Verificar se há processo rodando
netstat -ano | grep :3000
# Se vazio → frontend não está rodando

# 2. Iniciar frontend
cd "C:\Users\User\Evis AI"
npm run dev

# 3. Validar
# Aguarde mensagem: "Local: http://localhost:3000/"
curl http://localhost:3000

# 4. Se falhar com erro de porta ocupada:
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:3000 | xargs kill -9
```

---

## 🗄️ Recuperação do Banco (Supabase)

### Sintoma: Tabela `alias_conhecimento` não existe

**Ação:** Executar migration completa

1. Abra Supabase SQL Editor: https://supabase.com/dashboard/project/jwutiebpfauwzzltwgbb/sql
2. Execute o arquivo: [`docs/04_ALIAS_CONHECIMENTO_GLOBAL.sql`](docs/04_ALIAS_CONHECIMENTO_GLOBAL.sql)
3. Valide:

```sql
SELECT tipo, categoria, COUNT(*) AS total
FROM public.alias_conhecimento
GROUP BY tipo, categoria
ORDER BY tipo, categoria;
```

**Resultado esperado:**
- ~80 registros de tipo `servico`
- ~30 registros de tipo `equipe`
- Total: 129 registros

---

## 🔗 Recuperação da Integração Frontend-Backend

### Sintoma: Erro "Orquestrador falhou" ao processar diário

**Validações:**

```bash
# 1. Backend está respondendo?
curl -X POST http://localhost:3001/api/diario/processar-diario \
  -H "Content-Type: application/json" \
  -d '{"transcricao":"teste","obra_id":"3c7ade92-5078-4db3-996c-1390a9a2bb27","data_referencia":"2026-04-15"}'

# Esperado: {"success":true,"data":{...}}
# Se falhar → verificar logs do backend
```

**2. Verificar código do AIAnalysis.tsx:**

```bash
grep -n "processarDiarioOrchestrator" src/components/AIAnalysis.tsx
# Esperado: linha 2 (import) e linha 45 (chamada)
# Se não encontrar → arquivo foi revertido, restaurar de backup
```

**3. Verificar código do api.ts:**

```bash
grep -n "processarDiarioOrchestrator" src/lib/api.ts
# Esperado: definição da função
# Se não encontrar → arquivo foi revertido, restaurar de backup
```

---

## 📦 Recuperação Completa do Zero

**Use quando tudo mais falhar:**

```bash
# 1. Limpar tudo
cd "C:\Users\User\Evis AI"
rm -rf node_modules
rm -rf server/build
rm package-lock.json

# 2. Reinstalar
npm install

# 3. Verificar arquivos críticos
ls -la src/components/AIAnalysis.tsx
ls -la src/lib/api.ts
ls -la server/agents/orchestrator.ts

# 4. Iniciar sistema
./start.bat  # Windows
# ou
./start.sh   # Linux/Mac

# 5. Validar 3 pontos:
curl http://localhost:3001/health      # Backend
curl http://localhost:3000              # Frontend
# + Teste no navegador em http://localhost:3000
```

---

## 🚨 Estado Esperado do Sistema

### Processos Rodando

```bash
# Windows
netstat -ano | findstr ":3000 :3001"

# Linux/Mac
netstat -tuln | grep -E ":3000|:3001"
```

**Esperado:**
```
TCP  0.0.0.0:3000  ...  LISTENING  <PID_FRONTEND>
TCP  0.0.0.0:3001  ...  LISTENING  <PID_BACKEND>
```

### Arquivos Críticos

| Arquivo | Responsabilidade | Validação |
|---------|------------------|-----------|
| `server/agents/orchestrator.ts` | Orquestrador de 8 camadas | Deve conter `metodo: 'exato' \| 'alias' \| 'alias_global' \| 'semantico'` |
| `src/components/AIAnalysis.tsx` | Integração frontend | Deve importar `processarDiarioOrchestrator` |
| `src/lib/api.ts` | Cliente HTTP | Deve exportar `processarDiarioOrchestrator()` |
| `server/index.ts` | Servidor Express | Deve ter `app.use('/api/diario', diarioRoutes)` |

### Banco de Dados (Supabase)

```sql
-- Validação completa
SELECT 'alias_conhecimento' AS tabela, COUNT(*) AS registros FROM alias_conhecimento
UNION ALL
SELECT 'servicos', COUNT(*) FROM servicos
UNION ALL
SELECT 'equipes_cadastro', COUNT(*) FROM equipes_cadastro
UNION ALL
SELECT 'obras', COUNT(*) FROM obras;
```

**Esperado:**
- `alias_conhecimento`: 129 registros
- `servicos`: varia por obra
- `equipes_cadastro`: varia por obra
- `obras`: >= 1

---

## 📚 Documentação de Referência

- **Sessão de integração:** [`docs/SESSAO_2026-04-15_integracao_orquestrador.md`](docs/SESSAO_2026-04-15_integracao_orquestrador.md)
- **Aliases globais:** [`docs/SESSAO_2026-04-15_alias_global.md`](docs/SESSAO_2026-04-15_alias_global.md)
- **Arquitetura geral:** [`docs/EVIS_AI_VISAO_TECNICA.md`](docs/EVIS_AI_VISAO_TECNICA.md)
- **Memória técnica:** [`docs/MEMORIA_TECNICA.md`](docs/MEMORIA_TECNICA.md)

---

## 🆘 Último Recurso: Restaurar do Git

```bash
# Ver último commit funcional
git log --oneline -5

# Restaurar arquivo específico
git checkout HEAD -- src/components/AIAnalysis.tsx
git checkout HEAD -- src/lib/api.ts

# OU restaurar commit completo (CUIDADO: perde alterações não commitadas)
git reset --hard <commit-hash>

# Reinstalar e iniciar
npm install
./start.bat  # ou ./start.sh
```

---

*Última atualização: 15/04/2026*
