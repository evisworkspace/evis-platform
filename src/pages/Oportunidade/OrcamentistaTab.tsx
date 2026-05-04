import { useParams } from 'react-router-dom';
import OrcamentistaChat from '../OrcamentistaChat';
import { useAppContext } from '../../AppContext';
import { useOportunidadeOrcamento } from '../../hooks/useOportunidadeOrcamento';
import OrcamentistaManualItemsPanel from './OrcamentistaManualItemsPanel';

// ──────────────────────────────────────────────
// OrcamentistaTab — Fase 1D
//
// Regras:
//  - Nenhuma criação automática ao abrir a aba.
//  - Estado vazio exibido com clareza quando !hasOrcamento.
//  - Botão explícito para criar orçamento (Fase 1C).
//  - Quando hasOrcamento, exibe painel de itens manuais (Fase 1D).
//  - Se schema bloquear criação, exibir mensagem segura.
//  - Nunca usa obra_id = opp_<id> como vínculo de orcamento.
// ──────────────────────────────────────────────

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

  // ── Sem ID de oportunidade ──────────────────
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

  // ── Erro de leitura ─────────────────────────
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

  // ── Sem orçamento vinculado → estado vazio explícito ──
  if (!hasOrcamento) {
    const isBlocked   = createResult?.status === 'blocked';
    const isCreatedOk = createResult?.status === 'created';
    const isErrResult = createResult?.status === 'error';

    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="mx-auto max-w-xl space-y-4">
          {/* Estado vazio */}
          <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
            <p className="mb-1 font-medium text-t1">Nenhum orçamento oficial vinculado a esta oportunidade.</p>
            <p className="text-xs text-t3">
              Um orçamento oficial permite rastrear itens, quantitativos e valores
              dentro do fluxo canônico EVIS. Crie o orçamento abaixo para começar.
            </p>
          </div>

          {/* Feedback bloqueado por schema */}
          {isBlocked && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-400">
              <p className="font-semibold">Criação bloqueada</p>
              <p className="mt-1 text-xs">{createResult.message}</p>
            </div>
          )}

          {/* Feedback erro genérico */}
          {isErrResult && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
              <p className="font-semibold">Erro ao criar orçamento</p>
              <p className="mt-1 text-xs">{createResult.message}</p>
            </div>
          )}

          {/* Feedback sucesso (aguardando refetch) */}
          {isCreatedOk && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
              {createResult.message}
            </div>
          )}

          {/* Botão de ação explícita */}
          {canCreateOrcamento && !isBlocked && (
            <button
              id="btn-criar-orcamento-oportunidade"
              onClick={criarOrcamentoParaOportunidade}
              disabled={isCreating}
              className="w-full rounded-lg bg-brand-blue px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCreating ? 'Criando orçamento…' : 'Criar orçamento da oportunidade'}
            </button>
          )}

          {/* Mensagem de bloqueio por schema */}
          {isBlocked && (
            <p className="text-center text-xs text-t3">
              Criação bloqueada: schema atual ainda exige ajuste para orçamento por oportunidade.
              Consulte o SCHEMA_GAP_REPORT para a pendência registrada.
            </p>
          )}
        </div>
      </main>
    );
  }

  // ── Orçamento vinculado → painel de itens + Orçamentista IA ──
  //
  // workspaceId: identificador operacional do OrcamentistaChat.
  // NÃO é obra_id — o fallback opp_${id} é para o workspace de staging,
  // não para a tabela orcamentos.
  const workspaceId = opportunity.orcamentista_workspace_id || `opp_${id}`;

  return (
    <div className="min-h-screen bg-bg text-t1">
      <div className="mx-auto max-w-5xl space-y-8 p-6">

        {/* ── Seção 1: Itens manuais do orçamento oficial ── */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-b1" />
            <span className="text-xs font-semibold uppercase tracking-wider text-t3">
              Itens manuais do orçamento
            </span>
            <div className="h-px flex-1 bg-b1" />
          </div>

          {orcamento && (
            <OrcamentistaManualItemsPanel
              orcamento={orcamento}
              itens={itens}
              criarItemManual={criarItemManual}
              atualizarItemManual={atualizarItemManual}
              removerItemManual={removerItemManual}
            />
          )}
        </section>

        {/* ── Seção 2: Orçamentista IA (workspace/preview) ── */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-b1" />
            <span className="text-xs font-semibold uppercase tracking-wider text-t3">
              Orçamentista IA — workspace de análise
            </span>
            <div className="h-px flex-1 bg-b1" />
          </div>

          <div className="mb-3 rounded-lg border border-b1 bg-s1 px-5 py-3 text-xs text-t3">
            Esta área é o workspace de análise do Orçamentista IA. Dados gerados aqui
            são staging/preview e não substituem os itens manuais acima até consolidação explícita.
          </div>

          <OrcamentistaChat
            opportunityId={id}
            workspaceId={workspaceId}
            backTo={`/oportunidades/${id}`}
          />
        </section>

      </div>
    </div>
  );
}
