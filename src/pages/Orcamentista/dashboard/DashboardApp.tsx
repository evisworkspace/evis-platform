/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  FileText, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  ChevronRight, 
  LayoutDashboard, 
  Settings, 
  History,
  Brain,
  MessageSquare,
  ArrowRight,
  Maximize2,
  Table as TableIcon,
  Download,
  AlertTriangle,
  Zap,
  UserCheck,
  Plus,
  X,
  Save,
  Globe,
  Cpu,
  Layers,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

declare global {
  interface Window {
    antigravity: {
      runCommand: (config: { cmd: string; args: string[]; cwd?: string }) => Promise<{ exitCode: number; stdout: string; stderr: string }>;
      readFile: (path: string) => Promise<string>;
      writeFile: (path: string, content: string) => Promise<void>;
    };
  }
}

// Helper to load JSON via Antigravity
async function loadJSON(path: string) {
  try {
    if (!window.antigravity) {
      console.warn("Antigravity bridge not initialized yet");
      return null;
    }
    const content = await window.antigravity.readFile(path);
    return JSON.parse(content);
  } catch (error: any) {
    // If it's a 404, we don't need to log an error as it's expected on fresh runs
    if (error.status !== 404) {
      console.error(`Error loading JSON from ${path}:`, error);
    }
    return null;
  }
}


async function runCommand(cmd: string, args: string[], cwd?: string) {
  const result = await window.antigravity.runCommand({ cmd, args, cwd });
  if (result.exitCode !== 0) {
    throw new Error(result.stderr || result.stdout || `Command failed: ${cmd}`);
  }
  return result;
}

// Types representing the system state
type StepStatus = 'pending' | 'running' | 'completed' | 'error' | 'blocked';
type ActionType = 'liberar_quantitativo' | 'pacote_llm_vision_gerado' | 'enviar_para_especialistas' | 'solicitar_validacao_humana';
type HumDecision = 'none' | 'aprovado' | 'manual' | 'rejeitado';

interface DataPoint {
  room: string;
  area: number;
  highlight?: boolean;
}

interface AuditItem {
  id: string;
  ambient: string;
  areaExtracted: number;
  areaValidated: number;
  origin: 'OCR' | 'Quadro' | 'IA';
  confidence: number;
  status: 'OK' | 'Corrigido' | 'Suspeito';
  region: string;
  observations?: string;
  aiPrompt?: string;
  aiRawResponse?: string;
}

interface HistoryEntry {
  id: string;
  timestamp: string;
  user: string;
  decision: HumDecision;
  details?: string;
}

interface Folha {
  id: string;
  name: string;
  type: 'setorial' | 'complementar';
  status: StepStatus;
  currentStep: number;
  action?: ActionType;
  confidenceScore: number;
  lastUpdated: string;
  jsonPath: string;
  executorInputPath?: string;
  validatedOutputPath?: string;
  quantitativosPath?: string;
  readerDir?: string;
  bloquear_quantitativo: boolean;
  alerts?: string[];
  conflicts?: string[];
  corrigido_por_llm: boolean;
  extractedData?: DataPoint[];
  correctedData?: DataPoint[];
  auditItems?: AuditItem[];
  history?: HistoryEntry[];
  decisao_humana: HumDecision;
  manualVal?: number;
}

const DASHBOARD_STEPS = [
  { id: 'reader', label: 'Leitura Técnica', icon: FileText },
  { id: 'interpreter', label: 'Interpretação', icon: Brain },
  { id: 'executor', label: 'Validação e Decisão', icon: Zap },
  { id: 'final', label: 'Quantitativos', icon: TableIcon },
];

const INITIAL_FOLHAS: Folha[] = [
  {
    id: 'f1',
    name: 'Folha 1 - Planta Baixa Setor A',
    type: 'setorial',
    status: 'blocked',
    currentStep: 2,
    action: 'pacote_llm_vision_gerado',
    jsonPath: 'scratch/reader-lab/2023-10-27_14-30/Folha_1/route_executor/route_execution.json',
    confidenceScore: 0.42,
    lastUpdated: 'Agora mesmo',
    bloquear_quantitativo: true,
    corrigido_por_llm: true,
    alerts: [
      'Área "16,55 m²" repetida 4 vezes em ambientes distintos',
      'Baixa confiabilidade estrutural no polígono H042'
    ],
    conflicts: [
      'Sobreposição detectada entre Corredor e Sala de Estar'
    ],
    extractedData: [
      { room: 'Sala Estar', area: 16.55 },
      { room: 'Corredor', area: 16.55, highlight: true },
      { room: 'Quarto 1', area: 12.40 }
    ],
    correctedData: [
      { room: 'Sala Estar', area: 28.8, highlight: true },
      { room: 'Corredor', area: 8.2, highlight: true },
      { room: 'Quarto 1', area: 12.40 }
    ],
    auditItems: [
      { 
        id: 'a1', 
        ambient: 'Sala Estar', 
        areaExtracted: 16.55, 
        areaValidated: 28.8, 
        origin: 'IA', 
        confidence: 0.82, 
        status: 'Corrigido', 
        region: 'H042', 
        observations: 'Correção de escala via IA',
        aiPrompt: 'Analise a Folha 1 e valide a área da Sala de Estar. O valor extraído foi 16.55m², mas o polígono sugere uma área maior.',
        aiRawResponse: '{\n  "ambient": "Sala Estar",\n  "detected_area": 28.8,\n  "confidence": 0.82,\n  "reasoning": "A escala do projeto indica que o ambiente possui dimensões de 4.8m x 6.0m, resultando em 28.8m². O valor 16.55 parece ser um erro de leitura de um texto adjacente."\n}'
      },
      { 
        id: 'a2', 
        ambient: 'Corredor', 
        areaExtracted: 16.55, 
        areaValidated: 8.2, 
        origin: 'IA', 
        confidence: 0.45, 
        status: 'Suspeito', 
        region: 'H043', 
        observations: 'Conflito de OCR detectado',
        aiPrompt: 'O valor 16.55m² foi lido para o Corredor. Verifique se isso está correto.',
        aiRawResponse: '{\n  "ambient": "Corredor",\n  "detected_area": 8.2,\n  "confidence": 0.45,\n  "status": "warning",\n  "message": "O valor 16.55m² é idêntico ao da Sala de Estar, sugerindo erro de buffer. A área geométrica aproximada é 8.2m²."\n}'
      },
      { id: 'a3', ambient: 'Quarto 1', areaExtracted: 12.40, areaValidated: 12.40, origin: 'OCR', confidence: 0.95, status: 'OK', region: 'H044' }
    ],
    history: [
      { id: 'h1', timestamp: '2023-10-27 15:10', user: 'evisworkspace@gmail.com', decision: 'none', details: 'Leitura inicial automática' }
    ],
    decisao_humana: 'none'
  },
  {
    id: 'f2',
    name: 'Folha 2 - Detalhamentos Hidráulicos',
    type: 'complementar',
    status: 'completed',
    currentStep: 2,
    action: 'enviar_para_especialistas',
    jsonPath: 'scratch/reader-lab/2023-10-27_14-30/Folha_2/route_executor/route_execution.json',
    confidenceScore: 0.98,
    lastUpdated: '12 min atrás',
    bloquear_quantitativo: false,
    corrigido_por_llm: false,
    history: [
      { id: 'h2-1', timestamp: '2023-10-27 15:45', user: 'evisworkspace@gmail.com', decision: 'none', details: 'Leitura concluída sem anomalias' }
    ],
    decisao_humana: 'none'
  },
  {
    id: 'f3',
    name: 'Folha 3 - Layout Mobiliário Executive',
    type: 'setorial',
    status: 'completed',
    currentStep: 3,
    action: 'liberar_quantitativo',
    jsonPath: 'scratch/reader-lab/2023-10-27_14-30/Folha_3/route_executor/route_execution.json',
    confidenceScore: 0.95,
    lastUpdated: '1 hora atrás',
    bloquear_quantitativo: false,
    corrigido_por_llm: false,
    history: [
      { id: 'h3-1', timestamp: '2023-10-27 14:30', user: 'evisworkspace@gmail.com', decision: 'none', details: 'Projeto carregado no buffer' }
    ],
    decisao_humana: 'none'
  }
];

export default function DashboardApp() {
  const [folhas, setFolhas] = useState<Folha[]>([]);
  const [selectedFolhaId, setSelectedFolhaId] = useState<string>('');
  const [visionMode, setVisionMode] = useState(false);
  const [onlyExceptions, setOnlyExceptions] = useState(false);
  const [manualInput, setManualInput] = useState<string>('');
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settingsMode, setSettingsMode] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState({
    provider: 'openrouter',
    model: 'gpt-4o',
    threshold: 0.7,
    autoProcess: true,
    language: 'pt-BR'
  });

  const loadProjectState = async () => {
    const manifest = await loadJSON('scratch/reader-lab/project_state.json');
    if (manifest && manifest.folhas) {
      setFolhas(manifest.folhas);
      setCurrentRunId(manifest.run_id || null);
      if (manifest.folhas.length > 0) {
        setSelectedFolhaId((current) => current || manifest.folhas[0].id);
      }
    } else {
      setFolhas(INITIAL_FOLHAS);
      setSelectedFolhaId(INITIAL_FOLHAS[0].id);
    }
  };

  const syncProjectState = async () => {
    await runCommand('python', ['domains/orcamentista/tools/evis_project_state.py']);
    await loadProjectState();
  };

  const handleNewProject = () => {
    setCurrentRunId(null);
    setFolhas([]);
    setSelectedFolhaId('');
    setVisionMode(false);
  };

  const handleImportPDF = async () => {
    const pdfPath = prompt("Insira o caminho do PDF ou da pasta com PDFs:");
    if (!pdfPath) return;

    setIsProcessing(true);
    try {
      await runCommand('python', [
        'domains/orcamentista/tools/reader_lab.py',
        pdfPath,
        '--out',
        'scratch/reader-lab',
        '--no-debug-images',
      ]);
      await syncProjectState();
      alert('PDF importado com sucesso. Reader Lab executado e dashboard sincronizado.');
    } catch (err) {
      console.error('Erro ao importar PDF:', err);
      alert('Falha ao importar PDF. Verifique o caminho informado e o log do servidor.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateQuantitativos = async () => {
    if (!selectedFolha?.validatedOutputPath) return;
    setIsProcessing(true);
    try {
      await runCommand('python', [
        'domains/orcamentista/tools/evis_quantitativos.py',
        '--input',
        selectedFolha.validatedOutputPath,
      ]);
      await syncProjectState();
      alert(`Quantitativos gerados com sucesso para ${selectedFolha.name}.`);
    } catch (err) {
      console.error('Falha ao gerar quantitativos:', err);
      alert('Erro ao gerar quantitativos. Verifique a conexão com o Antigravity.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunValidation = async () => {
    if (!selectedFolha?.readerDir || !selectedFolha?.executorInputPath) return;
    setIsProcessing(true);
    try {
      await runCommand('python', ['domains/orcamentista/tools/evis_pdf_interpreter.py', selectedFolha.readerDir]);
      await runCommand('python', [
        'domains/orcamentista/tools/evis_route_executor.py',
        selectedFolha.executorInputPath,
        '--provider',
        dashboardConfig.provider,
      ]);
      await syncProjectState();
      setVisionMode(true);
    } catch (err) {
      console.error('Falha ao executar validacao:', err);
      alert('Falha ao executar a validacao da folha. Confira o log do servidor Antigravity.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await runCommand('powershell', [
        '-NoProfile',
        '-Command',
        `Get-ChildItem -LiteralPath "${currentRunId ? `scratch/reader-lab/${currentRunId}` : 'scratch/reader-lab'}"`,
      ]);
      alert(`Diretorio listado: ${currentRunId || 'scratch/reader-lab'}.`);
    } catch (err) {
      console.error('Erro ao abrir diretório:', err);
    }
  };

  const toggleSettings = () => {
    setSettingsMode(!settingsMode);
    setVisionMode(false);
  };

  const handleOpenProjectFile = async () => {
    if (!selectedFolha?.jsonPath) return;
    alert(`Arquivo tecnico vinculado: ${selectedFolha.jsonPath}`);
  };

  useEffect(() => {
    loadProjectState();
  }, []);

  const filteredFolhas = onlyExceptions 
    ? folhas.filter(f => f.bloquear_quantitativo || f.confidenceScore < 0.7)
    : folhas;

  const selectedFolha = folhas.find(f => f.id === selectedFolhaId) || (folhas.length > 0 ? folhas[0] : null);

  const auditItems = selectedFolha?.auditItems || [];
  const hasSuspectItems = auditItems.some(item => item.status === 'Suspeito');
  const avgConfidence = auditItems.length > 0 
    ? auditItems.reduce((acc, item) => acc + item.confidence, 0) / auditItems.length 
    : 0;
  
  // Quantitativos só podem ser habilitados se: não houver itens com status "Suspeito" E confiança média > 0.7
  const isQuantEnabled = selectedFolha ? (selectedFolha.status === 'completed' && !hasSuspectItems && avgConfidence > 0.7) : false;

  const handleDecision = async (id: string, decision: HumDecision, newVal?: number) => {
    const updatedFolhas = folhas.map((folha) => {
      if (folha.id !== id) {
        return folha;
      }
      const newHistory: HistoryEntry = {
        id: `h-${Date.now()}`,
        timestamp: new Date().toLocaleString(),
        user: 'evisworkspace@gmail.com',
        decision,
        details: newVal ? `Valor manual definido: ${newVal} m²` : 'Validado via interface do projeto',
      };
      return {
        ...folha,
        decisao_humana: decision,
        manualVal: newVal,
        lastUpdated: `Validado via dashboard (${decision})`,
        history: [...(folha.history || []), newHistory],
      };
    });

    setFolhas(updatedFolhas);
    try {
      await window.antigravity.writeFile(
        'scratch/reader-lab/project_state.json',
        JSON.stringify(
          {
            run_id: currentRunId,
            run_dir: currentRunId ? `scratch/reader-lab/${currentRunId}` : 'scratch/reader-lab',
            updated_at: new Date().toISOString(),
            folhas: updatedFolhas,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      console.error('Falha ao persistir decisão humana:', err);
    }

    setVisionMode(false);
    setIsManualEdit(false);
  };

  const runFullPipeline = async (pdfPath: string) => {
    try {
      await runCommand('python', ['domains/orcamentista/tools/reader_lab.py', pdfPath, '--out', 'scratch/reader-lab']);
      await syncProjectState();
    } catch (err) {
      console.error('Full pipeline execution failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-bg-main text-text-main font-sans selection:bg-blue-500/30 overflow-hidden uppercase tracking-tight">
      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-2 border-b border-border-dim bg-bg-panel shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-sm">E</div>
          <h1 className="text-[11px] font-bold tracking-widest text-white">EVIS PDF — <span className="text-blue-400">Leitura Inteligente de Projetos</span></h1>
        </div>
        
        <div className="flex gap-8 text-[9px] font-mono whitespace-nowrap">
          <div className="flex gap-2 items-center text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> 
            LEITURA TÉCNICA ATIVA
          </div>
          <div className="text-white/20">|</div>
          <div className="text-white/40 uppercase tracking-tighter">DIRETÓRIO: {currentRunId || 'scratch\\reader-lab\\2023-10-27_14-30'}</div>
          <div className="text-white/20">|</div>
          <div className="flex gap-2 items-center text-green-500">
            <CheckCircle2 className="w-3 h-3" />
            CONEXÃO: ESTÁVEL
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSettings}
            className={`px-3 py-1 border rounded text-[10px] font-bold transition-all uppercase flex items-center gap-2 ${
              settingsMode ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Configurações
          </button>
          <button 
            onClick={handleNewProject}
            className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[10px] font-bold hover:bg-white/10 transition-colors uppercase flex items-center gap-2"
          >
             <Plus className="w-3.5 h-3.5" /> Novo Projeto
          </button>
          <button 
            onClick={handleImportPDF}
            className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] font-bold shadow-lg shadow-blue-500/20 uppercase flex items-center gap-2"
          >
            <Download className="w-3.5 h-3.5 rotate-180" /> Importar PDF
          </button>
        </div>
      </nav>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Queue Sidebar */}
        <aside className="w-64 border-r border-border-dim flex flex-col bg-bg-panel shrink-0">
          <div className="p-3 text-[9px] uppercase font-bold text-white/30 border-b border-white/5 tracking-[0.2em]">Fila de Processamento</div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isProcessing ? (
              <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
                 <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                 <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Processando Folhas...</span>
              </div>
            ) : filteredFolhas.length > 0 ? (
              filteredFolhas.map((folha) => (
                <FolhaCard 
                  key={folha.id} 
                  folha={folha} 
                  selected={selectedFolhaId === folha.id} 
                  onClick={() => setSelectedFolhaId(folha.id)}
                />
              ))
            ) : (
              <div className="p-8 flex flex-col items-center justify-center text-center opacity-40">
                <FileText className="w-12 h-12 mb-4 text-white/10" />
                <p className="text-[10px] font-bold uppercase tracking-widest leading-loose">
                  Nenhuma folha<br/>nas listas
                </p>
              </div>
            )}
          </div>

          <div className="p-4 bg-black/20 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-blue-500" />
              </div>
              <span className="text-[9px] font-mono text-white/60">33%</span>
            </div>
            <div className="text-[9px] font-mono text-white/30 tracking-tighter italic">Tempo Estimado: 4m 12s (Interpretação Ativa)</div>
          </div>
        </aside>

        {/* Center/Main Area */}
        <main className="flex-1 flex flex-col bg-bg-workspace relative overflow-hidden">
          <AnimatePresence mode="wait">
            {settingsMode && (
              <SettingsView 
                config={dashboardConfig} 
                setConfig={setDashboardConfig} 
                onClose={() => setSettingsMode(false)}
                onBrowse={handleOpenFolder}
              />
            )}
          </AnimatePresence>

          {folhas.length === 0 ? (
             <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-8 border border-blue-500/20">
                   <Building2 className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Nenhum projeto carregado</h2>
                <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] mb-12">
                   Inicie um novo ciclo de orçamento automatizado ou importe um projeto PDF
                </p>
                <div className="flex gap-4">
                   <button 
                     onClick={handleNewProject}
                     className="px-12 py-4 bg-white/5 border border-white/10 rounded-sm font-bold text-[11px] text-white hover:bg-white/10 transition-all uppercase tracking-[0.2em]"
                   >
                     Novo Projeto
                   </button>
                   <button 
                     onClick={handleImportPDF}
                     className="px-12 py-4 bg-blue-600 rounded-sm font-bold text-[11px] text-white hover:bg-blue-500 transition-all uppercase tracking-[0.2em] shadow-2xl shadow-blue-500/40"
                   >
                     Importar PDF
                   </button>
                </div>
             </div>
          ) : (
            <AnimatePresence mode="wait">
            {!selectedFolha ? (
              <div className="flex-1 flex items-center justify-center text-white/20 italic text-[10px]">
                 Carregando dados da folha...
              </div>
            ) : visionMode ? (
              <VisionValidationView 
                folha={selectedFolha} 
                onCancel={() => setVisionMode(false)}
                onConfirm={() => handleDecision(selectedFolha.id, 'aprovado')}
                onManualEntry={() => setIsManualEdit(true)}
                onManualConfirm={(val) => handleDecision(selectedFolha.id, 'manual', val)}
                onReject={() => handleDecision(selectedFolha.id, 'rejeitado')}
                onViewProject={handleOpenProjectFile}
                isManualEdit={isManualEdit}
                setIsManualEdit={setIsManualEdit}
                manualInput={manualInput}
                setManualInput={setManualInput}
              />
            ) : (
              <div className="flex flex-1 overflow-hidden">
                <motion.div 
                  key="main-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* View Header with Exception Filter */}
                <div className="p-4 border-b border-border-dim bg-bg-panel flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-6">
                    <div>
                      <h2 className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4 text-blue-500" />
                        Detalhes do Contexto da Folha
                      </h2>
                      <p className="text-[9px] text-white/40 font-mono mt-0.5 tracking-tight">Status da Etapa: evis_route_executor.py --step 0 --live</p>
                    </div>

                    <div className="h-8 border-l border-white/10" />

                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold ${onlyExceptions ? 'text-amber-500' : 'text-white/30'}`}>EXCEÇÕES</span>
                      <button 
                        onClick={() => setOnlyExceptions(!onlyExceptions)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${onlyExceptions ? 'bg-amber-600' : 'bg-white/10'}`}
                      >
                        <motion.div 
                          animate={{ x: onlyExceptions ? 22 : 2 }}
                          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="px-2 py-1 bg-white/5 border border-white/10 rounded flex flex-col items-center">
                      <span className="text-[7px] text-white/40 uppercase font-bold">Confiança</span>
                      <span className={`text-[11px] font-mono font-bold ${selectedFolha.confidenceScore < 0.7 ? 'text-amber-500' : 'text-green-500'}`}>
                        {(selectedFolha.confidenceScore * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="px-2 py-1 bg-white/5 border border-white/10 rounded flex flex-col items-center">
                      <span className="text-[11px] font-mono text-blue-400 font-bold">
                        {selectedFolha.status === 'blocked' ? 'BLOQUEADO' : 
                         selectedFolha.status === 'completed' ? 'CONCLUÍDO' : 
                         selectedFolha.status === 'running' ? 'EM PROCESSAMENTO' : 'PENDENTE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  
                  {/* Tabela de Auditoria Técnica */}
                  {selectedFolha.auditItems && (
                    <AuditTable items={selectedFolha.auditItems} />
                  )}

                  {/* Status Banner & Action Block */}
                  <div className={`p-5 rounded border-2 flex items-center justify-between shadow-xl ${
                    !isQuantEnabled 
                      ? 'bg-amber-500/5 border-amber-500/20' 
                      : 'bg-emerald-500/5 border-emerald-500/20'
                  }`}>
                    <div className="flex gap-4">
                      <div className={`p-2.5 rounded ${
                        !isQuantEnabled ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
                      }`}>
                        {!isQuantEnabled ? <AlertTriangle className="w-5 h-5 shadow-[0_0_10px_rgba(245,158,11,0.3)]" /> : <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-sm text-white tracking-tight">{selectedFolha.name}</h3>
                          {selectedFolha.corrigido_por_llm && (
                            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold border border-blue-500/30">
                              <Brain className="w-2.5 h-2.5" /> 🤖 CORRIGIDO POR IA
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                           <p className={`text-[10px] font-bold uppercase tracking-widest ${!isQuantEnabled ? 'text-amber-500' : 'text-emerald-500'}`}>
                             {!isQuantEnabled 
                               ? 'Os quantitativos estão bloqueados devido a inconsistências detectadas ou confiança insuficiente.' 
                               : '✔️ Quantitativos liberados para exportação após auditoria'}
                           </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {!isQuantEnabled ? (
                        <button 
                          onClick={handleRunValidation}
                          className="bg-blue-600 text-white px-6 py-3 rounded-sm font-bold text-[10px] hover:bg-blue-500 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20 flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" /> Executar Validação
                        </button>
                      ) : (
                        <button 
                          onClick={handleGenerateQuantitativos}
                          className="bg-emerald-600 text-white px-6 py-3 rounded-sm font-bold text-[10px] hover:bg-emerald-500 transition-all uppercase tracking-widest shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                        >
                          <TableIcon className="w-4 h-4" /> Gerar Quantitativos
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reasons for Blockage (Only if blocked) */}
                  {selectedFolha.bloquear_quantitativo && (
                    <div className="bg-bg-panel border border-amber-500/10 rounded p-6">
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Motivos do Bloqueio:
                      </h4>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em]">Alertas Detectados</span>
                          <ul className="space-y-2">
                            {selectedFolha.alerts?.map((alert, i) => (
                              <li key={i} className="text-[11px] text-white/70 flex items-start gap-3 bg-white/5 p-2 rounded">
                                <span className="w-1 h-1 rounded-full bg-amber-500 mt-1.5" />
                                {alert}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-3">
                           <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.15em]">Conflitos Críticos</span>
                           <ul className="space-y-2">
                            {selectedFolha.conflicts?.map((conflict, i) => (
                              <li key={i} className="text-[11px] text-rose-400 flex items-start gap-3 bg-rose-500/5 p-2 rounded border border-rose-500/10">
                                <span className="w-1 h-1 rounded-full bg-rose-500 mt-1.5" />
                                {conflict}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Comparison Panel: Antes vs Depois */}
                  {(selectedFolha.corrigido_por_llm || selectedFolha.decisao_humana === 'manual') && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-bg-panel border border-white/5 rounded p-5">
                         <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Extraído do Reader (Antigo)</span>
                           <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono">SOURCE: RAW_OCR</span>
                         </div>
                         <div className="space-y-1">
                            {selectedFolha.extractedData?.map((item, i) => (
                              <div key={i} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                                <span className="text-[11px] text-white/50">{item.room}</span>
                                <span className="text-[11px] font-mono text-white/80">{item.area.toFixed(2)} m²</span>
                              </div>
                            ))}
                         </div>
                      </div>

                      <div className="bg-blue-500/5 border border-blue-500/20 rounded p-5 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-4 opacity-5">
                           <Brain className="w-16 h-16 text-blue-500" />
                         </div>
                         <div className="flex items-center justify-between mb-4 relative z-10">
                           <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                             Corrigido por IA / Humano (Novo)
                           </span>
                           <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-mono">STATUS: VALIDATED</span>
                         </div>
                         <div className="space-y-1 relative z-10">
                            {selectedFolha.correctedData?.map((item, i) => {
                              const original = selectedFolha.extractedData?.find(e => e.room === item.room);
                              const changed = original && original.area !== item.area;
                              return (
                                <div key={i} className="flex justify-between py-2 border-b border-white/5 last:border-0">
                                  <span className="text-[11px] text-white/50">{item.room}</span>
                                  <div className="flex items-center gap-2">
                                    {changed && <ArrowRight className="w-3 h-3 text-blue-400" />}
                                    <span className={`text-[11px] font-mono font-bold ${changed ? 'text-blue-400 bg-blue-500/10 px-1 rounded' : 'text-white/80'}`}>
                                      {item.area.toFixed(2)} m²
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                         </div>
                      </div>
                    </div>
                  )}

                  {/* Step Indicators */}
                  <div className="grid grid-cols-4 gap-3">
                    {DASHBOARD_STEPS.map((step, idx) => {
                      const isCurrent = selectedFolha.currentStep === idx;
                      const isCompleted = selectedFolha.currentStep > idx;
                      return (
                        <div key={step.id} className={`p-4 rounded border flex flex-col items-center gap-2 transition-all ${
                          isCurrent ? 'bg-blue-500/10 border-blue-500/40' : 
                          isCompleted ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' : 
                          'bg-white/5 border-white/5 opacity-20'
                        }`}>
                          <step.icon className={`w-4 h-4 ${isCurrent ? 'text-blue-400' : isCompleted ? 'text-emerald-400' : 'text-white/40'}`} />
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${isCurrent ? 'text-blue-400' : 'text-white/40'}`}>{step.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary Status Matrix */}
                  <div className="grid grid-cols-4 gap-4">
                    <StatusBlock label="Status Final" value={
                      selectedFolha.decisao_humana === 'aprovado' ? 'CORRIGIDO POR IA' :
                      selectedFolha.decisao_humana === 'manual' ? 'VALIDADO MANUALMENTE' :
                      selectedFolha.decisao_humana === 'rejeitado' ? 'REJEITADO' :
                      selectedFolha.confidenceScore > 0.9 ? 'APROVADO AUTOMÁTICO' : 'BLOQUEADO'
                    } color={
                      selectedFolha.decisao_humana === 'aprovado' ? 'text-blue-400' :
                      selectedFolha.decisao_humana === 'manual' ? 'text-purple-400' :
                      selectedFolha.decisao_humana === 'rejeitado' ? 'text-rose-400' :
                      selectedFolha.confidenceScore > 0.9 ? 'text-emerald-400' : 'text-amber-500'
                    } />
                    <StatusBlock label="Score Híbrido" value={selectedFolha.confidenceScore.toFixed(3)} />
                    <StatusBlock label="Corrigido por IA" value={selectedFolha.corrigido_por_llm ? 'SIM' : 'NÃO'} color={selectedFolha.corrigido_por_llm ? 'text-blue-400' : 'text-white/20'} />
                    <StatusBlock label="Fonte da Decisão" value={selectedFolha.decisao_humana !== 'none' ? 'HUMANA' : 'SISTEMA'} />
                  </div>
                </div>
              </motion.div>
              <HistorySidebar history={selectedFolha?.history || []} />
            </div>
          )}
          </AnimatePresence>
          )}
        </main>
      </div>

        {/* Footer / Console Bottom Bar */}
        <footer className="h-8 bg-black border-t border-white/10 flex items-center px-4 gap-6 shrink-0 font-mono">
          <div className="text-[9px] font-bold text-blue-500">[LOG DE EXECUÇÃO]</div>
          <div className="text-[9px] text-white/40 truncate flex-1 tracking-tighter italic font-mono">
            python domains\\orcamentista\\tools\\evis_route_executor.py &lt;Folha_X&gt;\\evis_interpreter_output.json --provider=openrouter --llm-call-limit=2
          </div>
          <div className="flex items-center gap-6 text-[9px] font-mono font-bold">
            <div className="flex gap-2">
              <span className="text-white/20 uppercase text-[8px]">Memória</span>
              <span className="text-white/60">2.4GB</span>
            </div>
            <div className="flex gap-2">
              <span className="text-white/20 uppercase text-[8px]">Conexão</span>
              <span className="text-blue-500">CONECTADO</span>
            </div>
            <div className="text-white/40">{new Date().toLocaleTimeString()}</div>
          </div>
        </footer>
    </div>

  );
}

function StatusBlock({ label, value, color = 'text-white' }: { label: string, value: string, color?: string }) {
  return (
    <div className="bg-bg-panel border border-white/5 p-4 rounded flex flex-col gap-1">
      <span className="text-[8px] text-white/30 uppercase font-bold tracking-widest">{label}</span>
      <span className={`text-[11px] font-mono font-bold truncate ${color}`}>{value}</span>
    </div>
  );
}

function AuditTable({ items }: { items: AuditItem[] }) {
  const [filterOnlyInconsistencies, setFilterOnlyInconsistencies] = React.useState(false);
  const [sortField, setSortField] = React.useState<'confidence' | 'ambient'>('confidence');
  const [inspectingItem, setInspectingItem] = React.useState<AuditItem | null>(null);

  const filteredItems = filterOnlyInconsistencies 
    ? items.filter(item => item.status !== 'OK')
    : items;

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortField === 'confidence') return a.confidence - b.confidence;
    return a.ambient.localeCompare(b.ambient);
  });

  return (
    <div className="bg-bg-panel border border-white/5 rounded overflow-hidden">
      <AnimatePresence>
        {inspectingItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm p-12 flex items-center justify-center"
            onClick={() => setInspectingItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-3xl bg-bg-panel border border-white/10 rounded shadow-2xl flex flex-col max-h-[80vh]"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-blue-500/5">
                <div className="flex items-center gap-3">
                  <Brain className="w-4 h-4 text-blue-500" />
                  <h3 className="text-[10px] font-bold text-white uppercase tracking-widest">Detalhes da Interpretação IA — {inspectingItem.ambient}</h3>
                </div>
                <button onClick={() => setInspectingItem(null)} className="text-white/20 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                <div>
                  <h4 className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-3">Prompt de Auditoria</h4>
                  <div className="bg-black/40 p-4 rounded border border-white/5 font-mono text-[11px] text-white/60 leading-relaxed italic whitespace-pre-wrap">
                    {inspectingItem.aiPrompt || "Nenhum prompt disponível para este registro."}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Resposta Bruta (JSON)</h4>
                  <div className="bg-black/60 p-4 rounded border border-white/5 font-mono text-[11px] text-green-400/80 leading-relaxed overflow-x-auto whitespace-pre">
                    {inspectingItem.aiRawResponse || "{ \"status\": \"error\", \"message\": \"Resposta não encontrada no histórico\" }"}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end">
                <button 
                  onClick={() => setInspectingItem(null)}
                  className="px-6 py-2 bg-blue-600 text-white text-[10px] font-bold rounded uppercase tracking-widest hover:bg-blue-500 transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
        <div className="flex items-center gap-3">
          <TableIcon className="w-4 h-4 text-blue-400" />
          <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Tabela de Dados Extraídos — Etapa 0</h3>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setFilterOnlyInconsistencies(!filterOnlyInconsistencies)}
             className={`text-[9px] font-bold px-2 py-1 rounded border transition-all ${filterOnlyInconsistencies ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-white/5 border-white/10 text-white/40'}`}
           >
             FILTRAR INCONSISTÊNCIAS
           </button>
           <select 
             value={sortField}
             onChange={(e) => setSortField(e.target.value as any)}
             className="bg-black/40 border border-white/10 rounded px-2 py-1 text-[9px] font-bold text-white/60 uppercase"
           >
             <option value="confidence">ORDENAR POR CONFIANÇA</option>
             <option value="ambient">ORDENAR POR AMBIENTE</option>
           </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-black/40 text-[8px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5">
              <th className="p-3">Ambiente</th>
              <th className="p-3">Área Extraída (m²)</th>
              <th className="p-3">Área Validada (m²)</th>
              <th className="p-3">Origem</th>
              <th className="p-3">Confiança</th>
              <th className="p-3">Status</th>
              <th className="p-3">Região</th>
              <th className="p-3">Observações</th>
            </tr>
          </thead>
          <tbody className="text-[10px] font-mono">
            {sortedItems.map((item) => (
              <tr key={item.id} className={`border-b border-white/5 transition-colors ${
                item.status === 'Suspeito' ? 'bg-rose-500/5 hover:bg-rose-500/10' :
                item.status === 'Corrigido' ? 'bg-amber-500/5 hover:bg-amber-500/10' :
                'hover:bg-white/5'
              }`}>
                <td className="p-3 font-bold text-white uppercase">{item.ambient}</td>
                <td className="p-3 text-white/60">{item.areaExtracted.toFixed(2)}</td>
                <td className="p-3">
                  <span className={item.areaValidated !== item.areaExtracted ? 'text-blue-400 font-bold' : 'text-white/60'}>
                    {item.areaValidated.toFixed(2)}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-1 rounded text-[8px] font-bold ${item.origin === 'IA' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/40'}`}>
                    {item.origin}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: `${item.confidence * 100}%` }} />
                    </div>
                    <span className={item.confidence < 0.7 ? 'text-amber-500' : 'text-green-500 font-bold'}>
                      {(item.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold tracking-tighter ${
                      item.status === 'Suspeito' ? 'text-rose-500' :
                      item.status === 'Corrigido' ? 'text-amber-500' :
                      'text-green-500'
                    }`}>
                      {item.status}
                    </span>
                    {(item.status === 'Suspeito' || item.status === 'Corrigido') && (
                      <button 
                        onClick={() => setInspectingItem(item)}
                        className="p-1 hover:bg-white/10 rounded transition-colors text-blue-400"
                        title="Ver detalhes da IA"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
                <td className="p-3 text-white/30 text-[8px]">{item.region}</td>
                <td className="p-3 text-white/40 italic text-[9px] truncate max-w-[150px]">{item.observations || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HistoryList({ history }: { history: HistoryEntry[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
      {history.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-white/10 italic text-[10px]">
          Nenhuma decisão registrada
        </div>
      ) : (
        [...history].reverse().map((entry) => (
          <div key={entry.id} className="relative pl-6 border-l border-white/5 pb-4 last:pb-0">
            <div className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-bg-panel ${
              entry.decision === 'aprovado' ? 'bg-green-500' :
              entry.decision === 'manual' ? 'bg-purple-500' :
              entry.decision === 'rejeitado' ? 'bg-rose-500' :
              'bg-white/20'
            }`} />
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest ${
                 entry.decision === 'aprovado' ? 'bg-green-500/20 text-green-500' :
                 entry.decision === 'manual' ? 'bg-purple-500/20 text-purple-500' :
                 entry.decision === 'rejeitado' ? 'bg-rose-500/20 text-rose-500' :
                 'bg-white/10 text-white/40'
              }`}>
                {entry.decision === 'none' ? 'Início' : entry.decision}
              </span>
              <span className="text-[8px] font-mono text-white/20">{entry.timestamp}</span>
            </div>
            <p className="text-[10px] text-white/80 font-bold mb-0.5">{entry.user}</p>
            <p className="text-[10px] text-white/40 italic leading-snug">{entry.details}</p>
          </div>
        ))
      )}
    </div>
  );
}

function HistorySidebar({ history }: { history: HistoryEntry[] }) {
  return (
    <aside className="w-80 border-l border-border-dim bg-bg-panel flex flex-col shrink-0">
      <div className="p-3 text-[9px] uppercase font-bold text-white/30 border-b border-white/5 tracking-[0.2em] flex items-center gap-2">
        <History className="w-3.5 h-3.5 text-blue-500" />
        Histórico de Decisões
      </div>
      <HistoryList history={history} />
      <div className="p-4 bg-white/5 border-t border-white/5">
        <p className="text-[9px] text-white/20 font-mono tracking-tighter">ID Auditoria: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
      </div>
    </aside>
  );
}

// Subcomponents

function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded cursor-pointer transition-all ${
      active ? 'bg-blue-500/10 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white/60'
    }`}>
      <Icon className="w-4 h-4" />
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
      {active && <motion.div layoutId="nav-pill" className="ml-auto w-1 h-3 bg-blue-500" />}
    </div>
  );
}

function FolhaCard({ folha, selected, onClick }: { folha: Folha, selected: boolean, onClick: () => void }) {
  const statusConfig = {
    pending: { color: 'text-white/20', bg: 'bg-white/5', label: 'PENDENTE' },
    running: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: '🟡 EM VALIDAÇÃO' },
    completed: { color: 'text-green-500', bg: 'bg-green-500/10', label: '✔️ CONCLUÍDO' },
    error: { color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'FALHA' },
    blocked: { color: 'text-rose-500', bg: 'bg-rose-500/10', label: '🔴 BLOQUEADO' }
  };

  const config = statusConfig[folha.status];

  return (
    <div 
      onClick={onClick}
      className={`p-3 border-b border-white/5 transition-all cursor-pointer group relative ${
        selected ? 'bg-blue-500/5 border-l-2 border-l-blue-500' : 'hover:bg-white/5'
      }`}
    >
      <div className="flex justify-between items-start mb-1">
        <h4 className={`font-bold text-[11px] truncate uppercase tracking-tight ${selected ? 'text-white' : 'text-white/60'}`}>
          {folha.name.split(' - ')[0]}
        </h4>
        <span className={`text-[8px] px-1.5 py-0.5 rounded border font-mono font-bold whitespace-nowrap ${config.bg} ${config.color} border-current/20`}>
          {config.label}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[9px] text-white/30 font-mono truncate lowercase">
          {folha.action?.replace('pacote_llm_vision_gerado', 'validacao_visual').replace('liberar_quantitativo', 'liberado')}.json
        </p>
        <span className="text-[8px] font-mono text-white/10 uppercase">{folha.type === 'setorial' ? 'SET' : 'COM'}</span>
      </div>
    </div>
  );
}

function TagIcon({ type }: { type: string }) {
  return type === 'setorial' ? <LayoutDashboard className="w-2.5 h-2.5" /> : <Brain className="w-2.5 h-2.5" />;
}

function KPIRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono font-bold text-slate-200">{value}</span>
    </div>
  );
}

const MOCK_CHART_DATA = [
  { name: 'S Sala 1', base: 45, corrigido: 45.2 },
  { name: 'Corredor', base: 12, corrigido: 16.55 },
  { name: 'Cozinha', base: 32, corrigido: 32.1 },
  { name: 'Banheiro', base: 8, corrigido: 8.0 },
  { name: 'Sacada', base: 15, corrigido: 15.2 },
];

function VisionValidationView({ 
  folha, 
  onCancel, 
  onConfirm, 
  onManualEntry, 
  onManualConfirm,
  onReject,
  onViewProject,
  isManualEdit,
  setIsManualEdit,
  manualInput,
  setManualInput
}: { 
  folha: Folha, 
  onCancel: () => void, 
  onConfirm: () => void,
  onManualEntry: () => void,
  onManualConfirm: (val: number) => void,
  onReject: () => void,
  onViewProject: () => void,
  isManualEdit: boolean,
  setIsManualEdit: (v: boolean) => void,
  manualInput: string,
  setManualInput: (v: string) => void
}) {
  return (
    <motion.div 
      key="vision-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full bg-bg-workspace overflow-hidden"
    >
      {/* Detail Header */}
      <div className="p-4 border-b border-white/10 bg-bg-panel flex justify-between items-center bg-amber-500/5 shrink-0">
        <div>
          <h2 className="text-[11px] font-bold text-white uppercase tracking-tight flex items-center gap-2">
            <Brain className="w-4 h-4 text-amber-500" />
            Central de Decisão — <span className="text-amber-500 font-bold">Validação Visual Assistida</span>
          </h2>
          <p className="text-[9px] text-white/40 font-mono mt-0.5 lowercase tracking-tight italic">Ambiguidade detectada no conjunto de dados. Requer intervenção técnica.</p>
        </div>
        <div className="flex gap-2">
          <div className="px-2 py-1 bg-white/5 border border-white/10 rounded flex flex-col items-center">
            <span className="text-[7px] text-white/40 uppercase font-bold">Conf. Local</span>
            <span className="text-[11px] font-mono text-yellow-500 font-bold">0.32</span>
          </div>
          <button onClick={onCancel} className="bg-white/5 p-1.5 rounded-sm hover:bg-white/10 transition-colors ml-2">
            <Maximize2 className="w-4 h-4 text-white/40" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 bg-white/5 gap-px">
        {/* Main Content Area */}
        <div className="flex-[2] bg-bg-main p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
           {/* Visual Evidence Section */}
           <div className="flex-1 min-h-[400px] border border-white/10 rounded overflow-hidden relative bg-black/40 group">
              <div className="absolute top-4 left-4 z-20 flex gap-2">
                <span className="bg-blue-600 px-2 py-1 text-[9px] font-bold rounded text-white shadow-lg uppercase">SOURCE_IMAGE_001.png</span>
                <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-1 text-[9px] font-bold rounded uppercase">Zona de Conflito Alvo</span>
              </div>
              
              <div className="absolute inset-0 grayscale opacity-20 bg-[url('https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=2070')] bg-cover bg-center" />
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <motion.div 
                   animate={{ scale: [1, 1.05, 1] }} 
                   transition={{ repeat: Infinity, duration: 3 }}
                   className="w-48 h-24 border-2 border-dashed border-amber-500 bg-amber-500/10 flex flex-col items-center justify-center shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]"
                 >
                    <span className="text-4xl font-mono font-bold text-white tracking-widest drop-shadow-md">16,55?</span>
                    <span className="text-[8px] font-bold text-amber-500 bg-black/60 px-1 mt-2 uppercase tracking-widest">Conflito de OCR (H042)</span>
                 </motion.div>
              </div>

              <div className="absolute bottom-4 right-4 flex gap-2">
                <button 
                  onClick={onViewProject}
                  className="p-2 bg-black/60 border border-white/10 rounded text-white hover:bg-black/80 font-bold text-[10px]"
                >
                  VER PROJETO
                </button>
              </div>
           </div>

           {/* AI Proposed Correction Table */}
           <div className="bg-bg-panel border border-blue-500/20 rounded p-6 shadow-xl relative overflow-hidden">
             <div className="absolute -top-12 -right-12 opacity-5">
                <Brain className="w-48 h-48 text-blue-500" />
             </div>
             <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
               <Brain className="w-4 h-4" /> Resumo da Proposta de Visão IA
             </h4>
             
             <div className="grid grid-cols-3 gap-8 relative z-10">
                <div className="space-y-4">
                  <div>
                    <p className="text-[8px] text-white/30 uppercase font-bold mb-1">Localização</p>
                    <p className="text-[12px] font-bold text-white">Corredor Principal (Z-02)</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-white/30 uppercase font-bold mb-1">Valor Original</p>
                    <p className="text-[12px] font-mono text-rose-400 line-through">16,55 m²</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[8px] text-white/30 uppercase font-bold mb-1">Valor Corrigido</p>
                    <p className="text-[16px] font-mono font-bold text-blue-400">28.80 m² <CheckCircle2 className="inline w-4 h-4 ml-1" /></p>
                  </div>
                   <div>
                    <p className="text-[8px] text-white/30 uppercase font-bold mb-1">Confiança AI</p>
                    <p className="text-[12px] font-mono text-white/60 font-bold">82.4% (Calculado)</p>
                  </div>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded flex flex-col justify-center text-center">
                   <p className="text-[9px] font-bold text-blue-400 uppercase mb-2">Impacto em Totais</p>
                   <p className="text-[14px] font-mono font-bold text-white">+12.25 m²</p>
                   <p className="text-[8px] text-white/20 uppercase mt-1">Correção de Escala</p>
                </div>
             </div>
           </div>
        </div>

        {/* Action / Context Panel */}
        <aside className="flex-1 bg-bg-panel border-l border-white/10 flex flex-col overflow-hidden">
          {isManualEdit ? (
             <div className="flex-1 p-6 flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  Correção Manual
                </h3>
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Nova Área do Ambiente (m²):</label>
                    <input 
                      type="number"
                      autoFocus
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded p-4 text-2xl font-mono text-white focus:outline-none focus:border-blue-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="p-4 bg-white/5 rounded border border-white/5 text-[11px] text-white/40 leading-relaxed italic">
                    Ao realizar a correção manual, o status da folha será alterado para "VALIDADO MANUALMENTE" e o bloqueio de quantitativos será removido.
                  </div>
                </div>
                <div className="mt-auto flex flex-col gap-3">
                  <button 
                    onClick={() => onManualConfirm(parseFloat(manualInput))}
                    className="w-full bg-blue-600 text-white rounded p-4 text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-all font-display"
                  >
                    Confirmar Valor Manual
                  </button>
                  <button 
                    onClick={() => setIsManualEdit(false)}
                    className="w-full text-white/30 text-[10px] font-bold uppercase tracking-widest hover:text-white/60 transition-colors"
                  >
                    Voltar para Análise AI
                  </button>
                </div>
             </div>
          ) : (
            <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
              <div className="flex-1">
                <div className="text-[10px] font-bold text-blue-400 uppercase mb-4 flex items-center gap-2 tracking-[0.2em]">
                  <div className="w-1 h-3 bg-blue-400"></div>
                  Prompt Visualizado pela AI
                </div>
                <div className="bg-black/40 p-5 rounded font-mono text-[11px] text-white/60 border border-white/10 leading-relaxed custom-scrollbar text-justify px-4">
                   <pre className="whitespace-pre-wrap">{MOCK_PROMPT_MD}</pre>
                </div>
              </div>
              <div className="mt-4 p-5 bg-amber-500/10 border border-amber-500/20 rounded">
                 <h5 className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-3">Justificativa do Sistema</h5>
                 <p className="text-[11px] text-white/60 leading-relaxed">
                   O valor extraído originalmente na Planta Baixa (16,55) ocorre múltiplas vezes na tabela de esquadrias e áreas, sugerindo um erro de buffer no Leitor. O GPT Vision confirmou visualmente que a dimensão do polígono é inconsistente com o valor de texto lido.
                 </p>
              </div>
            </div>
          )}

          <div className="border-t border-white/5 flex flex-col min-h-0">
             <div className="p-4 border-b border-white/5 flex items-center gap-2">
               <History className="w-3 h-3 text-blue-500" />
               <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Histórico de Decisões</span>
             </div>
             <HistoryList history={folha.history || []} />
          </div>
        </aside>
      </div>

      {/* Action Bar Bottom */}
      <div className="p-6 border-t border-white/10 bg-bg-main flex items-center justify-between shadow-[0_-10px_20px_rgba(0,0,0,0.4)] shrink-0">
        <div className="flex gap-4">
           {!isManualEdit && (
            <>
              <button 
                onClick={onConfirm}
                className="bg-green-600 text-white px-8 py-3.5 rounded-sm font-bold text-[11px] hover:bg-green-500 transition-all uppercase tracking-widest shadow-lg shadow-green-500/20 relative group"
              >
                ✔️ Aprovar Correção da IA
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <button 
                onClick={onManualEntry}
                className="px-6 py-3.5 border border-white/10 text-white/70 rounded-sm font-bold text-[11px] hover:bg-white/5 transition-all uppercase tracking-widest flex items-center gap-2"
              >
                ✏️ Corrigir Manualmente
              </button>
              <button 
                onClick={onReject}
                className="px-6 py-3.5 border border-rose-500/20 text-rose-500/60 rounded-sm font-bold text-[11px] hover:bg-rose-500/5 transition-all uppercase tracking-widest"
              >
                ❌ Rejeitar e Manter Bloqueado
              </button>
            </>
           )}
        </div>
        
        <div className="text-right flex flex-col items-end">
           <p className="text-[9px] font-mono text-white/30 uppercase flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> Decisão registrada no log técnico
           </p>
           <button onClick={onCancel} className="text-[10px] font-bold text-white/20 mt-1 hover:text-white/40 uppercase tracking-widest">ESC para fechar</button>
        </div>
      </div>
    </motion.div>
  );
}

const MOCK_PROMPT_MD = `
# Instrução de Validação Visual
O sistema detectou um valor inconsistente na Folha 1.

## Contexto Técnico
- **Ambiente:** Corredor de acesso
- **Valor Detectado:** "16,55"
- **Erro:** Caractere não numérico ou delimitador regional inválido.

## Tarefa
Valide se o polígono destacado corresponde ao ambiente informado. Se o número for legível como 16.55, autorize a normalização.

**Critérios:**
1. Perímetro fechado
2. Coerência de escala
3. Sem sobreposição
`;

function SettingsView({ config, setConfig, onClose, onBrowse }: { 
  config: any, 
  setConfig: (c: any) => void, 
  onClose: () => void,
  onBrowse: () => void
}) {
  return (
    <motion.div 
      key="settings-view"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="absolute inset-0 z-[100] bg-bg-workspace/95 backdrop-blur-md p-8 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-2xl bg-bg-panel border border-white/10 rounded shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-blue-500" />
            <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Configurações Globais do Sistema</h3>
          </div>
          <button onClick={onClose} className="text-white/20 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          {/* AI Provider Section */}
          <section className="space-y-4">
            <h4 className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Globe className="w-3 h-3" /> Provedor de Inteligência Artificial
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setConfig({...config, provider: 'openrouter'})}
                className={`p-4 rounded border transition-all text-left ${config.provider === 'openrouter' ? 'bg-blue-500/10 border-blue-500' : 'bg-white/5 border-white/5 opacity-40'}`}
              >
                <div className="text-[11px] font-bold text-white mb-1">OpenRouter (Agnóstico)</div>
                <div className="text-[9px] text-white/40 leading-snug uppercase tracking-tighter">Acesso a GPT-4, Claude 3, etc.</div>
              </button>
              <button 
                onClick={() => setConfig({...config, provider: 'google'})}
                className={`p-4 rounded border transition-all text-left ${config.provider === 'google' ? 'bg-blue-500/10 border-blue-500' : 'bg-white/5 border-white/5 opacity-40'}`}
              >
                <div className="text-[11px] font-bold text-white mb-1">Google Gemini 1.5</div>
                <div className="text-[9px] text-white/40 leading-snug uppercase tracking-tighter">Nativo Google AI Studio</div>
              </button>
            </div>
          </section>

          {/* Execution Settings */}
          <div className="grid grid-cols-2 gap-8">
            <section className="space-y-4">
              <h4 className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-3 h-3" /> Parâmetros de Execução
              </h4>
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] text-white/40 uppercase font-bold">Limite de Confiança (Threshold)</label>
                  <input 
                    type="range" min="0.1" max="0.95" step="0.05"
                    value={config.threshold}
                    onChange={(e) => setConfig({...config, threshold: parseFloat(e.target.value)})}
                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-[9px] font-mono text-white/60">
                    <span>0.10</span>
                    <span className="text-blue-400 font-bold">{config.threshold.toFixed(2)}</span>
                    <span>0.95</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/5">
                  <span className="text-[10px] font-bold text-white/60 uppercase">Processamento Automático</span>
                  <button 
                    onClick={() => setConfig({...config, autoProcess: !config.autoProcess})}
                    className={`w-8 h-4 rounded-full relative transition-colors ${config.autoProcess ? 'bg-blue-600' : 'bg-white/10'}`}
                  >
                    <motion.div animate={{ x: config.autoProcess ? 18 : 2 }} className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[9px] font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                <Layers className="w-3 h-3" /> Gerenciamento de Arquivos
              </h4>
              <div className="space-y-2">
                <button 
                  onClick={onBrowse}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded text-[10px] font-bold text-white/60 hover:bg-white/10 transition-all uppercase flex items-center justify-between"
                >
                  <span>Explorar Diretório PDF</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <div className="p-3 bg-black/20 rounded text-[8px] text-white/20 font-mono italic leading-snug">
                  Caminho: scratch/reader-lab/&lt;run_id&gt;/
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/5 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded border border-white/10 text-[10px] font-bold text-white/40 hover:bg-white/5 transition-all uppercase"
          >
            Cancelar
          </button>
          <button 
            onClick={() => {
              alert('Configurações salvas com sucesso no project_state.json');
              onClose();
            }}
            className="px-6 py-2 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-500 transition-all uppercase flex items-center gap-2"
          >
            <Save className="w-3.5 h-3.5" /> Salvar Alterações
          </button>
        </div>
      </div>
    </motion.div>
  );
}
