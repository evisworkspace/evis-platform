import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase } from 'lucide-react';

export default function OportunidadesPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-8 text-t1">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col">
        <Link
          to="/dashboard"
          className="mb-8 inline-flex w-fit items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-t3 transition-colors hover:text-brand-green"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-2xl rounded-lg border border-b1 bg-s1 p-8">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-b1 bg-bg text-brand-green">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-green">
              Oportunidades
            </div>
            <h1 className="text-2xl font-extrabold text-t1">Módulo em preparação</h1>
            <p className="mt-4 text-sm leading-6 text-t3">
              Esta área será a entrada para registrar e acompanhar oportunidades comerciais. Neste patch, ela funciona como placeholder explícito da rota.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
