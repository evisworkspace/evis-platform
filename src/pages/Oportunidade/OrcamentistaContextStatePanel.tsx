import { AlertTriangle, CheckCircle2, Database, FileText, FolderOpen, Loader2, Lock, Upload } from 'lucide-react';
import type { OpportunityFile } from '../../types';
import {
  useOrcamentistaWorkspaceState,
  type OrcamentistaWorkspaceAttachment,
} from '../../hooks/useOrcamentistaWorkspaceState';

type Props = {
  opportunityId: string;
  workspaceId: string;
  opportunityFiles: OpportunityFile[];
  isLoadingOpportunityFiles?: boolean;
  opportunityFilesError?: string | null;
  selectedFileIds?: string[];
  onSelectionChange?: (fileIds: string[]) => void;
};

function formatBytes(value: number | null | undefined) {
  if (!value || value <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toLocaleString('pt-BR', { maximumFractionDigits: unitIndex === 0 ? 0 : 1 })} ${units[unitIndex]}`;
}

function statusClass(ok: boolean) {
  return ok
    ? 'border-green-500/30 bg-green-500/10 text-green-400'
    : 'border-amber-500/30 bg-amber-500/10 text-amber-400';
}

function attachmentLabel(attachment: OrcamentistaWorkspaceAttachment) {
  return `${attachment.categoria} · ${attachment.mimeType} · ${formatBytes(attachment.tamanhoBytes)}`;
}

export default function OrcamentistaContextStatePanel({
  opportunityId,
  workspaceId,
  opportunityFiles,
  isLoadingOpportunityFiles = false,
  opportunityFilesError = null,
  selectedFileIds,
  onSelectionChange,
}: Props) {
  const selectionEnabled = typeof onSelectionChange === 'function';
  const selectedSet = new Set(selectedFileIds ?? []);

  const toggleFileSelection = (fileId: string) => {
    if (!selectionEnabled) return;
    const next = new Set(selectedSet);
    if (next.has(fileId)) {
      next.delete(fileId);
    } else {
      next.add(fileId);
    }
    onSelectionChange?.(Array.from(next));
  };
  const workspaceState = useOrcamentistaWorkspaceState(workspaceId, opportunityId);
  const state = workspaceState.data ?? null;
  const previewItems = state?.preview.data?.items ?? [];
  const previewWarnings = state?.preview.warnings ?? [];
  const attachments = state?.attachments ?? [];
  const workspaceExists = Boolean(state?.workspace.exists);
  const previewAvailable = state?.preview.status === 'available';

  return (
    <div className="space-y-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Database size={15} className="text-emerald-300" />
            <h2 className="text-sm font-bold text-emerald-200">Estado contextual real</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-white/50">
            Leitura read-only da oportunidade, arquivos, workspace local e preview disponível. Este
            painel não executa IA, não grava orçamento oficial e não altera itens.
          </p>
        </div>
        <span className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-emerald-200">
          REAL · READ-ONLY
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Workspace</p>
          <p className={`mt-2 w-fit rounded border px-2 py-0.5 text-xs font-bold ${statusClass(workspaceExists)}`}>
            {workspaceState.isLoading ? 'Consultando' : workspaceExists ? 'Encontrado' : 'Ausente'}
          </p>
          <p className="mt-2 truncate font-mono text-[10px] text-white/35" title={workspaceId}>
            {workspaceId}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Arquivos oportunidade</p>
          <p className="mt-1 text-lg font-bold text-white/80">
            {isLoadingOpportunityFiles ? '...' : opportunityFiles.length}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Attachments workspace</p>
          <p className="mt-1 text-lg font-bold text-white/80">
            {workspaceState.isLoading ? '...' : attachments.length}
          </p>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Preview real</p>
          <p className={`mt-2 w-fit rounded border px-2 py-0.5 text-xs font-bold ${statusClass(previewAvailable)}`}>
            {workspaceState.isLoading ? 'Consultando' : previewAvailable ? `${previewItems.length} item(ns)` : 'Vazio'}
          </p>
        </div>
      </div>

      {(workspaceState.isError || opportunityFilesError || previewWarnings.length > 0 || !workspaceExists) && (
        <div className="space-y-2">
          {workspaceState.isError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] leading-5 text-red-300">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{workspaceState.error instanceof Error ? workspaceState.error.message : 'Erro ao consultar workspace.'}</span>
            </div>
          )}
          {opportunityFilesError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-[11px] leading-5 text-red-300">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{opportunityFilesError}</span>
            </div>
          )}
          {!workspaceState.isLoading && !workspaceExists && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-5 text-amber-300">
              <FolderOpen size={13} className="mt-0.5 shrink-0" />
              <span>Workspace local ainda não existe para este ID. A oportunidade segue vinculada; a pasta local precisa ser criada/sincronizada antes de haver attachments ou preview.</span>
            </div>
          )}
          {previewWarnings.map((warning) => (
            <div key={warning} className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-5 text-amber-300">
              <AlertTriangle size={13} className="mt-0.5 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-blue-300" />
              <p className="text-xs font-bold uppercase tracking-widest text-white/50">Arquivos reais em opportunity_files</p>
            </div>
            <button
              className="flex items-center gap-1.5 rounded border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] font-bold text-blue-300 transition-colors hover:bg-blue-500/20"
              title="Upload experimental"
            >
              <Upload size={10} />
              UPLOAD LAB
            </button>
          </div>
          <div className="mb-3 rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[10px] leading-4 text-amber-200/70">
            Upload experimental para teste do Orçamentista. Não usar como fluxo oficial de produção.
          </div>
          {isLoadingOpportunityFiles ? (
            <p className="flex items-center gap-2 text-xs text-white/40">
              <Loader2 size={13} className="animate-spin" />
              Consultando arquivos da oportunidade...
            </p>
          ) : opportunityFiles.length > 0 ? (
            <div className="space-y-2">
              {opportunityFiles.slice(0, 5).map((file) => {
                const isSelected = selectedSet.has(file.id);
                return (
                  <label
                    key={file.id}
                    className={`flex items-start gap-2 rounded border px-3 py-2 transition-colors ${
                      selectionEnabled
                        ? isSelected
                          ? 'cursor-pointer border-emerald-500/40 bg-emerald-500/10'
                          : 'cursor-pointer border-white/10 bg-white/[0.03] hover:border-white/20'
                        : 'border-white/10 bg-white/[0.03]'
                    }`}
                  >
                    {selectionEnabled && (
                      <input
                        type="checkbox"
                        className="mt-1 h-3.5 w-3.5 accent-emerald-500"
                        checked={isSelected}
                        onChange={() => toggleFileSelection(file.id)}
                        aria-label={`Selecionar arquivo ${file.nome} para análise`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-white/80" title={file.nome}>{file.nome}</p>
                      <p className="mt-1 font-mono text-[9px] text-white/35">
                        {file.categoria ?? 'sem categoria'} · {file.mime_type ?? 'mime indefinido'} · {formatBytes(file.tamanho_bytes)}
                      </p>
                    </div>
                  </label>
                );
              })}
              {opportunityFiles.length > 5 && (
                <p className="text-[11px] text-white/35">+ {opportunityFiles.length - 5} arquivo(s) não exibido(s).</p>
              )}
              {selectionEnabled && (
                <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-300/70">
                  {selectedSet.size} de {opportunityFiles.length} selecionado(s) para análise
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs leading-5 text-white/40">Nenhum arquivo registrado em opportunity_files para esta oportunidade.</p>
          )}
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center gap-2">
            <FolderOpen size={14} className="text-purple-300" />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Attachments reais do workspace local</p>
          </div>
          {workspaceState.isLoading ? (
            <p className="flex items-center gap-2 text-xs text-white/40">
              <Loader2 size={13} className="animate-spin" />
              Consultando attachments do workspace...
            </p>
          ) : attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.slice(0, 5).map((attachment) => (
                <div key={attachment.relativePath} className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                  <p className="truncate text-xs font-semibold text-white/80" title={attachment.relativePath}>{attachment.nome}</p>
                  <p className="mt-1 font-mono text-[9px] text-white/35">{attachmentLabel(attachment)}</p>
                </div>
              ))}
              {attachments.length > 5 && (
                <p className="text-[11px] text-white/35">+ {attachments.length - 5} attachment(s) não exibido(s).</p>
              )}
            </div>
          ) : (
            <p className="text-xs leading-5 text-white/40">Nenhum attachment local encontrado para este workspace.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-300" />
            <p className="text-xs font-bold uppercase tracking-widest text-white/50">Preview real do workspace</p>
          </div>
          <span className="rounded border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-red-200">
            <Lock size={11} className="mr-1 inline" />
            Escrita oficial bloqueada
          </span>
        </div>
        {workspaceState.isLoading ? (
          <p className="flex items-center gap-2 text-xs text-white/40">
            <Loader2 size={13} className="animate-spin" />
            Consultando preview do workspace...
          </p>
        ) : previewItems.length > 0 ? (
          <div className="space-y-2">
            {previewItems.slice(0, 5).map((item, index) => (
              <div key={`${item.descricao}-${index}`} className="rounded border border-white/10 bg-white/[0.03] px-3 py-2">
                <p className="text-xs font-semibold text-white/80">{item.descricao}</p>
                <p className="mt-1 font-mono text-[9px] text-white/35">
                  {item.unidade} · qtd {item.quantidade.toLocaleString('pt-BR')} · origem {item.origem ?? 'indefinida'}
                </p>
              </div>
            ))}
            {previewItems.length > 5 && (
              <p className="text-[11px] text-white/35">+ {previewItems.length - 5} item(ns) de preview não exibido(s).</p>
            )}
          </div>
        ) : (
          <p className="text-xs leading-5 text-white/40">
            Nenhum item de preview disponível no workspace. Este é um estado vazio real, não uma execução em andamento.
          </p>
        )}
      </div>
    </div>
  );
}
