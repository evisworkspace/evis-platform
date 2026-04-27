import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';
import {
  WorkspaceAttachmentCategory,
  listOrcamentistaWorkspaces,
  listWorkspaceAttachmentFiles,
} from './workspaces';

export interface GcsWorkspaceRuntimeFile {
  id: string;
  mimeType: string;
  nome: string;
  relativePath: string;
  sha256: string;
  tamanhoBytes: number;
  uri: string;
}

export interface SyncWorkspaceToGcsInput {
  bucket?: string;
  categorias?: WorkspaceAttachmentCategory[];
  maxFiles?: number;
  prefix?: string;
  workspaceId: string;
}

export interface SyncWorkspaceToGcsResult {
  bucket: string;
  files: GcsWorkspaceRuntimeFile[];
  prefix: string;
  skipped: Array<{ relativePath: string; reason: string }>;
}

const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
]);

function defaultBucket(): string {
  const bucket = process.env.ORCAMENTISTA_GCS_BUCKET || process.env.TEST_GCS_BUCKET || 'evis-ai-bucket-orcam';
  return bucket.replace(/^gs:\/\//, '').replace(/\/.*$/, '');
}

function sha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function getWorkspacePath(workspaceId: string): string {
  const workspace = listOrcamentistaWorkspaces().find((item) => item.id === workspaceId);
  if (!workspace) {
    throw new Error(`Workspace nao encontrado: ${workspaceId}`);
  }
  return workspace.fullPath;
}

function buildObjectName(prefix: string, workspaceId: string, relativePath: string): string {
  return [prefix.replace(/^\/+|\/+$/g, ''), workspaceId, relativePath.replace(/\\/g, '/')]
    .filter(Boolean)
    .join('/');
}

async function getStorageAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    scopes: [
      'https://www.googleapis.com/auth/cloud-platform',
      'https://www.googleapis.com/auth/devstorage.read_write',
    ],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) {
    throw new Error('ADC nao retornou access token para o Google Cloud Storage.');
  }
  return token.token;
}

async function uploadToGcs(input: {
  bucket: string;
  buffer: Buffer;
  contentType: string;
  objectName: string;
  token: string;
}): Promise<string> {
  const url =
    `https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(input.bucket)}/o` +
    `?uploadType=media&name=${encodeURIComponent(input.objectName)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.token}`,
      'Content-Type': input.contentType,
    },
    body: input.buffer as unknown as BodyInit,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Falha ao subir ${input.objectName} para GCS: ${response.status} - ${details}`);
  }

  const data = await response.json();
  return `gs://${input.bucket}/${data.name || input.objectName}`;
}

export async function syncWorkspaceAttachmentsToGcs(
  input: SyncWorkspaceToGcsInput
): Promise<SyncWorkspaceToGcsResult> {
  const workspacePath = getWorkspacePath(input.workspaceId);
  const bucket = input.bucket || defaultBucket();
  const prefix = input.prefix || process.env.ORCAMENTISTA_GCS_PREFIX || 'orcamentista-workspaces';
  const categorias = input.categorias || ['projeto', 'referencias', 'fornecedores'];
  const maxFiles = input.maxFiles || Number(process.env.ORCAMENTISTA_GCS_MAX_FILES || 20);
  const token = await getStorageAccessToken();

  const files = listWorkspaceAttachmentFiles(input.workspaceId).filter((file) => categorias.includes(file.categoria));
  const synced: GcsWorkspaceRuntimeFile[] = [];
  const skipped: Array<{ relativePath: string; reason: string }> = [];

  for (const file of files) {
    if (synced.length >= maxFiles) {
      skipped.push({ relativePath: file.relativePath, reason: `limite de ${maxFiles} arquivos para sync GCS` });
      continue;
    }

    if (!SUPPORTED_MIME_TYPES.has(file.mimeType)) {
      skipped.push({ relativePath: file.relativePath, reason: `mimeType nao suportado: ${file.mimeType}` });
      continue;
    }

    const absolutePath = path.join(workspacePath, file.relativePath);
    const buffer = fs.readFileSync(absolutePath);
    const digest = sha256(buffer);
    const objectName = buildObjectName(prefix, input.workspaceId, file.relativePath);
    const uri = await uploadToGcs({
      bucket,
      buffer,
      contentType: file.mimeType,
      objectName,
      token,
    });

    synced.push({
      id: `${file.relativePath}:${digest.slice(0, 12)}`,
      mimeType: file.mimeType,
      nome: file.nome,
      relativePath: file.relativePath,
      sha256: digest,
      tamanhoBytes: file.tamanhoBytes,
      uri,
    });
  }

  return { bucket, files: synced, prefix, skipped };
}
