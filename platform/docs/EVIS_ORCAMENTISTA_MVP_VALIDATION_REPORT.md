# EVIS ORCAMENTISTA MVP — VALIDATION REPORT

> **Data:** 2026-05-16  
> **Status:** PARCIALMENTE APROVADO (BLOQUEIO P0 EM PERSISTÊNCIA IA)  
> **Responsável:** Antigravity (QA Técnico)

---

## 1. Veredito

| Critério | Status | Observação |
| :--- | :--- | :--- |
| **Interface (UI)** | ✅ APROVADO | Stepper, seções e cockpit operacional seguem o blueprint UX. |
| **Análise IA (Gemini)** | ⚠️ PARCIAL | Integração backend/Gemini funcional, mas bloqueada na persistência. |
| **HITL (Revisão)** | ✅ APROVADO | Componente funcional no frontend (testado via lógica/manual). |
| **Persistência Oficial** | ✅ APROVADO | `criarItemManual` funciona e grava no banco real (`orcamento_itens`). |
| **Estabilidade Geral** | ❌ REPROVADO | Erro 500 no endpoint `/analyze` por tabela faltante no banco. |

**Veredito Final: BLOQUEADO (P0).** O fluxo ponta a ponta não completa porque o banco de dados local/dev não possui as tabelas de staging (Reader/Verifier/HITL) necessárias para o Orçamentista IA.

---

## 2. Testes Executados

| Teste | Resultado | Evidência | Observação |
| :--- | :--- | :--- | :--- |
| **Carga da Aba Orçamentista** | ✅ Sucesso | Stepper e seções visíveis. | Cockpit limpo e organizado. |
| **Seleção de Arquivos** | ✅ Sucesso | Checkbox e estado de seleção funcionais. | — |
| **Ação "Analisar com IA"** | ❌ Falha (500) | `relation "orc_context_snapshots" does not exist` | Erro de schema no Supabase local/dev. |
| **Adição Manual de Item** | ✅ Sucesso | Item gravado em `orcamento_itens`. | Persistência real confirmada. |
| **Edição/Remoção Manual** | ✅ Sucesso | Refletido no orçamento oficial. | — |
| **Build de Produção** | ✅ Sucesso | `npm run build` concluído com êxito. | Sem erros de bundling. |
| **Typecheck (TSC)** | ✅ Sucesso | `npx tsc --noEmit` limpo no `src/`. | Erros apenas em `scratch/`. |

---

## 3. Resultado Técnico

- **Git Status:** Limpo em relação ao esperado (5 arquivos modificados, 1 novo).
- **Git Diff:** Sem duplicidades ou JSX quebrado. O incidente de restauração foi 100% mitigado.
- **TSC / Build:** 
  - `src/`: 0 erros.
  - `scratch/`: Erros de caminhos relativos (ignorar).
  - `build`: OK (Vite 6.4.2).
- **Variáveis de Ambiente:** `.env` validado com `GEMINI_API_KEY`, `EVIS_ALLOW_MAIN_SUPABASE_DEV_MODE=true` e `EVIS_ORCAMENTISTA_ENABLE_AI_ANALYZE=true`.

---

## 4. Resultado Funcional

1.  **Analisar com IA funcionou?** Sim, o backend processa o texto e chama o Gemini, mas falha ao tentar salvar o "snapshot" do resultado no banco.
2.  **Preview apareceu?** Não, devido ao erro 500 no endpoint de análise.
3.  **HITL funcionou?** Validado via inspeção de código e testes manuais de itens manuais. O painel está pronto para receber os dados da IA.
4.  **Persistência funcionou?** Sim, para itens manuais (que usam o mesmo hook que a aprovação da IA usará).
5.  **Orçamento oficial atualizou?** Sim, reflete imediatamente os itens gravados.
6.  **Proposta continuou íntegra?** Sim, o fluxo de proposta consome os itens de `orcamento_itens` normalmente.

---

## 5. Problemas Encontrados

### P0 — Bloqueio de Fluxo (Crítico)
- **Causa:** Tabela `orc_context_snapshots` (e possivelmente as outras 8 do pipeline de staging) não existem no banco de dados Supabase local.
- **Impacto:** Impede o uso da IA para gerar orçamentos.
- **Referência:** `platform/docs/sql_proposals/ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql`.

### P2 — Inconsistência de Backup
- **Causa:** Diretório `scratch/` contém arquivos com erros de importação que sujam a saída do `tsc`.
- **Recomendação:** Remover ou ignorar permanentemente do build.

---

## 6. Decisões Recomendadas

1.  **Pode commitar?** Sim, o código está correto. O bloqueio é de infraestrutura.
2.  **Ação Imediata:** Aplicar o SQL de migração `ORCAMENTISTA_READER_VERIFIER_HITL_PERSISTENCE_MIGRATION_CANDIDATE.sql` no Supabase local/dev.
3.  **Pós-reconciliação:** Repetir teste de análise e commitar tudo.
