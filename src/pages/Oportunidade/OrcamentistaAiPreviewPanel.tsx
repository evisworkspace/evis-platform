import { useState } from 'react';
import { AlertTriangle, ShieldAlert, ChevronDown, ChevronRight, Lock } from 'lucide-react';
import { OrcamentistaAiPreview, OrcamentistaPreviewRisk } from '../../types';

interface Props {
  preview: OrcamentistaAiPreview;
}

function severidadeColor(s: OrcamentistaPreviewRisk['severidade']): string {
  switch (s) {
    case 'critica': return 'text-red-400 border-red-500/30 bg-red-500/10';
    case 'alta':    return 'text-orange-400 border-orange-500/30 bg-orange-500/10';
    case 'media':   return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    default:        return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  }
}

function confiancaColor(c: number): string {
  if (c >= 0.8) return 'text-green-400';
  if (c >= 0.6) return 'text-amber-400';
  return 'text-red-400';
}

function CollapsibleSection({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-white/10 bg-white/5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-white/70">{title}</span>
          {badge && (
            <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-white/40">
              {badge}
            </span>
          )}
        </div>
        {open ? <ChevronDown size={13} className="text-white/30" /> : <ChevronRight size={13} className="text-white/30" />}
      </button>
      {open && <div className="border-t border-white/10 px-4 py-3">{children}</div>}
    </div>
  );
}

export default function OrcamentistaAiPreviewPanel({ preview }: Props) {
  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      {/* Banner de aviso — sempre visível */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/8 px-5 py-4">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-400" />
        <div>
          <p className="text-sm font-bold text-amber-300">PRÉVIA IA — Não é orçamento oficial</p>
          <p className="mt-1 text-xs text-white/50">
            Estes dados são <strong className="text-white/70">estimativas simuladas</strong> para
            demonstração do pipeline. Nenhum item foi gravado em <code className="text-white/50">orcamento_itens</code>.
            A consolidação no orçamento oficial requer validação humana (HITL) completa.
          </p>
        </div>
      </div>

      {/* Resumo de confiança e custo estimado */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Custo estimado</p>
          <p className="mt-1 text-lg font-bold text-white/80">{fmt(preview.custos_estimados)}</p>
          <p className="text-[10px] text-white/30">sem BDI</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Confiança global</p>
          <p className={`mt-1 text-lg font-bold ${confiancaColor(preview.confianca)}`}>
            {Math.round(preview.confianca * 100)}%
          </p>
          <p className="text-[10px] text-white/30">média dos agentes</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">HITLs pendentes</p>
          <p className="mt-1 text-lg font-bold text-amber-400">{preview.pendencias_hitl.length}</p>
          <p className="text-[10px] text-white/30">validações humanas</p>
        </div>
      </div>

      {/* Quantitativos */}
      <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
        <p className="font-mono text-[9px] font-bold uppercase tracking-widest text-white/30 mb-1">Base quantitativa</p>
        <p className="text-xs text-white/60">{preview.quantitativos_estimados}</p>
      </div>

      {/* Serviços sugeridos */}
      <CollapsibleSection title="Serviços sugeridos" badge={`${preview.servicos_sugeridos.length} itens`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-2 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Descrição</th>
                <th className="pb-2 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Categoria</th>
                <th className="pb-2 text-right font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Qtd est.</th>
                <th className="pb-2 text-left font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Un</th>
                <th className="pb-2 text-right font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Custo est.</th>
                <th className="pb-2 text-right font-mono text-[9px] font-bold uppercase tracking-widest text-white/30">Conf.</th>
              </tr>
            </thead>
            <tbody>
              {preview.servicos_sugeridos.map((s, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="py-2 pr-3 text-white/70">{s.descricao}</td>
                  <td className="py-2 pr-3 text-white/40">{s.categoria ?? '—'}</td>
                  <td className="py-2 pr-3 text-right font-mono text-white/60">{s.quantidade_estimada}</td>
                  <td className="py-2 pr-3 text-white/40">{s.unidade}</td>
                  <td className="py-2 pr-3 text-right font-mono text-white/60">{fmt(s.custo_estimado)}</td>
                  <td className={`py-2 text-right font-mono font-bold ${confiancaColor(s.confianca)}`}>
                    {Math.round(s.confianca * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[10px] text-white/25">
          Dados simulados · origem: preview_ia_mock · nenhum item gravado em orcamento_itens
        </p>
      </CollapsibleSection>

      {/* Riscos */}
      <CollapsibleSection title="Riscos identificados" badge={`${preview.riscos.length}`}>
        <div className="space-y-2">
          {preview.riscos.map((r) => (
            <div key={r.id} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
              <ShieldAlert size={13} className="mt-0.5 shrink-0 text-white/30" />
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-white/70">{r.descricao}</span>
                  <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${severidadeColor(r.severidade)}`}>
                    {r.severidade}
                  </span>
                  {r.disciplina && (
                    <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[8px] text-white/30 uppercase">
                      {r.disciplina}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-white/40">{r.impacto}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* HITLs pendentes */}
      <CollapsibleSection title="Revisões HITL pendentes" badge={`${preview.pendencias_hitl.length} pendentes`}>
        <div className="space-y-2">
          {preview.pendencias_hitl.map((h) => (
            <div key={h.id} className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-amber-300">{h.titulo}</span>
                <span className={`rounded border px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest ${severidadeColor(h.severidade)}`}>
                  {h.severidade}
                </span>
                {h.disciplina && (
                  <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[8px] text-white/30 uppercase">
                    {h.disciplina}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/50">{h.motivo}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Premissas e exclusões */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CollapsibleSection title="Premissas" badge={`${preview.premissas.length}`}>
          <ul className="space-y-1">
            {preview.premissas.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-white/50">
                <span className="mt-0.5 shrink-0 text-white/20">·</span>
                {p}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
        <CollapsibleSection title="Exclusões" badge={`${preview.exclusoes.length}`}>
          <ul className="space-y-1">
            {preview.exclusoes.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-white/50">
                <span className="mt-0.5 shrink-0 text-red-500/50">×</span>
                {e}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      </div>

      {/* Botão desabilitado de consolidação */}
      <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-5">
        <div className="flex items-center gap-3 mb-3">
          <Lock size={14} className="text-white/20" />
          <span className="text-sm font-semibold text-white/30">Consolidação no orçamento oficial</span>
        </div>
        <p className="mb-4 text-xs text-white/30">
          A consolidação da prévia IA no orçamento oficial será habilitada na Fase 3,
          após validação completa de todos os pontos HITL e aprovação do responsável técnico.
        </p>
        <button
          disabled
          className="w-full cursor-not-allowed rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/20"
        >
          Consolidar prévia no orçamento oficial — fase futura
        </button>
        <p className="mt-2 text-center font-mono text-[9px] text-white/20 uppercase tracking-widest">
          Disponível após revisão HITL completa
        </p>
      </div>
    </div>
  );
}
