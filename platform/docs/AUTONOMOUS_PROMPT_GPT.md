# Contexto
Você está operando no repositório do "Evis AI", uma plataforma SaaS para engenharia e construção civil.
Nosso objetivo esta noite é refinar e estabilizar o pipeline do "Orçamentista IA".
Eu acabei de implementar um roteador multi-provedor (Gemini, Ollama, OpenRouter) em `server/services/llmRouter.ts` e um script de testes autônomo em `scripts/test-orcamentista-nightly.ts`.

# Sua Missão
Você deve agir de forma autônoma para refinar a precisão e a estabilidade da extração de itens de orçamento.

1. **Rodar o Pipeline:**
   Execute repetidas vezes o comando `npx tsx scripts/test-orcamentista-nightly.ts`.
   
2. **Analisar Resultados:**
   Verifique o JSON gerado na pasta `server/scripts/output/`. Analise os `warnings`, a `confianca` dos itens e se o formato JSON está sendo quebrado.

3. **Refinar Prompts e Parsing:**
   Se a IA falhar em extrair categorias, unidades ou quantidades corretamente:
   - Edite `server/services/geminiOrcamentista.ts` para melhorar o `SYSTEM_PROMPT`.
   - Melhore as tratativas de regex e parse do JSON.
   
4. **Otimização Multi-Model:**
   Certifique-se de que a lógica em `geminiOrcamentista.ts` consiga extrair as respostas de forma confiável tanto do Ollama (Llama 3.1) local quanto do OpenRouter (Minimax). 

5. **Regras de Código:**
   - NÃO altere a arquitetura do banco de dados (Supabase).
   - O Orçamentista deve retornar apenas JSON puro no output do LLM.
   - Sempre utilize o script de testes para validar suas mudanças.

# Como proceder
Inicie imediatamente rodando o comando `npx tsx scripts/test-orcamentista-nightly.ts`. Analise o primeiro output e planeje suas melhorias no prompt ou na lógica de parse. Me atualize a cada 3 iterações bem sucedidas.
