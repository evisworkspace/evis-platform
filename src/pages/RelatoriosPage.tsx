import React from 'react';
import { BarChart2, TrendingUp, Calendar, Download, FileText, CheckCircle2, Clock, AlertCircle, Building2 } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface RelatorioMock {
  id: string;
  obra: string;
  titulo: string;
  tipo: string;
  data: string;
  tamanho: string;
}

const RELATORIOS_MOCK: RelatorioMock[] = [
  {
    id: '1',
    obra: 'Obra Piloto Vila Mariana',
    titulo: 'Síntese Executiva & Avanço Físico - Quinzena 01/Maio',
    tipo: 'Relatório Quinzenal de Engenharia',
    data: '15/05/2026',
    tamanho: '2.4 MB (PDF)',
  },
  {
    id: '2',
    obra: 'Obra Piloto Vila Mariana',
    titulo: 'Relatório Fotográfico de Canteiro - Estacas e Blocos',
    tipo: 'Acompanhamento Visual',
    data: '14/05/2026',
    tamanho: '14.8 MB (PDF)',
  },
  {
    id: '3',
    obra: 'Obra Piloto Vila Mariana',
    titulo: 'Análise Curva S - Físico vs Financeiro (Abril/2026)',
    tipo: 'BI / Planejamento Estratégico',
    data: '02/05/2026',
    tamanho: '1.8 MB (PDF)',
  },
  {
    id: '4',
    obra: 'Reforma Residencial Alto da Lapa',
    titulo: 'Relatório de Vistoria e Demolição Inicial',
    tipo: 'Laudo Técnico',
    data: '10/05/2026',
    tamanho: '4.2 MB (PDF)',
  },
];

export default function RelatoriosPage() {
  const { config } = useAppContext();

  return (
    <main className="flex-1 overflow-y-auto bg-bg p-8 text-t1 outline-none">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Inteligência & BI</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-t1">Relatórios Executivos</h1>
            <p className="mt-1 text-sm text-t3">
              Sínteses executivas, curva S, relatórios fotográficos e dashboards de produtividade para a diretoria e clientes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 font-sans text-[11px] font-extrabold uppercase tracking-widest text-bg shadow-lg shadow-brand-green/10 transition-all hover:bg-brand-green2">
              <Download className="h-4 w-4" /> Exportar Pacote
            </button>
          </div>
        </header>

        {/* Resumo de BI */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Avanço Médio (Obras)</span>
              <TrendingUp className="h-5 w-5 text-brand-green" />
            </div>
            <div className="text-3xl font-extrabold text-t1">28.5%</div>
            <div className="mt-1 text-[11px] text-t4">Progresso global acumulado</div>
          </div>

          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Relatórios Emitidos</span>
              <FileText className="h-5 w-5 text-brand-blue" />
            </div>
            <div className="text-3xl font-extrabold text-t1">14</div>
            <div className="mt-1 text-[11px] text-t4">No mês de maio/2026</div>
          </div>

          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Saúde do Portfólio</span>
              <CheckCircle2 className="h-5 w-5 text-brand-green" />
            </div>
            <div className="text-3xl font-extrabold text-brand-green">100%</div>
            <div className="mt-1 text-[11px] text-t4 font-mono">0 obras paralisadas</div>
          </div>
        </div>

        {/* Lista de Relatórios */}
        <div className="rounded-xl border border-b1 bg-s1 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-b1 flex items-center justify-between bg-s2/50">
            <h2 className="font-bold text-sm text-t1 uppercase tracking-wider">Acervo de Documentos Executivos</h2>
            <span className="font-mono text-[11px] text-t4">{RELATORIOS_MOCK.length} relatórios disponíveis</span>
          </div>

          <div className="divide-y divide-b1">
            {RELATORIOS_MOCK.map(rel => (
              <div key={rel.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-s2/50 transition-colors">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="mt-1 p-2 bg-white/5 border border-white/10 rounded-lg shrink-0 text-t3">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest bg-brand-green/10 text-brand-green border border-brand-green/20">
                        {rel.tipo}
                      </span>
                      <span className="font-mono text-[11px] text-t4">{rel.data}</span>
                      <span className="text-t4/40">·</span>
                      <span className="font-mono text-[11px] text-t3">{rel.obra}</span>
                    </div>

                    <h3 className="text-base font-bold text-t1 mb-1">{rel.titulo}</h3>
                    <div className="flex items-center gap-4 text-xs text-t4 font-mono">
                      <span>Arquivo: <strong className="text-t2 font-semibold">{rel.tamanho}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-b1 justify-between sm:justify-end">
                  <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-s2 border border-b1 text-t2 hover:border-b3 hover:text-t1 font-sans text-xs font-bold transition-all">
                    <Download className="w-4 h-4" /> Baixar PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
