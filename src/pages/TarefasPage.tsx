import React, { useState } from 'react';
import { CheckSquare, Calendar, Filter, Clock, Plus, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface TarefaMock {
  id: string;
  obra: string;
  titulo: string;
  responsavel: string;
  prioridade: 'alta' | 'media' | 'baixa';
  status: 'concluido' | 'em_andamento' | 'pendente';
  dataPrevista: string;
}

const TAREFAS_MOCK: TarefaMock[] = [
  {
    id: '1',
    obra: 'Obra Piloto Vila Mariana',
    titulo: 'Concretagem das Estacas de Fundação',
    responsavel: 'Eng. Evandro',
    prioridade: 'alta',
    status: 'concluido',
    dataPrevista: '15/05/2026',
  },
  {
    id: '2',
    obra: 'Obra Piloto Vila Mariana',
    titulo: 'Alvenaria Estrutural - Bloco A',
    responsavel: 'Equipe Alvenaria',
    prioridade: 'alta',
    status: 'em_andamento',
    dataPrevista: '29/05/2026',
  },
  {
    id: '3',
    obra: 'Obra Piloto Vila Mariana',
    titulo: 'Instalação Elétrica - Passagem de Eletrodutos',
    responsavel: 'Equipe Elétrica',
    prioridade: 'media',
    status: 'pendente',
    dataPrevista: '14/06/2026',
  },
  {
    id: '4',
    obra: 'Reforma Residencial Alto da Lapa',
    titulo: 'Demolição de Paredes Internas',
    responsavel: 'Eng. Bruno',
    prioridade: 'alta',
    status: 'em_andamento',
    dataPrevista: '22/05/2026',
  },
];

export default function TarefasPage() {
  const { config } = useAppContext();
  const [busca, setBusca] = useState('');

  const tarefasFiltradas = TAREFAS_MOCK.filter(t => 
    t.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    t.responsavel.toLowerCase().includes(busca.toLowerCase()) ||
    t.obra.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto bg-bg p-8 text-t1 outline-none">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Gestão Operacional</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-t1">Tarefas & Atividades</h1>
            <p className="mt-1 text-sm text-t3">
              Quadro geral de tarefas da equipe técnica e cronograma de serviços no canteiro.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 font-sans text-[11px] font-extrabold uppercase tracking-widest text-bg shadow-lg shadow-brand-green/10 transition-all hover:bg-brand-green2">
              <Plus className="h-4 w-4" /> Nova Tarefa
            </button>
          </div>
        </header>

        {/* Barra de busca e filtros */}
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-b1 bg-s1 p-4 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-t4" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por título, responsável ou obra..."
              className="w-full rounded-lg bg-s2 py-2 pl-10 pr-4 font-sans text-sm text-t1 placeholder-t4 outline-none transition-colors border border-b1 focus:border-brand-green"
            />
          </div>
          <div className="hidden font-mono text-[11px] text-t4 sm:block">
            {tarefasFiltradas.length} tarefa{tarefasFiltradas.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Lista de Tarefas */}
        <div className="rounded-xl border border-b1 bg-s1 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-b1 flex items-center justify-between bg-s2/50">
            <h2 className="font-bold text-sm text-t1 uppercase tracking-wider">Acompanhamento de Atividades</h2>
            <div className="flex items-center gap-4 text-xs text-t4">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span> Alta Prioridade</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"></span> Média Prioridade</span>
            </div>
          </div>

          <div className="divide-y divide-b1">
            {tarefasFiltradas.map(tarefa => (
              <div key={tarefa.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-s2/50 transition-colors">
                <div className="flex items-start gap-4 min-w-0">
                  <div className={`mt-1 p-2 rounded-lg shrink-0 border ${
                    tarefa.status === 'concluido' ? 'bg-brand-green/10 border-brand-green/20 text-brand-green' : 
                    tarefa.status === 'em_andamento' ? 'bg-brand-blue/10 border-brand-blue/20 text-brand-blue' :
                    'bg-white/5 border-white/10 text-t4'
                  }`}>
                    {tarefa.status === 'concluido' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${
                        tarefa.prioridade === 'alta' ? 'bg-brand-red' :
                        tarefa.prioridade === 'media' ? 'bg-brand-amber' : 'bg-t4'
                      }`} />
                      <span className="font-mono text-[11px] text-t4 font-semibold uppercase">{tarefa.prioridade} Prioridade</span>
                      <span className="text-t4/40">·</span>
                      <span className="font-mono text-[11px] text-t3">{tarefa.obra}</span>
                    </div>

                    <h3 className="text-base font-bold text-t1 mb-1">{tarefa.titulo}</h3>
                    <div className="flex items-center gap-4 text-xs text-t4">
                      <span>Resp: <strong className="text-t2 font-semibold">{tarefa.responsavel}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-b1 justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-t4">Data Prevista</div>
                    <div className="text-xs font-semibold text-t2 mt-0.5">{tarefa.dataPrevista}</div>
                  </div>

                  <span className={`px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest border ${
                    tarefa.status === 'concluido' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                    tarefa.status === 'em_andamento' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' :
                    'bg-white/5 text-t4 border-white/10'
                  }`}>
                    {tarefa.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
