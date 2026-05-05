import { useMemo } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileImage,
  FileText,
  Image as ImageIcon,
  Layers,
  XCircle,
} from 'lucide-react';
import { MOCK_PAGE_PROCESSING_JOB, getMockRenderedPages } from '../../lib/orcamentista/pageProcessingMock';
import { getPageProcessingRisk, getPageProcessingStatusLabel } from '../../lib/orcamentista/pageProcessingContract';

function readinessBadgeClass(status: string) {
  switch (status) {
    case 'READY':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
    case 'READY_WITH_WARNINGS':
      return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
    case 'REQUIRES_OCR':
      return 'border-purple-500/30 bg-purple-500/10 text-purple-300';
    case 'BLOCKED':
      return 'border-red-500/30 bg-red-500/10 text-red-300';
    default:
      return 'border-white/10 bg-white/5 text-t3';
  }
}

function renderReadinessBadge(status: string) {
  const baseClass = `inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${readinessBadgeClass(status)}`;

  if (status === 'READY') return <span className={baseClass}>Pronta</span>;
  if (status === 'READY_WITH_WARNINGS') return <span className={baseClass}>Avisos</span>;
  if (status === 'REQUIRES_OCR') {
    return (
      <span className={baseClass}>
        <FileImage className="h-3 w-3" />
        OCR
      </span>
    );
  }
  if (status === 'BLOCKED') return <span className={baseClass}>Bloqueada</span>;
  return <span className={baseClass}>{status}</span>;
}

function riskLabelClass(risk: string) {
  switch (risk) {
    case 'baixa':
      return 'text-emerald-300';
    case 'media':
      return 'text-amber-300';
    case 'alta':
      return 'text-orange-300';
    case 'critica':
      return 'text-red-300';
    default:
      return 'text-t3';
  }
}

export function OrcamentistaPageProcessingPanel() {
  const job = MOCK_PAGE_PROCESSING_JOB;
  const pages = useMemo(() => getMockRenderedPages('doc-mock-001'), []);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-lg border border-blue-500/20 bg-blue-500/5">
        <header className="border-b border-white/10 bg-white/3 px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-t1">
                <Layers className="h-5 w-5 text-blue-300" />
                Processamento de Páginas
              </h2>
              <p className="mt-1 text-xs leading-5 text-t3">
                Etapa técnica futura que transforma PDFs em páginas auditáveis para leitura IA.
              </p>
            </div>
            <span className="w-fit rounded border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-blue-200">
              Fase 2D (Mock)
            </span>
          </div>
        </header>

        <div className="space-y-6 p-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <div className="flex flex-col items-center justify-center rounded-lg border border-white/10 bg-white/3 p-3 text-center">
              <span className="mb-1 text-xs text-t3">Total</span>
              <span className="text-2xl font-semibold text-t1">{job.summary?.total_pages || 0}</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <span className="mb-1 text-xs text-emerald-300">Processadas</span>
              <span className="text-2xl font-semibold text-emerald-200">
                {job.summary?.processed_pages || 0}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 text-center">
              <span className="mb-1 text-xs text-blue-300">Prontas p/ Reader</span>
              <span className="text-2xl font-semibold text-blue-200">
                {job.summary?.ready_for_reader || 0}
              </span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center">
              <span className="mb-1 text-xs text-amber-300">OCR Futuro</span>
              <span className="text-2xl font-semibold text-amber-200">{job.summary?.requires_ocr || 0}</span>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
              <span className="mb-1 text-xs text-red-300">Bloqueadas</span>
              <span className="text-2xl font-semibold text-red-200">{job.summary?.blocked_pages || 0}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="border-b border-white/10 pb-2 text-sm font-medium text-t2">
              Inventário de Páginas Renderizadas
            </h3>
            <div className="overflow-hidden rounded-lg border border-white/10">
              <table className="min-w-full divide-y divide-white/10">
                <thead className="bg-white/3">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-t3">
                      Página
                    </th>
                    <th scope="col" className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-t3">
                      Status
                    </th>
                    <th scope="col" className="px-4 py-3 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-t3">
                      Assets
                    </th>
                    <th scope="col" className="px-4 py-3 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-t3">
                      Prontidão
                    </th>
                    <th scope="col" className="px-4 py-3 text-center font-mono text-[9px] font-bold uppercase tracking-widest text-t3">
                      Risco
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-s1">
                  {pages.map((page) => {
                    const risk = getPageProcessingRisk(page);
                    return (
                      <tr key={page.id} className="transition-colors hover:bg-white/3">
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-t1">Pág. {page.page_number}</span>
                            <span className="text-xs text-t3">{page.page_label}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <div className="flex items-center gap-2">
                            {page.render_status === 'COMPLETED' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                            ) : page.render_status === 'FAILED' ? (
                              <XCircle className="h-4 w-4 text-red-300" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-300" />
                            )}
                            <span className="text-sm text-t2">
                              {getPageProcessingStatusLabel(page.render_status)}
                            </span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <div className="flex flex-col items-center">
                              <ImageIcon className={`h-4 w-4 ${page.image_ref ? 'text-blue-300' : 'text-t4'}`} />
                              <span className="mt-1 text-[10px] text-t3">{page.image_ref ? 'Render' : '---'}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <FileText className={`h-4 w-4 ${page.has_text_layer ? 'text-blue-300' : 'text-t4'}`} />
                              <span className="mt-1 text-[10px] text-t3">
                                {page.has_text_layer ? 'Nativo' : '---'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {renderReadinessBadge(page.ready_for_reader)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-center">
                          {risk === 'critica' ? (
                            <div className="flex items-center justify-center gap-1 text-sm font-medium text-red-300">
                              <AlertTriangle className="h-3 w-3" />
                              Crítico
                            </div>
                          ) : (
                            <span className={`text-sm font-medium ${riskLabelClass(risk)}`}>
                              {risk === 'baixa' && 'Baixo'}
                              {risk === 'media' && 'Médio'}
                              {risk === 'alta' && 'Alto'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-3 rounded-lg border border-white/10 bg-white/3 p-4 text-sm text-t3">
              <AlertCircle className="h-5 w-5 shrink-0 text-t4" />
              <div>
                <p className="mb-1 font-medium text-t2">Nota sobre a Camada de Texto (Nativo)</p>
                <p>
                  Páginas com texto nativo (vetor) são processadas com maior precisão pelo Reader IA.
                  Plantas escaneadas ou rasterizadas exigem OCR visual, que consome mais recursos e
                  tem precisão variável. O sistema identifica e roteia automaticamente com base nestas
                  propriedades.
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-white/10 bg-white/3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-t3">Renderização determinística. Nenhuma IA envolvida nesta etapa.</p>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-t4"
          >
            Processar páginas — fase futura
          </button>
        </footer>
      </section>
    </div>
  );
}
