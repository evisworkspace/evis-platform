import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Building2,
  TrendingUp,
  BarChart2,
  Users,
  Settings,
} from 'lucide-react';

const PRIMARY_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/oportunidades', icon: Briefcase, label: 'Oportunidades', end: false },
  { to: '/propostas', icon: FileText, label: 'Propostas', end: false },
  { to: '/obras', icon: Building2, label: 'Obras', end: false },
];

const SECONDARY_NAV = [
  { label: 'Financeiro', icon: TrendingUp },
  { label: 'Relatórios', icon: BarChart2 },
  { label: 'Cadastros', icon: Users },
  { label: 'Configurações', icon: Settings },
];

export default function GlobalLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-bg text-t1">
      {/* Sidebar */}
      <aside
        className="flex shrink-0 flex-col border-r border-b1 bg-s1"
        style={{ width: '240px' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-b1 px-5 py-[14px]">
          <span
            className="text-[13px] font-extrabold uppercase tracking-[0.18em]"
            style={{ color: '#2F6FED' }}
          >
            EVIS
          </span>
          <span className="text-[11px] font-medium uppercase tracking-widest text-t4">
            Plataforma
          </span>
        </div>

        {/* Nav principal */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-3">
          {PRIMARY_NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                [
                  'relative flex items-center gap-3 rounded-md px-3 py-[7px] text-[13px] font-medium transition-colors',
                  isActive
                    ? 'text-[#2F6FED]'
                    : 'text-t3 hover:bg-white/5 hover:text-t1',
                ].join(' ')
              }
              style={({ isActive }) =>
                isActive
                  ? { background: 'rgba(47,111,237,0.10)', borderLeft: '2px solid #2F6FED' }
                  : { borderLeft: '2px solid transparent' }
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          <div className="my-2 border-t border-b1" />

          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-t4">
            Em breve
          </p>

          {SECONDARY_NAV.map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="flex cursor-not-allowed items-center gap-3 rounded-md px-3 py-[7px] text-[13px] font-medium text-t4 opacity-40"
              title="Em breve"
              style={{ borderLeft: '2px solid transparent' }}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </span>
          ))}
        </nav>

        {/* Rodapé */}
        <div className="border-t border-b1 px-5 py-3">
          <p className="text-[10px] font-medium uppercase tracking-widest text-t4">
            v1.0 · alpha
          </p>
        </div>
      </aside>

      {/* Área de conteúdo */}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
