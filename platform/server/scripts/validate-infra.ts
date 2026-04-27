import { GoogleAuth } from 'google-auth-library';
import { VertexDocumentRuntimeProvider } from '../orcamentista/providers/VertexDocumentRuntimeProvider';

// Helper de log padronizado
function logCheck(name: string, status: 'RUNNING' | 'OK' | 'FAIL', details?: any) {
  const symbol = status === 'OK' ? '✅' : status === 'FAIL' ? '❌' : '🔄';
  console.log(`${symbol} [${name}] ${status}`);
  if (details && status === 'FAIL') console.error(details);
}

// Configs reais para o teste (Devem ser substituídas por URIs válidas no bucket do cliente)
const TEST_BUCKET = process.env.TEST_GCS_BUCKET || process.env.ORCAMENTISTA_GCS_BUCKET || 'evis-ai-bucket-orcam';
const TEST_OBJECT = process.env.TEST_GCS_OBJECT || 'projetos/teste_padrao.pdf';
const TEST_URI = `gs://${TEST_BUCKET}/${TEST_OBJECT}`;

const TEST_SCHEMA = {
  type: "OBJECT",
  properties: {
    status_extracao: { type: "STRING" },
    documentos: { type: "ARRAY", items: { type: "STRING" } }
  },
  required: ["status_extracao", "documentos"]
};

// Validador semântico estrito do contrato
function validateStrict(data: any, schema: any, path: string = 'root'): { valid: boolean; error?: string } {
  if (!schema) return { valid: true };

  if (schema.type === 'OBJECT') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) return { valid: false, error: `${path} deve ser um objeto.` };
    const schemaKeys = Object.keys(schema.properties || {});
    const dataKeys = Object.keys(data);
    
    for (const key of dataKeys) {
      if (!schemaKeys.includes(key)) return { valid: false, error: `${path} possui chave extra/não declarada: ${key}` };
    }
    for (const req of (schema.required || [])) {
      if (!(req in data)) return { valid: false, error: `${path} não possui a chave obrigatória: ${req}` };
    }
    for (const key of schemaKeys) {
      if (key in data) {
        const propRes = validateStrict(data[key], schema.properties[key], `${path}.${key}`);
        if (!propRes.valid) return propRes;
      }
    }
    return { valid: true };
  } else if (schema.type === 'ARRAY') {
    if (!Array.isArray(data)) return { valid: false, error: `${path} deve ser um array.` };
    if (schema.items) {
      for (let i = 0; i < data.length; i++) {
        const itemRes = validateStrict(data[i], schema.items, `${path}[${i}]`);
        if (!itemRes.valid) return itemRes;
      }
    }
    return { valid: true };
  } else if (schema.type === 'STRING') {
    if (typeof data !== 'string') return { valid: false, error: `${path} deve ser do tipo STRING. Recebido: ${typeof data}` };
    return { valid: true };
  } else if (schema.type === 'NUMBER') {
    if (typeof data !== 'number') return { valid: false, error: `${path} deve ser do tipo NUMBER. Recebido: ${typeof data}` };
    return { valid: true };
  } else if (schema.type === 'BOOLEAN') {
    if (typeof data !== 'boolean') return { valid: false, error: `${path} deve ser do tipo BOOLEAN. Recebido: ${typeof data}` };
    return { valid: true };
  }
  return { valid: true };
}

async function checkGcsAccess(auth: GoogleAuth, bucket: string, object: string) {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const url = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/${encodeURIComponent(object)}`;
  
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token.token}` }
  });

  if (!res.ok) {
    throw new Error(`Acesso negado ou arquivo não encontrado: ${res.status} - ${await res.text()}`);
  }
  const data = await res.json();
  return data;
}

async function runInfraValidation() {
  console.log('======================================================');
  console.log('🚀 INICIANDO MATRIZ DE ACEITAÇÃO DE INFRAESTRUTURA');
  console.log('======================================================\n');

  const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
  let provider = new VertexDocumentRuntimeProvider();
  let cacheName = '';

  // 1. ADC_OK
  logCheck('ADC_OK', 'RUNNING');
  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) throw new Error('Token vazio.');
    logCheck('ADC_OK', 'OK');
  } catch (err) {
    logCheck('ADC_OK', 'FAIL', err);
    console.log('\n🛑 Abortando matriz: Sem ADC configurado, nada mais funcionará. (Rode gcloud auth application-default login)');
    return;
  }

  // 2. GCS_URI_OK
  logCheck('GCS_URI_OK', 'RUNNING');
  try {
    const meta = await checkGcsAccess(auth, TEST_BUCKET, TEST_OBJECT);
    if (meta.contentType !== 'application/pdf') {
      console.warn(`Aviso: MIME Type não é PDF (${meta.contentType})`);
    }
    logCheck('GCS_URI_OK', 'OK');
  } catch (err) {
    logCheck('GCS_URI_OK', 'FAIL', err);
    console.log(`\n⚠️ O arquivo ${TEST_URI} não pôde ser lido. Pulando testes de cache real.`);
  }

  // 3. CACHE_CREATE_OK
  logCheck('CACHE_CREATE_OK', 'RUNNING');
  try {
    const cacheResult = await provider.createCache({
      workspaceId: 'infra-test',
      files: [{ id: 'f1', uri: TEST_URI, mimeType: 'application/pdf' }],
      ttlSeconds: 600 // 10 min
    });
    cacheName = cacheResult.cacheName;
    logCheck('CACHE_CREATE_OK', 'OK');
  } catch (err) {
    logCheck('CACHE_CREATE_OK', 'FAIL', err);
  }

  // 4. CACHE_NAME_PERSIST_OK
  logCheck('CACHE_NAME_PERSIST_OK', 'RUNNING');
  if (cacheName && cacheName.startsWith('projects/') && cacheName.includes('/cachedContents/')) {
    logCheck('CACHE_NAME_PERSIST_OK', 'OK');
  } else {
    logCheck('CACHE_NAME_PERSIST_OK', 'FAIL', `Nome de cache ausente ou inválido.`);
  }

  // 5. GENERATE_WITH_CACHE_OK & 6. JSON_SCHEMA_OK
  logCheck('GENERATE_WITH_CACHE_OK', 'RUNNING');
  logCheck('JSON_SCHEMA_OK', 'RUNNING');
  try {
    const payload: any = await provider.extractStructured<any>({
      cacheName,
      schema: TEST_SCHEMA,
      instruction: "Responda com 'sucesso' em status_extracao e liste os nomes de projetos que encontrar no documento. Retorne um JSON válido."
    });
    
    logCheck('GENERATE_WITH_CACHE_OK', 'OK');
    
    // Validando o JSON semântica e estritamente
    const valResult = validateStrict(payload, TEST_SCHEMA);
    if (valResult.valid) {
      logCheck('JSON_SCHEMA_OK', 'OK');
    } else {
      logCheck('JSON_SCHEMA_OK', 'FAIL', `Objeto viola regras do Schema: ${valResult.error}`);
    }
  } catch (err) {
    logCheck('GENERATE_WITH_CACHE_OK', 'FAIL', err);
    logCheck('JSON_SCHEMA_OK', 'FAIL', 'Extração falhou antes de validar o Schema.');
  }

  // 7. BYPASS_MODE_OK
  logCheck('BYPASS_MODE_OK', 'RUNNING');
  try {
    // Passando via injeção de dependência em vez de mutar global
    const bypassProvider = new VertexDocumentRuntimeProvider({ disableCache: true }); 
    
    const bypassCache = await bypassProvider.createCache({
      workspaceId: 'infra-test-bypass',
      files: [{ id: 'f1', uri: TEST_URI, mimeType: 'application/pdf' }]
    });

    if (bypassCache.cacheName !== 'BYPASS_CACHE') {
      throw new Error('Fallback de cache falhou.');
    }

    const bypassExtract: any = await bypassProvider.extractStructured<any>({
      cacheName: bypassCache.cacheName,
      schema: TEST_SCHEMA,
      instruction: "Responda de forma curta confirmando que conseguiu ler o arquivo sem cache. Retorne os projetos encontrados.",
      filesBackup: [{ uri: TEST_URI, mimeType: 'application/pdf' }]
    });

    const bypassValResult = validateStrict(bypassExtract, TEST_SCHEMA);
    if (bypassValResult.valid) {
      logCheck('BYPASS_MODE_OK', 'OK');
    } else {
      logCheck('BYPASS_MODE_OK', 'FAIL', `JSON Schema violado no bypass: ${bypassValResult.error}`);
    }
  } catch (err) {
    logCheck('BYPASS_MODE_OK', 'FAIL', err);
  }

  console.log('\n======================================================');
  console.log('🎯 MATRIZ CONCLUÍDA');
  console.log('======================================================');
}

runInfraValidation().catch(console.error);
