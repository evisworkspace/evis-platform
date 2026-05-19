import { CheckCircle2, Loader2, SkipForward } from 'lucide-react';
import { useCommitBatches, type CommitBatch } from '../../hooks/useCommitBatches';

type Props = {
  runId: string | null;
};

const REASON_LABEL: Record<string, string> = {
  no_evidence: 'sem evidência vinculada',
  empty_description: 'descrição vazia',
  status_not_approved: 'status não aprovado',
};

function BatchCard({ batch }: { batch: CommitBatch }) {
  const date = new Date(batch.created_at).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  return (
    <div className="rounded-lg border border-b1 bg-s1/60 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span className="text-sm font-semibold text-t1">
            {batch.total_items_committed} item(ns) commitado(s)
          </span>
          {batch.total_items_skipped > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-amber-400">
              <SkipForward className="h-3 w-3" />
              {batch.total_items_skipped} pulado(s)
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-t4">{date}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-t3 sm:grid-cols-3">
        <div>
          <span className="text-t4">Batch ID</span>
          <p className="truncate font-mono text-[10px] text-t1">{batch.id}</p>
        </div>
        <div>
          <span className="text-t4">Commitado por</span>
          <p className="text-t1">{batch.committed_by}</p>
        </div>
        <div>
          <span className="text-t4">Flag</span>
          <p className="font-mono text-[10px] text-green-400">
            {(batch.safety_flags_json?.flag as string) ?? 'EVIS_ORCAMENTISTA_ENABLE_OFFICIAL_COMMIT'}
          </p>
        </div>
      </div>

      {batch.skip_reasons_json?.length > 0 && (
        <details className="rounded border border-amber-500/20 bg-amber-500/5 px-3 py-2">
          <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            {batch.skip_reasons_json.length} item(ns) pulado(s) — detalhes
          </summary>
          <ul className="mt-2 space-y-1">
            {batch.skip_reasons_json.map((skip) => (
              <li key={skip.preview_item_id} className="text-[10px] text-amber-300">
                <span className="font-mono">{skip.preview_item_id.slice(0, 8)}…</span>
                {' '}— {REASON_LABEL[skip.reason] ?? skip.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

export default function OrcamentistaCommitBatchesPanel({ runId }: Props) {
  const { data, isFetching, error } = useCommitBatches(runId);

  if (!runId) return null;

  if (isFetching && !data) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-b1 bg-s1/40 p-4 text-sm text-t3">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando histórico de commits…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        Falha ao listar commit batches: {error.message}
      </div>
    );
  }

  if (data?.schema_status === 'schema_not_ready') return null;

  const batches = data?.data ?? [];
  if (batches.length === 0) return null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-t4">
        {batches.length} batch(es) de commit neste run.
      </p>
      {batches.map((batch) => (
        <BatchCard key={batch.id} batch={batch} />
      ))}
    </div>
  );
}
