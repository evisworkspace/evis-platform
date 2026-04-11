# 📦 PASTA .ARCHIVE - Guia de Uso

**Data:** 11 de abril de 2026  
**Objetivo:** Manter histórico sem poluir raiz do projeto

---

## ⚠️ IMPORTANTE

Esta pasta contém:
- ✅ Histórico de tarefas concluídas (para referência)
- ✅ Scripts de diagnóstico (só usar se tiver problema)
- ✅ Documentação auxiliar (consulta quando necessário)

**NÃO MEXER NESTES ARQUIVOS** durante desenvolvimento normal.

---

## 📂 Subpastas

### `diagnostics/` - Scripts de Debug (Descartável)

Contém scripts Node.js que foram usados para diagnosticar problemas uma única vez.

**Quando usar:**
- Só se tiver erro de Supabase novamente
- Não incluir em commits regulares
- Executar com: `node [arquivo].js`

**Conteúdo:**
- `diagnose-supabase.js` - Verifica quais tabelas existem
- `check-servicos-schema.js` - Verifica schema da tabela servicos
- `check-columns.js` - Testa diferentes seleções de colunas
- `check-obra-id.js` - Verifica se obra_id existe no DB
- `DIAGNOSTICO_ERROS_TESTES.md` - Relatório de erros encontrados

**Ação:** Pode descartar se não precisar mais de debugging.

---

### `tasks-completed/` - Relatórios de Tarefas (Referência)

Contém relatórios de todas as tarefas já executadas.

**Quando consultar:**
- Se precisar entender como foi implementado algo
- Se tiver dúvida sobre uma decisão técnica
- Antes de re-fazer uma tarefa

**Conteúdo:**
- `P0_CONCLUIDO.txt` - Setup de API Keys
- `P1_CONCLUIDO.md` - Logger + React Query + CSS + TypeScript
- `P2_CONCLUIDO.md` - Tipagem + Refatoração
- `P1.2_COMPLETION_REPORT.md` - Relatório detalhado React Query
- `P1.2_VISUAL_SUMMARY.md` - Sumário visual React Query

**Padrão:** Não modificar. Apenas ler para referência.

---

### `documentation/` - Docs Técnicas (Consulta)

Contém documentação técnica e guias.

**Quando consultar:**
- Se precisar entender como funciona React Query cache
- Se tiver dúvida sobre arquitetura
- Se precisar replicar um padrão

**Conteúdo:**
- `REACT_QUERY_CACHE_GUIDE.md` - Guia de cache e invalidation
- `REACT_QUERY_CODE_CHANGES.md` - Mudanças específicas de código
- `P1.2_REACT_QUERY_IMPLEMENTATION.md` - Como foi implementado
- `GEMINI_COMPARACAO.txt` - Comparação de diferentes planos
- `MANUAL_EXECUCAO_AUTOMATIZADA.md` - Como rodar automação (obsoleto)
- `DOCUMENTACAO_DE_ARQUIVOS.md` - Estrutura antiga (referência)

**Padrão:** Apenas leitura. Para novas docs, criar na raiz com `PROJETO_P3.X_[NOME].md`.

---

## 🔄 Workflow com .archive/

### Ao começar uma NOVA tarefa:

1. ✅ Consultar `.archive/tasks-completed/` se similar já foi feita
2. ✅ Consultar `.archive/documentation/` se precisar de contexto
3. ✅ NÃO COPIAR nada de `.archive/`
4. ✅ Criar novo arquivo na RAIZ: `PROJETO_P3.X_[NOME].md`

### Ao terminar uma tarefa:

1. ✅ Mover relatório final para `.archive/tasks-completed/`
2. ✅ Atualizar `AUDIT_TRAIL.md` na raiz
3. ✅ Atualizar `INDEX.md` com novo score
4. ✅ Fazer commit com mensagem descritiva

### Se tiver problema de Supabase:

1. ✅ Consultar `.archive/diagnostics/DIAGNOSTICO_ERROS_TESTES.md`
2. ✅ Se precisar re-diagnosticar, executar script em `.archive/diagnostics/`
3. ✅ Criar novo relatório em RAIZ: `PROBLEMA_[DATA].md`
4. ✅ Mover diagnóstico para `.archive/diagnostics/` quando resolvido

---

## 📊 Tamanho e Impacto

| Pasta | Arquivos | Tamanho | Impacto Git |
|-------|----------|---------|------------|
| diagnostics/ | 5 | ~50 KB | .gitignore |
| tasks-completed/ | 5 | ~100 KB | .gitignore |
| documentation/ | 6 | ~200 KB | .gitignore |
| **TOTAL** | **16** | **~350 KB** | Não commitado |

**Nota:** Adicionar `.archive/` ao `.gitignore` para não inflacionar repositório.

---

## 🎯 Checklist: Quando Adicionar Algo a .archive/

Antes de mover arquivo para `.archive/`:

- [ ] Tarefa está 100% completa?
- [ ] npm run lint passou (ZERO ERRORS)?
- [ ] npm run build passou (SUCCESS)?
- [ ] Documentação está completa?
- [ ] Relatório foi gerado?
- [ ] Atualizou INDEX.md e AUDIT_TRAIL.md?

Se SIM em todos, mover para `.archive/tasks-completed/`.

---

## 🚀 Exemplo: Adicionando P3.1 (README) ao Archive

### Passo 1: Enquanto trabalha (na RAIZ)
```
PROJETO_P3.1_README.md (em progresso)
```

### Passo 2: Ao terminar
```
Criar: PROJETO_P3.1_README.md (versão final)
Mover para: .archive/tasks-completed/PROJETO_P3.1_README.md
Atualizar: AUDIT_TRAIL.md
Atualizar: INDEX.md (score)
Fazer commit
```

### Passo 3: Próxima pessoa
```
Consulta: .archive/tasks-completed/PROJETO_P3.1_README.md
Para entender: Como foi implementado
```

---

## 📝 Template: Relatório de Tarefa Concluída

Quando mover arquivo para `.archive/tasks-completed/`:

```markdown
# 📋 PROJETO_P3.X_[NOME] ✅ CONCLUÍDO

**Data:** DD/MM/YYYY
**Tempo Estimado:** X horas
**Tempo Real:** Y horas
**Score:** XX → XX/100 (+X pontos)

## 🎯 Objetivo
[O que foi feito]

## ✅ Implementação
[Como foi implementado]

## 📊 Resultados
- ✅ npm run lint: ZERO ERRORS
- ✅ npm run build: SUCCESS
- ✅ Testes: [status]

## 📝 Mudanças
| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| file.ts | 10-20 | mudança |

## 🔗 Referências
- Link1
- Link2
```

---

## 💾 Git Configuration

Adicionar ao `.gitignore`:

```gitignore
# Archive (historical reference only)
.archive/diagnostics/
.archive/tasks-completed/
.archive/documentation/
```

Desta forma:
- ✅ Histórico fica local
- ✅ Não polui repositório Git
- ✅ Cada pessoa tem seu arquivo local
- ✅ Reduz tamanho do repo

---

## ❓ Dúvidas Frequentes

**P: Posso deletar .archive/?**  
R: Não. Mantenha para referência histórica.

**P: Posso modificar arquivos em .archive/?**  
R: Não. São read-only de referência.

**P: Posso copiar código de .archive/diagnostics/?**  
R: Sim, se precisar. Mas melhor consultar a doc em raiz.

**P: Quanto tempo mantenho .archive/?**  
R: Indefinidamente. Não ocupa espaço no Git se configurar .gitignore.

**P: .archive/ cresce infinitamente?**  
R: Só se adicionar muitos arquivos. Revise a cada 10 tarefas.

---

## ✅ Summary

```
✅ .archive/ = Histórico organizado
✅ Não polui raiz do projeto
✅ Não commitado no Git
✅ Fácil encontrar documentação
✅ Evita re-fazer tarefas
✅ Serve como referência
```

**Mantenha limpo. Mantenha organizado. Mantenha funcionando!**

---

**Versão:** 1.0  
**Data:** 11 de abril de 2026

