import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layers, Plus, Search, ArrowUpRight, Building2, Calendar, Users, ChevronRight } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface ProjetoMock {
  id: string;
  nome: string;
  codigo: string;
  status: 'em_andamento' | 'planejamento' | 'concluido';
  avanco: number;
  engenheiro: string;
  orcamento: string;
  prazo: string;
}

const PROJETOS_MOCK: ProjetoMock[] = [
  {
    id: '52598bf5-9ee1-4937-9d6d-31025dd977f0',
    nome: 'Obra Piloto Vila Mariana',
    codigo: 'PRJ-2026-001',
    status: 'em_andamento',
    avanco: 42,
    engenheiro: 'Eng. Evandro',
    orcamento: 'R$ 1.450.000',
    prazo: 'Dez 2026',
  },
  {
    id: 'f169f3c3-a122-437c-b4ba-6e56bc5f3f46',
    nome: 'Reforma Residencial Alto da Lapa',
    codigo: 'PRJ-2026-002',
    status: 'em_andamento',
    avanco: 15,
    engenheiro: 'Eng. Bruno',
    orcamento: 'R$ 380.000',
    prazo: 'Ago 2026',
  },
  {
    id: 'casa-teste-02',
    nome: 'Casa Teste 02 (Protótipo)',
    codigo: 'PRJ-2026-003',
    status: 'planejamento',
    avanco: 0,
    engenheiro: 'Engª Rita',
    orcamento: 'R$ 890.000',
    prazo: 'Fev 2027',
  },
];

export default function ProjetosPage() {
  const { config, setConfig } = useAppContext();
  const [busca, setBusca] = useState('');

  const projetosFiltrados = PROJETOS_MOCK.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
    p.engenheiro.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <main className="flex-1 overflow-y-auto bg-bg p-8 text-t1 outline-none">
      <div className="mx-auto max-w-6xl">
        {/* Cabeçalho */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
              <Layers className="h-3.5 w-3.5" />
              <span>Gestão de Projetos</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-t1">Projetos Ativos</h1>
            <p className="mt-1 text-sm text-t3">
              Entidade central que conecta oportunidades ganhas à execução no canteiro.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 font-sans text-[11px] font-extrabold uppercase tracking-widest text-bg shadow-lg shadow-brand-green/10 transition-all hover:bg-brand-green2">
              <Plus className="h-4 w-4" /> Novo Projeto
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
              placeholder="Buscar por nome, código ou engenheiro..."
              className="w-full rounded-lg bg-s2 py-2 pl-10 pr-4 font-sans text-sm text-t1 placeholder-t4 outline-none transition-colors border border-b1 focus:border-brand-green"
            />
          </div>
          <div className="hidden font-mono text-[11px] text-t4 sm:block">
            {projetosFiltrados.length} projeto{projetosFiltrados.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Lista de Projetos */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projetosFiltrados.map(projeto => {
            const isAtivo = config.obraId === projeto.id;

            return (
              <div
                key={projeto.id}
                className={`group relative flex flex-col justify-between rounded-xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl ${
                  isAtivo
                    ? 'border-brand-green bg-brand-green/5 shadow-brand-green/5'
                    : 'border-b1 bg-s1 hover:border-b3 hover:bg-s2'
                }`}
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-t4">
                      {projeto.codigo}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest ${
                        projeto.status === 'em_andamento'
                          ? 'bg-brand-green/10 text-brand-green border border-brand-green/20'
                          : 'bg-brand-amber/10 text-brand-amber border border-brand-amber/20'
                      }`}
                    >
                      {projeto.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-t1 group-hover:text-brand-green transition-colors">
                    {projeto.nome}
                  </h3>

                  <div className="mb-6 flex flex-col gap-2 text-[12px] text-t3">
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-t4" />
                      <span>{projeto.engenheiro}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-t4" />
                      <span>Prazo: {projeto.prazo}</span>
                    </div>
                  </div>
                </div>

                <div>
                  {/* Barra de Progresso */}
                  <div className="mb-4">
                    <div className="mb-1 flex items-center justify-between text-[11px] font-semibold">
                      <span className="text-t3">Avanço Físico</span>
                      <span className="font-mono text-brand-green">{projeto.avanco}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-s2 border border-b1">
                      <div
                        className="h-full rounded-full bg-brand-green transition-all duration-500"
                        style={{ width: `${projeto.avanco}%` }}
                      />
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center justify-between border-t border-b1 pt-4">
                    <div className="font-mono text-[11px] font-bold text-t2">
                      {projeto.orcamento}
                    </div>

                    <Link
                      to={`/obras/${projeto.id}`}
                      onClick={() => setConfig({ ...config, obraId: projeto.id })}
                      className="inline-flex items-center gap-1.5 font-sans text-[11px] font-extrabold uppercase tracking-widest text-brand-green hover:underline"
                    >
                      <span>Acessar Cockpit</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {projetosFiltrados.length === 0 && (
          <div className="rounded-xl border border-dashed border-b1 p-12 text-center">
            <Building2 className="mx-auto mb-4 h-8 w-8 text-t4" />
            <h3 className="text-base font-bold text-t2">Nenhum projeto encontrado</h3>
            <p className="mt-1 text-sm text-t4">
              Tente alterar os termos da busca ou crie um novo projeto.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
