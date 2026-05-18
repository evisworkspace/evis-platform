import React from 'react';
import { TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Plus, Search, CheckCircle2, AlertCircle, Building2, Calendar } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface MovimentacaoMock {
  id: string;
  obra: string;
  descricao: string;
  categoria: string;
  tipo: 'receita' | 'despesa';
  valor: string;
  data: string;
  status: 'pago' | 'pendente';
}

const MOVIMENTACOES_MOCK: MovimentacaoMock[] = [
  {
    id: '1',
    obra: 'Obra Piloto Vila Mariana',
    descricao: 'Parcela 02 - Contrato de Empreitada Geral',
    categoria: 'Receita de Contrato',
    tipo: 'receita',
    valor: 'R$ 145.000,00',
    data: '10/05/2026',
    status: 'pago',
  },
  {
    id: '2',
    obra: 'Obra Piloto Vila Mariana',
    descricao: 'Pagamento Fornecedor - Votorantim Cimentos',
    categoria: 'Materiais',
    tipo: 'despesa',
    valor: 'R$ 6.800,00',
    data: '12/05/2026',
    status: 'pago',
  },
  {
    id: '3',
    obra: 'Obra Piloto Vila Mariana',
    descricao: 'Folha de Pagamento - Equipe Alvenaria (Quinzena)',
    categoria: 'Mão de Obra',
    tipo: 'despesa',
    valor: 'R$ 15.200,00',
    data: '15/05/2026',
    status: 'pago',
  },
  {
    id: '4',
    obra: 'Reforma Residencial Alto da Lapa',
    descricao: 'Sinal - Aditivo de Projeto Executivo',
    categoria: 'Serviços Extras',
    tipo: 'receita',
    valor: 'R$ 38.000,00',
    data: '18/05/2026',
    status: 'pendente',
  },
  {
    id: '5',
    obra: 'Reforma Residencial Alto da Lapa',
    descricao: 'Compra de Porcelanato Portobello',
    categoria: 'Acabamentos',
    tipo: 'despesa',
    valor: 'R$ 24.300,00',
    data: '20/05/2026',
    status: 'pendente',
  },
];

export default function FinanceiroPage() {
  const { config } = useAppContext();

  return (
    <main className="flex-1 overflow-y-auto bg-bg p-8 text-t1 outline-none">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Gestão Financeira</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-t1">Financeiro Geral</h1>
            <p className="mt-1 text-sm text-t3">
              Fluxo de caixa consolidado, contas a pagar, contas a receber e DRE por projeto da construtora.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 font-sans text-[11px] font-extrabold uppercase tracking-widest text-bg shadow-lg shadow-brand-green/10 transition-all hover:bg-brand-green2">
              <Plus className="h-4 w-4" /> Nova Movimentação
            </button>
          </div>
        </header>

        {/* Resumo Financeiro */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Receitas (Mês)</span>
              <div className="p-1.5 bg-brand-green/10 rounded-lg text-brand-green border border-brand-green/20">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-brand-green">R$ 183.000</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-t4 font-mono">
              <span className="text-brand-green font-bold">+12%</span> em relação a abril
            </div>
          </div>

          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Despesas (Mês)</span>
              <div className="p-1.5 bg-brand-red/10 rounded-lg text-brand-red border border-brand-red/20">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-t1">R$ 46.300</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-t4 font-mono">
              <span className="text-brand-red font-bold">R$ 24.300</span> pendentes
            </div>
          </div>

          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Saldo Operacional</span>
              <DollarSign className="h-5 w-5 text-brand-blue" />
            </div>
            <div className="text-3xl font-extrabold text-brand-blue">R$ 136.700</div>
            <div className="mt-1 text-[11px] text-t4">Caixa livre acumulado</div>
          </div>
        </div>

        {/* Lista de Movimentações */}
        <div className="rounded-xl border border-b1 bg-s1 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-b1 flex items-center justify-between bg-s2/50">
            <h2 className="font-bold text-sm text-t1 uppercase tracking-wider">Lançamentos e Fluxo de Caixa</h2>
            <span className="font-mono text-[11px] text-t4">{MOVIMENTACOES_MOCK.length} lançamentos</span>
          </div>

          <div className="divide-y divide-b1">
            {MOVIMENTACOES_MOCK.map(mov => (
              <div key={mov.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-s2/50 transition-colors">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`mt-1 p-2 rounded-lg shrink-0 border ${
                    mov.tipo === 'receita' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 'bg-brand-red/10 border-brand-red/20 text-brand-red'
                  }`}>
                    {mov.tipo === 'receita' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest border ${
                        mov.status === 'pago' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-brand-amber/10 text-brand-amber border-brand-amber/20'
                      }`}>
                        {mov.status.toUpperCase()}
                      </span>
                      <span className="font-mono text-[11px] text-t4">{mov.data}</span>
                      <span className="text-t4/40">·</span>
                      <span className="font-mono text-[11px] text-t3">{mov.obra}</span>
                    </div>

                    <h3 className="text-base font-bold text-t1 mb-1">{mov.descricao}</h3>
                    <div className="flex items-center gap-4 text-xs text-t4">
                      <span>Categoria: <strong className="text-t2 font-semibold">{mov.categoria}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-b1 justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-t4">Valor</div>
                    <div className={`text-base font-extrabold mt-0.5 ${mov.tipo === 'receita' ? 'text-brand-green' : 'text-brand-red'}`}>
                      {mov.tipo === 'receita' ? '+ ' : '- '}{mov.valor}
                    </div>
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
