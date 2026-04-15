# 🧠 Evis AI — Memória Técnica

Este documento consolida a arquitetura e decisões de design para garantir a continuidade do desenvolvimento sem alucinações ou redundâncias.

## 📂 Arquitetura de Pastas
- `/server`: Motor de processamento IA (Node/Express).
  - `/agents`: Lógica individual por domínio (Serviços, Equipes, Notas).
  - `/routes`: Endpoints da API.
  - `/tools`: Utilitários ACI (Ex: integração direta com Supabase).
- `/skills`: Protocolos em Markdown que definem o comportamento de cada agente.
- `/evals`: Golden Set e logs de validação para garantir precisão técnica.
- `/src/lib`: Funções utilitárias compartilhadas entre Front e Back.

## 🔄 Fluxo de Dados (Diário de Obra)
1. **Entrada**: Narrativa de voz (transcrita) enviada ao backend.
2. **Contextualização**: O servidor busca no Supabase o estado atual da obra (o que está em andamento, quem está escalado).
3. **Orquestração**: O `orchestrator.ts` identifica quais domínios foram citados na narrativa.
4. **Processamento Sequencial**:
   - Agente de Serviços (usando `qwen2.5-coder`) processa avanços.
   - Agente de Equipes (usando `llama3.2`) processa presenças.
   - Agente de Notas processa pendências e observações.
5. **Consolidação**: Retorno de um JSON estruturado para o Frontend.
6. **HITL (Human-In-The-Loop)**: O usuário revisa e confirma os dados na interface antes de salvar definitivamente no Supabase.

## 🤖 Modelos Recomendados
- **qwen2.5-coder:7b**: Melhor para lógica, scripts e extrações que exigem precisão matemática/percentual.
- **llama3.2:3b/latest**: Ótimo para lidar com linguagem natural, nomes de pessoas e resumos de notas.
- **Minimax**: Utilizado via OpenCode para componentes de interface e design "premium".

## 🛡️ Prevenção de Hallucinação
- **Contexto Blindado**: A IA nunca deve "adivinhar" IDs. Ela deve sempre receber a lista de serviços ativos do banco antes de tentar mapear um avanço.
- **Validação de Tipagem**: O uso de TypeScript em todo o projeto garante que as interfaces de dados sejam respeitadas entre Agentes e UI.
- **Golden Set**: Sempre rode os testes em `/evals` após modificar o prompt de um agente.

---
*Atualizado em: 13/04/2026*
