import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, Camera, Calendar, FileText, 
  MapPin, TrendingUp, ChevronLeft, ExternalLink 
} from 'lucide-react';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { Servico, Foto, Nota } from '../types';

export default function PortalCliente() {
  const { obraId } = useParams();
  
  // No portal do cliente, apenas url/key/obraId são relevantes (leitura pública).
  // Os demais campos do Config são preenchidos com '' para satisfazer a tipagem.
  const config = {
    url:       (import.meta.env.VITE_SUPABASE_URL      as string) || '',
    key:       (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '',
    obraId:    obraId    || '',
    gemini:    '',
    model:     '',
    imgbbKey:  '',
    ollama:    '',
    minimax:   '',
    mcpServer: '',
  };

  const obraIdSafe = obraId ?? '';

  const servicos = useSupabaseQuery<Servico[]>(
    ['servicos-portal', obraIdSafe],
    `servicos?obra_id=eq.${obraIdSafe}&select=nome,avanco_atual,status`,
    config
  );

  const fotos = useSupabaseQuery<Foto[]>(
    ['fotos-portal', obraIdSafe],
    `fotos?obra_id=eq.${obraIdSafe}&order=data_foto.desc&limit=12`,
    config
  );

  const pctMedia = servicos.data 
    ? Math.round(servicos.data.reduce((acc, s) => acc + (s.avanco_atual || 0), 0) / (servicos.data.length || 1))
    : 0;

  return (
    <div className="min-h-screen bg-[#090a0b] text-[#f0f6fc] font-sans pb-20">
      {/* Header Premium */}
      <header className="h-20 border-b border-[#30363d] bg-[#121417]/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-[#3fb950] p-2 rounded-xl">
             <Building2 className="w-6 h-6 text-[#0a0d0a]" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold tracking-tight">Portal do Cliente</h1>
            <p className="text-[10px] font-mono text-[#3fb950]/80 tracking-[0.2em] uppercase">EVIS AI — VISTORIA DIGITAL</p>
          </div>
        </div>
        <Link to="/" className="text-[12px] font-bold text-[#a1aab5] hover:text-[#f0f6fc] flex items-center gap-2 transition-colors">
          <ChevronLeft className="w-4 h-4" /> ÁREA TÉCNICA
        </Link>
      </header>

      <main className="max-w-6xl mx-auto p-8 space-y-12">
        
        {/* KPI de Progresso */}
        <section className="bg-gradient-to-br from-[#121417] to-[#1a1d21] border border-[#30363d] rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 space-y-4">
            <span className="text-[12px] font-bold text-[#3fb950] uppercase tracking-widest">Status Geral da Obra</span>
            <h2 className="text-[32px] font-extrabold leading-tight">Sua obra está com <span className="text-[#3fb950]">{pctMedia}%</span> de avanço concluído.</h2>
            <div className="w-full bg-[#30363d] h-3 rounded-full overflow-hidden">
               <div 
                className="h-full bg-[#3fb950] transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(63,185,80,0.3)]"
                style={{ width: `${pctMedia}%` }}
              />
            </div>
          </div>
          <div className="w-40 h-40 rounded-full border-8 border-[#1a1d21] border-t-[#3fb950] flex items-center justify-center relative shadow-2xl">
              <span className="text-[36px] font-black">{pctMedia}%</span>
          </div>
        </section>

        {/* Galeria de Fotos */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="w-5 h-5 text-[#3fb950]" />
              <h3 className="text-[20px] font-bold">Últimas Fotos</h3>
            </div>
            <button className="text-[12px] font-bold text-[#a1aab5] hover:text-[#3fb950] flex items-center gap-2">
              VER TODAS <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {fotos.data?.map((f, i) => (
              <div key={i} className="group relative aspect-square rounded-2xl overflow-hidden border border-[#30363d] hover:border-[#3fb950]/50 transition-all cursor-zoom-in">
                <img src={f.url} alt={f.legenda} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                   <p className="text-[11px] font-bold">{f.legenda}</p>
                   <p className="text-[9px] text-[#a1aab5]">{new Date(f.data_foto).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Serviços em Destaque */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#121417] border border-[#30363d] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-[#3fb950]" />
              <h3 className="text-[18px] font-bold">Estágio dos Serviços</h3>
            </div>
            <div className="space-y-4">
              {servicos.data?.slice(0, 5).map((s, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#c9d1d9]">{s.nome}</span>
                    <span className="font-bold text-[#3fb950]">{s.avanco_atual}%</span>
                  </div>
                  <div className="w-full bg-[#1a1d21] h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#3fb950]/40" style={{ width: `${s.avanco_atual}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#121417] border border-[#30363d] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-[#3fb950]/10 p-4 rounded-full">
              <FileText className="w-8 h-8 text-[#3fb950]" />
            </div>
            <h3 className="text-[18px] font-bold">Relatório Semanal Ativo</h3>
            <p className="text-[13px] text-[#a1aab5] px-10">Consulte o detalhamento técnico completo de tudo que aconteceu nesta última semana na sua obra.</p>
            <button className="px-6 py-2.5 bg-[#f0f6fc] text-[#0a0d0a] text-[12px] font-extrabold rounded-xl hover:bg-white transition-colors">
              BAIXAR PDF DO RELATÓRIO
            </button>
          </div>
        </section>

      </main>

      {/* Footer Nav Mobile Style */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-[#121417]/95 backdrop-blur-lg border-t border-[#30363d] flex items-center justify-around md:hidden px-4">
          {/* Mobile Tab bar simulation */}
      </footer>
    </div>
  );
}
