# 📂 Skill: Índice de Validação Cruzada

**Descrição**: Esta skill serve como o "Mapa de Dependências" do projeto. Ela deve ser consultada por qualquer outro Agente ou Skill ANTES de realizar uma alteração para identificar quais arquivos e regras de validação são afetados.

## 🗺️ Mapa de Domínios e Arquivos Críticos

### 1. Domínio: Dados e Estado (Frontend)
- **Arquivo Principal**: `src/AppContext.tsx`
- **Tipagem**: `src/types.ts`
- **Validação Necessária**: Se alterar o estado, verifique se os tipos em `types.ts` foram atualizados e se o `AppContext` reflete a mudança.

### 2. Domínio: Backend e IA (Servidor)
- **Orquestrador**: `server/agents/orchestrator.ts`
- **Sub-Agentes**: `server/agents/{servicos, equipes, notas}.ts`
- **Ferramentas**: `server/tools/supabaseTools.ts`
- **Validação Necessária**: Se alterar a lógica de um agente, valide contra `skills/{domínio}/SKILL.md` e execute testes no `evals/golden_set.json`.

### 3. Domínio: Regras de Negócio (Skills)
- **Localização**: `/skills/`
- **Validação Necessária**: Alterações em lógica de extração devem ser refletidas no `SKILL.md` correspondente.

### 4. Domínio: Persistência (Supabase)
- **API Cliente**: `src/lib/api.ts`
- **API Servidor**: `server/tools/supabaseTools.ts`
- **Validação Necessária**: Mudanças em nomes de tabelas ou colunas exigem atualização dupla (Front/Back) e verificação do RLS no Supabase.

## 🔍 Protocolo de Consulta Pré-Ação
Sempre que uma tarefa for iniciada:
1. **Identificar o Alvo**: Qual arquivo/função será alterado?
2. **Consultar este Índice**: Procure o domínio correspondente acima.
3. **Listar Dependências**: Quais outros arquivos o índice recomenda ler? (Ex: Se alterar `Diario.tsx`, leia `AIAnalysis.tsx` e `SKILL.md` de notas).
4. **Execução Cirúrgica**: Leia apenas os arquivos identificados, economizando contexto e evitando alucinações por falta de visão do "todo".

## 📑 Tabela de Referência Rápida (Scripts de Validação)
| Ação | Arquivo de Validação | Regra Crítica |
|:---|:---|:---|
| Manipular Datas | `src/lib/dateUtils.ts` | Use sempre a Semana Relativa (S1, S2...) |
| Alterar UI | `src/index.css` | Mantenha as cores `--brand-green` e `--color-bg` |
| Novo Agente | `server/agents/orchestrator.ts` | Deve ser adicionado ao fluxo sequencial |
| Sync Supabase | `src/hooks/useRealtimeSync.ts` | Garanta que o canal da `obra_id` esteja ativo |

---
*Este índice deve ser atualizado sempre que uma nova estrutura de pastas ou domínio de negócio for adicionado.*
