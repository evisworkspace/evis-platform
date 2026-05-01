import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sbFetch } from '../lib/api';
import {
  Config,
  Contact,
  Opportunity,
  OpportunityEvent,
  OpportunityFile,
  OpportunityStatus,
} from '../types';

export type OportunidadesFilters = {
  status?: OpportunityStatus;
  contactId?: string;
  obraId?: string;
  limit?: number;
};

export type CreateOpportunityPayload = Pick<Opportunity, 'titulo'> &
  Partial<Omit<Opportunity, 'id' | 'titulo' | 'created_at' | 'updated_at'>>;

export type CreateContactPayload = Pick<Contact, 'nome'> &
  Partial<Omit<Contact, 'id' | 'nome' | 'created_at' | 'updated_at'>>;

export type CreateOpportunityEventPayload = Omit<OpportunityEvent, 'id' | 'created_at'>;

export const oportunidadesKeys = {
  all: ['opportunities'] as const,
  list: (filters?: OportunidadesFilters) => ['opportunities', filters ?? {}] as const,
  detail: (id: string) => ['opportunities', 'detail', id] as const,
  events: (opportunityId: string) => ['opportunity_events', opportunityId] as const,
  files: (opportunityId: string) => ['opportunity_files', opportunityId] as const,
};

function buildOportunidadesPath(filters: OportunidadesFilters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.set('status', `eq.${filters.status}`);
  if (filters.contactId) params.set('contact_id', `eq.${filters.contactId}`);
  if (filters.obraId) params.set('obra_id', `eq.${filters.obraId}`);

  params.set('order', 'created_at.desc');
  params.set('limit', String(filters.limit ?? 100));

  return `opportunities?${params.toString()}`;
}

export function useOportunidades(config: Config, filters: OportunidadesFilters = {}) {
  return useQuery<Opportunity[]>({
    queryKey: oportunidadesKeys.list(filters),
    queryFn: async () => {
      const data = await sbFetch(buildOportunidadesPath(filters), {}, config);
      return data as Opportunity[];
    },
    enabled: !!(config.url && config.key),
    staleTime: 1000 * 60 * 5,
  });
}

export function useOportunidade(id: string, config: Config) {
  return useQuery<Opportunity | null>({
    queryKey: oportunidadesKeys.detail(id),
    queryFn: async () => {
      const data = await sbFetch(`opportunities?id=eq.${id}&limit=1`, {}, config);
      const rows = Array.isArray(data) ? data : [];
      return (rows[0] ?? null) as Opportunity | null;
    },
    enabled: !!(config.url && config.key && id),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateOportunidade(config: Config) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOpportunityPayload) => {
      const data = await sbFetch(
        'opportunities',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        config
      );
      return (Array.isArray(data) ? data[0] : data) as Opportunity;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: oportunidadesKeys.all });
    },
  });
}

export function useCreateContact(config: Config) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateContactPayload) => {
      const data = await sbFetch(
        'contacts',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        config
      );
      return (Array.isArray(data) ? data[0] : data) as Contact;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateOportunidade(config: Config) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Opportunity> }) => {
      const data = await sbFetch(
        `opportunities?id=eq.${id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
        },
        config
      );
      return (Array.isArray(data) ? data[0] : data) as Opportunity;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: oportunidadesKeys.all });
      if (data?.id) {
        qc.invalidateQueries({ queryKey: oportunidadesKeys.events(data.id) });
        qc.invalidateQueries({ queryKey: oportunidadesKeys.files(data.id) });
      }
    },
  });
}

export function useOpportunityEvents(opportunityId: string, config: Config) {
  return useQuery<OpportunityEvent[]>({
    queryKey: oportunidadesKeys.events(opportunityId),
    queryFn: async () => {
      const data = await sbFetch(
        `opportunity_events?opportunity_id=eq.${opportunityId}&order=created_at.desc&limit=200`,
        {},
        config
      );
      return data as OpportunityEvent[];
    },
    enabled: !!(config.url && config.key && opportunityId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateOpportunityEvent(config: Config) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateOpportunityEventPayload) => {
      const data = await sbFetch(
        'opportunity_events',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        config
      );
      return (Array.isArray(data) ? data[0] : data) as OpportunityEvent;
    },
    onSuccess: (data) => {
      if (data?.opportunity_id) {
        qc.invalidateQueries({ queryKey: oportunidadesKeys.events(data.opportunity_id) });
        qc.invalidateQueries({ queryKey: oportunidadesKeys.detail(data.opportunity_id) });
      }
    },
  });
}

export function useOpportunityFiles(opportunityId: string, config: Config) {
  return useQuery<OpportunityFile[]>({
    queryKey: oportunidadesKeys.files(opportunityId),
    queryFn: async () => {
      const data = await sbFetch(
        `opportunity_files?opportunity_id=eq.${opportunityId}&order=created_at.desc&limit=100`,
        {},
        config
      );
      return data as OpportunityFile[];
    },
    enabled: !!(config.url && config.key && opportunityId),
    staleTime: 1000 * 60 * 5,
  });
}
