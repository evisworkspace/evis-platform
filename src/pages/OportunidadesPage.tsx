import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, Loader2, Plus, Save, X } from 'lucide-react';
import { useAppContext } from '../AppContext';
import {
  useCreateContact,
  useCreateOportunidade,
  useOportunidades,
} from '../hooks/useOportunidades';

type FormState = {
  titulo: string;
  cliente_nome: string;
  telefone: string;
  origem: string;
  tipo_obra: string;
  metragem_estimada: string;
  valor_estimado: string;
  observacao: string;
};

const initialForm: FormState = {
  titulo: '',
  cliente_nome: '',
  telefone: '',
  origem: '',
  tipo_obra: '',
  metragem_estimada: '',
  valor_estimado: '',
  observacao: '',
};

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

function cleanText(value: string) {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoney(value: number | null) {
  if (value === null) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function OportunidadesPage() {
  const { config, toast } = useAppContext();
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);

  const { data: oportunidades = [], isLoading, error } = useOportunidades(config);
  const createContact = useCreateContact(config);
  const createOportunidade = useCreateOportunidade(config);

  const isSaving = createContact.isPending || createOportunidade.isPending;
  const totalEstimado = useMemo(
    () => oportunidades.reduce((acc, item) => acc + (item.valor_estimado ?? 0), 0),
    [oportunidades]
  );

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const titulo = form.titulo.trim();
    if (!titulo) {
      toast('Informe o título da oportunidade.', 'error');
      return;
    }

    try {
      const clienteNome = cleanText(form.cliente_nome);
      const telefone = cleanText(form.telefone);
      let contactId: string | null = null;

      if (clienteNome || telefone) {
        const contact = await createContact.mutateAsync({
          nome: clienteNome || telefone || 'Contato sem nome',
          telefone,
          tipo: 'cliente',
        });
        contactId = contact.id;
      }

      await createOportunidade.mutateAsync({
        titulo,
        status: 'novo',
        prioridade: 'media',
        contact_id: contactId,
        origem: cleanText(form.origem),
        cliente_nome_snapshot: clienteNome,
        telefone_snapshot: telefone,
        tipo_obra: cleanText(form.tipo_obra),
        metragem_estimada: parseOptionalNumber(form.metragem_estimada),
        valor_estimado: parseOptionalNumber(form.valor_estimado),
        observacao: cleanText(form.observacao),
      });

      setForm(initialForm);
      setIsCreating(false);
      toast('Oportunidade criada.', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao criar oportunidade.';
      toast(message, 'error');
    }
  }

  return (
    <main className="min-h-screen bg-bg text-t1">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
        <header className="flex flex-col gap-5 border-b border-b1 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              to="/dashboard"
              className="mb-5 inline-flex w-fit items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-t3 transition-colors hover:text-brand-green"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-green">
              <Briefcase className="h-4 w-4" />
              Oportunidades
            </div>
            <h1 className="text-3xl font-extrabold tracking-normal text-t1 sm:text-4xl">
              Pipeline comercial
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-t3">
              Registro inicial de leads antes da criação de orçamento, proposta ou obra.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-lg border border-b1 bg-s1 px-4 py-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-t4">
                Valor estimado
              </div>
              <div className="mt-1 font-mono text-sm font-bold text-t1">
                {formatMoney(totalEstimado)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-green px-4 py-3 text-[11px] font-extrabold uppercase tracking-widest text-bg transition-colors hover:bg-brand-green2"
            >
              <Plus className="h-4 w-4" />
              Nova oportunidade
            </button>
          </div>
        </header>

        {isCreating && (
          <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-b1 bg-s1 p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-t1">Nova oportunidade</h2>
                <p className="mt-1 text-xs text-t3">
                  Preencha só o necessário para iniciar o acompanhamento comercial.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setIsCreating(false);
                }}
                className="rounded-lg border border-b1 bg-bg p-2 text-t3 transition-colors hover:border-b3 hover:text-t1"
                aria-label="Fechar formulário"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="block lg:col-span-2">
                <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">
                  Título *
                </span>
                <input
                  value={form.titulo}
                  onChange={(event) => updateField('titulo', event.target.value)}
                  className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t4 focus:border-brand-green"
                  placeholder="Ex: Reforma residencial - bairro Centro"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">
                  Cliente
                </span>
                <input
                  value={form.cliente_nome}
                  onChange={(event) => updateField('cliente_nome', event.target.value)}
                  className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t4 focus:border-brand-green"
                  placeholder="Nome"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">
                  Telefone
                </span>
                <input
                  value={form.telefone}
                  onChange={(event) => updateField('telefone', event.target.value)}
                  className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t4 focus:border-brand-green"
                  placeholder="(00) 00000-0000"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">
                  Origem
                </span>
                <input
                  value={form.origem}
                  onChange={(event) => updateField('origem', event.target.value)}
                  className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t4 focus:border-brand-green"
                  placeholder="Indicação, site, Instagram"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">
                  Tipo de obra
                </span>
                <input
                  value={form.tipo_obra}
                  onChange={(event) => updateField('tipo_obra', event.target.value)}
                  className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t4 focus:border-brand-green"
                  placeholder="Residencial, comercial"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">
                  Metragem estimada
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.metragem_estimada}
                  onChange={(event) => updateField('metragem_estimada', event.target.value)}
                  className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t4 focus:border-brand-green"
                  placeholder="120"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">
                  Valor estimado
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valor_estimado}
                  onChange={(event) => updateField('valor_estimado', event.target.value)}
                  className="w-full rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t4 focus:border-brand-green"
                  placeholder="250000"
                />
              </label>
              <label className="block md:col-span-2 lg:col-span-4">
                <span className="mb-1.5 block font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">
                  Observação
                </span>
                <textarea
                  value={form.observacao}
                  onChange={(event) => updateField('observacao', event.target.value)}
                  className="min-h-24 w-full resize-y rounded-md border border-b1 bg-bg px-3 py-2 text-sm text-t1 outline-none transition-colors placeholder:text-t4 focus:border-brand-green"
                  placeholder="Resumo do pedido, contexto inicial ou próximos passos."
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setIsCreating(false);
                }}
                className="rounded-md border border-b2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-t2 transition-colors hover:border-b3 hover:text-t1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-green px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-widest text-bg transition-colors hover:bg-brand-green2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            </div>
          </form>
        )}

        <section className="mt-6 flex-1 rounded-lg border border-b1 bg-s1">
          <div className="flex items-center justify-between border-b border-b1 px-4 py-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-t3">
              {oportunidades.length} oportunidades
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-t3">
              <Loader2 className="h-5 w-5 animate-spin text-brand-green" />
              Carregando oportunidades
            </div>
          ) : error ? (
            <div className="flex min-h-64 items-center justify-center px-6 text-center text-sm text-brand-red">
              {error instanceof Error ? error.message : 'Erro ao carregar oportunidades.'}
            </div>
          ) : oportunidades.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-b1 bg-bg text-brand-green">
                <Briefcase className="h-6 w-6" />
              </div>
              <h2 className="text-base font-bold text-t1">Nenhuma oportunidade registrada</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-t3">
                Crie a primeira oportunidade para iniciar o pipeline comercial.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse">
                <thead>
                  <tr className="border-b border-b1 bg-s2/40">
                    <th className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">Título</th>
                    <th className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">Status</th>
                    <th className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">Origem</th>
                    <th className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">Prioridade</th>
                    <th className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">Cliente</th>
                    <th className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">Telefone</th>
                    <th className="px-4 py-3 text-right font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">Valor</th>
                    <th className="px-4 py-3 text-right font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">Metragem</th>
                    <th className="px-4 py-3 text-left font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-t3">Criada em</th>
                  </tr>
                </thead>
                <tbody>
                  {oportunidades.map((oportunidade) => (
                    <tr key={oportunidade.id} className="border-b border-b1/70 transition-colors hover:bg-s2/40">
                      <td className="max-w-[260px] px-4 py-4">
                        <div className="truncate text-sm font-bold text-t1">{oportunidade.titulo}</div>
                        {oportunidade.tipo_obra && (
                          <div className="mt-1 truncate text-[11px] text-t4">{oportunidade.tipo_obra}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded border border-brand-green/30 bg-brand-green/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-green">
                          {statusLabel[oportunidade.status] ?? oportunidade.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-t2">{oportunidade.origem || '-'}</td>
                      <td className="px-4 py-4 font-mono text-[11px] font-bold uppercase text-t2">
                        {oportunidade.prioridade}
                      </td>
                      <td className="max-w-[180px] px-4 py-4 text-sm text-t2">
                        <div className="truncate">{oportunidade.cliente_nome_snapshot || '-'}</div>
                      </td>
                      <td className="px-4 py-4 font-mono text-[12px] text-t3">
                        {oportunidade.telefone_snapshot || '-'}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-[12px] text-t1">
                        {formatMoney(oportunidade.valor_estimado)}
                      </td>
                      <td className="px-4 py-4 text-right font-mono text-[12px] text-t2">
                        {oportunidade.metragem_estimada === null ? '-' : `${oportunidade.metragem_estimada} m2`}
                      </td>
                      <td className="px-4 py-4 font-mono text-[11px] text-t3">
                        {formatDate(oportunidade.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
