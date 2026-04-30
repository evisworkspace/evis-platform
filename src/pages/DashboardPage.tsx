import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Building2, FileText, LayoutDashboard, MessageSquare } from 'lucide-react';

const cards = [
  {
    title: 'Oportunidades',
    description: 'Entrada comercial para organizar demandas, origens e próximos passos.',
    href: '/oportunidades',
    icon: Briefcase,
  },
  {
    title: 'Orçamentista',
    description: 'Leitura documental, roteiro técnico e validação HITL. Etapas posteriores em evolução.',
    href: '/orcamentista',
    icon: MessageSquare,
  },
  {
    title: 'Propostas',
    description: 'Geração e revisão de propostas comerciais a partir das informações técnicas disponíveis.',
    href: '/propostas',
    icon: FileText,
  },
  {
    title: 'Gestão da Obra',
    description: 'Diário, equipes, orçamento, cronograma, notas, fotos e relatórios da obra ativa.',
    href: '/obras',
    icon: Building2,
  },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-bg text-t1">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-b1 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-green">
              <LayoutDashboard className="h-4 w-4" />
              Plataforma EVIS
            </div>
            <h1 className="text-3xl font-extrabold tracking-normal text-t1 sm:text-4xl">
              Dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-t3">
              Entrada simples para acessar os módulos atuais da plataforma, mantendo a Gestão da Obra preservada em sua rota própria.
            </p>
          </div>
          <Link
            to="/obras"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-widest text-bg transition-colors hover:bg-brand-green2"
          >
            Abrir obras
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <div className="grid flex-1 content-start gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="group flex min-h-[190px] flex-col justify-between rounded-lg border border-b1 bg-s1 p-5 transition-colors hover:border-b3 hover:bg-s2"
            >
              <div>
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg border border-b1 bg-bg text-brand-green">
                  <card.icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-bold text-t1">{card.title}</h2>
                <p className="mt-3 text-sm leading-6 text-t3">{card.description}</p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-t3 group-hover:text-brand-green">
                Acessar
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
