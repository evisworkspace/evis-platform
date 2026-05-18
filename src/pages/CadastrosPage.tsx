import React, { useState } from 'react';
import { Users, Building, Briefcase, Plus, Search, CheckCircle2, Building2 } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface CadastroMock {
  id: string;
  nome: string;
  tipo: 'cliente' | 'fornecedor' | 'equipe';
  documento: string;
  contato: string;
  status: 'ativo' | 'inativo';
}

const CADASTROS_MOCK: CadastroMock[] = [
  {
    id: '1',
    nome: 'Dr. Carlos Eduardo Lapa (Cliente)',
    tipo: 'cliente',
    documento: 'CPF: 291.***.***-09',
    contato: 'carlos.lapa@gmail.com',
    status: 'ativo',
  },
  {
    id: '2',
    nome: 'Votorantim Cimentos S.A.',
    tipo: 'fornecedor',
    documento: 'CNPJ: 01.637.895/0001-32',
    contato: 'vendas@votorantim.com',
    status: 'ativo',
  },
  {
    id: '3',
    nome: 'Equipe Alvenaria & Estrutura (Empreiteiro João)',
    tipo: 'equipe',
    documento: 'CNPJ: 14.892.102/0001-88',
    contato: '(11) 98829-1029',
    status: 'ativo',
  },
  {
    id: '4',
    nome: 'Gerdau S.A. (Aços e Vergalhões)',
    tipo: 'fornecedor',
    documento: 'CNPJ: 33.611.500/0001-19',
    contato: 'cotacoes@gerdau.com.br',
    status: 'ativo',
  },
  {
    id: '5',
    nome: 'Portobello Shop (Revestimentos)',
    tipo: 'fornecedor',
    documento: 'CNPJ: 84.683.670/0001-00',
    contato: 'atendimento@portobello.com.br',
    status: 'ativo',
  },
];

export default function CadastrosPage() {
  const { config } = useAppContext();
  const [busca, setBusca] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');

  const cadastrosFiltrados = CADASTROS_MOCK.filter(c => {
    const matchBusca = c.nome.toLowerCase().includes(busca.toLowerCase()) || c.documento.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'todos' || c.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  return (
    <main className="flex-1 overflow-y-auto bg-bg p-8 text-t1 outline-none">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
              <Users className="h-3.5 w-3.5" />
              <span>Base de Dados</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-t1">Cadastros Gerais</h1>
            <p className="mt-1 text-sm text-t3">
              Gestão de clientes, fornecedores de insumos e equipes/empreiteiros da construtora.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 font-sans text-[11px] font-extrabold uppercase tracking-widest text-bg shadow-lg shadow-brand-green/10 transition-all hover:bg-brand-green2">
              <Plus className="h-4 w-4" /> Novo Cadastro
            </button>
          </div>
        </header>

        {/* Barra de busca e filtros */}
        <div className="mb-6 flex flex-col sm:flex-row items-center gap-4 rounded-xl border border-b1 bg-s1 p-4 shadow-sm">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-t4" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar por nome ou documento (CPF/CNPJ)..."
              className="w-full rounded-lg bg-s2 py-2 pl-10 pr-4 font-sans text-sm text-t1 placeholder-t4 outline-none transition-colors border border-b1 focus:border-brand-green"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setFiltroTipo('todos')}
              className={`px-4 py-2 rounded-lg font-sans text-xs font-bold whitespace-nowrap transition-all border ${
                filtroTipo === 'todos' ? 'bg-brand-green/10 border-brand-green text-brand-green' : 'bg-s2 border-b1 text-t3 hover:text-t1'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroTipo('cliente')}
              className={`px-4 py-2 rounded-lg font-sans text-xs font-bold whitespace-nowrap transition-all border ${
                filtroTipo === 'cliente' ? 'bg-brand-green/10 border-brand-green text-brand-green' : 'bg-s2 border-b1 text-t3 hover:text-t1'
              }`}
            >
              Clientes
            </button>
            <button
              onClick={() => setFiltroTipo('fornecedor')}
              className={`px-4 py-2 rounded-lg font-sans text-xs font-bold whitespace-nowrap transition-all border ${
                filtroTipo === 'fornecedor' ? 'bg-brand-green/10 border-brand-green text-brand-green' : 'bg-s2 border-b1 text-t3 hover:text-t1'
              }`}
            >
              Fornecedores
            </button>
            <button
              onClick={() => setFiltroTipo('equipe')}
              className={`px-4 py-2 rounded-lg font-sans text-xs font-bold whitespace-nowrap transition-all border ${
                filtroTipo === 'equipe' ? 'bg-brand-green/10 border-brand-green text-brand-green' : 'bg-s2 border-b1 text-t3 hover:text-t1'
              }`}
            >
              Equipes
            </button>
          </div>
        </div>

        {/* Lista de Cadastros */}
        <div className="rounded-xl border border-b1 bg-s1 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-b1 flex items-center justify-between bg-s2/50">
            <h2 className="font-bold text-sm text-t1 uppercase tracking-wider">Registros do Sistema</h2>
            <span className="font-mono text-[11px] text-t4">{cadastrosFiltrados.length} entidades</span>
          </div>

          <div className="divide-y divide-b1">
            {cadastrosFiltrados.map(cad => (
              <div key={cad.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-s2/50 transition-colors">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="mt-1 p-2 bg-white/5 border border-white/10 rounded-lg shrink-0 text-t3">
                    {cad.tipo === 'cliente' ? <Briefcase className="w-5 h-5 text-brand-blue" /> : cad.tipo === 'fornecedor' ? <Building className="w-5 h-5 text-brand-amber" /> : <Users className="w-5 h-5 text-brand-green" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2.5 py-0.5 rounded-full font-mono text-[9px] font-bold uppercase tracking-widest border ${
                        cad.tipo === 'cliente' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' : cad.tipo === 'fornecedor' ? 'bg-brand-amber/10 text-brand-amber border-brand-amber/20' : 'bg-brand-green/10 text-brand-green border-brand-green/20'
                      }`}>
                        {cad.tipo.toUpperCase()}
                      </span>
                      <span className="font-mono text-[11px] text-t4">{cad.documento}</span>
                    </div>

                    <h3 className="text-base font-bold text-t1 mb-1">{cad.nome}</h3>
                    <div className="flex items-center gap-4 text-xs text-t4">
                      <span>Contato: <strong className="text-t2 font-semibold">{cad.contato}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t sm:border-t-0 pt-4 sm:pt-0 border-b1 justify-between sm:justify-end">
                  <span className="px-3 py-1 rounded-full font-mono text-[10px] font-bold uppercase tracking-widest bg-brand-green/10 text-brand-green border border-brand-green/20">
                    {cad.status.toUpperCase()}
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
