# 🛠️ Skill: Executor Autônomo de Plano (Terminal)

Esta skill permite que a IA atue como o "braço executor" (⚡ OPENCODE) descrito no plano de execução, realizando tarefas técnicas de forma autônoma via terminal.

## 🎯 Objetivo
Transformar o `docs/PLANO_EXECUCAO.md` em uma fila de execução automatizada, focando em tarefas destinadas a modelos locais (Ollama) ou ferramentas de terminal (OpenCode).

## 📋 Protocolo de Atuação

### 1. Fase de Reconhecimento
- Ler o arquivo `docs/PLANO_EXECUCAO.md`.
- **Consultar `skills/INDICE_VALIDACAO.md`** para identificar arquivos dependentes ou regras de segurança associadas ao domínio da tarefa.
- Identificar a próxima tarefa pendente `[ ]`.
- Verificar se o **Agente** ou **Executor** é compatível com o ambiente local (🦙 OLLAMA ou ⚡ OPENCODE).

### 2. Ciclo de Execução Autônoma
Para cada tarefa identificada:
1. **Preparação**: Analisar os arquivos mencionados e os prompts sugeridos no plano.
2. **Ação (Terminal/File)**: 
   - Se for uma tarefa de código (F1.1, F1.2, etc), realizar as alterações seguindo exatamente as instruções do prompt contido no plano.
   - Usar comandos de terminal para verificar erros (`npm run lint`, `tsc`, etc).
3. **Validação**: Verificar se o **Critério de Conclusão** definido na tarefa foi atingido.
4. **Persistência**: 
   - Atualizar o status da tarefa no arquivo `docs/PLANO_EXECUCAO.md` de `[ ]` para `[x]`.
   - Adicionar uma breve nota de log abaixo da tarefa indicando o que foi feito.

### 3. Regras de Segurança e Autonomia
- **Modo Autônomo**: Quando ativada, a IA não interromperá o fluxo para perguntar "posso fazer a próxima?", a menos que encontre um erro bloqueante ou ambiguidade no plano.
- **Respeito ao Plano**: Não inventar novas tarefas. Seguir estritamente o que está escrito no Markdown.

## 🚀 Como Iniciar
Para ativar esta skill, o usuário deve enviar o comando:
> "Ativar executor autônomo baseado no plano."

---

## 🧠 Orquestrador Semântico — Arquitetura de 8 Camadas

Implementado em `server/agents/orchestrator.ts`. O ponto de entrada é `processarDia()`.

### Camadas

| # | Nome | Responsabilidade |
|---|---|---|
| 0 | Normalização | Limpa ruídos de áudio, remove honoríficos, une entradas do dia |
| 1 | Leitura semântica | Detecta eventos (execucao_servico, problema_obra, pedido_cliente…) |
| 2 | Classificação por domínio | Mapeia eventos para domínios (equipe, orcamento, cronograma…) |
| 3 | Resolução de entidade | Busca no Supabase por nome exato → alias → semântico |
| 4 | Extração de intenção | Gera ações concretas com `requer_input_gestor` quando incerto |
| 5 | Filtro de relevância | Remove duplicatas e ações sem evidência real |
| 6 | Mapa de impacto | Encadeamento: orcamento → cronograma, presença → serviços |
| 7 | Distribuição | Monta `Dispatch[]` por subagente |
| 8 | Saída HITL | Resumo + thresholds para confirmação do gestor |

### Thresholds de confiança

| Faixa | Comportamento no HITL |
|---|---|
| ≥ 0.85 | Check marcado — gestor confirma |
| 0.65–0.84 | Check marcado com ⚠️ — gestor revisa |
| < 0.65 | Campo aberto com pergunta direta ao gestor |

### Métodos de resolução de entidade

- `exato` (0.95) — nome bate exatamente no banco
- `alias` (0.85) — bate em `aliases[]` cadastrado
- `semantico` (0.65–0.80) — match parcial no nome
- `nao_resolvido` (0.0) — não identificado → `requer_input_gestor: true`

### Aprendizado de aliases

Novos aliases descobertos nas narrativas devem ser adicionados via:
```sql
UPDATE public.servicos SET aliases = aliases || ARRAY['novo_alias'] WHERE id = '...';
UPDATE public.equipes_cadastro SET aliases = aliases || ARRAY['novo_alias'] WHERE id = '...';
```
O script de seed está em `docs/03_ALIASES_SEMANTICOS.sql`.

---
*Nota: Esta skill foi gerada automaticamente para alinhar a IA com o fluxo de trabalho do Evis AI.*
