import { useParams } from 'react-router-dom';
import OrcamentistaChat from '../OrcamentistaChat';
import { useAppContext } from '../../AppContext';
import { useOportunidade } from '../../hooks/useOportunidades';

export default function OrcamentistaTab() {
  const { id = '' } = useParams();
  const { config } = useAppContext();
  const oportunidade = useOportunidade(id, config);

  if (!id) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Oportunidade não informada para abrir o Orçamentista IA.
        </div>
      </main>
    );
  }

  if (oportunidade.isLoading) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Carregando oportunidade para abrir o Orçamentista IA.
        </div>
      </main>
    );
  }

  if (oportunidade.error) {
    const message = oportunidade.error instanceof Error
      ? oportunidade.error.message
      : 'Erro ao carregar oportunidade.';

    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 p-6 text-sm text-brand-red">
          {message}
        </div>
      </main>
    );
  }

  if (!oportunidade.data) {
    return (
      <main className="min-h-screen bg-bg p-8 text-t1">
        <div className="rounded-lg border border-b1 bg-s1 p-6 text-sm text-t3">
          Oportunidade não encontrada para abrir o Orçamentista IA.
        </div>
      </main>
    );
  }

  const workspaceId = oportunidade.data.orcamentista_workspace_id || `opp_${id}`;

  return (
    <OrcamentistaChat
      opportunityId={id}
      workspaceId={workspaceId}
      backTo={`/oportunidades/${id}`}
    />
  );
}
