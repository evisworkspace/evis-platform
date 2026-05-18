import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { sbFetch } from '../lib/api';
import { Config, Opportunity, OpportunityEvent, Servico, Pendencia } from '../types';

// ── Tipos internos do dashboard ──────────────────────────────────────────────

type HitlRow = {
  id: string;
  titulo: string;
  severidade: 'baixa' | 'media' | 'alta' | 'critica';
  hitl_type: string;
  orcamento_id: string | null;
  status: string;
};

const SEVERIDADE_RANK: Record<string, number> = { critica: 4, alta: 3, media: 2, baixa: 1 };
const PRIORIDADE_RANK: Record<string, number> = { alta: 3, media: 2, baixa: 1 };

function daysAgo(iso?: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

// ── Hook principal ────────────────────────────────────────────────────────────

export function useDashboardCentral(config: Config) {
  const enabled = !!(config.url && config.key);
  const hoje = new Date().toISOString().slice(0, 10);
  const seisDiasAtras = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 19);

  const hitlsQ = useQuery<HitlRow[]>({
    queryKey: ['dashboard_hitls'],
    queryFn: async () => {
      const data = await sbFetch(
        'orcamentista_hitls?status=eq.pendente&limit=30',
        {},
        config
      );
      return (Array.isArray(data) ? data : []) as HitlRow[];
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const pendenciasQ = useQuery<Pendencia[]>({
    queryKey: ['dashboard_pendencias'],
    queryFn: async () => {
      const data = await sbFetch(
        'pendencias?status=eq.ABERTA&limit=30',
        {},
        config
      );
      return (Array.isArray(data) ? data : []) as Pendencia[];
    },
    enabled,
    staleTime: 1000 * 60 * 2,
  });

  const atrasadosQ = useQuery<Servico[]>({
    queryKey: ['dashboard_atrasados', hoje],
    queryFn: async () => {
      const data = await sbFetch(
        `servicos?status=neq.concluido&data_prevista=lt.${hoje}&order=data_prevista.asc&limit=30`,
        {},
        config
      );
      return (Array.isArray(data) ? data : []) as Servico[];
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const oportunidadesQ = useQuery<Opportunity[]>({
    queryKey: ['dashboard_oportunidades'],
    queryFn: async () => {
      const data = await sbFetch(
        'opportunities?order=updated_at.desc&limit=50',
        {},
        config
      );
      return (Array.isArray(data) ? data : []) as Opportunity[];
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });

  const eventosQ = useQuery<OpportunityEvent[]>({
    queryKey: ['dashboard_eventos'],
    queryFn: async () => {
      const data = await sbFetch(
        `opportunity_events?order=created_at.desc&limit=10`,
        {},
        config
      );
      return (Array.isArray(data) ? data : []) as OpportunityEvent[];
    },
    enabled,
    staleTime: 1000 * 60 * 1,
  });

  const resultado = useMemo(() => {
    const hitls = hitlsQ.data ?? [];
    const pendencias = pendenciasQ.data ?? [];
    const atrasados = atrasadosQ.data ?? [];
    const oportunidades = oportunidadesQ.data ?? [];
    const eventos = eventosQ.data ?? [];

    // Mapa: orcamento_id → opportunity para navegação HITL
    const orcamentoToOpp = new Map<string, Opportunity>();
    oportunidades.forEach(opp => {
      if (opp.orcamento_id) orcamentoToOpp.set(opp.orcamento_id, opp);
    });

    // Mapa: opportunity_id → opportunity para movimento recente
    const oppById = new Map<string, Opportunity>();
    oportunidades.forEach(opp => oppById.set(opp.id, opp));

    // ── Decisões: exigem ação imediata ─────────────────────────────────────
    const hitlsOrdenados = [...hitls].sort(
      (a, b) => (SEVERIDADE_RANK[b.severidade] ?? 0) - (SEVERIDADE_RANK[a.severidade] ?? 0)
    );

    const decisoes = hitlsOrdenados
      .filter(h => h.severidade === 'critica' || h.severidade === 'alta')
      .map(h => {
        const opp = h.orcamento_id ? orcamentoToOpp.get(h.orcamento_id) : null;
        return {
          id: h.id,
          tipo: 'hitl' as const,
          titulo: h.titulo,
          detalhe: h.hitl_type?.replace(/_/g, ' '),
          severidade: h.severidade,
          href: opp ? `/oportunidades/${opp.id}/orcamentista` : '/oportunidades',
          contexto: opp?.titulo ?? 'Orçamento pendente',
        };
      });

    // ── Alertas: exigem atenção em breve ──────────────────────────────────
    const alertasHitlMedios = hitlsOrdenados
      .filter(h => h.severidade === 'media' || h.severidade === 'baixa')
      .slice(0, 5)
      .map(h => {
        const opp = h.orcamento_id ? orcamentoToOpp.get(h.orcamento_id) : null;
        return {
          id: h.id,
          tipo: 'hitl_medio' as const,
          titulo: h.titulo,
          detalhe: `HITL ${h.severidade}`,
          href: opp ? `/oportunidades/${opp.id}/orcamentista` : '/oportunidades',
          contexto: opp?.titulo ?? 'Orçamento pendente',
          dias: 0,
        };
      });

    const alertasServicos = atrasados.slice(0, 10).map(s => ({
      id: String(s.id || s.nome),
      tipo: 'servico_atrasado' as const,
      titulo: s.nome,
      detalhe: `Prazo: ${s.data_prevista ? s.data_prevista.split('-').reverse().join('/') : '-'}`,
      href: s.obra_id ? `/obras/${s.obra_id}?tab=planejamento` : '/obras',
      contexto: s.obra_id ?? 'Obra',
      dias: daysAgo(s.data_prevista),
    }));

    const propostasAguardando = oportunidades
      .filter(opp => opp.status === 'proposta_enviada')
      .map(opp => ({
        id: opp.id,
        tipo: 'proposta' as const,
        titulo: opp.titulo,
        detalhe: `Sem resposta há ${daysAgo(opp.updated_at)} dia${daysAgo(opp.updated_at) !== 1 ? 's' : ''}`,
        href: `/oportunidades/${opp.id}`,
        contexto: opp.cliente_nome_snapshot ?? 'Cliente',
        dias: daysAgo(opp.updated_at),
      }));

    const pendenciasAltas = [...pendencias]
      .sort((a, b) => (PRIORIDADE_RANK[b.prioridade] ?? 0) - (PRIORIDADE_RANK[a.prioridade] ?? 0))
      .filter(p => p.prioridade === 'alta')
      .map(p => ({
        id: p.id,
        tipo: 'pendencia' as const,
        titulo: p.descricao,
        detalhe: `Pendência alta`,
        href: p.obra_id ? `/obras/${p.obra_id}` : '/obras',
        contexto: p.obra_id ?? 'Obra',
        dias: 0,
      }));

    const alertas = [
      ...alertasServicos,
      ...propostasAguardando,
      ...pendenciasAltas,
      ...alertasHitlMedios,
    ];

    // ── Pipeline: oportunidades ativas (não bloqueadas) ─────────────────────
    const pipeline = oportunidades.filter(
      opp =>
        opp.status !== 'ganha' &&
        opp.status !== 'perdida' &&
        opp.status !== 'arquivada'
    );

    // ── Movimento recente ──────────────────────────────────────────────────
    const movimento = eventos.map(ev => ({
      id: ev.id,
      tipo: ev.tipo,
      descricao: ev.descricao,
      opportunityTitulo: oppById.get(ev.opportunity_id)?.titulo ?? null,
      opportunityId: ev.opportunity_id,
      created_at: ev.created_at,
      diasAtras: daysAgo(ev.created_at),
    }));

    const totalAcoes = decisoes.length + alertas.length;
    const criticos = decisoes.filter(d => d.severidade === 'critica').length;

    return { decisoes, alertas, pipeline, movimento, totalAcoes, criticos };
  }, [hitlsQ.data, pendenciasQ.data, atrasadosQ.data, oportunidadesQ.data, eventosQ.data]);

  const isLoading =
    hitlsQ.isLoading ||
    pendenciasQ.isLoading ||
    atrasadosQ.isLoading ||
    oportunidadesQ.isLoading ||
    eventosQ.isLoading;

  const error =
    oportunidadesQ.error ??
    atrasadosQ.error ??
    null;

  return { ...resultado, isLoading, error };
}
