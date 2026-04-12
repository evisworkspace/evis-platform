import React, { useRef, useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { UploadCloud, Loader2, Trash2 } from 'lucide-react';
import { logger } from '../services/logger';
import { Foto } from '../types';
import { getRelativeWeekString, getDaysOfRelativeWeek } from '../lib/dateUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Fotos() {
  const { state, setState, config, markPending, toast } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (!config.imgbbKey) {
      toast('Configure a chave da API do ImgBB nas Configurações primeiro.', 'error');
      return;
    }

    setUploading(true);
    const files = Array.from(e.target.files);
    
    for (const f of files) {
      try {
        const formData = new FormData();
        formData.append('image', f);
        
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${config.imgbbKey}`, {
          method: 'POST',
          body: formData
        });
        
        const data = await res.json();
        if (data.success) {
          const newFoto: Foto = {
            id: crypto.randomUUID(),
            url: data.data.url,
            thumb: data.data.thumb.url,
            data_foto: state.currentDay,
            semana: getRelativeWeekString(state.currentDay, state),
            legenda: f.name.replace(/\.[^.]+$/, '')
          };
          
          setState(prev => ({ ...prev, fotos: [newFoto, ...prev.fotos] }));
           markPending('fotos', newFoto);
         } else {
           logger.error('ImgBB Error:', data);
         }
       } catch (err) {
         logger.error('Upload failed:', err);
       }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const deletePhoto = (id: string) => {
      setState(p => ({...p, fotos: p.fotos.filter(f => f.id !== id)}));
  };

  // Group photos by relative week
  const photosByWeek = useMemo(() => {
      const grouped: Record<string, Foto[]> = {};
      state.fotos.forEach(f => {
          let w = f.semana;
          // Legacy check if photo was saved using ISO Format (2026-W11) recalculate.
           if (w && w.includes('-W')) {
              w = getRelativeWeekString(f.data_foto, state);
          } else if (!w) {
              w = getRelativeWeekString(f.data_foto, state);
          }
          if (!grouped[w]) grouped[w] = [];
          grouped[w].push(f);
      });
      return grouped;
  }, [state.fotos, state.servicos, state.diario]);

  // Sort weeks S1, S2, S3...
  const sortedWeeks = Object.keys(photosByWeek).sort((a,b) => {
      const numA = parseInt(a.replace('S',''), 10);
      const numB = parseInt(b.replace('S',''), 10);
      return numB - numA; // Largest first (most recent)
  });

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col pt-4">
      <div className="flex items-start justify-between mb-8 pb-4 border-b border-b1">
        <div>
          <h2 className="text-[20px] font-bold text-t1 uppercase tracking-tight">Registro Fotográfico</h2>
          <p className="font-mono text-[11px] text-t3 uppercase mt-1">
            Galeria Imutável • Organizada por Semanas Virtuais da Obra
          </p>
        </div>
        <div className="flex gap-4">
          <input type="file" ref={fileInputRef} onChange={onFotos} multiple accept="image/*" className="hidden" />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-brand-green text-[#0a0d0a] text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-brand-green2 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            {uploading ? 'ENVIANDO...' : 'CARREGAR FOTOS'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-12 pb-20">
         {sortedWeeks.map(w => {
            const days = getDaysOfRelativeWeek(w, state);
            if (days.length === 0) return null;
            const dtFrom = new Date(days[0]).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});
            const dtTo = new Date(days[days.length - 1]).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'});

            return (
               <div key={w} className="flex flex-col gap-4">
                   <div className="bg-s1 border-l-4 border-brand-green p-4 px-6 relative rounded-r-md">
                      <div className="text-[16px] font-black uppercase tracking-tighter text-t1">Semana {w.replace('S','')}</div>
                      <div className="text-[10px] font-mono text-t3 uppercase tracking-widest mt-1">Período Contábil: {dtFrom} a {dtTo}</div>
                   </div>

                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                       {photosByWeek[w].map(f => (
                           <div key={f.id} className="group relative bg-s1 border border-b1 rounded-lg overflow-hidden shadow-lg hover:border-brand-green transition-colors aspect-square flex flex-col">
                               <img src={f.thumb || f.url} alt={f.legenda} className="w-full h-full object-cover filter contrast-[1.05]" />
                               <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end pointer-events-none">
                                   <p className="text-[12px] font-bold text-white uppercase tracking-tighter truncate">{f.legenda}</p>
                                   <p className="text-[9px] font-mono text-gray-300 tracking-widest uppercase mt-1">
                                       {format(new Date(f.data_foto), "dd/MM 'às' HH:mm", {locale: ptBR})}
                                   </p>
                               </div>
                               <button 
                                 onClick={() => deletePhoto(f.id)}
                                 className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-all hover:bg-brand-red"
                               >
                                  <Trash2 size={14} />
                               </button>
                           </div>
                       ))}
                   </div>
               </div>
            );
         })}

         {sortedWeeks.length === 0 && (
             <div className="text-center py-20 bg-s1 border border-b1 border-dashed rounded-lg">
                 <p className="text-[12px] font-mono text-t4 uppercase tracking-widest leading-relaxed">A galeria da obra ainda não possui registros fotográficos vinculados aos diários.</p>
             </div>
         )}
      </div>
    </div>
  );
}
