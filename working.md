## Sessão Atual
- Tarefa: Concluída — execução autônoma noturna de melhorias
- Arquivos em edição: nenhum (todos commitados)
- Checkpoint atual: 7 (commit fix/nightly entregue)
- Próximo passo: Validação visual no browser

## Commits desta branch (feat/orcamentista-integrate-approved-line)
- 360d53f fix(nightly): sbFetch em ConfigPage, resiliência dashboard, CSS no-scrollbar
- 20097a0 feat(platform): espinha dorsal de navegação EVIS — sidebar + dashboard central
- f83f63a feat(orcamentista): integração end-to-end oportunidade → proposta
- a0b05d5 docs(orcamentista): relatório de execução e working.md do refactor Produto/Lab
- 29a8419 chore(orcamentista): adicionar script SQL de limpeza de dados de teste
- 9ac9f6d feat(orcamentista): separar Modo Produto de Modo Laboratório (Fase 3+4)
- 8d47ad9 fix(orcamentista): corrigir erros de API e preparar diagnóstico Fase 0+1
- 629eba3 feat: implement operational Orçamentista IA MVP with HITL pipeline

## O que foi corrigido nesta sessão (360d53f)
- [x] ConfigPage: 6 chamadas fetch() diretas ao Supabase → sbFetch (violação crítica de padrão)
- [x] ConfigPage: 8 ocorrências de tracking-[0.1em] → tracking-widest (Tailwind v4)
- [x] useDashboardCentral: hitlsQ com try/catch + retry:false (tabela orcamentista_hitls inexistente)
- [x] index.css: .no-scrollbar adicionado (usado em GlobalLayout, Fotos, HITLReview, Notas, App)
- [x] tsconfig.json: exclude scratch/ para ignorar arquivos .OURS/.THEIRS de conflito de merge
- [x] TypeScript: zero erros (npx tsc --noEmit limpo)
- [x] Vite build: verde (3783 módulos transformados, 7.62s)

## Validação pendente (Fase 5 — humano)
- [ ] Sidebar navega para todas as rotas (Dashboard, Oportunidades, Orçamentista, Propostas, Obras...)
- [ ] Dashboard carrega sem erro (mesmo sem dados, mostra estado "em ordem")
- [ ] OportunidadeDetalhePage mostra 4 tabs: Resumo, Orçamento IA, Proposta, Atividades
- [ ] OrcamentistaProductView abre em /oportunidades/:id/orcamentista
- [ ] Botão "Voltar ao HUB" funciona
- [ ] Link "Diagnóstico técnico" abre o Lab
- [ ] Console limpo (zero 500 no fluxo principal)

## Fase 2 SQL — Ainda aguardando confirmação
Script: platform/docs/sql_proposals/ORCAMENTISTA_CLEANUP_TEST_DATA.sql
Ação requerida: executar Passo 0 (SELECTs de auditoria), fazer backup, digitar "confirmo"
