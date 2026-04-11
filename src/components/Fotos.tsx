import React, { useRef, useState } from 'react';
import { useAppContext } from '../AppContext';
import { UploadCloud, Loader2 } from 'lucide-react';
import { logger } from '../services/logger';
import { Foto } from '../types';

export default function Fotos() {
  const { state, setState, config, markPending, toast } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Helper to get week string (e.g., "2026-W15")
  const getWeekString = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
  };

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
            semana: getWeekString(state.currentDay),
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

  // Group photos by week
  const groupedFotos = state.fotos.reduce((acc, foto) => {
    const w = foto.semana || getWeekString(foto.data_foto);
    if (!acc[w]) acc[w] = [];
    acc[w].push(foto);
    return acc;
  }, {} as Record<string, Foto[]>);

  const weeks = Object.keys(groupedFotos).sort().reverse();

  return (
    <div>
      <div className="flex items-start justify-between mb-6 gap-3">
        <div>
          <h2 className="text-[20px] font-bold text-t1">Registro Fotográfico</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            disabled={uploading}
            className="px-2.5 py-1.5 rounded-md text-[11px] font-bold tracking-[0.05em] text-t2 border border-b2 hover:border-b3 hover:text-t1 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '+ Adicionar fotos'}
          </button>
        </div>
      </div>
      
      <input type="file" ref={fileInputRef} accept="image/*" multiple className="hidden" onChange={onFotos} />
      
      {weeks.length === 0 && !uploading && (
        <div onClick={() => fileInputRef.current?.click()} className="border border-dashed border-b2 rounded-lg py-12 px-5 flex flex-col items-center gap-2.5 cursor-pointer text-t3 transition-colors hover:border-brand-green hover:text-brand-green font-mono text-[11px] tracking-[0.06em] text-center">
          <UploadCloud className="w-8 h-8" strokeWidth={1.2} />
          Clique ou arraste fotos aqui
        </div>
      )}

      {weeks.map(week => (
        <div key={week} className="mb-8">
          <h3 className="font-mono text-[12px] text-t2 uppercase tracking-[0.1em] mb-3 pb-2 border-b border-b1">Semana {week.split('-W')[1]} ({week.split('-W')[0]})</h3>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-2.5">
            {groupedFotos[week].map(f => (
              <div key={f.id} className="bg-s1 border border-b1 rounded-lg overflow-hidden cursor-pointer transition-all hover:border-b2 hover:-translate-y-px">
                <img src={f.thumb || f.url} alt={f.legenda} className="w-full h-[130px] object-cover bg-s3 block" />
                <div className="p-2.5">
                  <div className="text-[12px] text-t2 whitespace-nowrap overflow-hidden text-ellipsis">{f.legenda}</div>
                  <div className="font-mono text-[10px] text-t3 mt-1">{f.data_foto}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
