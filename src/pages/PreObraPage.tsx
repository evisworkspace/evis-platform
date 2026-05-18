import React from 'react';
import { FileCheck, Clock, AlertCircle, CheckCircle2, ArrowUpRight, Search, Plus, Building2 } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface LicencaMock {
  id: string;
  obra: string;
  tipo: string;
  status: 'aprovado' | 'em_analise' | 'pendente';
  protocolo: string;
  data: string;
}

const LICENCAS_MOCK: LicencaMock[] = [
  {
    id: '1',
    obra: 'Obra Piloto Vila Mariana',
    tipo: 'Alvará de Execução de Edificação',
    status: 'aprovado',
    protocolo: '2026-00892/SP',
    data: '12/04/2026',
  },
  {
    id: '2',
    obra: 'Obra Piloto Vila Mariana',
    tipo: 'ART - Responsabilidade Técnica (CREA)',
    status: 'aprovado',
    protocolo: 'ART-992810293',
    data: '15/04/2026',
  },
  {
    id: '3',
    obra: 'Reforma Residencial Alto da Lapa',
    tipo: 'Autorização de Supressão Arbórea',
    status: 'em_analise',
    protocolo: '2026-01452/SP',
    data: '02/05/2026',
  },
  {
    id: '4',
    obra: 'Reforma Residencial Alto da Lapa',
    tipo: 'Alvará de Reforma',
    status: 'pendente',
    protocolo: '---',
    data: '---',
  },
];

export default function PreObraPage() {
  const { config } = useAppContext();

  return (
    <main className="flex-1 overflow-y-auto bg-bg p-8 text-t1 outline-none">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
              <FileCheck className="h-3.5 w-3.5" />
              <span>Legalização & Contratos</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-t1">Pré-Obra & Licenças</h1>
            <p className="mt-1 text-sm text-t3">
              Gestão de alvarás, contratos, ART/RRT e viabilidade técnica antes da mobilização do canteiro.
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
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Aprovados</span>
              <CheckCircle2 className="h-5 w-5 text-brand-green" />
            </div>
            <div className="text-3xl font-extrabold text-t1">2</div>
            <div className="mt-1 text-[11px] text-t4">Alvarás e ARTs liberados</div>
          </div>

          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Em Análise</span>
              <Clock className="h-5 w-5 text-brand-amber" />
            </div>
            <div className="text-3xl font-extrabold text-t1">1</div>
            <div className="mt-1 text-[11px] text-t4">Órgãos públicos / Prefeitura</div>
          </div>

          <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-t3">Pendentes</span>
              <AlertCircle className="h-5 w-5 text-brand-red" />
            </div>
            <div className="text-3xl font-extrabold text-t1">1</div>
            <div className="mt-1 text-[11px] text-t4">Aguardando documentação</div>
          </div>
        </div>

        {/* Lista de Documentos */}
        <div className="rounded-xl border border-b1 bg-s1 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-b1 flex items-center justify-between bg-s2/50">
            <h2 className="font-bold text-sm text-t1 uppercase tracking-wider">Controle de Documentos e Alvarás</h2>
            <span className="font-mono text-[11px] text-t4">{LICENCAS_MOCK.length} itens</span>
          </div>

          <div className="divide-y divide-b1">
            {LICENCAS_MOCK.map(item => (
              <div key={item.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-s2/50 transition-colors">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="mt-1 p-2 bg-white/5 border border-white/10 rounded-lg shrink-0">
                    <Building2 className="w-5 h-5 text-t3" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest border ${
                        item.status === 'aprovado' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                        item.status === 'em_analise' ? 'bg-brand-amber/10 text-brand-amber border-brand-amber/20' :
                        'bg-brand-red/10 text-brand-red border-brand-red/20'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                      <span className="font-mono text-[11px] text-t4">Prot: {item.protocolo}</span>
                    </div>
                    <h3 className="text-base font-bold text-t1 mb-0.5">{item.tipo}</h3>
                    <p className="text-xs text-t3">{item.obra}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-b1 justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-t4">Data / Previsão</div>
                    <div className="text-xs font-semibold text-t2 mt-0.5">{item.data}</div>
                  </div>

                  <button className="p-2 text-t4 hover:text-brand-green hover:bg-white/5 rounded-lg transition-colors border border-b1 sm:border-transparent">
                    <ArrowUpRight className="w-4 h-4" />
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
