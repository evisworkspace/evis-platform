# 🎯 PLANO DE EXECUÇÃO CAMINHO C - PARA CLAUDE SONNET

**Status:** ✅ AUTORIZADO PELO USUÁRIO  
**Data:** 11 de abril de 2026  
**Executor:** Claude Code Sonnet  
**Orquestrador:** OpenCode  
**Modo:** 5 Fases + Checkpoints

---

## 🔐 PROTOCOLO DE SEGURANÇA

### ANTES DE COMEÇAR

```bash
# 1. Verificar estado atual
git status                    # Deve estar limpo
npm run lint                  # Deve ser ZERO ERRORS
npm run build                 # Deve ser SUCCESS

# 2. Criar checkpoint
git add -A
git commit -m "checkpoint: antes de CAMINHO C"
git log --oneline -1          # Confirmar commit

# 3. Se algo der errado ANYTIME:
git reset --hard HEAD~1       # Volta tudo
```

### REGRAS INVIOLÁVEIS

❌ **NUNCA:**
- Tocar em `src/` (código da aplicação)
- Modificar `package.json` (versões)
- Alterar `.env` (secrets)
- Executar `npm install` (mudanças inesperadas)
- Fazer force push (`git push --force`)
- Deletar arquivos (apenas mover para .archive/)

✅ **SEMPRE:**
- Fazer backup antes de cada fase
- Validar lint + build após mudanças
- Commit com mensagem descritiva
- Aguardar aprovação do usuário entre fases

---

## 📋 FASE 1: CRIAR INFRAESTRUTURA (30 min)

### Objetivo
Criar estrutura de diretórios e arquivos de memória sem mover nada.

### Ações

**1. Criar diretórios**
```bash
mkdir -p docs/archive
mkdir -p docs/reference
mkdir -p docs/learnings
```

**2. Criar working.md (vazio, para sessão atual)**
```
C:\Users\User\Evis AI\working.md

# 🔄 WORKING MEMORY - Sessão Atual

**Data:** 11 de abril de 2026  
**Fase:** CAMINHO C - Execução  
**Status:** Em progresso

## Tarefas em Progresso
- [ ] FASE 1: Infraestrutura
- [ ] FASE 2: Migração
- [ ] FASE 3: P3.3 SQL
- [ ] FASE 4: P3.4 WCAG

## Checkpoints
- [x] Checkpoint inicial (git commit)
- [ ] Checkpoint FASE 1
- [ ] Checkpoint FASE 2
- [ ] Checkpoint FASE 3
- [ ] Checkpoint FASE 4

## Notas da Sessão
(Será atualizado durante execução)
```

**3. Criar memory.md (vazio, para conhecimento permanente)**
```
C:\Users\User\Evis AI\memory.md

# 🧠 PERMANENT MEMORY - Conhecimento do Projeto

**Última Atualização:** 11 de abril de 2026  
**Propósito:** Centralizar learnings e padrões descobertos

## Arquitetura Principal
(Será preenchido durante execução)

## Padrões & Best Practices
(Será preenchido durante execução)

## Decisões Arquiteturais
(Será preenchido durante execução)

## Lições Aprendidas
(Será preenchido durante execução)
```

**4. Criar docs/README.md**
```
# 📚 DOCS - Documentação Organizada

Esta pasta contém documentação do projeto EVIS AI, organizada em 3 categorias:

- **archive/** - Tarefas completadas (P0, P1, P2, Sync)
- **reference/** - Documentação técnica permanente
- **learnings/** - Padrões e insights descobertos

Ver INDEX.md na raiz para navegação completa.
```

### Validação FASE 1
```bash
# Verificar arquivos criados
ls -la working.md
ls -la memory.md
ls -la docs/
ls -la docs/archive/
ls -la docs/reference/
ls -la docs/learnings/

# Verificar que código não foi tocado
npm run lint   # Deve ser ZERO ERRORS
npm run build  # Deve ser SUCCESS

# Commit FASE 1
git add working.md memory.md docs/
git commit -m "FASE 1: Criar infraestrutura (memória + diretórios)"
```

### Checkpoint FASE 1
```
Status: ✅ Completo se:
- [ ] working.md existe e está vazio
- [ ] memory.md existe e está vazio
- [ ] docs/archive/, reference/, learnings/ existem
- [ ] npm run lint: ZERO ERRORS
- [ ] npm run build: SUCCESS
- [ ] Git commit feito
- [ ] Sem mudanças em src/

Usuário Aprova? [SIM] → Continuar | [NÃO] → git reset --hard HEAD~1
```

---

## 📦 FASE 2: MIGRAR DOCUMENTAÇÃO (1 hora)

### Objetivo
Mover arquivos para docs/ mantendo referências na raiz.

### Mapeamento de Movimentos

**Para docs/archive/ (Tarefas Completadas)**
```
P0_CONCLUIDO.txt                 ← .archive/tasks-completed/P0_CONCLUIDO.txt
P1_CONCLUIDO.md                  ← .archive/tasks-completed/P1_CONCLUIDO.md
P2_CONCLUIDO.md                  ← .archive/tasks-completed/P2_CONCLUIDO.md
P1.2_COMPLETION_REPORT.md        ← .archive/tasks-completed/P1.2_COMPLETION_REPORT.md
P1.2_VISUAL_SUMMARY.md           ← .archive/tasks-completed/P1.2_VISUAL_SUMMARY.md
SINCRONIZACAO_100_CORRECOES.md   ← (Mover da raiz)
IMPLEMENTACAO_SINCRONIZACAO_COMPLETA.md ← (Mover da raiz)
PROJETO_CONCLUIDO.md             ← (Mover da raiz)
```

**Para docs/reference/ (Documentação Permanente)**
```
DESCRITIVO_TECNICO_AUDITORIA.md  ← (Mover da raiz)
QUESTIONARIO_AUDITORIA.md        ← (Mover da raiz)
DIAGRAMAS_VISUAIS.md             ← (Mover da raiz)
AUDITORIA_STATUS.md              ← (Mover da raiz)
BRIEFING_TAREFAS_COM_MOTORES.md  ← (Mover da raiz)
implementation_plan.md           ← (Mover da raiz)
validation_sync.md               ← (Mover da raiz)
REACT_QUERY_CACHE_GUIDE.md       ← .archive/documentation/REACT_QUERY_CACHE_GUIDE.md
REACT_QUERY_CODE_CHANGES.md      ← .archive/documentation/REACT_QUERY_CODE_CHANGES.md
P1.2_REACT_QUERY_IMPLEMENTATION.md ← .archive/documentation/P1.2_REACT_QUERY_IMPLEMENTATION.md
GEMINI_COMPARACAO.txt            ← .archive/documentation/GEMINI_COMPARACAO.txt
```

**Para docs/learnings/ (Padrões Descobertos)**
```
REACT_QUERY_PATTERNS.md          ← NOVO (Extrair de P1.2_REACT_QUERY_IMPLEMENTATION.md)
SUPABASE_BEST_PRACTICES.md       ← NOVO (Extrair de DESCRITIVO_TECNICO_AUDITORIA.md)
EVIS_ARCHITECTURE_OVERVIEW.md    ← NOVO (Síntese do sistema)
AI_SYNCHRONIZATION_GUIDE.md      ← NOVO (Extrair de SINCRONIZACAO_100_CORRECOES.md)
```

**Manter na Raiz (Core Documents)**
```
INDEX.md                         ← MANTER (índice central)
AUDIT_TRAIL.md                   ← MANTER (timeline)
GUIA_DE_NAVEGACAO.md             ← MANTER (entry point)
QUICK_START.md                   ← MANTER (setup 5min)
working.md                       ← NOVO (sessão)
memory.md                        ← NOVO (permanente)
P3.3_SUPABASE_SCHEMA_CORRECTIONS.sql ← MANTER (ativo P3.3)
P3.3_SUPABASE_AUTH_RLS.md        ← MANTER (ativo P3.3)
P3.3_DEPLOYMENT_SUMMARY.md       ← MANTER (ativo P3.3)
README.md                        ← MANTER (GitHub)
.archive/README.md               ← MANTER (guia .archive/)
```

### Ações FASE 2

**Passo 1: Mover arquivos completados**
```bash
# Para docs/archive/
mv SINCRONIZACAO_100_CORRECOES.md docs/archive/
mv IMPLEMENTACAO_SINCRONIZACAO_COMPLETA.md docs/archive/
mv PROJETO_CONCLUIDO.md docs/archive/

# Verificar .archive/tasks-completed/ foi movido
cp .archive/tasks-completed/* docs/archive/
```

**Passo 2: Mover referência técnica**
```bash
# Para docs/reference/
mv DESCRITIVO_TECNICO_AUDITORIA.md docs/reference/
mv QUESTIONARIO_AUDITORIA.md docs/reference/
mv DIAGRAMAS_VISUAIS.md docs/reference/
mv AUDITORIA_STATUS.md docs/reference/
mv BRIEFING_TAREFAS_COM_MOTORES.md docs/reference/
mv implementation_plan.md docs/reference/
mv validation_sync.md docs/reference/

# Mover de .archive/documentation/
cp .archive/documentation/* docs/reference/
```

**Passo 3: Criar learnings (extrair de documentos existentes)**
```
Criar: docs/learnings/REACT_QUERY_PATTERNS.md
- Fonte: P1.2_REACT_QUERY_IMPLEMENTATION.md
- Extrair: Padrões de cache, invalidação, hooks
- Resumo: 100-150 linhas

Criar: docs/learnings/SUPABASE_BEST_PRACTICES.md
- Fonte: DESCRITIVO_TECNICO_AUDITORIA.md
- Extrair: RLS, constraints, índices, performance
- Resumo: 100-150 linhas

Criar: docs/learnings/EVIS_ARCHITECTURE_OVERVIEW.md
- Fonte: Múltiplos documentos
- Síntese: Stack, fluxos, banco de dados
- Resumo: 150-200 linhas

Criar: docs/learnings/AI_SYNCHRONIZATION_GUIDE.md
- Fonte: SINCRONIZACAO_100_CORRECOES.md
- Resumo: 3 correções, failsafes, React Query
- Resumo: 80-100 linhas
```

**Passo 4: Atualizar memory.md com learnings**
```
memory.md deve incluir:
- Referência para cada arquivo em docs/learnings/
- Resumo de cada padrão
- Links para documentação completa em docs/reference/
```

**Passo 5: Atualizar working.md com progresso**
```
working.md deve incluir:
- Checkpoints completados
- O que falta fazer
- Status de cada fase
```

### Validação FASE 2
```bash
# Verificar estrutura
ls -la docs/archive/          # Deve ter 8+ arquivos
ls -la docs/reference/        # Deve ter 11+ arquivos
ls -la docs/learnings/        # Deve ter 4 novos arquivos

# Verificar que raiz ficou limpa
ls -la *.md | wc -l           # Deve ter ~11 arquivos (antes tinha ~20)

# Verificar código não foi tocado
npm run lint   # Deve ser ZERO ERRORS
npm run build  # Deve ser SUCCESS

# Commit FASE 2
git add -A
git commit -m "FASE 2: Migrar documentação para docs/ (archive + reference + learnings)"
```

### Checkpoint FASE 2
```
Status: ✅ Completo se:
- [ ] docs/archive/ tem P0-P2 + sync completados
- [ ] docs/reference/ tem documentação técnica
- [ ] docs/learnings/ tem 4 novos arquivos
- [ ] Raiz limpa (máximo 11 core docs)
- [ ] working.md e memory.md atualizados
- [ ] npm run lint: ZERO ERRORS
- [ ] npm run build: SUCCESS
- [ ] Git commit feito

Usuário Aprova? [SIM] → Continuar | [NÃO] → git reset --hard HEAD~1
```

---

## 🔐 FASE 3: DEPLOY P3.3 SQL (1 hora)

### Objetivo
Executar SQL no Supabase e validar implementação.

### Ações

**Passo 1: Instrução para Usuário**
```
⚠️ ESTA FASE REQUER AÇÃO MANUAL NO SUPABASE

1. Abra: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá para: SQL Editor
4. Crie nova query
5. Copie todo conteúdo de: P3.3_SUPABASE_SCHEMA_CORRECTIONS.sql
6. Cole na query
7. Clique "Run"
8. Aguarde completion (deve levar <1 min)
9. Sem erros? [SIM] → Continue | [NÃO] → Reportar erro
```

**Passo 2: Verificar Implementação**
```bash
# Após SQL executado, você vai rodar verification queries no Supabase
# Copie cada query de P3.3_SUPABASE_SCHEMA_CORRECTIONS.sql SEÇÃO 8

# Query 1: Verificar RLS ativado (deve mostrar 8 tabelas com true)
# Query 2: Verificar constraints (deve mostrar 9+ constraints)
# Query 3: Verificar indexes (deve mostrar 6+ indexes)

# Reportar: "Todas as 3 queries passaram ✅"
```

**Passo 3: Atualizar Frontend**
```
Modificar: src/lib/api.ts
- Adicionar error handling para RLS (código 403 PGRST301)
- Adicionar logging de violations
- Adicionar retry logic

Referência: P3.3_SUPABASE_AUTH_RLS.md (linha X-Y)
```

**Passo 4: Testar Constraints**
```bash
# Testes manuais no frontend (você faz):

1. Insert serviço com avanço = 150
   Esperado: Erro CONSTRAINT CHECK
   Status: ✅ ou ❌

2. Insert serviço com data_fim < data_inicio
   Esperado: Erro CONSTRAINT CHECK
   Status: ✅ ou ❌

3. Insert serviço com status = "pausado" (inválido)
   Esperado: Erro CONSTRAINT ENUM
   Status: ✅ ou ❌

4. Delete obra
   Esperado: Cascade delete servicos
   Status: ✅ ou ❌
```

### Validação FASE 3
```bash
# Após RLS estar live no Supabase:

npm run lint   # Deve ser ZERO ERRORS
npm run build  # Deve ser SUCCESS

# Commit FASE 3
git add src/lib/api.ts
git commit -m "FASE 3: Atualizar frontend para RLS (error handling)"

# Atualizar working.md com resultado
```

### Checkpoint FASE 3
```
Status: ✅ Completo se:
- [ ] SQL executado no Supabase (sem erros)
- [ ] 3 verification queries passaram
- [ ] src/lib/api.ts atualizado
- [ ] 4 testes de constraints passaram
- [ ] npm run lint: ZERO ERRORS
- [ ] npm run build: SUCCESS
- [ ] Git commit feito
- [ ] Score agora: 95-97/100 ✅

Usuário Aprova? [SIM] → Continuar | [NÃO] → Rollback SQL + git reset
```

---

## ♿ FASE 4: IMPLEMENTAR P3.4 WCAG (1 hora)

### Objetivo
Implementar acessibilidade WCAG AA.

### Escopo P3.4

**1. Color Contrast (AA Standard)**
```
Verificar e corrigir em index.css + componentes:
- Text vs background: mínimo 4.5:1 para small text
- Large text (≥18pt): mínimo 3:1
- UI components: mínimo 3:1

Ferramentas: Chrome DevTools → Accessibility
```

**2. ARIA Attributes**
```
Adicionar em componentes complexos:
- aria-label para botões sem texto
- aria-describedby para descrições
- aria-live="polite" para atualizações dinâmicas
- aria-expanded para accordions
```

**3. Keyboard Navigation**
```
Testar:
- Tab: navegar por todos botões/inputs
- Enter: ativar botões, submit forms
- Escape: fechar modais
- Arrow keys: navegação em listas
```

**4. Screen Reader Support**
```
Verificar com NVDA (Windows) ou JAWS:
- Títulos anunciados corretamente
- Botões identificados
- Formulários navegáveis
- Imagens têm alt text
```

**5. Mobile Touch Targets**
```
Verificar:
- Botões: mínimo 48x48px
- Espaçamento entre alvos
- Responsividade em 320px-1024px
- Orientação landscape/portrait
```

### Ações FASE 4

**Checklist WCAG AA Completo**

```markdown
# WCAG AA Implementation Checklist

## 1. Perceivable
- [ ] Text contrast 4.5:1 (small) ou 3:1 (large)
- [ ] Imagens têm alt text
- [ ] Vídeos têm captions
- [ ] Sem dependência apenas de cor

## 2. Operable
- [ ] Teclado funciona (Tab, Enter, Escape, Arrows)
- [ ] Focus visível em todos elementos
- [ ] Sem keyboard trap (consegue sair com Tab)
- [ ] Tempo suficiente para ler/interagir

## 3. Understandable
- [ ] Formulários têm labels associadas
- [ ] Mensagens de erro claras
- [ ] Linguagem simples (8º série)
- [ ] Previsível (nada muda ao receber focus)

## 4. Robust
- [ ] HTML válido (W3C validator)
- [ ] ARIA usado corretamente
- [ ] Compatível com screen readers
- [ ] Sem JavaScript obrigatório
```

### Validação FASE 4
```bash
# Testes WCAG AA
npm run lint   # Deve ser ZERO ERRORS
npm run build  # Deve ser SUCCESS

# Commit FASE 4
git add src/
git commit -m "FASE 4: Implementar WCAG AA (acessibilidade)"

# Atualizar working.md com resultado
```

### Checkpoint FASE 4
```
Status: ✅ Completo se:
- [ ] Todas as mudanças de acessibilidade implementadas
- [ ] Contrast checker passou (4.5:1 ou 3:1)
- [ ] Keyboard navigation testada
- [ ] ARIA attributes adicionados
- [ ] Mobile responsivo (testado em 320px, 768px, 1024px)
- [ ] npm run lint: ZERO ERRORS
- [ ] npm run build: SUCCESS
- [ ] Git commit feito
- [ ] Score agora: 100/100 ✅✅✅

Usuário Aprova? [SIM] → Finalize | [NÃO] → Corrigir
```

---

## ✅ VALIDAÇÃO FINAL

### Pré-Commit Validation
```bash
# Verify tudo passou
npm run lint           # ZERO ERRORS ✅
npm run build          # SUCCESS ✅
npm run test           # Se existir, ZERO FAILURES ✅

# Verify documentação
ls -la working.md      # Existe ✅
ls -la memory.md       # Existe ✅
ls -la docs/           # Estrutura ✅

# Verify git
git status             # Clean ✅
git log --oneline -5   # Commits visíveis ✅
```

### Final Commit
```bash
git add -A
git commit -m "CAMINHO C: Completo - Memória + Docs + P3.3 RLS + P3.4 WCAG (100/100)

- FASE 1: Infraestrutura (working.md, memory.md, docs/ estrutura)
- FASE 2: Migração (20 docs → docs/archive+reference+learnings)
- FASE 3: P3.3 SQL Deploy (RLS, constraints, indexes, validação)
- FASE 4: P3.4 WCAG AA (acessibilidade, contrast, keyboard, screen reader)

Resultado:
✅ Score: 91-92 → 100/100
✅ Documentação: Organizada em docs/
✅ Memória: working.md + memory.md ativo
✅ Raiz: Limpa (11 core docs vs 20 antes)
✅ Lint: ZERO ERRORS
✅ Build: SUCCESS
✅ Auditoria: 100/100 COMPLETA"
```

### Push to Remote
```bash
git push origin main
# Opcional: Criar release tag
git tag -a v1.0-complete -m "EVIS AI: 100/100 Audit Complete"
git push origin v1.0-complete
```

---

## 🎯 PRÓXIMOS PASSOS PÓS-CAMINHO C

### Imediato (Após Completo)
1. ✅ Documentar o que foi feito em memory.md
2. ✅ Fazer release no GitHub
3. ✅ Atualizar README.md com "100/100 Audit Complete"

### Futuro (Para Próximas Fases)
1. ⏳ Skill `auto-evolution` (automação de cleanup)
2. ⏳ Skill `context-management` (cache de contexto)
3. ⏳ Integrar autenticação real (Supabase Auth)
4. ⏳ Multi-tenancy completa

---

## 📞 CONTATO & ROLLBACK

**Se algo der errado em qualquer fase:**
```bash
# Voltar ao estado anterior
git reset --hard HEAD~1

# Ou voltar N commits
git reset --hard HEAD~3

# Ver histórico
git log --oneline
```

**Checkpoints salvos:**
- Checkpoint inicial (antes de CAMINHO C)
- Checkpoint FASE 1 (após infraestrutura)
- Checkpoint FASE 2 (após migração)
- Checkpoint FASE 3 (após P3.3)
- Checkpoint FASE 4 (após P3.4)

---

**PRONTO PARA COMEÇAR FASE 1?**

Claude Sonnet aguardando sua confirmação final!
