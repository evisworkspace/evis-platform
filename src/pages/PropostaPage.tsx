import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, FileText, Upload, Download, 
  ChevronRight, Calendar, Target, TrendingUp, 
  ShieldCheck, Info, CheckCircle2, ChevronDown,
  Printer, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';

// --- Tipos para a Proposta ---
interface PropostaData {
  obra: {
    nome: string;
    cliente: string;
    endereco: string;
    tipo_obra: string;
    area_total_m2: number;
    valor_custos_diretos: number;
    valor_total_com_bdi: number;
    bdi_percentual: number;
    bdi_valor: number;
    prazo_dias_uteis: number;
    data_inicio_prevista: string;
    data_fim_prevista: string;
    observacoes?: string;
  };
  servicos: any[];
  equipes: any[];
  _meta?: {
    status_orcamento: string;
    itens_excluidos_escopo?: string[];
    pendencias?: string[];
  };
  bdi_detalhamento?: {
    total_valor: number;
    observacao?: string;
  };
}

// --- Helpers de Formatação ---
const formatCurrency = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'A definir';
  const d = new Date(dateStr + 'T12:00:00');
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
};

// --- Componentes de UI Premium ---

const GlassCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm rounded-3xl overflow-hidden ${className}`}
    style={{ boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}
  >
    {children}
  </motion.div>
);

const SectionTitle = ({ title, subtitle }: { title: string, subtitle: string }) => (
  <div className="mb-8">
    <h2 className="text-3xl font-serif text-[#112231] mb-2 tracking-tight">{title}</h2>
    <p className="text-slate-500 text-sm max-w-2xl">{subtitle}</p>
    <div className="w-12 h-1 bg-[#b79969] mt-4 rounded-full" />
  </div>
);

export default function PropostaPage() {
  const [data, setData] = useState<PropostaData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Injetar fontes premium
  React.useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // --- Lógica de Processamento ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setData(json);
      } catch (err) {
        alert('Erro ao processar o JSON. Verifique o formato do arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setData(json);
      } catch (err) {
        alert('Erro ao processar o JSON.');
      }
    };
    reader.readAsText(file);
  };

  // --- Derivações para Gráficos ---
  const getCategoryData = () => {
    if (!data) return [];
    const map = new Map();
    data.servicos.forEach(s => {
      const cat = s.categoria || 'Outros';
      map.set(cat, (map.get(cat) || 0) + (s.valor_total_direto || s.valor_total || 0));
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] text-[#112231] font-sans flex flex-col">
        <header className="h-16 flex items-center justify-between px-8 bg-white/50 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#112231] transition-colors"
          >
            <ArrowLeft size={16} /> HUB
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#112231] text-white flex items-center justify-center font-bold text-xs rounded-lg">E</div>
            <span className="text-sm font-bold tracking-tight">Evis Propostas</span>
          </div>
          <div className="w-16" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-2xl p-12 border-2 border-dashed rounded-[40px] flex flex-col items-center text-center transition-all ${
              isDragging ? 'border-[#b79969] bg-[#b79969]/5' : 'border-slate-200 bg-white'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 shadow-sm">
              <Upload className="text-[#b79969]" size={32} />
            </div>
            <h1 className="text-3xl font-serif mb-4">Crie sua Proposta Premium</h1>
            <p className="text-slate-500 mb-8 max-w-md leading-relaxed">
              Arraste o JSON do orçamento gerado pelo Evis Orçamentista para transformar dados técnicos em uma narrativa comercial impecável.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-8 py-4 bg-[#112231] text-white rounded-2xl font-bold text-sm hover:bg-[#19384f] transition-all shadow-lg hover:shadow-[#112231]/20"
              >
                Selecionar Arquivo
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".json" 
                className="hidden" 
              />
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  const categoryData = getCategoryData();
  const COLORS = ['#112231', '#19384f', '#2d617e', '#b79969', '#d4c2a5'];

  return (
    <div className="min-h-screen bg-[#fcfaf7] text-[#112231] font-sans pb-20 print:bg-white print:p-0">
      {/* --- Topbar Action --- */}
      <div className="fixed top-6 right-8 z-[100] flex gap-3 print:hidden">
        <button 
          onClick={() => window.print()}
          className="p-3 bg-[#112231] text-white rounded-full shadow-2xl hover:scale-105 transition-transform"
          title="Imprimir / PDF"
        >
          <Printer size={20} />
        </button>
        <button 
          onClick={() => setData(null)}
          className="p-3 bg-white text-red-500 border border-red-100 rounded-full shadow-2xl hover:scale-105 transition-transform"
          title="Limpar Proposta"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* --- Hero Section --- */}
      <section className="relative min-h-[85vh] flex flex-col md:grid md:grid-cols-2 overflow-hidden print:min-h-0 print:block">
        <div className="p-12 md:p-24 flex flex-col justify-between bg-[#112231] text-white">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 border border-white/20 flex items-center justify-center font-bold text-sm rounded-xl">EVIS</div>
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60">Proposta Comercial</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-serif leading-[0.95] mb-8 tracking-tighter">
              {data.obra.nome}
            </h1>
            
            <p className="text-lg text-slate-400 max-w-md leading-relaxed mb-12">
              Uma abordagem estruturada para a execução de sua obra, focada em transparência, precisão técnica e governança.
            </p>

            <div className="grid grid-cols-2 gap-6 mt-auto">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Cliente</span>
                <span className="text-sm font-medium">{data.obra.cliente}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Localização</span>
                <span className="text-sm font-medium line-clamp-1">{data.obra.endereco}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Prazo</span>
                <span className="text-sm font-medium">{data.obra.prazo_dias_uteis} dias úteis</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-2">Área</span>
                <span className="text-sm font-medium">{data.obra.area_total_m2} m²</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative bg-[#1a1d21] overflow-hidden print:hidden">
          <motion.div 
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 bg-cover bg-center grayscale-[0.2]"
            style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=80")' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#112231]/80 to-transparent" />
          
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-12 left-12 right-12 bg-white p-10 rounded-[32px] shadow-2xl"
          >
            <span className="text-[10px] font-bold text-[#b79969] uppercase tracking-widest block mb-3">Investimento Consolidado</span>
            <div className="text-4xl md:text-5xl font-serif text-[#112231] mb-4">
              {formatCurrency(data.obra.valor_total_com_bdi)}
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Valor total incluindo custos diretos, mobilização, equipamentos e BDI de gestão.
            </p>
          </motion.div>
        </div>
      </section>

      {/* --- Resumo Executivo --- */}
      <section className="max-w-7xl mx-auto px-8 py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-16">
          <div className="md:col-span-5">
            <SectionTitle 
              title="Resumo Executivo" 
              subtitle="Uma visão panorâmica sobre a lógica de execução e os pilares desta proposta." 
            />
            <div className="space-y-6 text-slate-600 leading-relaxed">
              <p>
                Esta proposta foi organizada para apresentar de forma clara o valor e a governança da construção 
                <strong> {data.obra.nome}</strong>. O investimento previsto contempla uma entrega estruturada 
                por sistemas construtivos, com foco em previsibilidade financeira.
              </p>
              <p>
                A narrativa operacional considera início estimado em <strong>{formatDate(data.obra.data_inicio_prevista)}</strong>, 
                conclusão projetada para <strong>{formatDate(data.obra.data_fim_prevista)}</strong>.
              </p>
            </div>
          </div>
          
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <GlassCard className="p-8" delay={0.1}>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                <Target className="text-[#112231]" size={24} />
              </div>
              <h3 className="font-bold mb-2">Escopo Técnico</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {data.servicos.length} frentes de serviço mapeadas e quantificadas com precisão.
              </p>
            </GlassCard>
            
            <GlassCard className="p-8" delay={0.2}>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-[#112231]" size={24} />
              </div>
              <h3 className="font-bold mb-2">Garantia Evis</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Processos auditados por IA e Human-in-the-Loop em todas as etapas.
              </p>
            </GlassCard>

            <GlassCard className="p-8" delay={0.3}>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                <TrendingUp className="text-[#112231]" size={24} />
              </div>
              <h3 className="font-bold mb-2">Previsibilidade</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Cronograma físico-financeiro detalhado para controle rigoroso de desembolsos.
              </p>
            </GlassCard>

            <GlassCard className="p-8" delay={0.4}>
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="text-[#112231]" size={24} />
              </div>
              <h3 className="font-bold mb-2">Prazo Firme</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Execução em {data.obra.prazo_dias_uteis} dias úteis com marcos contratuais definidos.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* --- Indicadores e Gráficos --- */}
      <section className="bg-slate-50 py-24 md:py-32 print:bg-white">
        <div className="max-w-7xl mx-auto px-8">
          <SectionTitle 
            title="Inteligência de Dados" 
            subtitle="Distribuição do investimento e representatividade por sistema construtivo." 
          />
          
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-8">
              <GlassCard className="p-10 h-full">
                <h3 className="font-bold mb-8 flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#b79969]" />
                  Principais Frentes de Investimento
                </h3>
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false}
                        width={120}
                        tick={{ fontSize: 11, fontWeight: 700, fill: '#112231' }}
                      />
                      <Tooltip 
                        formatter={(val: any) => formatCurrency(Number(val))}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>

            <div className="md:col-span-4 flex flex-col gap-6">
              <div className="bg-[#112231] p-8 rounded-[32px] text-white shadow-xl flex-1 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40 block mb-3">Custo Direto</span>
                <div className="text-3xl font-serif mb-4">{formatCurrency(data.obra.valor_custos_diretos)}</div>
                <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-[#b79969]" style={{ width: '85%' }} />
                </div>
                <p className="text-[11px] opacity-60">Representa 85% do valor global</p>
              </div>

              <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm flex-1 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-[#b79969] uppercase tracking-widest block mb-3">Gestão & BDI ({data.obra.bdi_percentual || 12}%)</span>
                <div className="text-3xl font-serif text-[#112231] mb-4">{formatCurrency(data.obra.bdi_valor || data.bdi_detalhamento?.total_valor || 0)}</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Engenharia, supervisão técnica, lucro e impostos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Detalhamento de Serviços (Accordion) --- */}
      <section className="max-w-5xl mx-auto px-8 py-24 md:py-32">
        <SectionTitle 
          title="Detalhamento do Orçamento" 
          subtitle="Lista exaustiva de serviços, quantidades e composições de custo." 
        />
        
        <div className="space-y-4">
          {Object.entries<any[]>(
            data.servicos.reduce((acc, s) => {
              const cat = s.categoria || 'Outros';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(s);
              return acc;
            }, {} as Record<string, any[]>)
          ).map(([cat, services], idx) => (
            <motion.details 
              key={idx}
              className="group bg-white border border-slate-200 rounded-[24px] overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-xs text-[#112231]">
                    {services.length}
                  </div>
                  <div>
                    <h4 className="font-bold text-[#112231]">{cat}</h4>
                    <p className="text-[11px] text-slate-400 uppercase tracking-widest">Sistemas Construtivos</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="font-bold text-[#112231]">
                      {formatCurrency(services.reduce((sum: number, s: any) => sum + (s.valor_total_direto || s.valor_total || 0), 0))}
                    </div>
                  </div>
                  <ChevronDown size={20} className="text-slate-300 group-open:rotate-180 transition-transform" />
                </div>
              </summary>
              
              <div className="px-6 pb-6 pt-2 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-3 text-[10px] uppercase tracking-widest text-slate-400 font-bold">Serviço</th>
                      <th className="py-3 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-right">Qtd</th>
                      <th className="py-3 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-right">Un</th>
                      <th className="py-3 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {services.map((s: any, sidx: number) => (
                      <tr key={sidx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="text-xs font-bold text-[#112231]">{s.nome || s.descricao}</div>
                          <div className="text-[10px] text-slate-400">Cód: {s.codigo_servico || s.cod}</div>
                        </td>
                        <td className="py-3 text-right text-xs font-medium">{s.quantidade || 0}</td>
                        <td className="py-3 text-right text-xs font-medium uppercase">{s.unidade || 'un'}</td>
                        <td className="py-3 text-right text-xs font-bold text-[#112231]">
                          {formatCurrency(s.valor_total_direto || s.valor_total || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.details>
          ))}
        </div>
      </section>

      {/* --- Footer / Premissas --- */}
      <footer className="bg-[#112231] text-white py-24 print:bg-white print:text-[#112231]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-2 gap-20">
            <div>
              <h3 className="text-2xl font-serif mb-8">Premissas e Condições</h3>
              <div className="space-y-6 text-sm text-slate-400 leading-relaxed">
                <p>
                  Esta proposta tem validade de 10 dias corridos a partir desta data. 
                  Os preços aqui apresentados baseiam-se nos projetos e informações técnicas fornecidas pelo cliente.
                </p>
                <p>
                  Alterações significativas de escopo, mudanças em acabamentos ou modificações estruturais 
                  solicitadas após o aceite desta proposta ensejarão revisão dos valores e prazos.
                </p>
                <div className="pt-8 border-t border-white/10 flex gap-12">
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest opacity-40 mb-2">Data da Proposta</span>
                    <span className="font-medium">{new Date().toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase tracking-widest opacity-40 mb-2">Versão</span>
                    <span className="font-medium">1.0.2 - Premium</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-end">
              <div className="p-10 border border-white/10 rounded-[40px] bg-white/5">
                <h4 className="font-bold mb-6">Próximos Passos</h4>
                <ul className="space-y-4">
                  {[
                    'Assinatura do contrato de prestação de serviços',
                    'Validação do cronograma executivo final',
                    'Mobilização do canteiro e equipes iniciais',
                    'Primeiro aporte conforme fluxo financeiro'
                  ].map((step, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                      <CheckCircle2 size={16} className="text-[#b79969]" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          <div className="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 text-[10px] uppercase tracking-[0.4em]">
            <span>© 2026 EVIS AI CONSTRUCTION TECHNOLOGIES</span>
            <span>Alta Performance na Gestão de Obras</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
