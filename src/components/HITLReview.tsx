import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertCircle, XCircle, RotateCcw, 
  ChevronRight, Save, User, HardHat, FileText,
  Plus, Trash2, Edit3
} from 'lucide-react';
import { useAppContext } from '../AppContext';

interface HITLResult {
  servicos: any[];
  equipes: any[];
  notas: any[];
  semana_relativa?: string;
}

interface HITLReviewProps {
  resultado: HITLResult;
  original: HITLResult; // Salvar o original para comparação
  onConfirm: (finalData: HITLResult) => void;
  onCancel: () => void;
}

export default function HITLReview({ resultado, original, onConfirm, onCancel }: HITLReviewProps) {
  const [data, setData] = useState<HITLResult>(resultado);
  const { toast } = useAppContext();

  const handleUpdateServico = (id: string, field: string, value: any) => {
    setData(prev => ({
      ...prev,
      servicos: prev.servicos.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const logFeedback = () => {
    const differences = {
      servicos: data.servicos.filter((s, i) => s.avanco !== original.servicos[i]?.avanco),
      equipes: original.equipes.length !== data.equipes.length,
      notas: original.notas.length !== data.notas.length
    };

    if (differences.servicos.length > 0 || differences.equipes || differences.notas) {
      console.warn('[HITL Feedback] Mudanças detectadas vs original IA. Registrando no log de melhoria...');
      // Em produção, isso enviaria um POST para /api/log-feedback
    }
  };

  const handleConfirm = () => {
    logFeedback();
    onConfirm(data);
  };

  const handleRemoveItem = (type: 'servicos' | 'equipes' | 'notas', idOrCod: string) => {
    setData(prev => ({
      ...prev,
      [type]: prev[type].filter((item: any) => (item.id || item.cod || item.descricao) !== idOrCod)
    }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-s1 border border-b1 rounded-2xl shadow-2xl overflow-hidden max-w-2xl w-full mx-auto"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-b1 flex items-center justify-between bg-gradient-to-r from-s1 to-s2">
        <div className="flex items-center gap-3">
          <div className="bg-brand-green/10 p-2 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-brand-green" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-t1 uppercase tracking-wider">Revisão de IA</h3>
            <p className="text-[10px] text-t4 font-mono">VALIDE OS DADOS EXTRAÍDOS ABAIXO</p>
          </div>
        </div>
        {data.semana_relativa && (
          <div className="bg-s3 px-3 py-1 rounded-full border border-b1">
            <span className="text-[10px] font-bold text-brand-green">{data.semana_relativa}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-8 max-h-[60vh] overflow-y-auto no-scrollbar">
        
        {/* SERVIÇOS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <HardHat className="w-4 h-4 text-t3" />
            <h4 className="text-[12px] font-bold text-t3 uppercase tracking-widest">Avanço de Serviços</h4>
          </div>
          <div className="space-y-3">
            {data.servicos.length === 0 && (
              <p className="text-[12px] text-t4 italic font-mono p-4 bg-s2/50 rounded-lg border border-dashed border-b1">Nenhum avanço detectado.</p>
            )}
            {data.servicos.map((s, idx) => (
              <motion.div 
                key={s.id || idx}
                layout
                className="bg-s2 border border-b1 p-4 rounded-xl flex items-center justify-between group"
              >
                <div className="flex-1">
                  <div className="text-[11px] font-mono text-t4 mb-1 uppercase">ID: {s.id?.slice(0,8) || 'N/A'}</div>
                  <div className="text-[14px] font-bold text-t1">Serviço Detectado</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                       <input 
                        type="number" 
                        value={s.avanco}
                        onChange={(e) => handleUpdateServico(s.id, 'avanco', parseInt(e.target.value))}
                        className="w-14 bg-s3 border border-b1 rounded px-1.5 py-0.5 text-[12px] font-bold text-brand-green text-center focus:outline-none focus:border-brand-green"
                      />
                      <span className="text-[12px] font-bold text-brand-green">%</span>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="date"
                        value={s.data_prevista || ''}
                        onChange={(e) => handleUpdateServico(s.id, 'data_prevista', e.target.value)}
                        className="bg-s3 border border-b1 rounded px-1.5 py-0.5 text-[10px] font-mono text-t2 focus:outline-none focus:border-brand-green"
                      />
                      <input 
                        type="date"
                        value={s.data_conclusao || ''}
                        onChange={(e) => handleUpdateServico(s.id, 'data_conclusao', e.target.value)}
                        className="bg-s3 border border-b1 rounded px-1.5 py-0.5 text-[10px] font-mono text-t2 focus:outline-none focus:border-brand-green"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveItem('servicos', s.id)}
                    className="p-2 text-t4 hover:text-brand-red transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* EQUIPES */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-t3" />
            <h4 className="text-[12px] font-bold text-t3 uppercase tracking-widest">Presença de Equipes</h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {data.equipes.length === 0 && (
              <p className="col-span-2 text-[12px] text-t4 italic font-mono p-4 bg-s2/50 rounded-lg border border-dashed border-b1">Nenhuma presença detectada.</p>
            )}
            {data.equipes.map((e, idx) => (
              <div key={e.cod || idx} className="bg-s2 border border-b1 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-green" />
                  <span className="text-[13px] font-bold text-t2">{e.nome || 'Não identificado'}</span>
                </div>
                <button onClick={() => handleRemoveItem('equipes', e.cod)} className="text-t4 hover:text-brand-red">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* NOTAS */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-t3" />
            <h4 className="text-[12px] font-bold text-t3 uppercase tracking-widest">Notas e Ocorrências</h4>
          </div>
          <div className="space-y-3">
            {data.notas.length === 0 && (
              <p className="text-[12px] text-t4 italic font-mono p-4 bg-s2/50 rounded-lg border border-dashed border-b1">Nenhuma nota importante.</p>
            )}
            {data.notas.map((n, idx) => (
              <div key={idx} className="bg-s2 border border-b1 p-4 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter ${
                    n.tipo === 'Material' ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-amber/10 text-brand-amber'
                  }`}>
                    {n.tipo}
                  </span>
                  <button onClick={() => handleRemoveItem('notas', n.descricao)} className="text-t4 hover:text-brand-red">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[13px] text-t2 leading-snug">{n.descricao}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="px-6 py-5 bg-s2 border-t border-b1 flex items-center justify-between">
        <button 
          onClick={onCancel}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-bold text-t3 hover:text-t1 hover:bg-s3 transition-all"
        >
          <RotateCcw className="w-4 h-4" /> DESCARTAR
        </button>
        <button 
          onClick={handleConfirm}
          className="flex items-center gap-2 px-8 py-2.5 bg-brand-green text-bg rounded-xl text-[12px] font-extrabold shadow-xl shadow-brand-green/20 hover:bg-brand-green2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <Save className="w-4 h-4" /> CONFIRMAR E SINCRONIZAR
        </button>
      </div>
    </motion.div>
  );
}
