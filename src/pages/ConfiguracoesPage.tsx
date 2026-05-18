import React from 'react';
import { Settings, Shield, Database } from 'lucide-react';
import ConfigPage from '../components/ConfigPage';

export default function ConfiguracoesPage() {
  return (
    <main className="flex-1 overflow-y-auto bg-bg p-8 text-t1 outline-none">
      <div className="mx-auto max-w-4xl">
        {/* Cabeçalho */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-brand-green">
              <Settings className="h-3.5 w-3.5" />
              <span>Plataforma & IA</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-t1">Configurações do Sistema</h1>
            <p className="mt-1 text-sm text-t3">
              Credenciais do Supabase, chaves de API da IA (Gemini, Ollama, Minimax) e inicialização de banco.
            </p>
          </div>
        </header>

        {/* Container do ConfigPage existente */}
        <div className="rounded-xl border border-b1 bg-s1 p-6 shadow-sm">
          <ConfigPage />
        </div>
      </div>
    </main>
  );
}
