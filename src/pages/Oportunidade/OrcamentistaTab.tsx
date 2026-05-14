import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, FlaskConical } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import OrcamentistaChat from '../OrcamentistaChat';
import { useAppContext } from '../../AppContext';
import { useOportunidadeOrcamento } from '../../hooks/useOportunidadeOrcamento';
import { useOpportunityFiles } from '../../hooks/useOportunidades';
import { analyzeKeys, type AnalyzeResponse } from '../../hooks/useAnalyzeOpportunity';
import OrcamentistaPreviewItemsHitlPanel from './OrcamentistaPreviewItemsHitlPanel';
import OrcamentistaManualItemsPanel from './OrcamentistaManualItemsPanel';
import OrcamentistaContextStatePanel from './OrcamentistaContextStatePanel';
import OrcamentistaInternalActionPanel from './OrcamentistaInternalActionPanel';
import OrcamentistaGuidedIntakePanel from './OrcamentistaGuidedIntakePanel';
import OrcamentistaMissingProjectFallbackPanel from './OrcamentistaMissingProjectFallbackPanel';
import { OrcamentistaPageProcessingPanel } from './OrcamentistaPageProcessingPanel';
import OrcamentistaReaderVerifierPanel from './OrcamentistaReaderVerifierPanel';
import OrcamentistaHitlPanel from './OrcamentistaHitlPanel';
import OrcamentistaAgentDispatchPanel from './OrcamentistaAgentDispatchPanel';
import { OrcamentistaConsolidatedPreviewPanel } from './OrcamentistaConsolidatedPreviewPanel';
import OrcamentistaConsolidationGatePanel from './OrcamentistaConsolidationGatePanel';
import OrcamentistaPayloadReviewPanel from './OrcamentistaPayloadReviewPanel';
import OrcamentistaRealReaderSandboxPanel from './OrcamentistaRealReaderSandboxPanel';

// ──────────────────────────────────────────────
// OrcamentistaTab — Fase 2 (reorganização semântica)
//
// Espinha dorsal visível do produto:
//   1. Arquivos da oportunidade
//   2. Diagnóstico + Análise técnica
//   3. Evidências extraídas        (placeholder até persistência)
//   4. Itens preliminares          (placeholder até persistência)
//   5. Pendências HITL             (placeholder até HITL real)
//   6. Aprovação humana            (placeholder até HITL real)
//   7. Commit oficial → ManualItems + Proposta
//
// Tudo que é mock/legado fica em <Laboratório avançado> colapsado.
//
// Regras:
//  - "OFICIAL" = gravado em orcamento_itens no banco.
//  - "PRÉVIA IA" = staging, nunca consolidado automaticamente.
//  - Mocks não aparecem como parte principal.
// ──────────────────────────────────────────────

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

function StagePlaceholder({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-b1 bg-s1/40 p-5">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-amber-400">
          {badge}
        </span>
        <p className="text-sm font-semibold text-t1">{title}</p>
      </div>
      <p className="text-xs leading-relaxed text-t3">{description}</p>
    </div>
  );
}

export default function OrcamentistaTab() {
  const { id = '' } = useParams();
  const { config } = useAppContext();
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
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

  useEffect(() => {
    setSelectedFileIds([]);
  }, [id]);

  useEffect(() => {
    const availableIds = new Set((opportunityFiles.data ?? []).map((file) => file.id));
    setSelectedFileIds((current) => current.filter((fileId) => availableIds.has(fileId)));
  }, [opportunityFiles.data]);

  if (!id) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Oportunidade não informada para abrir o Orçamentista IA.
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Carregando oportunidade e orçamento…
        </div>
      </main>
    );
  }

  if (isError && error) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-400">
          {error.message}
        </div>
      </main>
    );
  }

  if (!opportunity) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Oportunidade não encontrada.
        </div>
      </main>
    );
  }

  const workspaceId = opportunity.orcamentista_workspace_id || `opp_${id}`;
  const totalItens   = itens.reduce((acc, item) => acc + item.valor_total, 0);

  // Etapa 3: lê o resultado mais recente de /analyze a partir do cache react-query.
  // useAnalyzeOpportunity.onSuccess semeia o cache com a mesma key.
  // Aqui só assinamos para extrair run_id e schema_status sem refazer a chamada.
  const { data: cachedAnalyze } = useQuery<AnalyzeResponse>({
    queryKey: analyzeKeys.result(id),
    queryFn: () => Promise.reject(new Error('cache-only')),
    enabled: false,
    staleTime: Infinity,
    retry: false,
  });
  const analysisRunBlock = cachedAnalyze?.data.analysis_run ?? null;
  const currentRunId =
    analysisRunBlock?.schema_status === 'ready' ? analysisRunBlock.run_id : null;
  const schemaStatusFromAnalyze = analysisRunBlock?.schema_status ?? null;
  const temProposta  = !!opportunity.proposta_id;
  const isBlocked    = createResult?.status === 'blocked';
  const isCreatedOk  = createResult?.status === 'created';
  const isErrResult  = createResult?.status === 'error';
  const opportunityFilesError =
    opportunityFiles.error instanceof Error
      ? opportunityFiles.error.message
      : opportunityFiles.error
        ? 'Erro ao consultar opportunity_files.'
        : null;

  return (
    <div className="min-h-screen bg-bg text-t1">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-8">

        {/* ── CABEÇALHO ── */}
        <header>
          <div className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
            Orçamentista IA
          </div>
          <h1 className="text-2xl font-extrabold text-t1">{opportunity.titulo}</h1>
          <p className="mt-2 max-w-2xl text-sm text-t3">
            Esteira de pré-obra: arquivos → leitura técnica → evidências → itens preliminares →
            revisão humana → orçamento oficial → proposta. A IA propõe; nada vai para o orçamento
            oficial sem aprovação explícita.
          </p>

          {hasOrcamento && (
            <div className="mt-4 flex flex-wrap gap-3">
              <StatusPill label="Orçamento"      value="VINCULADO"                            variant="green"   />
              <StatusPill label="Itens oficiais" value={`${itens.length} item${itens.length !== 1 ? 'ns' : ''}`} variant={itens.length > 0 ? 'blue' : 'neutral'} />
              <StatusPill label="Proposta"       value={temProposta ? 'RASCUNHO' : 'Não gerada'} variant={temProposta ? 'amber' : 'neutral'} />
              <StatusPill label="Workspace IA"   value="PRÉVIA"                               variant="purple"  />
            </div>
          )}
        </header>

        {/* ── ESTADO VAZIO: criar orçamento ── */}
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

        {/* ── ESTEIRA REAL (somente com orçamento vinculado) ── */}
        {hasOrcamento && (
          <>
            {/* 1. Arquivos da oportunidade */}
            <section className="space-y-4">
              <SectionDivider label="1. Arquivos da oportunidade" badge="ENTRADA" badgeVariant="blue" />
              <OrcamentistaContextStatePanel
                opportunityId={id}
                workspaceId={workspaceId}
                opportunityFiles={opportunityFiles.data ?? []}
                isLoadingOpportunityFiles={opportunityFiles.isFetching}
                opportunityFilesError={opportunityFilesError}
                selectedFileIds={selectedFileIds}
                onSelectionChange={setSelectedFileIds}
              />
            </section>

            {/* 2. Diagnóstico + Análise técnica */}
            <section className="space-y-4">
              <SectionDivider label="2. Diagnóstico e análise técnica" badge="AÇÃO" badgeVariant="green" />
              <OrcamentistaInternalActionPanel
                opportunityId={id}
                workspaceId={workspaceId}
                selectedFileIds={selectedFileIds}
                totalFilesAvailable={opportunityFiles.data?.length ?? 0}
              />
            </section>

            {/* 3. Evidências extraídas */}
            <section className="space-y-4">
              <SectionDivider
                label="3. Evidências extraídas"
                badge={
                  schemaStatusFromAnalyze === 'ready'
                    ? 'PERSISTIDAS'
                    : schemaStatusFromAnalyze === 'schema_not_ready'
                      ? 'AGUARDANDO SCHEMA'
                      : 'AGUARDANDO ANÁLISE'
                }
                badgeVariant={schemaStatusFromAnalyze === 'ready' ? 'green' : 'amber'}
              />
              {schemaStatusFromAnalyze === 'ready' &&
              analysisRunBlock?.schema_status === 'ready' ? (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300">
                  <p className="font-semibold">Evidências persistidas neste run</p>
                  <p className="mt-1 text-xs">
                    {analysisRunBlock.counts.evidences} evidência(s) ·{' '}
                    {analysisRunBlock.counts.fileReads} leitura(s) de arquivo ·{' '}
                    {analysisRunBlock.counts.previewItems} item(ns) preliminar(es).
                    Cada evidência traz origem rastreável (arquivo + trecho).
                  </p>
                </div>
              ) : (
                <StagePlaceholder
                  badge={
                    schemaStatusFromAnalyze === 'schema_not_ready' ? 'SCHEMA' : 'PRÓXIMA ANÁLISE'
                  }
                  title={
                    schemaStatusFromAnalyze === 'schema_not_ready'
                      ? 'Migration 003 ainda não aplicada'
                      : 'Dispare uma análise para extrair evidências'
                  }
                  description={
                    schemaStatusFromAnalyze === 'schema_not_ready'
                      ? 'O endpoint /analyze já gera evidências em memória e tenta persistir, mas o schema run-scoped (orc_analysis_runs/file_reads/evidences/preview_items) ainda não está aplicado em staging. Por ora, evidências são respondidas inline na análise.'
                      : 'A análise extrai evidências de arquivos .txt/.csv/.json/.md. Quando o schema estiver aplicado, cada evidência ficará persistida com origem rastreável.'
                  }
                />
              )}
            </section>

            {/* 4-6. Itens preliminares + Pendências HITL + Aprovação humana
                 Painel único: revisão humana real sobre orc_preview_items. */}
            <section className="space-y-4">
              <SectionDivider
                label="4. Itens preliminares e revisão humana"
                badge={
                  schemaStatusFromAnalyze === 'ready'
                    ? 'HITL ATIVO'
                    : schemaStatusFromAnalyze === 'schema_not_ready'
                      ? 'AGUARDANDO SCHEMA'
                      : 'AGUARDANDO ANÁLISE'
                }
                badgeVariant={schemaStatusFromAnalyze === 'ready' ? 'green' : 'amber'}
              />
              <OrcamentistaPreviewItemsHitlPanel
                runId={currentRunId}
                schemaStatusFromAnalyze={schemaStatusFromAnalyze}
              />
              <p className="text-xs text-t4">
                Decisões disponíveis: aprovar · pedir revisão · rejeitar · editar (descrição,
                quantidade, valor unitário). Aprovação aqui <strong>não</strong> grava no orçamento
                oficial — o commit dedicado entra na Etapa 4.
              </p>
            </section>

            {/* 5. Commit oficial — Itens manuais (real) */}
            {orcamento && (
              <section className="space-y-4">
                <SectionDivider
                  label="5. Commit oficial — itens do orçamento"
                  badge="GRAVADO NO BANCO"
                  badgeVariant="green"
                />
                <OrcamentistaManualItemsPanel
                  orcamento={orcamento}
                  itens={itens}
                  criarItemManual={criarItemManual}
                  atualizarItemManual={atualizarItemManual}
                  removerItemManual={removerItemManual}
                />
                <StagePlaceholder
                  badge="ETAPA 4"
                  title="Commit IA → orçamento oficial pendente"
                  description="O endpoint POST /api/orcamentista/analysis-runs/:runId/commit-approved-items entra na Etapa 4. Ele exigirá flag EVIS_ORCAMENTISTA_ENABLE_OFFICIAL_COMMIT=true e recusará qualquer item sem evidência ou sem aprovação humana. Hoje apenas itens manuais alimentam o orçamento oficial."
                />
              </section>
            )}

            {/* 6. Proposta */}
            <section className="space-y-4">
              <SectionDivider
                label="6. Proposta comercial"
                badge={temProposta ? 'RASCUNHO' : 'NÃO GERADA'}
                badgeVariant={temProposta ? 'amber' : 'neutral'}
              />
              <div className="rounded-lg border border-b1 bg-s1 p-5">
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

            {/* ── LABORATÓRIO AVANÇADO (colapsado) ── */}
            <section>
              <details className="group rounded-lg border border-b1 bg-s1/40">
                <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 text-sm font-semibold text-t2 transition-colors hover:bg-s1/80">
                  <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                  <FlaskConical className="h-4 w-4 text-purple-400" />
                  <span>Laboratório avançado</span>
                  <span className="rounded border border-purple-500/30 bg-purple-500/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-purple-400">
                    EXPERIMENTAL
                  </span>
                  <span className="ml-auto text-xs font-normal text-t4">
                    Painéis técnicos, mocks e sandboxes — fora da jornada principal
                  </span>
                </summary>

                <div className="space-y-6 border-t border-b1 px-5 py-6">
                  <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                    Esta seção contém painéis em estado de mock, sandbox ou laboratório.
                    Nada aqui escreve no orçamento oficial. Itens visíveis abaixo não representam
                    estado real do produto — servem para diagnóstico técnico e validação de
                    arquitetura.
                  </p>

                  <OrcamentistaGuidedIntakePanel />
                  <OrcamentistaMissingProjectFallbackPanel />
                  <OrcamentistaPageProcessingPanel />
                  <OrcamentistaReaderVerifierPanel />
                  <OrcamentistaHitlPanel />
                  <OrcamentistaAgentDispatchPanel />
                  <OrcamentistaConsolidatedPreviewPanel />
                  <OrcamentistaConsolidationGatePanel />
                  <OrcamentistaPayloadReviewPanel />
                  <OrcamentistaRealReaderSandboxPanel />

                  <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                    <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">
                      Orçamentista IA — Chat de análise (laboratório)
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
              </details>
            </section>
          </>
        )}

      </div>
    </div>
  );
}
