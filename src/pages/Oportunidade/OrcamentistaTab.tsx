import { useParams } from 'react-router-dom';
import OrcamentistaChat from '../OrcamentistaChat';
import { useAppContext } from '../../AppContext';
import { useOportunidadeOrcamento } from '../../hooks/useOportunidadeOrcamento';

export default function OrcamentistaTab() {
  const { id = '' } = useParams();
  const { config } = useAppContext();
  const oportunidadeOrcamento = useOportunidadeOrcamento(id, config);

  if (!id) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Oportunidade não informada para abrir o Orçamentista IA.
        </div>
      </main>
    );
  }

  if (oportunidadeOrcamento.isLoading) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Carregando oportunidade e orçamento para abrir o Orçamentista IA.
        </div>
      </main>
    );
  }

  if (oportunidadeOrcamento.error) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 p-6 text-sm text-brand-red">
          {oportunidadeOrcamento.error.message}
        </div>
      </main>
    );
  }

  if (!oportunidadeOrcamento.opportunity) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Oportunidade não encontrada para abrir o Orçamentista IA.
        </div>
      </main>
    );
  }

  const workspaceId = oportunidadeOrcamento.opportunity.orcamentista_workspace_id || `opp_${id}`;
  const statusText = oportunidadeOrcamento.hasOrcamento
    ? `Orçamento oficial vinculado: ${oportunidadeOrcamento.orcamento?.nome ?? oportunidadeOrcamento.orcamentoId}. ${oportunidadeOrcamento.itens.length} item(ns) carregado(s).`
    : 'Nenhum orçamento oficial vinculado ainda. A criação automática permanece desabilitada nesta fase.';

  return (
    <div className="min-h-screen bg-bg text-t1">
      <div className="border-b border-b1 bg-s1 px-6 py-3 text-xs text-t3">
        {statusText}
      </div>
      <OrcamentistaChat
        opportunityId={id}
        workspaceId={workspaceId}
        backTo={`/oportunidades/${id}`}
      />
    </div>
  );
}
