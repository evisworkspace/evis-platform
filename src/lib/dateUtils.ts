import { AppState } from '../types';

export const getObraBaseMonday = (state: AppState): Date => {
  let earliest = Infinity;
  
  state.servicos.forEach(s => { 
    if (s.data_inicio) { 
      const t = new Date(s.data_inicio).getTime(); 
      if (!isNaN(t) && t < earliest) earliest = t; 
    }
  });

  Object.keys(state.diario).forEach(d => { 
    const t = new Date(d).getTime(); 
    if (!isNaN(t) && t < earliest) earliest = t; 
  });

  state.fotos.forEach(f => {
    const t = new Date(f.data_foto).getTime(); 
    if (!isNaN(t) && t < earliest) earliest = t; 
  });

  if (earliest === Infinity) {
      earliest = new Date().getTime();
  }

  const base = new Date(earliest);
  // Ajustar para a Segunda-feira dessa semana
  const day = base.getDay();
  const diff = base.getDate() - day + (day === 0 ? -6 : 1); // ajusta quando o dia é domingo
  
  const monday = new Date(base.setDate(diff));
  monday.setHours(0,0,0,0);
  
  return monday;
};

export const getRelativeWeekNumber = (dateStr: string, state: AppState): number => {
    const baseMonday = getObraBaseMonday(state);
    
    const d = new Date(dateStr);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const targetMonday = new Date(d.setDate(diff));
    targetMonday.setHours(0,0,0,0);

    const msDiff = targetMonday.getTime() - baseMonday.getTime();
    const weeksDiff = Math.floor(msDiff / (7 * 24 * 60 * 60 * 1000));
    
    return weeksDiff + 1;
};

export const getRelativeWeekString = (dateStr: string, state: AppState): string => {
    const w = getRelativeWeekNumber(dateStr, state);
    return `S${w}`; // Return simply S1, S2, S3 instead of 2026-W11
};

export const getDaysOfRelativeWeek = (weekString: string, state: AppState): string[] => {
    // weekString is like "S1", "S2"
    if (!weekString.startsWith('S')) return [];
    const w = parseInt(weekString.replace('S', ''), 10);
    if (isNaN(w)) return [];

    const baseMonday = getObraBaseMonday(state);
    const targetMonday = new Date(baseMonday.getTime());
    targetMonday.setDate(targetMonday.getDate() + ((w - 1) * 7));

    const dias = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(targetMonday);
        d.setDate(targetMonday.getDate() + i);
        dias.push(d.toISOString().split('T')[0]);
    }
    return dias;
};
