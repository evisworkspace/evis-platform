import { VertexDocumentRuntimeProvider } from '../orcamentista/providers/VertexDocumentRuntimeProvider';
import { ETAPA0_EXTRACTION_INSTRUCTION, ETAPA0_RESPONSE_SCHEMA, validateEtapa0 } from '../orcamentista/etapa0';

async function runSpike() {
  console.log('🚀 Iniciando Spike ETAPA 0 Real (Vertex Cache + Structured Output)\n');

  // 1. Em um cenário real de produção com Vertex, os arquivos já teriam sido 
  // submetidos para o GCS na etapa de registry/upload. 
  // Para este spike de validação da borda do provedor, vamos simular que eles 
  // já estão no bucket GCS.
  const files = [
    {
      id: 'f1',
      uri: process.env.TEST_GCS_URI || 'gs://evis-ai-bucket-orcam/projetos/teste_padrao.pdf',
      mimeType: 'application/pdf',
      sha256: 'manual-test',
    },
  ];

  if (files.length === 0) {
    console.error('❌ ERRO: Nenhuma URI GCS fornecida.');
    return;
  }

  console.log(`📁 Encontradas ${files.length} referências GCS. Preparando provider...`);
  
  // Como podemos não ter credenciais GCP ativas (ADC) no ambiente local do usuário, 
  // vamos tentar rodar, mas capturar o erro gracefully caso falhe a autenticação.
  const provider = new VertexDocumentRuntimeProvider();

  let cacheResult;
  try {
    // 2. VertexDocumentRuntimeProvider.createCache(...)
    console.log('\n[Passo 1: createCache] Executando chamada ao Vertex AI para contexto...');
    const startTimeCache = performance.now();
    cacheResult = await provider.createCache({ workspaceId: 'ws-test', files, ttlSeconds: 3600 });
    const cacheLatency = Math.round(performance.now() - startTimeCache);
    
    console.log('✅ Cache criado com sucesso:');
    console.log(`   - Name: ${cacheResult.cacheName}`);
    console.log(`   - Expires: ${cacheResult.expiresAt}`);
    console.log(`   - Latência: ${cacheLatency}ms`);
  } catch (error: any) {
    console.error('\n❌ ERRO no [createCache]. Verifique as credenciais ADC (gcloud auth application-default login) ou o formato das URIs (GS vs Local).');
    console.error(error.message);
    return; // Para o spike
  }

  let etapa0;
  try {
    // 3. VertexDocumentRuntimeProvider.extractEtapa0(...)
    console.log('\n[Passo 2: extractEtapa0] Solicitando Structured Output puro (Temperatura 0)...');
    const startTimeExt = performance.now();
    etapa0 = await provider.extractEtapa0({
      cacheName: cacheResult.cacheName,
      schema: ETAPA0_RESPONSE_SCHEMA,
      instruction: ETAPA0_EXTRACTION_INSTRUCTION,
      filesBackup: files // Enviado para caso VERTEX_CACHE_DISABLED=true
    });
    const extLatency = Math.round(performance.now() - startTimeExt);
    console.log('✅ Extração finalizada com sucesso!');
    console.log(`   - Latência: ${extLatency}ms\n`);
  } catch (error: any) {
    console.error('\n❌ ERRO no [extractEtapa0]. Falha no Structured Output ou API de LLM.');
    console.error(error.message);
    return;
  }

  // 4. validateEtapa0(etapa0)
  console.log('[Passo 3: validateEtapa0] Verificando contrato...');
  const validation = await validateEtapa0(etapa0);
  
  if (validation.status === 'ERRO_ETAPA_0') {
    console.error('❌ ERRO na Validação: O JSON não atendeu aos critérios mínimos.');
    console.error(validation.errors);
    return;
  }
  console.log(`✅ Validação passou. Status do grafo: ${validation.status}`);

  // 5. Interrupt & Resumo
  console.log('\n======================================================');
  console.log('🎯 RESUMO DO SPIKE: ETAPA 0');
  console.log('======================================================');
  console.log(`Cache Usado: ${cacheResult.cacheName}`);
  console.log(`Qtd Documentos extraídos: ${etapa0.documentos?.length || 0}`);
  console.log(`Qtd Ambientes identificados: ${etapa0.ambientes?.length || 0}`);
  console.log(`Qtd Evidências rastreáveis: ${etapa0.evidencias?.length || 0}`);
  console.log(`Qtd Pendências HITL: ${etapa0.pendencias_hitl?.length || 0}`);
  if (validation.warnings.length > 0) {
    console.log(`\n⚠️ Warnings: ${validation.warnings.join(', ')}`);
  }
  console.log('======================================================');
  console.log('🏁 RESULTADO: SUCESSO E-2-E. Grafo aguardando interrupt().');
}

runSpike().catch(console.error);
