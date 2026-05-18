import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarDays, CheckCircle2, Loader2 } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { sbFetch } from '../lib/api';
import { Servico } from '../types';

interface Props {
  obraId: string;
}

function formatShortDate(value?: string) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value));
}

function getStringField(item: Record<string, unknown> | undefined, field: string) {
  const value = item?.[field];
  return typeof value === 'string' ? value : undefined;
}

export default function ObraVisaoGeral({ obraId }: Props) {
  const { config } = useAppContext();

  const servicosQuery = useQuery<Servico[]>({
    queryKey: ['obra_visao_geral_servicos', obraId],
    queryFn: async () => {
      const data = await sbFetch(
        `servicos?obra_id=eq.${obraId}&order=created_at.desc&limit=100`,
        {},
        config
      );
      return Array.isArray(data) ? (data as Servico[]) : [];
    },
    enabled: !!(config.url && config.key && obraId),
    staleTime: 1000 * 60 * 5,
  });

  const diarioQuery = useQuery<Array<Record<string, unknown>>>({
    queryKey: ['obra_visao_geral_diario', obraId],
    queryFn: async () => {
      const data = await sbFetch(
        `diario_obra?obra_id=eq.${obraId}&order=created_at.desc&limit=1`,
        {},
        config
      );
      return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    },
    enabled: !!(config.url && config.key && obraId),
    staleTime: 1000 * 60 * 5,
  });

  const obraQuery = useQuery<Array<Record<string, unknown>>>({
    queryKey: ['obra_visao_geral_obra', obraId],
    queryFn: async () => {
      const data = await sbFetch(`obras?id=eq.${obraId}&limit=1`, {}, config);
      return Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
    },
    enabled: !!(config.url && config.key && obraId),
    staleTime: 1000 * 60 * 5,
  });

  const resumo = useMemo(() => {
    const servicos = servicosQuery.data || [];
    const total = servicos.length;
    const concluidos = servicos.filter((servico) => servico.status === 'concluido').length;
    const avancoGeral = total
      ? Math.round(servicos.reduce((acc, servico) => acc + (servico.avanco_atual || 0), 0) / total)
      : 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendentesComData = servicos.filter(
      (servico) => servico.status !== 'concluido' && !!servico.data_prevista
    );

    return {
      avancoGeral,
      concluidos,
      total,
      proximasTarefas: [...pendentesComData]
        .sort(
          (a, b) =>
            new Date(a.data_prevista || '').getTime() - new Date(b.data_prevista || '').getTime()
        )
        .slice(0, 5),
      atrasados: pendentesComData.filter((servico) => {
        const dataPrevista = new Date(servico.data_prevista || '');
        dataPrevista.setHours(0, 0, 0, 0);
        return dataPrevista < today;
      }),
    };
  }, [servicosQuery.data]);

  const ultimoDiario = diarioQuery.data?.[0];
  const ultimaEntrada = formatShortDate(
    getStringField(ultimoDiario, 'dia') || getStringField(ultimoDiario, 'created_at')
  );
  const obraCreatedAt = getStringField(obraQuery.data?.[0], 'created_at');
  const diasEmObra = obraCreatedAt
    ? Math.max(1, Math.ceil((Date.now() - new Date(obraCreatedAt).getTime()) / 86400000))
    : null;

  const isLoading = servicosQuery.isLoading || diarioQuery.isLoading || obraQuery.isLoading;
  const error = servicosQuery.error || diarioQuery.error || obraQuery.error;

  if (isLoading) {
    return (
      <div className="flex min-h-72 items-center justify-center gap-3 text-sm text-white/60">
        <Loader2 className="h-5 w-5 animate-spin text-green-400" />
        Carregando visão geral
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-400">
        {error instanceof Error ? error.message : 'Erro ao carregar visão geral.'}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">
                Avanço Geral
              </p>
              <p className="mt-3 text-3xl font-extrabold text-white">{resumo.avancoGeral}%</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-green-500"
              style={{ width: `${Math.min(100, Math.max(0, resumo.avancoGeral))}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-white/60">
            {diasEmObra ? `${diasEmObra} dias em obra` : 'Data inicial não informada'}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Serviços</p>
          <p className="mt-3 text-3xl font-extrabold text-white">
            {resumo.concluidos} de {resumo.total}
          </p>
          <p className="mt-2 text-sm text-green-400">concluídos</p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Diário</p>
          <p className="mt-3 text-2xl font-extrabold text-white">
            {ultimoDiario ? `Última entrada: ${ultimaEntrada}` : 'Nenhuma entrada ainda'}
          </p>
          <p className="mt-2 text-sm text-white/60">Registro mais recente da obra</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-green-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">
              Próximas Tarefas
            </h2>
          </div>
          {resumo.proximasTarefas.length ? (
            <div className="space-y-3">
              {resumo.proximasTarefas.map((servico) => (
                <div
                  key={servico.id || servico.id_servico || servico.nome}
                  className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{servico.nome}</p>
                    <p className="mt-1 text-xs text-white/60">{servico.categoria}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-green-400">
                    {formatShortDate(servico.data_prevista)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-white/60">
              Nenhuma tarefa prevista.
            </p>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-white">Alertas</h2>
          </div>
          {resumo.atrasados.length ? (
            <div className="space-y-3">
              {resumo.atrasados.map((servico) => (
                <div
                  key={servico.id || servico.id_servico || servico.nome}
                  className="rounded-lg border border-amber-400/20 bg-amber-500/10 p-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-white">{servico.nome}</p>
                    <span className="shrink-0 text-xs font-bold text-amber-400">
                      {formatShortDate(servico.data_prevista)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-red-400">Tarefa atrasada</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-white/60">
              Nenhum alerta no momento.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
