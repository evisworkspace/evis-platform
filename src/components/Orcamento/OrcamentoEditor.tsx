import React from 'react';
import { useAppContext } from '../../AppContext';
import { 
  useOrcamentoItens, 
  useCreateItem, 
  useUpdateItem, 
  useDeleteItem, 
  useUpdateOrcamento, 
  calcularTotais 
} from '../../hooks/useOrcamento';
import { Orcamento, OrcamentoItem } from '../../types';
import { ArrowLeft, Plus, Trash2, Save, FileDown, Check } from 'lucide-react';

interface Props {
  orcamento: Orcamento;
  onBack: () => void;
  onOrcamentoChange?: (orcamento: Orcamento) => void;
}

export default function OrcamentoEditor({ orcamento, onBack, onOrcamentoChange }: Props) {
  const { config, toast } = useAppContext();
  
  // Hooks de Dados
  const { data: itens = [] } = useOrcamentoItens(orcamento.id, config);
  const createItemMut = useCreateItem(config);
  const updateItemMut = useUpdateItem(config);
  const deleteItemMut = useDeleteItem(config);
  const updateOrcamentoMut = useUpdateOrcamento(config);

  // Cálculos em tempo real baseados no cache do React Query
  const { total_bruto, total_final } = calcularTotais(itens, orcamento.bdi);

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleAddItem = async () => {
    try {
      await createItemMut.mutateAsync({
        orcamento_id: orcamento.id,
        codigo: '',
        descricao: 'Novo Item',
        unidade: 'un',
        quantidade: 1,
        valor_unitario: 0,
        valor_total: 0,
        origem: 'manual'
      });
    } catch {
      toast('Erro ao adicionar item', 'error');
    }
  };

  const handleUpdateField = (item: OrcamentoItem, patch: Partial<OrcamentoItem>) => {
    const nextPatch = { ...patch };
    if (patch.quantidade !== undefined || patch.valor_unitario !== undefined) {
      const quantidade = patch.quantidade ?? item.quantidade;
      const valorUnitario = patch.valor_unitario ?? item.valor_unitario;
      nextPatch.valor_total = quantidade * valorUnitario;
    }
    updateItemMut.mutate({ id: item.id, patch: nextPatch, orcamentoId: orcamento.id });
  };

  const handleSaveTotals = async () => {
    try {
      await updateOrcamentoMut.mutateAsync({
        id: orcamento.id,
        patch: { total_bruto, total_final }
      });
      toast('Totais sincronizados com sucesso!', 'success');
    } catch {
      toast('Erro ao salvar totais', 'error');
    }
  };

  const handleApprove = async () => {
    if (!confirm('Deseja aprovar este orçamento e travar edições críticas?')) return;
    try {
      await updateOrcamentoMut.mutateAsync({
        id: orcamento.id,
        patch: { status: 'aprovado' }
      });
      onOrcamentoChange?.({ ...orcamento, status: 'aprovado' });
      toast('Orçamento aprovado!', 'success');
    } catch {
      toast('Erro ao aprovar', 'error');
    }
  };

  const inputCls = "bg-transparent border-none outline-none focus:bg-white/5 w-full text-sm py-1.5 px-2 transition-colors rounded placeholder-white/20";

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161b22] sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-white/5 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">{orcamento.nome}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Editor de Itens</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${orcamento.status === 'aprovado' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {orcamento.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="p-2 text-white/40 hover:text-white transition-colors" title="Exportar JSON">
            <FileDown size={18} />
          </button>
          {orcamento.status === 'rascunho' && (
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-extrabold uppercase tracking-wider px-4 py-2 rounded-lg transition-all"
            >
              <Check size={14} /> Aprovar
            </button>
          )}
          <button
            onClick={handleSaveTotals}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-extrabold uppercase tracking-wider px-4 py-2 rounded-lg transition-all"
          >
            <Save size={14} /> Salvar Totais
          </button>
        </div>
      </header>

      {/* Linha de Resumo */}
      <div className="flex items-center gap-12 px-8 py-4 bg-white/[0.02] border-b border-white/5">
        <div>
          <span className="block text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Total Bruto</span>
          <span className="text-md font-semibold text-white/90">{fmt(total_bruto)}</span>
        </div>
        <div>
          <span className="block text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">BDI aplicado</span>
          <span className="text-md font-semibold text-white/90">{orcamento.bdi}%</span>
        </div>
        <div>
          <span className="block text-[9px] font-mono text-white/30 uppercase tracking-widest mb-1">Valor Final</span>
          <span className="text-lg font-black text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.2)]">{fmt(total_final)}</span>
        </div>
      </div>

      {/* Tabela de Itens */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 font-mono text-[10px] text-white/40 uppercase tracking-[0.2em]">
                <th className="px-4 py-4 font-bold">Código</th>
                <th className="px-4 py-4 font-bold">Descrição do Serviço / Insumo</th>
                <th className="px-4 py-4 font-bold text-center">Unid.</th>
                <th className="px-4 py-4 font-bold text-right">Qtd</th>
                <th className="px-4 py-4 font-bold text-right">Unitário (R$)</th>
                <th className="px-4 py-4 font-bold text-right">Subtotal</th>
                <th className="px-4 py-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {itens.map((item) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-2 py-1 w-32">
                    <input className={inputCls} defaultValue={item.codigo || ''} placeholder="Ex: SINAPI" onBlur={(e) => handleUpdateField(item, { codigo: e.target.value })} />
                  </td>
                  <td className="px-2 py-1">
                    <input className={inputCls} defaultValue={item.descricao} placeholder="Descrição do item..." onBlur={(e) => handleUpdateField(item, { descricao: e.target.value })} />
                  </td>
                  <td className="px-2 py-1 w-20">
                    <input className={inputCls + " text-center uppercase"} defaultValue={item.unidade} onBlur={(e) => handleUpdateField(item, { unidade: e.target.value })} />
                  </td>
                  <td className="px-2 py-1 w-24">
                    <input className={inputCls + " text-right font-mono"} type="number" defaultValue={item.quantidade} onBlur={(e) => handleUpdateField(item, { quantidade: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 py-1 w-36">
                    <input className={inputCls + " text-right font-mono text-blue-400"} type="number" defaultValue={item.valor_unitario} onBlur={(e) => handleUpdateField(item, { valor_unitario: Number(e.target.value) })} />
                  </td>
                  <td className="px-4 py-1 text-right text-sm font-bold font-mono text-white/80">
                    {fmt(item.valor_total)}
                  </td>
                  <td className="px-2 py-1">
                    <button onClick={() => deleteItemMut.mutate({ id: item.id!, orcamentoId: orcamento.id })} className="p-2 text-white/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleAddItem} className="w-full py-5 border-t border-white/5 text-white/20 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em]">
            <Plus size={16} /> Adicionar Novo Item
          </button>
        </div>
      </div>
    </div>
  );
}
