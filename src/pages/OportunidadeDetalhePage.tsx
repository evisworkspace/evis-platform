import { FormEvent, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  FileText,
  Hammer,
  Loader2,
  MessageSquarePlus,
  Send,
} from 'lucide-react';
import { useAppContext } from '../AppContext';
import {
  useCreateOpportunityEvent,
  useOportunidade,
  useOpportunityEvents,
} from '../hooks/useOportunidades';

const statusLabel: Record<string, string> = {
  novo: 'Novo',
  qualificando: 'Qualificando',
  aguardando_documentos: 'Aguardando docs',
  em_orcamento: 'Em orçamento',
  proposta_enviada: 'Proposta enviada',
  negociacao: 'Negociação',
  ganha: 'Ganha',
  perdida: 'Perdida',
  arquivada: 'Arquivada',
};

const priorityLabel: Record<string, string> = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatMoney(value: number | null) {
  if (value === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatArea(value: number | null) {
  if (value === null) return '-';
  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(value)} m2`;
}

function DetailItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="rounded-lg border border-b1 bg-bg/50 p-4">
      <div className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-t4">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-t1">{value || '-'}</div>
    </div>
  );
}

export default function OportunidadeDetalhePage() {
  const { id = '' } = useParams();
  const { config, toast } = useAppContext();
  const [eventType, setEventType] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const oportunidade = useOportunidade(id, config);
  const events = useOpportunityEvents(id, config);
  const createEvent = useCreateOpportunityEvent(config);

  async function handleAddEvent(event: FormEvent) {
    event.preventDefault();

    const tipo = eventType.trim();
    const descricao = eventDescription.trim();

    if (!tipo || !descricao) {
      toast('Informe tipo e descrição do evento.', 'error');
      return;
    }

    try {
      await createEvent.mutateAsync({
        opportunity_id: id,
        tipo,
        descricao,
        metadata: {},
      });
      setEventType('');
      setEventDescription('');
      toast('Evento adicionado.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao adicionar evento.';
      toast(message, 'error');
    }
  }

  const item = oportunidade.data;

  return (
    <main className="min-h-screen bg-bg text-t1">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <header className="border-b border-b1 pb-6">
          <Link
            to="/oportunidades"
            className="mb-5 inline-flex w-fit items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-t3 transition-colors hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4" />
            Oportunidades
          </Link>

          {oportunidade.isLoading ? (
            <div className="flex min-h-32 items-center gap-3 text-sm text-t3">
              <Loader2 className="h-5 w-5 animate-spin text-brand-green" />
              Carregando oportunidade
            </div>
          ) : oportunidade.error ? (
            <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
              {oportunidade.error instanceof Error
                ? oportunidade.error.message
                : 'Erro ao carregar oportunidade.'}
            </div>
          ) : !item ? (
            <div className="rounded-lg border border-b1 bg-s1 px-4 py-8 text-center text-sm text-t3">
              Oportunidade não encontrada.
            </div>
          ) : (
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-green">
                  <Briefcase className="h-4 w-4" />
                  Detalhe da oportunidade
                </div>
                <h1 className="max-w-4xl text-3xl font-extrabold tracking-normal text-t1 sm:text-4xl">
                  {item.titulo}
                </h1>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded border border-brand-green/30 bg-brand-green/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-green">
                    {statusLabel[item.status] ?? item.status}
                  </span>
                  <span className="rounded border border-b2 bg-s2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-t2">
                    {priorityLabel[item.prioridade] ?? item.prioridade}
                  </span>
                  <span className="rounded border border-b2 bg-s2 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-t3">
                    Criada em {formatDate(item.created_at)}
                  </span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-b1 bg-s1 px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest text-t4 opacity-80"
                >
                  <Hammer className="h-4 w-4" />
                  Abrir Orçamentista
                  <span className="font-mono text-[9px] text-brand-amber">Em breve</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-b1 bg-s1 px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest text-t4 opacity-80"
                >
                  <FileText className="h-4 w-4" />
                  Gerar Proposta
                  <span className="font-mono text-[9px] text-brand-amber">Próxima etapa</span>
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-b1 bg-s1 px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest text-t4 opacity-80"
                >
                  <Briefcase className="h-4 w-4" />
                  Converter em Obra
                  <span className="font-mono text-[9px] text-brand-amber">Em breve</span>
                </button>
              </div>
            </div>
          )}
        </header>

        {item && (
          <div className="grid flex-1 gap-6 py-6 lg:grid-cols-[1fr_380px]">
            <section className="space-y-6">
              <div className="rounded-lg border border-b1 bg-s1 p-5">
                <div className="mb-4 text-[10px] font-bold uppercase tracking-widest text-t3">
                  Dados comerciais
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <DetailItem label="Origem" value={item.origem} />
                  <DetailItem label="Cliente" value={item.cliente_nome_snapshot} />
                  <DetailItem label="Telefone" value={item.telefone_snapshot} />
                  <DetailItem label="Email" value={item.email_snapshot} />
                  <DetailItem label="Endereço" value={item.endereco_resumo} />
                  <DetailItem label="Tipo de obra" value={item.tipo_obra} />
                  <DetailItem label="Metragem estimada" value={formatArea(item.metragem_estimada)} />
                  <DetailItem label="Valor estimado" value={formatMoney(item.valor_estimado)} />
                  <DetailItem label="Criada em" value={formatDate(item.created_at)} />
                </div>
              </div>

              <div className="rounded-lg border border-b1 bg-s1 p-5">
                <div className="mb-3 text-[10px] font-bold uppercase tracking-widest text-t3">
                  Observação
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-t2">
                  {item.observacao || 'Nenhuma observação registrada.'}
                </p>
              </div>
            </section>

            <aside className="rounded-lg border border-b1 bg-s1 p-5">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-t3">
                    Linha do tempo
                  </div>
                  <div className="mt-1 text-xs text-t4">Eventos manuais da oportunidade</div>
                </div>
                {events.isFetching && <Loader2 className="h-4 w-4 animate-spin text-brand-green" />}
              </div>

              <form onSubmit={handleAddEvent} className="mb-6 rounded-lg border border-b1 bg-bg/50 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-bold text-t1">
                  <MessageSquarePlus className="h-4 w-4 text-brand-green" />
                  Adicionar evento
                </div>
                <label className="mb-3 block">
                  <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">
                    Tipo
                  </span>
                  <input
                    value={eventType}
                    onChange={(event) => setEventType(event.target.value)}
                    className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t4 focus:border-brand-green"
                    placeholder="Ex: ligação, visita, nota"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">
                    Descrição
                  </span>
                  <textarea
                    value={eventDescription}
                    onChange={(event) => setEventDescription(event.target.value)}
                    className="min-h-24 w-full resize-y rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t4 focus:border-brand-green"
                    placeholder="Resumo do contato ou próximo passo."
                  />
                </label>
                <button
                  type="submit"
                  disabled={createEvent.isPending}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-green px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-widest text-bg transition-colors hover:bg-brand-green2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createEvent.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Salvar evento
                </button>
              </form>

              {events.error ? (
                <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
                  {events.error instanceof Error ? events.error.message : 'Erro ao carregar eventos.'}
                </div>
              ) : events.isLoading ? (
                <div className="flex min-h-32 items-center justify-center gap-3 text-sm text-t3">
                  <Loader2 className="h-5 w-5 animate-spin text-brand-green" />
                  Carregando eventos
                </div>
              ) : !events.data?.length ? (
                <div className="flex min-h-32 flex-col items-center justify-center rounded-lg border border-dashed border-b2 px-4 text-center">
                  <CalendarDays className="mb-3 h-5 w-5 text-t4" />
                  <div className="text-sm font-bold text-t2">Nenhum evento registrado</div>
                  <div className="mt-1 text-xs leading-5 text-t4">
                    Adicione o primeiro evento manual para iniciar o histórico.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.data.map((event) => (
                    <article key={event.id} className="rounded-lg border border-b1 bg-bg/50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-bold text-t1">{event.tipo}</div>
                        <time className="shrink-0 font-mono text-[10px] text-t4">
                          {formatDate(event.created_at)}
                        </time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-t3">
                        {event.descricao || '-'}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}
