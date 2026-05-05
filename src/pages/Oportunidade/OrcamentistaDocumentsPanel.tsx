import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  PlayCircle,
  ShieldAlert,
} from 'lucide-react';
import { OrcamentistaDocumentIntakeFile, OrcamentistaDocumentReadinessStatus } from '../../types';
import {
  canDispatchToAgents,
  canRunReader,
  getBlockedPages,
  getPagesRequiringVerification,
  summarizeDocumentInventory,
} from '../../lib/orcamentista/documentInventory';
import { PDF_READER_THRESHOLDS } from '../../lib/orcamentista/pdfReaderContract';

type Props = {
  documents: OrcamentistaDocumentIntakeFile[];
  isLoadingFiles?: boolean;
  filesError?: string | null;
};

const readinessLabel: Record<OrcamentistaDocumentReadinessStatus, string> = {
  not_ready: 'Não pronto',
  partial_inventory: 'Inventário parcial',
  ready_for_reader: 'Pronto para Reader futuro',
  requires_verification: 'Exige Verifier',
  requires_hitl: 'Exige HITL',
  blocked: 'Bloqueado',
};

function formatBytes(value: number) {
  if (value <= 0) return '-';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toLocaleString('pt-BR', { maximumFractionDigits: unitIndex === 0 ? 0 : 1 })} ${units[unitIndex]}`;
}

function confidenceClass(value: number) {
  if (value >= 0.9) return 'text-green-400';
  if (value >= PDF_READER_THRESHOLDS.MIN_CLASSIFICATION_CONFIDENCE) return 'text-blue-400';
  if (value >= 0.7) return 'text-amber-400';
  return 'text-red-400';
}

function readinessClass(status: OrcamentistaDocumentReadinessStatus) {
  switch (status) {
    case 'ready_for_reader':
      return 'border-green-500/30 bg-green-500/10 text-green-400';
    case 'partial_inventory':
    case 'requires_verification':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-400';
    case 'requires_hitl':
      return 'border-orange-500/30 bg-orange-500/10 text-orange-400';
    case 'blocked':
      return 'border-red-500/30 bg-red-500/10 text-red-400';
    default:
      return 'border-white/10 bg-white/5 text-white/40';
  }
}

function uploadLabel(status: OrcamentistaDocumentIntakeFile['upload_status']) {
  switch (status) {
    case 'received':
      return 'Recebido';
    case 'partial':
      return 'Parcial';
    case 'failed':
      return 'Falhou';
    default:
      return 'Registrado';
  }
}

function processingLabel(status: OrcamentistaDocumentIntakeFile['processing_status']) {
  switch (status) {
    case 'inventory_mocked':
      return 'Inventário mockado';
    case 'reader_pending':
      return 'Reader pendente';
    case 'verification_pending':
      return 'Verifier pendente';
    case 'hitl_required':
      return 'HITL obrigatório';
    case 'blocked':
      return 'Bloqueado';
    case 'ready_for_future_analysis':
      return 'Pronto para fase futura';
    default:
      return 'Não iniciado';
  }
}

function sourceLabel(source: OrcamentistaDocumentIntakeFile['source']) {
  switch (source) {
    case 'opportunity_files_readonly':
      return 'opportunity_files somente leitura';
    case 'manual_registry_mock':
      return 'registro manual mockado';
    default:
      return 'mock local';
  }
}

function PageFlag({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${
        active
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          : 'border-white/10 bg-white/5 text-white/25'
      }`}
    >
      {label}
    </span>
  );
}

function DocumentAlerts({ document }: { document: OrcamentistaDocumentIntakeFile }) {
  const pagesRequiringVerification = getPagesRequiringVerification(document);
  const blockedPages = getBlockedPages(document);
  const lowConfidencePages = document.inventory.pages.filter(
    (page) => page.confidence < PDF_READER_THRESHOLDS.MIN_CLASSIFICATION_CONFIDENCE
  );
  const hitlPages = document.inventory.pages.filter((page) => page.requires_hitl);
  const alerts = [
    document.upload_status === 'partial'
      ? 'Documento parcial: registro recebido, mas revisão do arquivo ainda é pendente.'
      : null,
    document.missing_disciplines.length > 0
      ? `Disciplinas ausentes neste documento: ${document.missing_disciplines.join(', ')}.`
      : null,
    pagesRequiringVerification.length > 0
      ? `${pagesRequiringVerification.length} página(s) exigem Verifier ou revisão por baixa confiança.`
      : null,
    lowConfidencePages.length > 0
      ? `${lowConfidencePages.length} página(s) abaixo do limiar de confiança do contrato.`
      : null,
    hitlPages.length > 0 ? `${hitlPages.length} página(s) com HITL obrigatório.` : null,
    blockedPages.length > 0
      ? `${blockedPages.length} página(s) bloqueiam consolidação futura.`
      : null,
  ].filter((alert): alert is string => Boolean(alert));

  if (!alerts.length) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/5 px-3 py-2 text-[11px] text-green-400">
        <CheckCircle2 size={13} />
        Sem alerta crítico no inventário mockado.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert}
          className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] leading-5 text-amber-300"
        >
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          <span>{alert}</span>
        </div>
      ))}
    </div>
  );
}

export default function OrcamentistaDocumentsPanel({
  documents,
  isLoadingFiles = false,
  filesError = null,
}: Props) {
  const summary = summarizeDocumentInventory(documents);

  return (
    <div className="space-y-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-blue-300" />
            <h2 className="text-sm font-bold text-blue-200">Documentos da oportunidade</h2>
          </div>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-white/50">
            Arquivos recebidos para análise. Ainda não são orçamento. Arquivo recebido não é
            leitura validada, inventário mockado não é orçamento oficial, e a análise IA real será
            habilitada em fase futura.
          </p>
        </div>

        <div className="flex flex-col items-start gap-1 sm:items-end">
          <span className="rounded border border-blue-500/40 bg-blue-500/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-blue-200">
            Document Intake mockado
          </span>
          <span className="font-mono text-[8px] uppercase tracking-widest text-white/25">
            sem OCR · sem PDF real · sem IA real
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
            Documentos
          </p>
          <p className="mt-1 text-lg font-bold text-white/80">{summary.totalDocuments}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
            Páginas inventariadas
          </p>
          <p className="mt-1 text-lg font-bold text-white/80">{summary.totalPages}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
            Exigem HITL
          </p>
          <p className="mt-1 text-lg font-bold text-orange-400">{summary.hitlPages}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
            Bloqueios
          </p>
          <p className="mt-1 text-lg font-bold text-red-400">{summary.blockedPages}</p>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
              Disciplinas detectadas
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {summary.detectedDisciplines.map((discipline) => (
                <span
                  key={discipline}
                  className="rounded border border-green-500/20 bg-green-500/10 px-2 py-1 text-[10px] font-semibold uppercase text-green-300"
                >
                  {discipline}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
              Disciplinas ausentes
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {summary.missingDisciplines.map((discipline) => (
                <span
                  key={discipline}
                  className="rounded border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[10px] font-semibold uppercase text-amber-300"
                >
                  {discipline}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {isLoadingFiles && (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/40">
          <Loader2 size={14} className="animate-spin text-blue-300" />
          Consultando registros existentes em opportunity_files para leitura somente.
        </div>
      )}

      {filesError && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs leading-5 text-amber-300">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            Não foi possível listar opportunity_files agora. O painel segue com inventário mockado
            local, sem persistência e sem upload real. Detalhe técnico: {filesError}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {documents.map((document) => {
          const readerAvailable = canRunReader(document);
          const agentDispatchAvailable = canDispatchToAgents(document);

          return (
            <article key={document.id} className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-bold text-white/80">{document.file_name}</h3>
                    <span className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${readinessClass(document.readiness_status)}`}>
                      {readinessLabel[document.readiness_status]}
                    </span>
                    <span className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-white/30">
                      {sourceLabel(document.source)}
                    </span>
                  </div>
                  <div className="mt-2 grid gap-2 text-[11px] text-white/45 sm:grid-cols-2 lg:grid-cols-4">
                    <span>Tipo: {document.file_type}</span>
                    <span>Tamanho: {formatBytes(document.file_size)}</span>
                    <span>Upload: {uploadLabel(document.upload_status)}</span>
                    <span>Processo: {processingLabel(document.processing_status)}</span>
                  </div>
                </div>

                <div className="grid shrink-0 grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <p className="font-mono text-[8px] uppercase tracking-widest text-white/25">Páginas</p>
                    <p className="text-sm font-bold text-white/70">{document.total_pages}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <p className="font-mono text-[8px] uppercase tracking-widest text-white/25">Reader</p>
                    <p className={`text-sm font-bold ${readerAvailable ? 'text-blue-300' : 'text-white/25'}`}>
                      {readerAvailable ? 'Simulado' : 'Não'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    <p className="font-mono text-[8px] uppercase tracking-widest text-white/25">Agentes</p>
                    <p className={`text-sm font-bold ${agentDispatchAvailable ? 'text-green-300' : 'text-white/25'}`}>
                      {agentDispatchAvailable ? 'Liberado' : 'Bloqueado'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_280px]">
                <div className="space-y-3">
                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full min-w-[760px] text-xs">
                      <thead className="bg-white/[0.03]">
                        <tr className="border-b border-white/10">
                          <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                            Página
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                            Tipo
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                            Disciplina
                          </th>
                          <th className="px-3 py-2 text-right font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                            Conf.
                          </th>
                          <th className="px-3 py-2 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                            Flags
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {document.inventory.pages.map((page) => (
                          <tr key={`${document.id}-${page.page_number}`} className="border-b border-white/5 last:border-0">
                            <td className="px-3 py-2 text-white/60">
                              <span className="font-mono text-white/35">{page.page_number}</span>{' '}
                              {page.page_label}
                            </td>
                            <td className="px-3 py-2 font-mono text-[10px] text-white/45">{page.page_type}</td>
                            <td className="px-3 py-2 font-mono text-[10px] text-white/45">{page.discipline}</td>
                            <td className={`px-3 py-2 text-right font-mono font-bold ${confidenceClass(page.confidence)}`}>
                              {Math.round(page.confidence * 100)}%
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1">
                                <PageFlag active={page.requires_reader} label="Reader" />
                                <PageFlag active={page.requires_verifier} label="Verifier" />
                                <PageFlag active={page.requires_hitl} label="HITL" />
                                <PageFlag active={page.blocks_consolidation} label="Bloqueia" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {document.detected_disciplines
                      .filter((discipline) => discipline.detected)
                      .map((discipline) => (
                        <span
                          key={`${document.id}-${discipline.discipline}`}
                          className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/45"
                        >
                          {discipline.discipline}: {discipline.pages_count} pág. ·{' '}
                          {Math.round(discipline.confidence * 100)}%
                        </span>
                      ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3">
                    <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                      Risco inicial
                    </p>
                    <p className="mt-1 text-sm font-bold uppercase text-amber-300">
                      {document.inventory.initial_risk}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {document.inventory.risk_notes.map((note) => (
                        <li key={note} className="text-[11px] leading-5 text-white/45">
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <DocumentAlerts document={document} />

                  <button
                    type="button"
                    disabled
                    className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/25"
                  >
                    <PlayCircle size={14} />
                    Analisar documento
                  </button>
                  <div className="flex items-start gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-white/35">
                    <Lock size={13} className="mt-0.5 shrink-0" />
                    <span>
                      A análise real por IA será habilitada em fase futura. Este botão não chama
                      Gemini, OpenAI, Claude, OCR ou processamento real de PDF.
                    </span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-[11px] leading-5 text-red-300">
        <Ban size={14} className="mt-0.5 shrink-0" />
        <span>
          Nenhum documento listado aqui grava itens oficiais, altera proposta, cria Obra ou escreve
          em Diário de Obra. Consolidação futura permanece bloqueada até Reader, Verifier e HITL.
        </span>
      </div>
    </div>
  );
}
