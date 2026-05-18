import React, { useState } from 'react';
import { ShoppingBag, TrendingUp, Plus, Search, DollarSign, Clock, CheckCircle2, AlertCircle, Building2 } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface CompraMock {
  id: string;
  obra: string;
  item: string;
  fornecedor: string;
  quantidade: string;
  valor: string;
  status: 'aprovado' | 'em_cotacao' | 'pendente';
  dataSolicitacao: string;
}

const COMPRAS_MOCK: CompraMock[] = [
  {
    id: '1',
    obra: 'Obra Piloto Vila Mariana',
    item: 'Cimento CP II 50kg (Lote 200 sacos)',
    fornecedor: 'Votorantim Cimentos',
    quantidade: '200 sacos',
    valor: 'R$ 6.800,00',
    status: 'aprovado',
    dataSolicitacao: '10/05/2026',
  },
  {
    id: '2',
    obra: 'Obra Piloto Vila Mariana',
    item: 'Aço CA-50 10mm (Vergalhão)',
    fornecedor: 'Gerdau S.A.',
    quantidade: '1.500 kg',
    valor: 'R$ 12.450,00',
    status: 'em_cotacao',
    dataSolicitacao: '14/05/2026',
  },
  {
    id: '3',
    obra: 'Reforma Residencial Alto da Lapa',
    item: 'Locação de Betoneira 400L',
    fornecedor: 'LocaMaq Equipamentos',
    quantidade: '1 mês',
    valor: 'R$ 1.200,00',
    status: 'aprovado',
    dataSolicitacao: '02/05/2026',
  },
  {
    id: '4',
    obra: 'Reforma Residencial Alto da Lapa',
    item: 'Porcelanato Acetinado 90x90cm',
    fornecedor: 'Portobello Shop',
    quantidade: '180 m²',
    valor: 'R$ 24.300,00',
    status: 'pendente',
    dataSolicitacao: '16/05/2026',
  },
];

export default function ComprasPage() {
  const { config } = useAppContext();
  const [busca, setBusca] = useState('');

  const comprasFiltradas = COMPRAS_MOCK.filter(c => 
    c.item.toLowerCase().includes(busca.toLowerCase()) ||
    c.fornecedor.toLowerCase().includes(busca.toLowerCase()) ||
    c.obra.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto bg-bg p-8 text-t1 outline-none">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Suprimentos & Logística</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-t1">Gestão de Compras</h1>
            <p className="mt-1 text-sm text-t3">
              Solicitações de materiais, cotações com fornecedores e ordens de compra para o canteiro.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 font-sans text-[11px] font-extrabold uppercase tracking-widest text-bg shadow-lg shadow-brand-green/10 transition-all hover:bg-brand-green2">
              <Plus className="h-4 w-4" /> Nova Solicitação
            </button>
          </div>
        </header>

        {/* Resumo de Status */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Ordens Aprovadas</span>
              <CheckCircle2 className="h-5 w-5 text-brand-green" />
            </div>
            <div className="text-3xl font-extrabold text-t1">R$ 8.000</div>
            <div className="mt-1 text-[11px] text-t4">Materiais com entrega liberada</div>
          </div>

          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Em Cotação</span>
              <Clock className="h-5 w-5 text-brand-amber" />
            </div>
            <div className="text-3xl font-extrabold text-t1">R$ 12.450</div>
            <div className="mt-1 text-[11px] text-t4">Negociação com fornecedores</div>
          </div>

          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Aguardando Aprovação</span>
              <AlertCircle className="h-5 w-5 text-brand-red" />
            </div>
            <div className="text-3xl font-extrabold text-t1">R$ 24.300</div>
            <div className="mt-1 text-[11px] text-t4">Análise da diretoria / engenharia</div>
          </div>
        </div>

        {/* Barra de busca e filtros */}
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-b1 bg-s1 p-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-t4" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por item, fornecedor ou obra..."
              className="w-full rounded-lg bg-s2 py-2 pl-10 pr-4 font-sans text-sm text-t1 placeholder-t4 outline-none transition-colors border border-b1 focus:border-brand-green"
            />
          </div>
          <div className="hidden font-mono text-[11px] text-t4 sm:block">
            {comprasFiltradas.length} solicitação{comprasFiltradas.length !== 1 ? 'ões' : ''}
          </div>
        </div>

        {/* Lista de Compras */}
        <div className="rounded-xl border border-b1 bg-s1 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-b1 flex items-center justify-between bg-s2/50">
            <h2 className="font-bold text-sm text-t1 uppercase tracking-wider">Painel de Suprimentos</h2>
            <span className="font-mono text-[11px] text-t4">{comprasFiltradas.length} itens</span>
          </div>

          <div className="divide-y divide-b1">
            {comprasFiltradas.map(compra => (
              <div key={compra.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-s2/50 transition-colors">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`mt-1 p-2 rounded-lg shrink-0 border ${
                    compra.status === 'aprovado' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 
                    compra.status === 'em_cotacao' ? 'bg-brand-amber/10 border-brand-amber/20 text-brand-amber' :
                    'bg-brand-red/10 border-brand-red/20 text-brand-red'
                  }`}>
                    <DollarSign className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest border ${
                        compra.status === 'aprovado' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 
                        compra.status === 'em_cotacao' ? 'bg-brand-amber/10 text-brand-amber border-brand-amber/20' :
                        'bg-brand-red/10 text-brand-red border-brand-red/20'
                      }`}>
                        {compra.status.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-[11px] text-t4">Solicitado em {compra.dataSolicitacao}</span>
                    </div>

                    <h3 className="text-base font-bold text-t1 mb-1">{compra.item}</h3>
                    <div className="flex items-center gap-4 text-xs text-t4">
                      <span>Fornecedor: <strong className="text-t2 font-semibold">{compra.fornecedor}</strong></span>
                      <span className="text-t4/40">·</span>
                      <span>Obra: <strong className="text-t3">{compra.obra}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-b1 justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-t4">Qtd / Valor Total</div>
                    <div className="text-sm font-extrabold text-t1 mt-0.5">{compra.valor}</div>
                    <div className="text-[10px] text-t4 font-mono">{compra.quantidade}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
