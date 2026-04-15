// Re-export from src/lib/utils para compatibilidade com components/ui/ na raiz.
// O tsconfig mapeia @/* para ./* (raiz), mas os componentes shadcn esperam @/lib/utils.
export { cn } from '../src/lib/utils';
