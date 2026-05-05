import { Link, useParams } from 'react-router-dom';
import OrcamentistaChat from '../OrcamentistaChat';
import { useAppContext } from '../../AppContext';
import { useOportunidadeOrcamento } from '../../hooks/useOportunidadeOrcamento';
import { useOpportunityFiles } from '../../hooks/useOportunidades';
import OrcamentistaManualItemsPanel from './OrcamentistaManualItemsPanel';
import OrcamentistaAiPipelinePanel from './OrcamentistaAiPipelinePanel';
import OrcamentistaAiPreviewPanel from './OrcamentistaAiPreviewPanel';
import OrcamentistaDocumentsPanel from './OrcamentistaDocumentsPanel';
import { OrcamentistaPageProcessingPanel } from './OrcamentistaPageProcessingPanel';
import OrcamentistaReaderVerifierPanel from './OrcamentistaReaderVerifierPanel';
import OrcamentistaHitlPanel from './OrcamentistaHitlPanel';
import OrcamentistaAgentDispatchPanel from './OrcamentistaAgentDispatchPanel';
import { OrcamentistaConsolidatedPreviewPanel } from './OrcamentistaConsolidatedPreviewPanel';
import OrcamentistaConsolidationGatePanel from './OrcamentistaConsolidationGatePanel';
import OrcamentistaPayloadReviewPanel from './OrcamentistaPayloadReviewPanel';
import OrcamentistaRealReaderSandboxPanel from './OrcamentistaRealReaderSandboxPanel';
import OrcamentistaMissingProjectFallbackPanel from './OrcamentistaMissingProjectFallbackPanel';
import { buildMockDocumentIntakeFiles } from '../../lib/orcamentista/documentIntakeMock';
import { mockPipelineSteps, mockAiPreview } from '../../lib/orcamentista/mockPipeline';

// ──────────────────────────────────────────────
// OrcamentistaTab — Fase 1F
//
// Blocos visuais:
//  A. Cabeçalho operacional + status pills
//  B. Orçamento oficial (estado vazio ou dados)
//  C. Itens oficiais — OrcamentistaManualItemsPanel
//  D. Proposta (rascunho ou CTA)
//  E. Workspace IA — prévia não consolidada
//
// Regras:
//  - Sem criação automática ao abrir.
//  - "OFICIAL" = gravado em orcamento_itens no banco.
//  - "PRÉVIA IA" = workspace staging, nunca consolidado automaticamente.
//  - Nunca usa obra_id = opp_<id> como vínculo de orcamento.
// ──────────────────────────────────────────────

// ── Pill de status ────────────────────────────
function StatusPill({
  label,
  value,
  variant = 'neutral',
}: {
  label: string;
  value: string;
  variant?: 'green' | 'blue' | 'amber' | 'purple' | 'neutral';
}) {
  const colors: Record<string, string> = {
    green:   'border-brand-green/30  bg-brand-green/10  text-brand-green',
    blue:    'border-brand-blue/30   bg-brand-blue/10   text-brand-blue',
    amber:   'border-brand-amber/30  bg-brand-amber/10  text-brand-amber',
    purple:  'border-purple-500/30   bg-purple-500/10   text-purple-400',
    neutral: 'border-b1 bg-s2 text-t3',
  };
  return (
    <div className={`flex flex-col items-center rounded-lg border px-4 py-2 ${colors[variant]}`}>
      <span className="font-mono text-[9px] font-bold uppercase tracking-widest opacity-70">{label}</span>
      <span className="mt-0.5 text-xs font-bold">{value}</span>
    </div>
  );
}

// ── Divisor de seção ──────────────────────────
function SectionDivider({
  label,
  badge,
  badgeVariant = 'neutral',
}: {
  label: string;
  badge?: string;
  badgeVariant?: 'green' | 'blue' | 'amber' | 'purple' | 'neutral';
}) {
  const badgeColors: Record<string, string> = {
    green:   'border-brand-green/30  bg-brand-green/10  text-brand-green',
    blue:    'border-brand-blue/30   bg-brand-blue/10   text-brand-blue',
    amber:   'border-brand-amber/30  bg-brand-amber/10  text-brand-amber',
    purple:  'border-purple-500/30   bg-purple-500/10   text-purple-400',
    neutral: 'border-b1 bg-s2 text-t3',
  };
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-b1" />
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-t3">{label}</span>
        {badge && (
          <span className={`rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${badgeColors[badgeVariant]}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="h-px flex-1 bg-b1" />
    </div>
  );
}

export default function OrcamentistaTab() {
  const { id = '' } = useParams();
  const { config } = useAppContext();
  const {
    opportunity,
    orcamento,
    itens,
    hasOrcamento,
    canCreateOrcamento,
    isLoading,
    isCreating,
    isError,
    error,
    createResult,
    criarOrcamentoParaOportunidade,
    criarItemManual,
    atualizarItemManual,
    removerItemManual,
  } = useOportunidadeOrcamento(id, config);
  const opportunityFiles = useOpportunityFiles(id, config);

  // ── Sem ID ──────────────────────────────────
  if (!id) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Oportunidade não informada para abrir o Orçamentista IA.
        </div>
      </main>
    );
  }

  // ── Carregando ──────────────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Carregando oportunidade e orçamento…
        </div>
      </main>
    );
  }

  // ── Erro ────────────────────────────────────
  if (isError && error) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400">
          {error.message}
        </div>
      </main>
    );
  }

  // ── Oportunidade não encontrada ─────────────
  if (!opportunity) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Oportunidade não encontrada.
        </div>
      </main>
    );
  }

  // workspaceId: apenas para o OrcamentistaChat (staging/preview).
  // NÃO é obra_id — opp_${id} identifica o workspace de análise IA,
  // não vincula a tabela orcamentos.
  const workspaceId = opportunity.orcamentista_workspace_id || `opp_${id}`;

  const totalItens   = itens.reduce((acc, item) => acc + item.valor_total, 0);
  const temProposta  = !!opportunity.proposta_id;
  const isBlocked    = createResult?.status === 'blocked';
  const isCreatedOk  = createResult?.status === 'created';
  const isErrResult  = createResult?.status === 'error';
  const documentIntakeFiles = buildMockDocumentIntakeFiles({
    opportunityId: id,
    orcamentoId: orcamento?.id ?? opportunity.orcamento_id,
    opportunityFiles: opportunityFiles.data ?? [],
  });
  const opportunityFilesError =
    opportunityFiles.error instanceof Error
      ? opportunityFiles.error.message
      : opportunityFiles.error
        ? 'Erro ao consultar opportunity_files.'
        : null;

  return (
    <div className="min-h-screen bg-bg text-t1">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">

        {/* ── A. CABEÇALHO OPERACIONAL ── */}
        <header>
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
            Orçamentista IA
          </div>
          <h1 className="text-2xl font-extrabold text-t1">{opportunity.titulo}</h1>
          <p className="mt-2 max-w-2xl text-sm text-t3">
            Esta área prepara o orçamento oficial antes da proposta e da conversão em obra.
            Itens adicionados são <strong className="text-t2">gravados no banco</strong> e alimentam
            a proposta comercial. O workspace IA é uma prévia separada — não consolidada automaticamente.
          </p>

          {/* Status pills — apenas quando orçamento existe */}
          {hasOrcamento && (
            <div className="mt-4 flex flex-wrap gap-3">
              <StatusPill label="Orçamento"      value="VINCULADO"                            variant="green"   />
              <StatusPill label="Itens oficiais" value={`${itens.length} item${itens.length !== 1 ? 'ns' : ''}`} variant={itens.length > 0 ? 'blue' : 'neutral'} />
              <StatusPill label="Proposta"       value={temProposta ? 'RASCUNHO' : 'Não gerada'} variant={temProposta ? 'amber' : 'neutral'} />
              <StatusPill label="Workspace IA"   value="PRÉVIA"                               variant="purple"  />
            </div>
          )}
        </header>

        {/* ── B. SEM ORÇAMENTO: estado vazio ── */}
        {!hasOrcamento && (
          <section className="space-y-4">
            <SectionDivider label="Orçamento oficial" badge="NÃO VINCULADO" />

            <div className="rounded-lg border border-b1 bg-s1 p-6">
              <p className="mb-1 font-medium text-t1">Nenhum orçamento oficial vinculado.</p>
              <p className="text-sm text-t3">
                Um orçamento oficial permite rastrear itens, quantitativos e valores
                no fluxo canônico EVIS. Crie abaixo para começar.
              </p>
              <p className="mt-2 text-xs text-t4">
                A criação não vincula uma Obra — o orçamento fica associado apenas a esta
                oportunidade até a conversão explícita.
              </p>
            </div>

            {isBlocked && (
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
                <p className="font-semibold">Criação bloqueada</p>
                <p className="mt-1 text-xs">{createResult.message}</p>
              </div>
            )}
            {isErrResult && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                <p className="font-semibold">Erro ao criar orçamento</p>
                <p className="mt-1 text-xs">{createResult.message}</p>
              </div>
            )}
            {isCreatedOk && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
                {createResult.message}
              </div>
            )}

            {canCreateOrcamento && !isBlocked && (
              <button
                id="btn-criar-orcamento-oportunidade"
                onClick={criarOrcamentoParaOportunidade}
                disabled={isCreating}
                className="w-full rounded-lg bg-brand-green px-4 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? 'Criando orçamento…' : 'Criar orçamento da oportunidade'}
              </button>
            )}

            {isBlocked && (
              <p className="text-center text-xs text-t3">
                Consulte o SCHEMA_GAP_REPORT para a pendência registrada.
              </p>
            )}
          </section>
        )}

        {/* ── C. ITENS OFICIAIS DO ORÇAMENTO ── */}
        {hasOrcamento && orcamento && (
          <section>
            <SectionDivider
              label="Orçamento oficial"
              badge="GRAVADO NO BANCO"
              badgeVariant="green"
            />
            <div className="mt-4">
              <OrcamentistaManualItemsPanel
                orcamento={orcamento}
                itens={itens}
                criarItemManual={criarItemManual}
                atualizarItemManual={atualizarItemManual}
                removerItemManual={removerItemManual}
              />
            </div>
          </section>
        )}

        {/* ── D. PROPOSTA ── */}
        {hasOrcamento && (
          <section>
            <SectionDivider
              label="Proposta comercial"
              badge={temProposta ? 'RASCUNHO' : 'NÃO GERADA'}
              badgeVariant={temProposta ? 'amber' : 'neutral'}
            />
            <div className="mt-4 rounded-lg border border-b1 bg-s1 p-5">
              {temProposta ? (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-t1">Proposta em rascunho</p>
                    <p className="mt-0.5 text-xs text-t3">
                      Gerada a partir do orçamento oficial ·{' '}
                      {itens.length} item(ns) ·{' '}
                      {totalItens.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} base
                    </p>
                  </div>
                  <Link
                    to={`/propostas?id=${opportunity.proposta_id}`}
                    className="shrink-0 rounded-lg border border-brand-amber/30 bg-brand-amber/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-brand-amber transition-colors hover:bg-brand-amber/20"
                  >
                    Abrir proposta →
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-t1">Nenhuma proposta gerada ainda.</p>
                  <p className="mt-1 text-xs text-t3">
                    {itens.length === 0
                      ? 'Adicione pelo menos um item ao orçamento antes de gerar a proposta.'
                      : 'Orçamento com itens. Gere a proposta pela página da oportunidade → "Gerar proposta comercial".'}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── E. WORKSPACE IA — PRÉVIA NÃO CONSOLIDADA ── */}
        {hasOrcamento && (
          <section>
            <SectionDivider
              label="Workspace IA"
              badge="PRÉVIA — NÃO CONSOLIDADA"
              badgeVariant="purple"
            />
            <div className="mt-4 space-y-6">

              {/* E1. Documentos recebidos / inventário mockado */}
              <OrcamentistaDocumentsPanel
                documents={documentIntakeFiles}
                isLoadingFiles={opportunityFiles.isFetching}
                filesError={opportunityFilesError}
              />

              {/* E2. Projetos ausentes / estimativas controladas */}
              <OrcamentistaMissingProjectFallbackPanel />

              {/* E3. Processamento de páginas mockado */}
              <OrcamentistaPageProcessingPanel />

              {/* E4. Reader + Verifier mockado */}
              <OrcamentistaReaderVerifierPanel />

              {/* E5. HITL do Orçamentista mockado */}
              <OrcamentistaHitlPanel />

              {/* E6. Dispatch mockado para agentes especialistas */}
              <OrcamentistaAgentDispatchPanel />

              {/* E7. Preview Consolidado mockado */}
              <OrcamentistaConsolidatedPreviewPanel />

              {/* E8. Gate de consolidação mockado */}
              <OrcamentistaConsolidationGatePanel />

              {/* E9. Revisão humana do payload simulado */}
              <OrcamentistaPayloadReviewPanel />

              {/* E10. Sandbox de primeira leitura real controlada */}
              <OrcamentistaRealReaderSandboxPanel />

              {/* E11. Pipeline IA mockado */}
              <OrcamentistaAiPipelinePanel steps={mockPipelineSteps} />

              {/* E12. Prévia IA mockada (legado) */}
              <OrcamentistaAiPreviewPanel preview={mockAiPreview} />

              {/* E13. Chat do Orçamentista (staging/preview separado) */}
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                  Orçamentista IA — Chat de análise
                </p>
                <p className="mb-4 text-xs text-white/40">
                  Ambiente de análise livre. Dados do chat são staging — não alimentam o
                  orçamento oficial nem a proposta automaticamente.
                </p>
                <OrcamentistaChat
                  opportunityId={id}
                  workspaceId={workspaceId}
                  backTo={`/oportunidades/${id}`}
                />
              </div>

            </div>
          </section>
        )}

      </div>
    </div>
  );
}
