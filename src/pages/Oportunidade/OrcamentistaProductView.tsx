import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Upload, FileText, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { useOportunidadeOrcamento } from '../../hooks/useOportunidadeOrcamento';
import { useOpportunityFiles, useUpdateOportunidade, useCreateOpportunityEvent } from '../../hooks/useOportunidades';
import { useCreateProposta } from '../../hooks/usePropostas';
import { calcularTotais } from '../../hooks/useOrcamento';
import { useAnalyzeOpportunity, type AnalyzeData, analyzeKeys } from '../../hooks/useAnalyzeOpportunity';
import { useQueryClient } from '@tanstack/react-query';
import OrcamentistaManualItemsPanel from './OrcamentistaManualItemsPanel';
import OrcamentistaAiReviewPanel from './OrcamentistaAiReviewPanel';

type ProductStatus =
  | 'aguardando_memorial'
  | 'em_analise'
  | 'pronto_para_revisar'
  | 'com_itens'
  | 'proposta_gerada';

const STATUS_LABEL: Record<ProductStatus, string> = {
  aguardando_memorial: 'Aguardando memorial',
  em_analise: 'Em análise',
  pronto_para_revisar: 'Pronto para revisar',
  com_itens: 'Com itens',
  proposta_gerada: 'Proposta gerada',
};

const STATUS_COLOR: Record<ProductStatus, string> = {
  aguardando_memorial: 'border-white/20 bg-white/5 text-white/50',
  em_analise: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  pronto_para_revisar: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  com_itens: 'border-green-500/30 bg-green-500/10 text-green-400',
  proposta_gerada: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
};

function StatusBadge({ status }: { status: ProductStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_COLOR[status]}`}>
      {status === 'em_analise' && <Clock size={11} />}
      {status === 'pronto_para_revisar' && <AlertCircle size={11} />}
      {status === 'com_itens' && <CheckCircle size={11} />}
      {status === 'proposta_gerada' && <CheckCircle size={11} />}
      {STATUS_LABEL[status]}
    </span>
  );
}

export default function OrcamentistaProductView() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { config } = useAppContext();
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const tanstackQc = useQueryClient();
  const createProposta = useCreateProposta(config);
  const updateOportunidade = useUpdateOportunidade(config);
  const createEvent = useCreateOpportunityEvent(config);

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
  const analyzeMutation = useAnalyzeOpportunity(id);
  const cachedAnalyzeResult = tanstackQc.getQueryData<{ data: AnalyzeData }>(analyzeKeys.result(id));
  const analyzeResult: AnalyzeData | null = analyzeMutation.data?.data ?? cachedAnalyzeResult?.data ?? null;
  const isAnalyzing = analyzeMutation.isPending;

  useEffect(() => {
    setSelectedFileIds([]);
  }, [id]);

  useEffect(() => {
    const available = new Set((opportunityFiles.data ?? []).map((f) => f.id));
    setSelectedFileIds((cur) => cur.filter((fid) => available.has(fid)));
  }, [opportunityFiles.data]);

  if (!id) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Oportunidade não informada.
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Carregando…
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

  const files = opportunityFiles.data ?? [];
  const hasAiItems = (analyzeResult?.items?.length ?? 0) > 0;
  const temProposta = !!opportunity.proposta_id;
  const totalItens = itens.reduce((acc, item) => acc + item.valor_total, 0);
  const workspaceId = opportunity.orcamentista_workspace_id || `opp_${id}`;

  const productStatus: ProductStatus = (() => {
    if (temProposta) return 'proposta_gerada';
    if (itens.length > 0) return 'com_itens';
    if (isAnalyzing) return 'em_analise';
    if (hasAiItems) return 'pronto_para_revisar';
    return 'aguardando_memorial';
  })();

  const canAnalyze = selectedFileIds.length > 0 && !isAnalyzing;

  const handleAnalyze = async () => {
    if (!canAnalyze) return;
    try {
      await analyzeMutation.mutateAsync({
        fileIds: selectedFileIds,
        workspaceId,
        provider: (config as any).aiProvider || undefined,
        model: (config as any).aiModel || undefined,
      });
    } catch {
      // erro via analyzeMutation.error
    }
  };

  const handleGerarProposta = async () => {
    if (!opportunity || !orcamento || itens.length === 0) return;
    
    try {
      const { total_bruto, total_final } = calcularTotais(itens, orcamento.bdi);
      const hoje = new Date().toISOString().slice(0, 10);
      const fimPrevisto = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

      const payload = {
        obra: {
          nome: opportunity.titulo,
          cliente: opportunity.cliente_nome_snapshot || opportunity.titulo,
          endereco: opportunity.endereco_resumo || '',
          tipo_obra: opportunity.tipo_obra || '',
          area_total_m2: opportunity.metragem_estimada ?? 0,
          valor_custos_diretos: total_bruto,
          valor_total_com_bdi: total_final,
          bdi_percentual: orcamento.bdi,
          bdi_valor: total_final - total_bruto,
          prazo_dias_uteis: 0,
          data_inicio_prevista: hoje,
          data_fim_prevista: fimPrevisto,
          observacoes: opportunity.observacao || undefined,
        },
        servicos: itens.map((it) => ({
          nome: it.descricao,
          descricao: it.descricao,
          categoria: 'Serviços',
          codigo_servico: it.codigo || '',
          cod: it.codigo || '',
          quantidade: it.quantidade,
          unidade: it.unidade,
          valor_unitario: it.valor_unitario,
          valor_total: it.valor_total,
          valor_total_direto: it.valor_total,
        })),
        equipes: [],
        _meta: { status_orcamento: orcamento.status },
      };

      const proposta = await createProposta.mutateAsync({
        opportunity_id: opportunity.id,
        orcamento_id: orcamento.id,
        titulo: `Proposta - ${opportunity.titulo}`,
        cliente_nome_snapshot: opportunity.cliente_nome_snapshot || opportunity.titulo,
        status: 'rascunho',
        validade_dias: 10,
        valor_total: total_final,
        bdi: orcamento.bdi,
        payload,
        observacoes: opportunity.observacao || null,
      });

      await updateOportunidade.mutateAsync({ id: opportunity.id, patch: { proposta_id: proposta.id } });

      await createEvent.mutateAsync({
        opportunity_id: opportunity.id,
        tipo: 'proposta_gerada',
        descricao: 'Proposta gerada a partir do orçamentista IA.',
        metadata: { proposta_id: proposta.id, orcamento_id: orcamento.id },
      });

      navigate(`/propostas?id=${proposta.id}`);
    } catch (err) {
      console.error('Erro ao gerar proposta:', err);
    }
  };

  const isBlocked = createResult?.status === 'blocked';
  const isCreatedOk = createResult?.status === 'created';
  const isErrResult = createResult?.status === 'error';

  return (
    <div className="min-h-screen bg-bg text-t1">
      {/* ── Header fixo ── */}
      <div className="sticky top-0 z-20 border-b border-white/10 bg-bg/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link
            to="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft size={13} />
            Voltar ao HUB
          </Link>
          <Link
            to={`/oportunidades/${id}/orcamentista/lab`}
            className="flex items-center gap-1 text-[11px] text-white/30 transition-colors hover:text-white/50"
          >
            Diagnóstico técnico
            <ExternalLink size={10} />
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">

        {/* ── Cabeçalho ── */}
        <header>
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-green-400">
            Orçamentista IA
          </p>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
            <h1 className="text-2xl font-extrabold text-t1">{opportunity.titulo}</h1>
            <StatusBadge status={productStatus} />
          </div>
          {opportunity.cliente_nome_snapshot && (
            <p className="mt-1 text-sm text-white/40">{opportunity.cliente_nome_snapshot}</p>
          )}
        </header>

        {/* ── Sem orçamento ── */}
        {!hasOrcamento && (
          <section className="space-y-4">
            <div className="rounded-lg border border-b1 bg-s1 p-6">
              <p className="mb-1 font-medium text-t1">Nenhum orçamento vinculado.</p>
              <p className="text-sm text-t3">
                Crie o orçamento oficial para começar a registrar itens e gerar a proposta.
              </p>
            </div>

            {isBlocked && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-400">
                {createResult.message}
              </div>
            )}
            {isErrResult && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
                {createResult.message}
              </div>
            )}
            {isCreatedOk && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
                {createResult.message}
              </div>
            )}

            {canCreateOrcamento && !isBlocked && (
              <button
                onClick={criarOrcamentoParaOportunidade}
                disabled={isCreating}
                className="w-full rounded-lg bg-green-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? 'Criando…' : 'Criar orçamento da oportunidade'}
              </button>
            )}
          </section>
        )}

        {/* ── Com orçamento ── */}
        {hasOrcamento && (
          <>
            {/* Memorial descritivo */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-white/70">Memorial descritivo</h2>

              {/* Lista de arquivos */}
              {opportunityFiles.isFetching && (
                <p className="text-xs text-white/40">Carregando arquivos…</p>
              )}
              {!opportunityFiles.isFetching && files.length === 0 && (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-white/15 p-5 text-sm text-white/40">
                  <Upload size={16} />
                  Nenhum arquivo enviado. Envie o memorial pela página da oportunidade.
                </div>
              )}
              {files.length > 0 && (
                <div className="rounded-lg border border-white/10 bg-white/5 divide-y divide-white/5">
                  {files.map((file) => {
                    const isSelected = selectedFileIds.includes(file.id);
                    return (
                      <label
                        key={file.id}
                        className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors ${isSelected ? 'bg-green-500/10' : 'hover:bg-white/5'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() =>
                            setSelectedFileIds((cur) =>
                              isSelected ? cur.filter((x) => x !== file.id) : [...cur, file.id]
                            )
                          }
                          className="accent-green-500"
                        />
                        <FileText size={14} className="shrink-0 text-white/40" />
                        <span className="flex-1 truncate text-sm text-white/80">{file.nome}</span>
                        {file.tamanho_bytes && (
                          <span className="text-xs text-white/30">
                            {(file.tamanho_bytes / 1024).toFixed(0)} KB
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Botão analisar */}
              {files.length > 0 && (
                <button
                  onClick={handleAnalyze}
                  disabled={!canAnalyze}
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-blue-400 transition-colors hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isAnalyzing
                    ? 'Analisando arquivos…'
                    : selectedFileIds.length > 0
                    ? `Analisar ${selectedFileIds.length} arquivo${selectedFileIds.length > 1 ? 's' : ''} selecionado${selectedFileIds.length > 1 ? 's' : ''}`
                    : 'Selecione arquivos para analisar'}
                </button>
              )}

              {analyzeMutation.error && (
                <p className="text-xs text-red-400">
                  Não foi possível analisar os arquivos. Tente novamente.
                </p>
              )}
            </section>

            {/* Resultado IA — revisão humana */}
            {analyzeResult && analyzeResult.items.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-white/70">Revisão dos itens identificados</h2>
                <OrcamentistaAiReviewPanel
                  items={analyzeResult.items}
                  resumo={(analyzeResult as any).resumo ?? null}
                  warnings={analyzeResult.warnings}
                  analyzedAt={analyzeResult.generated_at}
                  analyzedFileCount={analyzeResult.source_files?.length ?? 0}
                  criarItemManual={criarItemManual}
                />
              </section>
            )}

            {analyzeResult && analyzeResult.items.length === 0 && (
              <section>
                <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <p className="text-sm font-medium text-t1">Nenhum item identificado.</p>
                  <p className="mt-1 text-xs text-white/40">
                    Tente selecionar outros arquivos ou adicione itens manualmente abaixo.
                  </p>
                  {analyzeResult.warnings.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {analyzeResult.warnings.map((w, i) => (
                        <p key={i} className="text-[11px] text-amber-400">⚠ {w}</p>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Itens do orçamento oficial */}
            {orcamento && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-white/70">Itens do orçamento</h2>
                <OrcamentistaManualItemsPanel
                  orcamento={orcamento}
                  itens={itens}
                  criarItemManual={criarItemManual}
                  atualizarItemManual={atualizarItemManual}
                  removerItemManual={removerItemManual}
                />
                {itens.length > 0 && (
                  <div className="flex justify-end">
                    <span className="text-sm font-bold text-white/70">
                      Total:{' '}
                      <span className="text-white">
                        {totalItens.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </span>
                  </div>
                )}
              </section>
            )}

            {/* Proposta */}
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-white/70">Proposta comercial</h2>
              <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                {temProposta ? (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-t1">Proposta em rascunho</p>
                      <p className="mt-0.5 text-xs text-white/40">
                        {itens.length} item{itens.length !== 1 ? 'ns' : ''} ·{' '}
                        {totalItens.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <Link
                      to={`/propostas?id=${opportunity.proposta_id}`}
                      className="shrink-0 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-amber-400 transition-colors hover:bg-amber-500/20"
                    >
                      Abrir proposta →
                    </Link>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-t1">Nenhuma proposta gerada.</p>
                    <p className="mt-1 text-xs text-white/40">
                      {itens.length === 0
                        ? 'Adicione pelo menos um item ao orçamento antes de gerar a proposta.'
                        : 'Orçamento com itens consolidado. Você já pode gerar a proposta oficial.'}
                    </p>
                    {itens.length > 0 && (
                      <button
                        type="button"
                        onClick={handleGerarProposta}
                        disabled={createProposta.isPending}
                        className="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-green-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {createProposta.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        Gerar proposta a partir deste orçamento
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {/* ── Rodapé com link para Lab ── */}
        <footer className="flex justify-end pt-4 border-t border-white/5">
          <Link
            to={`/oportunidades/${id}/orcamentista/lab`}
            className="flex items-center gap-1 text-[11px] text-white/25 transition-colors hover:text-white/40"
          >
            Diagnóstico técnico
            <ExternalLink size={10} />
          </Link>
        </footer>

      </div>
    </div>
  );
}
