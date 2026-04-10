import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { FileDown, Calendar, CheckCircle, AlertTriangle, MessageSquare } from 'lucide-react';

export default function Relatorios() {
  const { state } = useAppContext();
  const [semana, setSemana] = useState('');

  // Helper to get week string (e.g., "2026-W15")
  const getWeekString = (dateStr: string) => {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
  };

  // Extract all available weeks from data
  const availableWeeks = new Set<string>();
  Object.keys(state.diario).forEach(d => availableWeeks.add(getWeekString(d)));
  state.fotos.forEach(f => availableWeeks.add(f.semana || getWeekString(f.data)));
  state.notas.forEach(n => availableWeeks.add(getWeekString(n.data_nota)));
  
  const weeks = Array.from(availableWeeks).sort().reverse();
  
  // Default to latest week
  if (!semana && weeks.length > 0) {
    setSemana(weeks[0]);
  }

  const handlePrint = () => {
    window.print();
  };

  // Filter data for selected week
  const weekFotos = state.fotos.filter(f => (f.semana || getWeekString(f.data)) === semana);
  const weekNotas = state.notas.filter(n => getWeekString(n.data_nota) === semana);
  const weekDiarios = Object.entries(state.diario)
    .filter(([date]) => getWeekString(date) === semana)
    .sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6 gap-3 shrink-0 print:hidden">
        <div>
          <h2 className="text-[20px] font-bold text-t1">Relatório Semanal</h2>
        </div>
        <div className="flex gap-3">
          <select 
            value={semana} 
            onChange={e => setSemana(e.target.value)}
            className="bg-s2 border border-b1 rounded-md text-t1 font-mono text-[12px] px-3 py-1.5 outline-none focus:border-b3"
          >
            {weeks.map(w => (
              <option key={w} value={w}>Semana {w.split('-W')[1]} ({w.split('-W')[0]})</option>
            ))}
            {weeks.length === 0 && <option value="">Nenhuma semana disponível</option>}
          </select>
          <button 
            onClick={handlePrint}
            disabled={!semana}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-sans text-[11px] font-extrabold tracking-[0.05em] bg-brand-blue text-[#0a0d0a] hover:bg-blue-400 transition-colors disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            Gerar PDF
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="flex-1 overflow-y-auto bg-white text-black p-8 rounded-xl print:p-0 print:bg-transparent print:overflow-visible">
        <div className="max-w-[800px] mx-auto print:max-w-none">
          
          {/* Header */}
          <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-wider">Relatório Semanal de Obra</h1>
              <p className="text-sm text-gray-600 mt-1">Restaurante Badida ParkShopping Barigui</p>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-bold">Semana {semana ? semana.split('-W')[1] : ''}</div>
              <div className="font-mono text-xs text-gray-500">{semana ? semana.split('-W')[0] : ''}</div>
            </div>
          </div>

          {/* Resumo da Semana (Notas) */}
          {weekNotas.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Histórico e Notas
              </h2>
              <div className="flex flex-col gap-3">
                {weekNotas.map(n => (
                  <div key={n.id} className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-[10px] uppercase font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded">{n.tipo}</span>
                      <span className="font-mono text-[10px] text-gray-500">{new Date(n.data_nota).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{n.texto}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diário de Obra (Resumos) */}
          {weekDiarios.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Diário de Obra
              </h2>
              <div className="flex flex-col gap-4">
                {weekDiarios.map(([date, entry]) => (
                  <div key={date} className="border-l-2 border-gray-300 pl-4">
                    <div className="font-mono text-xs font-bold text-gray-600 mb-1">{new Date(date).toLocaleDateString('pt-BR')}</div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{(entry as any).texto || 'Sem registro.'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Avanço de Serviços */}
          <div className="mb-8 break-inside-avoid">
            <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" /> Status dos Serviços
            </h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left font-mono text-xs uppercase">Serviço</th>
                  <th className="border border-gray-300 p-2 text-left font-mono text-xs uppercase w-32">Categoria</th>
                  <th className="border border-gray-300 p-2 text-right font-mono text-xs uppercase w-24">Avanço</th>
                </tr>
              </thead>
              <tbody>
                {state.servicos.filter(s => s.avanco_atual > 0).map(s => (
                  <tr key={s.id_servico}>
                    <td className="border border-gray-300 p-2">{s.nome}</td>
                    <td className="border border-gray-300 p-2 text-gray-600">{s.categoria}</td>
                    <td className="border border-gray-300 p-2 text-right font-bold">{s.avanco_atual}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Registro Fotográfico */}
          {weekFotos.length > 0 && (
            <div className="mb-8 break-inside-avoid">
              <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-300 pb-2 mb-4 flex items-center gap-2">
                Registro Fotográfico
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {weekFotos.map(f => (
                  <div key={f.id} className="border border-gray-200 rounded p-2 break-inside-avoid">
                    <img src={f.url} alt={f.legenda} className="w-full h-48 object-cover mb-2 rounded" />
                    <p className="text-xs text-center text-gray-700 font-medium">{f.legenda}</p>
                    <p className="text-[10px] text-center text-gray-500 font-mono mt-1">{f.data}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
