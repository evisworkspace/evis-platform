import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Config } from './types';
import { initialData } from './initialData';

interface AppContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  markPending: (table: string, data: any) => void;
  resetState: () => void;
  toast: (msg: string, type?: 'info' | 'error' | 'success') => void;
}

const defaultState: AppState = {
  servicos: initialData.servicos || [],
  pendencias: initialData.pendencias || [],
  presenca: {},
  diario: {},
  narrativas: initialData.narrativas || {},
  notas: initialData.notas || [],
  fotos: initialData.fotos || [],
  equipes: initialData.equipes || [
    { cod: 'EQ-OBR-01', nome: 'Valdeci José E.' },
    { cod: 'EQ-ACO-01', nome: 'Ademarcos' },
    { cod: 'EQ-ELE-01', nome: 'Lumitech' },
    { cod: 'EQ-FRG-01', nome: 'Claudinei' },
    { cod: 'FOR-ESP-01', nome: 'Pablo' },
    { cod: 'EQ-MAR-01', nome: '[Marcenaria]' },
    { cod: 'EQ-LIM-01', nome: '[Limpeza]' },
    { cod: 'EQ-LOG-01', nome: 'Roberto' }
  ],
  currentDay: new Date().toISOString().split('T')[0],
  pendingChanges: []
};

const defaultConfig: Config = {
  url: '',
  key: '',
  obraId: '',
  gemini: '',
  model: 'gemini-2.0-flash',
  imgbbKey: ''
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [toastMsg, setToastMsg] = useState<{msg: string, type: 'info'|'error'|'success'} | null>(null);

  const toast = (msg: string, type: 'info'|'error'|'success' = 'info') => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const [state, setState] = useState<AppState>(() => {
    try {
      const s = localStorage.getItem('badida_state');
      if (s) {
        const parsed = JSON.parse(s);
        return {
          ...defaultState,
          ...parsed,
          servicos: parsed.servicos || defaultState.servicos,
          pendencias: parsed.pendencias || defaultState.pendencias,
          presenca: parsed.presenca || defaultState.presenca,
          diario: parsed.diario || defaultState.diario,
          narrativas: parsed.narrativas || defaultState.narrativas,
          notas: parsed.notas || defaultState.notas,
          fotos: parsed.fotos || defaultState.fotos,
          equipes: parsed.equipes?.map((e: any) => typeof e === 'string' ? { cod: e, nome: e } : e) || defaultState.equipes,
          pendingChanges: parsed.pendingChanges || defaultState.pendingChanges,
        };
      }
      return defaultState;
    } catch {
      return defaultState;
    }
  });

  const [config, setConfig] = useState<Config>(() => {
    try {
      const c = localStorage.getItem('badida_cfg');
      return c ? { ...defaultConfig, ...JSON.parse(c) } : defaultConfig;
    } catch {
      return defaultConfig;
    }
  });

  useEffect(() => {
    localStorage.setItem('badida_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('badida_cfg', JSON.stringify(config));
  }, [config]);

  const markPending = (table: string, data: any) => {
    setState(prev => ({
      ...prev,
      pendingChanges: [...prev.pendingChanges, { table, data, ts: Date.now() }]
    }));
  };

  const resetState = () => {
    setState(defaultState);
    localStorage.removeItem('badida_state');
  };

  return (
    <AppContext.Provider value={{ state, setState, config, setConfig, markPending, resetState, toast }}>
      {children}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
          <div className={`px-4 py-3 rounded-lg shadow-lg font-sans text-[13px] font-medium border ${
            toastMsg.type === 'error' ? 'bg-brand-red/10 border-brand-red/30 text-brand-red' :
            toastMsg.type === 'success' ? 'bg-brand-green/10 border-brand-green/30 text-brand-green' :
            'bg-s2 border-b2 text-t1'
          }`}>
            {toastMsg.msg}
          </div>
        </div>
      )}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
