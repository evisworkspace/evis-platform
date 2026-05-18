import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { useAppContext } from '../AppContext';
import { useDashboardCentral } from '../hooks/useDashboardCentral';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia.';
  if (h < 18) return 'Boa tarde.';
  return 'Boa noite.';
}

function formatRelativeTime(diasAtras: number): string {
  if (diasAtras === 0) return 'hoje';
  if (diasAtras === 1) return 'há 1 dia';
  return `há ${diasAtras} dias`;
}

const SEVERIDADE_LABEL: Record<string, string> = {
  critica: 'CRÍTICO',
  alta: 'ALTO',
  media: 'MÉDIO',
  baixa: 'BAIXO',
};

const SEVERIDADE_COLOR: Record<string, string> = {
  critica: 'text-red-400 bg-red-500/10 border-red-500/20',
  alta: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  media: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  baixa: 'text-t3 bg-white/5 border-white/10',
};

const TIPO_ICON: Record<string, string> = {
  hitl: '⚡',
  hitl_medio: '◦',
  servico_atrasado: '⏱',
  proposta: '📋',
  pendencia: '⚠',
};

export default function DashboardPage() {
  const { config } = useAppContext();
  const { decisoes, alertas, pipeline, movimento, totalAcoes, criticos, isLoading, error } =
    useDashboardCentral(config);

  const semConfig = !config.url || !config.key;

  if (semConfig) {
    return (
      <main className="min-h-screen bg-bg text-t1">
        <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-8">
          <div className="rounded-xl border border-b1 bg-s1 p-8 text-center">
            <div className="mb-3 font-mono text-[9px] font-bold uppercase tracking-widest text-brand-amber">
              Configuração pendente
            </div>
            <p className="text-sm text-t3">
              Configure o Supabase nas Configurações para ativar o EVIS Central.
            </p>
            <Link
              to="/config"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest text-bg hover:bg-brand-green2"
            >
              Abrir configurações
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const statusSistema =
    totalAcoes === 0
      ? 'em_ordem'
      : criticos > 0
        ? 'critico'
        : 'atencao';

  return (
    <main className="min-h-screen bg-bg text-t1">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">

        {/* ── Header operacional ─────────────────────────────────────────── */}
        <header className="border-b border-b1 pb-6">
          <p className="text-3xl font-extrabold text-t1">{greeting()}</p>

          {isLoading ? (
            <div className="mt-3 flex items-center gap-2 text-sm text-t3">
              <Loader2 className="h-4 w-4 animate-spin text-brand-green" />
              Verificando situação operacional...
            </div>
          ) : error ? (
            <p className="mt-3 text-sm text-red-400">
              Não foi possível carregar os dados. Tente novamente.
            </p>
          ) : statusSistema === 'em_ordem' ? (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-brand-green" />
              <span className="text-t2">
                Tudo em ordem. Nenhuma decisão pendente.
              </span>
            </div>
          ) : (
            <p className="mt-3 text-sm text-t2">
              {totalAcoes} {totalAcoes === 1 ? 'item aguarda' : 'itens aguardam'} atenção
              {criticos > 0 && (
                <span className="ml-2 font-bold text-red-400">
                  — {criticos} {criticos === 1 ? 'crítico' : 'críticos'}
                </span>
              )}
              {pipeline.length > 0 && (
                <span className="ml-2 text-t4">
                  · {pipeline.length} {pipeline.length === 1 ? 'oportunidade' : 'oportunidades'} ativas
                </span>
              )}
            </p>
          )}
        </header>

        {!isLoading && (
          <>
            {/* ── Decisões ───────────────────────────────────────────────── */}
            {decisoes.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    Decisões — {decisoes.length} pendente{decisoes.length !== 1 ? 's' : ''}
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  {decisoes.map(d => (
                    <Link
                      key={d.id}
                      to={d.href}
                      className="group flex items-center justify-between gap-4 rounded-lg border border-b1 bg-s1 px-4 py-3 transition-colors hover:border-b3 hover:bg-s2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider ${SEVERIDADE_COLOR[d.severidade] ?? SEVERIDADE_COLOR.baixa}`}
                        >
                          {SEVERIDADE_LABEL[d.severidade] ?? d.severidade}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-t1">{d.titulo}</p>
                          <p className="text-[11px] text-t4">{d.contexto}</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-t4 group-hover:text-brand-green transition-colors" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Alertas ────────────────────────────────────────────────── */}
            {alertas.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-t3" />
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-t3">
                    Alertas — {alertas.length} item{alertas.length !== 1 ? 'ns' : ''}
                  </h2>
                </div>
                <div className="flex flex-col gap-2">
                  {alertas.map(a => (
                    <Link
                      key={`${a.tipo}_${a.id}`}
                      to={a.href}
                      className="group flex items-center justify-between gap-4 rounded-lg border border-b1 bg-s1 px-4 py-3 transition-colors hover:border-b3 hover:bg-s2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="shrink-0 text-base" aria-hidden="true">
                          {TIPO_ICON[a.tipo] ?? '·'}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-semibold text-t1">{a.titulo}</p>
                          <p className="text-[11px] text-t4">
                            {a.detalhe}
                            {a.contexto && a.contexto !== a.titulo && (
                              <span className="ml-2 text-t4/60">· {a.contexto}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-t4 group-hover:text-brand-green transition-colors" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Empty state ────────────────────────────────────────────── */}
            {decisoes.length === 0 && alertas.length === 0 && pipeline.length === 0 && (
              <div className="rounded-xl border border-dashed border-b1 p-10 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-brand-green" />
                <p className="text-[13px] font-semibold text-t2">Nenhuma ação pendente.</p>
                <p className="mt-1 text-[11px] text-t4">
                  O sistema está operando sem alertas ou decisões abertas.
                </p>
              </div>
            )}

            {/* ── Pipeline ───────────────────────────────────────────────── */}
            {pipeline.length > 0 && (
              <section>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-t4" />
                    <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-t4">
                      Pipeline — {pipeline.length} ativ{pipeline.length !== 1 ? 'as' : 'a'}
                    </h2>
                  </div>
                  <Link
                    to="/oportunidades"
                    className="text-[10px] font-bold uppercase tracking-wider text-t4 hover:text-brand-green transition-colors"
                  >
                    Ver todas →
                  </Link>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {pipeline.slice(0, 6).map(opp => (
                    <Link
                      key={opp.id}
                      to={`/oportunidades/${opp.id}`}
                      className="group flex items-center justify-between gap-3 rounded-lg border border-b1 bg-s1 px-4 py-3 transition-colors hover:border-b3 hover:bg-s2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-semibold text-t1">{opp.titulo}</p>
                        <p className="text-[10px] text-t4 mt-0.5">
                          {opp.status?.replace(/_/g, ' ')}
                          {opp.updated_at && (
                            <span className="ml-2">
                              · {formatRelativeTime(
                                Math.floor((Date.now() - new Date(opp.updated_at).getTime()) / 86400000)
                              )}
                            </span>
                          )}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-t4 group-hover:text-brand-green transition-colors" />
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* ── Movimento recente ──────────────────────────────────────── */}
            {movimento.length > 0 && (
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-t4" />
                  <h2 className="font-mono text-[10px] font-bold uppercase tracking-widest text-t4">
                    Movimento Recente
                  </h2>
                </div>
                <div className="flex flex-col gap-1">
                  {movimento.map(ev => (
                    <Link
                      key={ev.id}
                      to={`/oportunidades/${ev.opportunityId}`}
                      className="flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-s1"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green/60" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[12px] font-medium text-t2">
                          {ev.tipo?.replace(/_/g, ' ')}
                        </span>
                        {ev.descricao && (
                          <span className="ml-2 text-[12px] text-t4 truncate">
                            — {ev.descricao}
                          </span>
                        )}
                        {ev.opportunityTitulo && (
                          <span className="ml-2 text-[10px] text-t4/60">
                            · {ev.opportunityTitulo}
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-t4">
                        {formatRelativeTime(ev.diasAtras)}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

      </section>
    </main>
  );
}
