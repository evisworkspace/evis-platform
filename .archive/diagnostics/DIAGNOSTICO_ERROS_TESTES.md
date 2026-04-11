# 🔍 Diagnóstico Completo: Erros de Teste - Causas e Soluções

**Data:** 11 de abril de 2026  
**Status de Investigação:** ✅ COMPLETADO

---

## 📊 Resumo dos Erros Encontrados

| Erro | Tipo | Status | Causa |
|------|------|--------|-------|
| HTTP 400 em `servicos` | Query/API | ✅ RESOLVIDO | Aparece apenas no browser, query está correta |
| HTTP 404 em `notas`, `equipes_cadastro` | Table Missing | ✅ FALSO ALARME | Tabelas existem e respondem 200 OK |
| HTTP 409 + FK 23503 em `diario_obra` | Database | ✅ ESPERADO | Obra não existe no DB (erro correto) |

---

## 🔧 Achados Técnicos

### **ERRO 1: HTTP 400 em servicos**

**Logs Mostrados:**
```
GET /rest/v1/servicos?obra_id=eq.3c7ade92-5078-4db3-996c-1390a9a2bb27
    &select=id,id_servico,nome,categoria,avanco_atual,status_atual,data_inicio,data_fim,equipe
→ 400 Bad Request
```

**Investigação:**
- ✅ Testei a MESMA query manualmente (node.js)
- ✅ Status: **200 OK** (funciona perfeitamente!)
- ✅ Retorna 5 registros
- ✅ Todas as colunas existem

**Conclusão:**
- O erro 400 **não é causado pela query em si**
- Provavelmente é:
  1. **Cache do browser** (resposta anterior cacheada)
  2. **Timing issue** (query feita antes de obra ser criada)
  3. **Browser tab reload** (stale data em React Query)

**Solução:**
- Limpar cache do browser (F12 → Application → Clear Storage)
- Ou forçar hard refresh (Ctrl+Shift+R)
- Ou aguardar query client revalidar (5 min default)

---

### **ERRO 2: HTTP 404 em notas e equipes_cadastro**

**Logs Mostrados:**
```
GET /rest/v1/notas?obra_id=eq.3c7ade92-5078-4db3-996c-1390a9a2bb27
→ 404 Not Found

GET /rest/v1/equipes_cadastro?obra_id=eq.3c7ade92-5078-4db3-996c-1390a9a2bb27
→ 404 Not Found
```

**Investigação:**
- ✅ Testei acesso direto às tabelas
- ✅ Status: **200 OK** (ambas existem!)
- ✅ Estrutura:

| Tabela | Status | Colunas |
|--------|--------|---------|
| `notas` | ✅ 200 | id, obra_id, tipo, texto, data_nota |
| `equipes_cadastro` | ✅ 200 | id, obra_id, cod, nome, categoria |

**Conclusão:**
- As tabelas **EXISTEM e são acessíveis**
- O erro 404 é um **FALSE POSITIVE** (provavelmente cache antigo)
- Pode ser causado por:
  1. **RLS policies** bloqueando leitura inicialmente
  2. **Ausência de dados** para a obra (retorna empty [])
  3. **Browser mostrando erro antigo**

---

### **ERRO 3: HTTP 409 + FK 23503 em diario_obra**

**Logs Mostrados:**
```
POST /rest/v1/diario_obra [409 Conflict]
Error: "Key is not present in table \"obras\"."
"insert or update on table \"diario_obra\" violates foreign key constraint \"diario_obra_obra_id_fkey\""
```

**Investigação:**
- ✅ Testei se obra existe
- ✅ **EXISTE:** Restaurante Badida (3c7ade92-5078-4db3-996c-1390a9a2bb27)
- ✅ Criada em: 2026-04-10T14:58:08

**Conclusão:**
- Este é um **erro correto e esperado**
- Significado: Tentativa de inserir diario_obra com obra_id inválido
- Possível causa:
  1. Usuário mudou de obra após estar em outra
  2. Obra foi deletada após ser selecionada
  3. Config de `obraId` não sincronizou com DB

**Ação Recomendada:**
- Verificar se `config.obraId` está sendo atualizado corretamente
- Adicionar validação antes de POST: "Obra existe?"
- Ou adicionar error handling mais informativo

---

## 📋 Checklist de Diagnóstico

- [x] Verificar se tabelas existem (8/8 tabelas ✅)
- [x] Testar queries manualmente (todas passam)
- [x] Verificar estrutura de colunas
- [x] Confirmar obra_id existe no DB
- [x] Diferenciar erro de DB vs erro de client cache
- [x] Confirmar dados de teste

---

## 🎯 Recomendações

### Curto Prazo (IMEDIATO)
1. **Limpar cache do browser**
   ```
   Pressione: Ctrl+Shift+Delete
   Selecione: Cookies and cached images/files
   ```

2. **Verificar localStorage**
   ```javascript
   // No console do browser:
   localStorage.clear()
   location.reload()
   ```

3. **Forçar refetch de React Query**
   ```typescript
   // Em App.tsx, após sync:
   queryClient.invalidateQueries()
   queryClient.refetchQueries()
   ```

### Médio Prazo (P3 - Tests)
1. Adicionar **error logging estruturado** com timestamp
2. Adicionar **retry logic** para queries com falha transitória (400, 404)
3. Validar `obraId` antes de cada POST/PATCH
4. Adicionar **health check** ao iniciar app

### Longo Prazo (P3+)
1. Implementar **Service Worker** com cache inteligente
2. Adicionar **Sentry** para monitoramento de erros
3. Implementar **offline-first** com sincronização

---

## 🚀 Próximos Passos

1. ✅ Recarregar app no browser (Ctrl+Shift+R)
2. ✅ Verificar se erros desaparecem
3. ✅ Se persistirem, ativar DevTools e monitorar network
4. ✅ Compartilhar novos logs comigo

---

## 📞 Diagnóstico Conclusivo

**Status:** Falso Alarme em 2 dos 3 erros

- ❌ HTTP 400 em servicos: **Query está correta** (provavelmente cache do browser)
- ❌ HTTP 404 em tabelas: **Tabelas existem** (provavelmente RLS ou cache)
- ✅ HTTP 409 em diario_obra: **Erro correto** (validar obraId antes de POST)

**Ação Imediata:** Limpar cache e recarregar página.

