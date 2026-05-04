# CONSOLIDAÇÃO DO FLUXO EVIS

> **Data:** 2026-04-15  
> **Sistema:** EVIS - Engenharia e Vistorias Integradas de Obras  
> **Status:** Documentação Oficial

---

## 1. FLUXO COMPLETO

```
ORÇAMENTAÇÃO (Sistema Anterior)
    ↓
Estruturação via IA (Prompt Padronizado)
    ↓
JSON Padronizado (Schema Supabase)
    ↓
APROVAÇÃO DO CLIENTE
    ↓
IMPORTAÇÃO NO EVIS (Orçamento Completo)
    ├─ Obra
    ├─ Serviços (todos)
    ├─ Equipes (dimensionadas)
    └─ Cronograma (datas previstas)
    ↓
SELETOR DE OBRAS (Dropdown canto superior)
    ↓
GESTÃO DA OBRA (Diário, Presença, Fotos)
    ├─ Pendências (surgem durante gestão)
    ├─ Notas (surgem durante gestão)
    ├─ Diário (narrativas diárias)
    └─ Presença (marcação diária)
```

---

## 2. O QUE É IMPORTADO

### ✅ INCLUÍDO NA IMPORTAÇÃO:
- **Obra:** dados básicos (nome, cliente, datas)
- **Serviços:** TODOS os serviços com:
  - ID, nome, categoria
  - Equipe responsável
  - Datas previstas
  - Aliases (para IA)
- **Equipes:** TODAS as equipes com:
  - Código, nome, função
  - Contatos completos
  - Aliases (para IA)
- **Cronograma:** datas previstas por serviço

### ❌ NÃO INCLUÍDO (surge na gestão):
- Pendências
- Notas
- Diário
- Presença
- Fotos
- Atualizações de avanço

---

## 3. ARQUIVOS CRIADOS

### 📄 `PROMPT_PADRONIZACAO_ORCAMENTO.md`
**Função:** Prompt completo para IA transformar dados brutos em JSON estruturado  
**Uso:** Sistema de orçamentação anterior ao EVIS  
**Output:** JSON padronizado compatível com Supabase

### 📄 `TEMPLATE_ORCAMENTO_COMPLETO_V3.json`
**Função:** Template de orçamento completo (Obra Badida)  
**Conteúdo:**
- 1 obra
- 8 equipes
- 25 serviços
- Cronograma completo

**Como usar:**
1. Copiar JSON
2. CONFIG → "Inicializar Projeto (JSON)"
3. Colar e processar
4. Selecionar obra no dropdown

### 📄 `SCHEMA_OFICIAL_V1.sql`
**Função:** DDL oficial do banco Supabase  
**Status:** Mapeamento real (15/04/2026)  
**Uso:** Referência para desenvolvimento

### 📄 `LIMPAR_BANCO.sql`
**Função:** Reset completo do banco  
**Uso:** Limpeza antes de reimportar  
**Preserva:** alias_conhecimento (conhecimento global)

---

## 4. PROBLEMAS IDENTIFICADOS

### 🔴 PROBLEMA 1: Comportamento pós-seleção inconsistente
**Descrição:** Ao selecionar obra no dropdown, sistema não carrega dados corretamente  
**Status:** **PENDENTE CORREÇÃO**  
**Ação:** Verificar função `selecionarObra()` e hooks de carregamento

### 🔴 PROBLEMA 2: Estado vazio não implementado
**Descrição:** Sem obra selecionada, sistema mostra dados fantasma  
**Esperado:** Interface vazia com mensagem "Nenhuma obra ativa"  
**Status:** **PENDENTE IMPLEMENTAÇÃO**

### 🔴 PROBLEMA 3: localStorage conflitando com Supabase
**Descrição:** Dados locais sobrescrevem Supabase  
**Correção aplicada:** `presenca: newPresenca` (sempre usa Supabase)  
**Status:** **CORRIGIDO PARCIALMENTE**  
**Pendente:** Validar após reimportação

---

## 5. PRÓXIMAS AÇÕES

### ✅ CONCLUÍDO:
1. Schema oficial documentado
2. Prompt de padronização criado
3. Template V3 (orçamento completo) pronto
4. Script de limpeza criado
5. Fluxo consolidado documentado

### 🔄 EM ANDAMENTO:
1. Reimportação da obra Badida
2. Teste do fluxo completo

### 📋 PENDENTE:
1. **Corrigir comportamento pós-seleção**
   - Verificar `selecionarObra()` em App.tsx
   - Garantir que React Query revalida corretamente
   - Testar troca entre obras

2. **Implementar estado vazio**
   - Criar componente EmptyState
   - Mostrar quando `!config.obraId`
   - Mensagem clara: "Selecione uma obra para começar"

3. **Validar importação completa**
   - Testar JSON V3 (orçamento completo)
   - Verificar se equipes são importadas
   - Validar relacionamento serviço ↔ equipe

4. **Testar gestão pós-importação**
   - Marcar presença
   - Criar diário
   - Adicionar notas/pendências
   - Upload de fotos

---

## 6. COMANDOS DE EXECUÇÃO

### Limpar banco:
```sql
-- Executar no Supabase SQL Editor
-- Arquivo: LIMPAR_BANCO.sql
DELETE FROM public.fotos;
DELETE FROM public.pendencias;
DELETE FROM public.notas;
DELETE FROM public.diario_obra;
DELETE FROM public.equipes_presenca;
DELETE FROM public.servicos;
DELETE FROM public.equipes_cadastro;
DELETE FROM public.obras;
```

### Importar obra:
1. Abrir `TEMPLATE_ORCAMENTO_COMPLETO_V3.json`
2. Copiar TODO o conteúdo
3. localhost:3000 → CONFIG
4. Seção "Inicializar Projeto (JSON)"
5. Colar JSON
6. Clicar "Processar e Inicializar"

### Selecionar obra:
1. Clicar "Obra ativa" (canto superior esquerdo)
2. Selecionar "Badida - ParkShopping Barigui"
3. Sistema carrega automaticamente

---

## 7. CHECKLIST DE VALIDAÇÃO

Após importação e seleção, validar:

- [ ] EQUIPES → 8 equipes listadas
- [ ] ORÇAMENTO → 25 serviços listados
- [ ] Cada serviço tem equipe atribuída
- [ ] Cronograma mostra datas previstas
- [ ] Matriz de presença vazia (sem dados fantasma)
- [ ] Diário vazio (pronto para criar)
- [ ] Pendências vazias (pronto para adicionar)
- [ ] Notas vazias (pronto para adicionar)

---

## 8. GLOSSÁRIO

- **EVIS:** Engenharia e Vistorias Integradas de Obras
- **Orçamento:** Proposta completa (serviços + equipes + cronograma)
- **Importação:** Carregar orçamento aprovado no EVIS
- **Gestão:** Uso diário do sistema (diário, presença, fotos)
- **Estado vazio:** Interface sem obra selecionada
- **Supabase:** Banco de dados PostgreSQL na nuvem

---

## 9. REFERÊNCIAS

- Schema oficial: `docs/SCHEMA_OFICIAL_V1.sql`
- Prompt padronização: `orcamentista/docs/PROMPT_PADRONIZACAO_ORCAMENTO.md`
- Template importação: `docs/TEMPLATE_ORCAMENTO_COMPLETO_V3.json`
- Limpeza: `LIMPAR_BANCO.sql`
- Documentação anterior: `docs/01_MAPEAMENTO_SUPABASE.md`

---

**Documento oficial consolidando o entendimento completo do fluxo EVIS.**  
**Próxima etapa:** Executar limpeza e reimportação da obra Badida.
