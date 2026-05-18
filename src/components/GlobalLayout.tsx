import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  Layers,
  Bot,
  FileText,
  FileCheck,
  Building2,
  CheckSquare,
  ShoppingBag,
  TrendingUp,
  BarChart2,
  Users,
  Settings,
} from 'lucide-react';

const MENU_CATEGORIES = [
  {
    title: 'Comercial & Projetos',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
      { to: '/oportunidades', icon: Briefcase, label: 'Oportunidades', end: false },
      { to: '/projetos', icon: Layers, label: 'Projetos', end: false },
      { to: '/orcamentista', icon: Bot, label: 'Orçamentista IA', end: false },
      { to: '/propostas', icon: FileText, label: 'Propostas', end: false },
    ],
  },
  {
    title: 'Engenharia & Obras',
    items: [
      { to: '/pre-obra', icon: FileCheck, label: 'Pré-Obra', end: false },
      { to: '/obras', icon: Building2, label: 'Obras (Cockpit)', end: false },
      { to: '/tarefas', icon: CheckSquare, label: 'Tarefas', end: false },
    ],
  },
  {
    title: 'Gestão & Finanças',
    items: [
      { to: '/compras', icon: ShoppingBag, label: 'Compras', end: false },
      { to: '/financeiro', icon: TrendingUp, label: 'Financeiro', end: false },
      { to: '/relatorios', icon: BarChart2, label: 'Relatórios / BI', end: false },
    ],
  },
  {
    title: 'Sistema',
    items: [
      { to: '/cadastros', icon: Users, label: 'Cadastros', end: false },
      { to: '/config', icon: Settings, label: 'Configurações', end: false },
    ],
  },
];

export default function GlobalLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg text-t1 font-sans">
      {/* Sidebar Lateral */}
      <aside
        className="flex shrink-0 flex-col border-r border-b1 bg-s1 shadow-2xl z-40 transition-all duration-300"
        style={{ width: '250px' }}
      >
        {/* Logo EVIS Plataforma */}
        <div className="flex items-center gap-3 border-b border-b1 px-6 py-4 bg-s2/30">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-green/10 border border-brand-green/20 shadow-lg shadow-brand-green/10">
            <Building2 className="h-4 w-4 text-brand-green" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-black uppercase tracking-[0.2em] text-brand-green leading-none">
                EVIS
              </span>
              <span className="rounded bg-brand-green/10 px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-widest text-brand-green border border-brand-green/20">
                SaaS
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-t4 block mt-0.5">
              Plataforma
            </span>
          </div>
        </div>

        {/* Navegação da Espinha Dorsal */}
        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 no-scrollbar">
          {MENU_CATEGORIES.map((category, catIdx) => (
            <div key={catIdx} className="flex flex-col gap-1">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-t4 font-mono">
                {category.title}
              </p>
              {category.items.map(({ to, icon: Icon, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    [
                      'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-bold transition-all group',
                      isActive
                        ? 'text-brand-green bg-brand-green/10 border-l-[3px] border-brand-green shadow-sm'
                        : 'text-t3 hover:bg-white/5 hover:text-t1 border-l-[3px] border-transparent',
                    ].join(' ')
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-brand-green' : 'text-t4 group-hover:text-t2'
                        }`}
                      />
                      <span className="truncate">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Rodapé da Sidebar */}
        <div className="border-t border-b1 p-4 bg-s2/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-2 w-2 rounded-full bg-brand-green animate-pulse shadow-[0_0_8px_rgba(63,185,80,0.6)]" />
            <span className="text-[11px] font-mono font-bold text-t2 truncate">
              Vobi Benchmark
            </span>
          </div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-t4 bg-white/5 px-2 py-1 rounded border border-white/10">
            v2.0
          </span>
        </div>
      </aside>

      {/* Área de Conteúdo Principal */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-bg">
        <Outlet />
      </div>
    </div>
  );
}
