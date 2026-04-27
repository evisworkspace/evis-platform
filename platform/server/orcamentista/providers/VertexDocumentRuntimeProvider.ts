import { GoogleAuth } from 'google-auth-library';
import { Etapa0Schema } from '../contracts';
import { ETAPA0_EXTRACTION_INSTRUCTION, ETAPA0_RESPONSE_SCHEMA } from '../etapa0';
import { DocumentRuntimeProvider } from './DocumentRuntimeProvider';

type DocumentBackend = 'vertex' | 'gemini';

export interface VertexDocumentRuntimeProviderOptions {
  apiKey?: string;
  backend?: DocumentBackend;
  baseUrl?: string;
  disableCache?: boolean;
  fallbackOnCacheError?: boolean;
  location?: string;
  model?: string;
  projectId?: string;
}

type RuntimeFile = { uri: string; mimeType: string; sha256?: string; id?: string };

const BYPASS_CACHE = 'BYPASS_CACHE';

function normalizeModelName(model: string): string {
  return model.replace(/^publishers\/google\/models\//, '').replace(/^models\//, '');
}

function buildParts(files: RuntimeFile[] | undefined, instruction: string) {
  const parts: Array<Record<string, unknown>> = [];

  for (const file of files || []) {
    parts.push({
      fileData: {
        mimeType: file.mimeType,
        fileUri: file.uri,
      },
    });
  }

  parts.push({ text: instruction });
  return parts;
}

function parseJsonResponse<T>(rawText: string): T {
  const trimmed = rawText.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(withoutFence) as T;
}

export class VertexDocumentRuntimeProvider implements DocumentRuntimeProvider {
  private apiKey: string;
  private backend: DocumentBackend;
  private baseUrl: string;
  private disableCache: boolean;
  private fallbackOnCacheError: boolean;
  private location: string;
  private model: string;
  private projectId: string;

  constructor(options: VertexDocumentRuntimeProviderOptions = {}) {
    this.apiKey = options.apiKey || process.env.GEMINI_API_KEY || '';
    this.model = normalizeModelName(options.model || process.env.ORCAMENTISTA_DOCUMENT_MODEL || 'gemini-2.5-pro');
    this.projectId =
      options.projectId ||
      process.env.GOOGLE_CLOUD_PROJECT ||
      process.env.GCP_PROJECT ||
      process.env.GOOGLE_VERTEX_PROJECT ||
      '';
    this.location = options.location || process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || 'us-central1';
    this.backend =
      options.backend ||
      (process.env.ORCAMENTISTA_DOCUMENT_BACKEND as DocumentBackend | undefined) ||
      (this.projectId ? 'vertex' : 'gemini');
    this.baseUrl = options.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.disableCache = options.disableCache ?? process.env.VERTEX_CACHE_DISABLED === 'true';
    this.fallbackOnCacheError = options.fallbackOnCacheError ?? false;
  }

  async createCache(input: {
    workspaceId: string;
    files: Array<{ uri: string; mimeType: string; sha256?: string; id: string }>;
    ttlSeconds?: number;
  }): Promise<{ cacheName: string; expiresAt?: string }> {
    if (this.disableCache || this.backend !== 'vertex') {
      console.log('[DocumentProvider] Cache explicito desativado; usando FileData direto.');
      return { cacheName: BYPASS_CACHE };
    }

    if (!this.projectId) {
      throw new Error('[DocumentProvider] GOOGLE_CLOUD_PROJECT/GCP_PROJECT ausente para Vertex AI.');
    }

    try {
      const token = await this.getAccessToken();
      const parent = `projects/${this.projectId}/locations/${this.location}`;
      const url = `https://${this.location}-aiplatform.googleapis.com/v1/${parent}/cachedContents`;
      const ttlSeconds = Math.max(60, input.ttlSeconds || 3600);
      const body = {
        model: `${parent}/publishers/google/models/${this.model}`,
        displayName: `evis-${input.workspaceId}`.slice(0, 128),
        ttl: `${ttlSeconds}s`,
        contents: [
          {
            role: 'user',
            parts: buildParts(input.files, 'Documentos tecnicos da obra para extracao factual ETAPA 0.'),
          },
        ],
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`[DocumentProvider] Falha ao criar cache Vertex: ${response.status} - ${details}`);
      }

      const data = await response.json();
      if (!data?.name) {
        throw new Error('[DocumentProvider] Vertex nao retornou nome do cache.');
      }

      return { cacheName: data.name, expiresAt: data.expireTime };
    } catch (error) {
      if (!this.fallbackOnCacheError) {
        throw error;
      }

      console.warn('[DocumentProvider] Cache Vertex falhou; usando FileData direto.', error);
      return { cacheName: BYPASS_CACHE };
    }
  }

  async extractStructured<T>(input: {
    cacheName: string;
    schema: object;
    instruction: string;
    filesBackup?: Array<{ uri: string; mimeType: string }>;
  }): Promise<T> {
    console.log(`[DocumentProvider] Extraindo JSON estruturado via ${this.backend}/${this.model}.`);

    const body = this.buildGenerateBody(input);
    const response =
      this.backend === 'vertex'
        ? await this.generateWithVertex(body)
        : await this.generateWithGeminiApi(body);

    const rawText = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error('[DocumentProvider] Resposta vazia do modelo.');
    }

    return parseJsonResponse<T>(rawText);
  }

  async extractEtapa0(input: {
    cacheName: string;
    filesBackup?: Array<{ uri: string; mimeType: string }>;
    instruction?: string;
    schema?: object;
  }): Promise<Etapa0Schema> {
    return this.extractStructured<Etapa0Schema>({
      cacheName: input.cacheName,
      filesBackup: input.filesBackup,
      instruction: input.instruction || ETAPA0_EXTRACTION_INSTRUCTION,
      schema: input.schema || ETAPA0_RESPONSE_SCHEMA,
    });
  }

  private buildGenerateBody(input: {
    cacheName: string;
    schema: object;
    instruction: string;
    filesBackup?: Array<{ uri: string; mimeType: string }>;
  }) {
    const usingCache = input.cacheName && input.cacheName !== BYPASS_CACHE;
    const contents = [
      {
        role: 'user',
        parts: usingCache ? [{ text: input.instruction }] : buildParts(input.filesBackup, input.instruction),
      },
    ];

    return {
      ...(usingCache ? { cachedContent: input.cacheName } : {}),
      contents,
      generationConfig: {
        temperature: 0,
        responseMimeType: 'application/json',
        responseSchema: input.schema,
      },
    };
  }

  private async generateWithGeminiApi(body: Record<string, unknown>) {
    if (!this.apiKey) {
      throw new Error('[DocumentProvider] GEMINI_API_KEY ausente.');
    }

    const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`[DocumentProvider] Falha Gemini API: ${response.status} - ${details}`);
    }

    return response.json();
  }

  private async generateWithVertex(body: Record<string, unknown>) {
    if (!this.projectId) {
      throw new Error('[DocumentProvider] GOOGLE_CLOUD_PROJECT/GCP_PROJECT ausente para Vertex AI.');
    }

    const token = await this.getAccessToken();
    const url =
      `https://${this.location}-aiplatform.googleapis.com/v1/projects/${this.projectId}` +
      `/locations/${this.location}/publishers/google/models/${this.model}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`[DocumentProvider] Falha Vertex AI: ${response.status} - ${details}`);
    }

    return response.json();
  }

  private async getAccessToken(): Promise<string> {
    const auth = new GoogleAuth({ scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token.token) {
      throw new Error('[DocumentProvider] ADC nao retornou access token.');
    }
    return token.token;
  }
}
