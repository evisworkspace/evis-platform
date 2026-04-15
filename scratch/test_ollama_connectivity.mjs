
async function testOllama() {
  console.log('--- Testando Conectividade Ollama ---');
  try {
    const start = Date.now();
    const response = await fetch('http://localhost:11434/api/tags');
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    const data = await response.json();
    const end = Date.now();
    
    console.log('Conexão Estabelecida!');
    console.log('Tempo de resposta:', end - start, 'ms');
    console.log('Modelos disponíveis:', data.models?.map(m => m.name).join(', '));
    
    // Teste de geração simples
    console.log('\n--- Testando Geração (llama3.2) ---');
    const genStart = Date.now();
    const genResponse = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: 'Olá, você está pronto para ajudar no Evis AI? Responda em uma frase curta.',
        stream: false
      })
    });
    const genData = await genResponse.json();
    const genEnd = Date.now();
    console.log('Resposta:', genData.response);
    console.log('Tempo de geração:', genEnd - genStart, 'ms');

  } catch (error) {
    console.error('ERRO: Não foi possível conectar ao Ollama local.');
    console.error('Certifique-se de que o Ollama está rodando na porta 11434.');
    console.error(error.message);
  }
}

testOllama();
