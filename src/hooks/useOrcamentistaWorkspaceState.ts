import { useQuery } from '@tanstack/react-query';

export type OrcamentistaWorkspaceAttachment = {
  categoria: 'projeto' | 'fornecedores' | 'referencias';
  nome: string;
  relativePath: string;
  mimeType: string;
  tamanhoBytes: number;
  atualizadoEm: string;
};

export type OrcamentistaWorkspacePreviewItem = {
  codigo: string | null;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  categoria: string | null;
  origem: string | null;
  confianca: number | null;
  observacoes: string | null;
};

export type OrcamentistaWorkspacePreview = {
  workspace_id: string;
  generated_at: string;
  source_file: string;
  items: OrcamentistaWorkspacePreviewItem[];
  warnings: string[];
};

export type OrcamentistaWorkspaceState = {
  opportunityId: string | null;
  workspaceId: string;
  generated_at: string;
  workspace: {
    exists: boolean;
    nome: string | null;
    unavailable_reason?: string;
  };
  attachments: OrcamentistaWorkspaceAttachment[];
  preview: {
    status: 'available' | 'empty' | 'workspace_missing' | 'workspace_root_missing' | 'error';
    data: OrcamentistaWorkspacePreview | null;
    warnings: string[];
  };
  safety: {
    canWriteConsolidationToBudget: false;
    touchedBudgetItemsTable: false;
    officialBudgetWrite: 'blocked';
  };
};

export const orcamentistaWorkspaceStateKeys = {
  detail: (workspaceId: string, opportunityId: string) =>
    ['orcamentista', 'workspace-state', workspaceId, opportunityId] as const,
};

export function useOrcamentistaWorkspaceState(workspaceId: string, opportunityId: string) {
  return useQuery<OrcamentistaWorkspaceState>({
    queryKey: orcamentistaWorkspaceStateKeys.detail(workspaceId, opportunityId),
    queryFn: async () => {
      const params = new URLSearchParams({ opportunityId });
      const response = await fetch(
        `/api/orcamentista/workspaces/${encodeURIComponent(workspaceId)}/state?${params.toString()}`
      );
      const payload = await response.json();

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.erro || `HTTP ${response.status}`);
      }

      return payload.data as OrcamentistaWorkspaceState;
    },
    enabled: Boolean(workspaceId && opportunityId),
    staleTime: 1000 * 30,
  });
}
