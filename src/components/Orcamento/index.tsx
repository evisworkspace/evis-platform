import React, { useState } from 'react';
import { Plus, FileText, Trash2, ChevronRight, CheckCircle, Clock, FileEdit, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../AppContext';
import { Orcamento, OrcamentoStatus } from '../../types';
import {
  useOrcamentos,
  useCreateOrcamento,
  useDeleteOrcamento,
} from '../../hooks/useOrcamento';
import OrcamentoEditor from './OrcamentoEditor';
import { useSearchParams } from 'react-router-dom';

// ──────────────────────────────────────────────
// BADGE DE STATUS
// ──────────────────────────────────────────────
const STATUS_CONFIG: Record<OrcamentoStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  rascunho: { label: 'Rascunho', icon: <FileEdit size={12} />, cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20' },
  aprovado: { label: 'Aprovado', icon: <CheckCircle size={12} />, cls: 'bg-green-500/10 text-green-400 border border-green-500/20' },
  importado: { label: 'Importado', icon: <CheckCircle size={12} />, cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' },
};

function StatusBadge({ status }: { status: OrcamentoStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.rascunho;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ──────────────────────────────────────────────
// CARD DE ORÇAMENTO
// ──────────────────────────────────────────────
function OrcamentoCard({
  orc,
  onOpen,
  onDelete,
}: {
  orc: Orcamento;
  onOpen: (o: Orcamento) => void;
  onDelete: (id: string) => void;
}) {
  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="group bg-white/5 hover:bg-white/8 border border-white/10 hover:border-white/20 rounded-xl p-4 transition-all cursor-pointer">
      <div className="flex items-start justify-between gap-3" onClick={() => onOpen(orc)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-blue-400 shrink-0" />
            <span className="font-semibold text-white text-sm truncate">{orc.nome}</span>
          </div>
          {orc.cliente && (
            <p className="text-xs text-white/50 mb-2 truncate">Cliente: {orc.cliente}</p>
          )}
          <div className="flex items-center gap-3">
            <StatusBadge status={orc.status} />
            <span className="text-xs text-white/40">BDI {orc.bdi}%</span>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xs text-white/40 mb-0.5">Total c/ BDI</p>
          <p className="text-base font-bold text-green-400">{fmt(orc.total_final)}</p>
          <p className="text-xs text-white/30">{fmt(orc.total_bruto)} s/ BDI</p>
        </div>

        <ChevronRight size={16} className="text-white/20 group-hover:text-white/50 self-center ml-1 transition-colors" />
      </div>

      {orc.status === 'rascunho' && (
        <div className="flex justify-end mt-3 pt-3 border-t border-white/5">
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(orc.id); }}
            className="flex items-center gap-1 text-xs text-red-400/60 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} /> Excluir
          </button>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// MODAL DE NOVO ORÇAMENTO
// ──────────────────────────────────────────────
function NovoOrcamentoModal({
  obraId,
  onClose,
  onCreate,
}: {
  obraId: string;
  onClose: () => void;
  onCreate: (nome: string, cliente: string, bdi: number) => void;
}) {
  const [nome, setNome] = useState('');
  const [cliente, setCliente] = useState('');
  const [bdi, setBdi] = useState(25);

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500/50 transition-colors';
  const labelCls = 'block text-xs text-white/50 mb-1 font-medium';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#16191e] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-white font-semibold text-base mb-5 flex items-center gap-2">
          <Plus size={16} className="text-green-400" /> Novo Orçamento
        </h2>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Nome do Orçamento *</label>
            <input
              className={inputCls}
              placeholder="Ex: Reforma Banheiro Suíte"
              value={nome}
              onChange={e => setNome(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className={labelCls}>Cliente</label>
            <input
              className={inputCls}
              placeholder="Nome do cliente"
              value={cliente}
              onChange={e => setCliente(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>BDI — Benefício e Despesas Indiretas (%)</label>
            <input
              className={inputCls}
              type="number"
              min={0}
              max={100}
              value={bdi}
              onChange={e => setBdi(Number(e.target.value))}
            />
            <p className="text-xs text-white/30 mt-1">Padrão mercado: 20–30%</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => nome.trim() && onCreate(nome.trim(), cliente.trim(), bdi)}
            disabled={!nome.trim()}
            className="flex-1 py-2 rounded-lg bg-green-500 hover:bg-green-400 disabled:opacity-40 text-sm font-semibold text-black transition-colors"
          >
            Criar Orçamento
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ──────────────────────────────────────────────
export default function OrcamentoTab() {
  const { config, toast } = useAppContext();
  const obraId = config.obraId;

  const { data: orcamentos = [], isLoading, error } = useOrcamentos(obraId, config);
  const createMut = useCreateOrcamento(config);
  const deleteMut = useDeleteOrcamento(config);

  const [showNovo, setShowNovo] = useState(false);
  const [obraAberta, setObraAberta] = useState<Orcamento | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const targetOrcamentoId = searchParams.get('orcamento_id');

  // Auto-open budget if orcamento_id is in URL
  React.useEffect(() => {
    if (targetOrcamentoId && orcamentos.length > 0 && !obraAberta) {
      const target = orcamentos.find(o => o.id === targetOrcamentoId);
      if (target) {
        setObraAberta(target);
        
        // Remove orcamento_id from URL so it doesn't reopen if closed
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('orcamento_id');
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [targetOrcamentoId, orcamentos, obraAberta, searchParams, setSearchParams]);

  const handleCreate = async (nome: string, cliente: string, bdi: number) => {
    try {
      await createMut.mutateAsync({
        obra_id: obraId,
        nome,
        cliente,
        status: 'rascunho',
        bdi,
        total_bruto: 0,
        total_final: 0,
      });
      setShowNovo(false);
      toast('Orçamento criado!', 'success');
    } catch {
      toast('Erro ao criar orçamento.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este orçamento? Todos os itens serão removidos.')) return;
    try {
      await deleteMut.mutateAsync({ id, obraId });
      toast('Orçamento excluído.', 'success');
    } catch {
      toast('Erro ao excluir.', 'error');
    }
  };

  // Obra aberta → mostra o editor
  if (obraAberta) {
    return (
      <OrcamentoEditor
        orcamento={obraAberta}
        onBack={() => setObraAberta(null)}
        onOrcamentoChange={setObraAberta}
      />
    );
  }

  // ──── Tela de lista ────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div>
          <h1 className="text-white font-bold text-lg">Orçamentos</h1>
          <p className="text-white/40 text-xs mt-0.5">{orcamentos.length} orçamento{orcamentos.length !== 1 ? 's' : ''} nesta obra</p>
        </div>
        <button
          onClick={() => setShowNovo(true)}
          className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={16} /> Novo Orçamento
        </button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading && (
          <div className="flex items-center justify-center h-40 text-white/30 text-sm">
            <Clock size={16} className="mr-2 animate-spin" /> Carregando...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle size={16} /> {error.message}
          </div>
        )}

        {!isLoading && !error && orcamentos.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <FileText size={40} className="text-white/10 mb-4" />
            <p className="text-white/40 text-sm">Nenhum orçamento cadastrado</p>
            <p className="text-white/20 text-xs mt-1">Clique em "Novo Orçamento" para começar</p>
          </div>
        )}

        <div className="grid gap-3 max-w-3xl">
          {orcamentos.map(orc => (
            <OrcamentoCard
              key={orc.id}
              orc={orc}
              onOpen={setObraAberta}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Modal novo orçamento */}
      {showNovo && (
        <NovoOrcamentoModal
          obraId={obraId}
          onClose={() => setShowNovo(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
