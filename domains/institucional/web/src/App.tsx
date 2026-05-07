/// <reference types="vite/client" />
import { useState, useEffect, useRef, ReactNode } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Ruler, 
  Hammer, 
  ChevronRight, 
  Star, 
  Lock, 
  Plus, 
  Trash2, 
  LogOut, 
  ArrowLeft,
  X,
  Phone,
  Mail,
  Menu,
  Instagram,
  Facebook,
  ShieldCheck,
  MessageSquare,
  ArrowUpRight,
  PlusCircle,
  LayoutGrid,
  Image as ImageIcon
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  setDoc,
  doc, 
  Timestamp,
  getDoc,
  limit
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import { db, auth } from './lib/firebase';
import { Project, Testimonial, SiteConfig } from './types';

interface Concept {
  id: string;
  url: string;
  createdAt: Timestamp;
}

// --- Shared Internal Components ---

const Navbar = ({ onAdminClick }: { onAdminClick: () => void }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeClick = () => {
    if (pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Jornada do Cliente', path: '/jornada' },
    { name: 'Portfólio', path: '/portfolio' },
  ];

  const handleLinkClick = (path: string) => {
    setIsMobileMenuOpen(false);
    if (path === pathname) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 border-b transition-all duration-500 ${
          isScrolled 
            ? 'h-16 bg-white/70 backdrop-blur-xl border-gray-100/30 shadow-sm' 
            : 'h-24 bg-white/80 backdrop-blur-2xl border-gray-100/50'
        }`}
      >
        <div 
          className="font-display text-2xl font-extrabold cursor-pointer tracking-tighter"
          onClick={handleHomeClick}
        >
          Berti<span className="text-berti-gold">.</span>
        </div>

        <div className="flex items-center gap-4 md:gap-12">
          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-500 cursor-pointer relative group ${
                  pathname === link.path ? 'text-berti-gold' : 'text-berti-ink hover:text-berti-gold'
                }`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 h-[1px] bg-berti-gold transition-all duration-500 ${pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'}`} />
              </Link>
            ))}
            <button 
              onClick={() => {
                document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
              }} 
              className="text-[11px] font-bold uppercase tracking-[0.2em] hover:text-berti-gold transition-all duration-500 cursor-pointer relative group"
            >
              Contato
              <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-berti-gold transition-all duration-500 group-hover:w-full" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.href = `https://wa.me/5541991836651`}
              className={`hidden lg:flex px-8 py-3.5 bg-berti-gold text-berti-ink text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-berti-dark hover:text-white transition-all items-center shadow-lg ${isScrolled ? 'scale-90' : 'scale-100'}`}
            >
              Solicitar Orçamento
            </button>
            <button 
              onClick={onAdminClick}
              className={`px-5 md:px-7 py-3.5 bg-berti-ink text-white hover:bg-berti-dark text-[11px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-all ${isScrolled ? 'scale-90' : 'scale-100'} group`}
            >
              <Lock size={12} className="text-berti-gold group-hover:text-white transition-colors" /> <span className="hidden sm:inline">Área do Cliente</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-berti-ink hover:text-berti-gold transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white lg:hidden"
          >
            <div className="flex flex-col h-full">
              <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
                <div className="font-display text-2xl font-extrabold tracking-tighter">
                  Berti<span className="text-berti-gold">.</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-berti-ink hover:text-berti-gold transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => handleLinkClick(link.path)}
                    className={`text-2xl font-display font-medium tracking-tight hover:text-berti-gold transition-colors ${pathname === link.path ? 'text-berti-gold' : 'text-berti-ink'}`}
                  >
                    {link.name}
                  </Link>
                ))}
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
                  }} 
                  className="text-2xl font-display font-medium tracking-tight text-berti-ink hover:text-berti-gold transition-colors"
                >
                  Contato
                </button>
              </div>

              <div className="p-12 border-t border-gray-100 flex flex-col items-center gap-6">
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onAdminClick();
                  }}
                  className="w-full py-5 bg-berti-ink text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-berti-dark transition-all flex items-center justify-center gap-3 group"
                >
                  <Lock size={12} className="text-berti-gold group-hover:text-white transition-colors" /> Área do Cliente
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const WhatsAppButton = () => (
  <motion.a
    href={`https://wa.me/5541991836651`}
    target="_blank"
    rel="noopener noreferrer"
    initial={{ opacity: 0, scale: 0.5, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ delay: 1, duration: 0.5 }}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className="fixed bottom-8 right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-[0_20px_50px_rgba(37,211,102,0.3)] flex items-center justify-center hover:bg-[#128C7E] transition-all duration-300 group"
    aria-label="Contato via WhatsApp"
  >
    <div className="absolute right-full mr-4 bg-white text-berti-ink text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded shadow-xl opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap border border-gray-100">
      Falar conosco
    </div>
    <MessageSquare size={24} fill="currentColor" className="text-white/20" />
    <div className="absolute inset-0 rounded-full border border-white animate-ping opacity-20 group-hover:hidden" />
  </motion.a>
);

const ParallaxImage = ({ src, alt, className }: { src: string; alt: string; className: string }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.1, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.9, 1, 1, 0.9]);

  return (
    <div ref={ref} className="relative w-full h-full overflow-hidden bg-gray-100">
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        style={{ y, scale, opacity }}
        className={`${className} absolute inset-0 contrast-110 saturate-110`}
      />
    </div>
  );
};

const HeroBackground = ({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) => {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, 200]);

  return (
    <motion.img 
      initial={{ scale: 1.1, opacity: priority ? 1 : 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 2, ease: "easeOut" }}
      src={src}
      loading={priority ? undefined : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      style={{ y }}
      className="w-full h-full object-cover saturate-110 contrast-105"
      alt={alt}
    />
  );
};

const PageTransition = ({ children }: { children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    className="w-full"
  >
    {children}
  </motion.div>
);

const LoadingSpinner = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex items-center justify-center py-24 w-full"
  >
    <div className="w-6 h-6 border-2 border-berti-ink/5 border-t-berti-gold rounded-full animate-spin" />
  </motion.div>
);

const ConceptGallery = ({ photos }: { photos: string[] }) => {
  if (!photos || photos.length === 0) return null;

  return (
    <div className="w-full relative py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16">
        <div className="text-berti-gold-dark text-[10px] font-bold uppercase tracking-[0.5em] mb-4">Galeria Conceito</div>
        <h3 className="text-4xl md:text-5xl font-display italic text-berti-ink">Da fundação ao acabamento.</h3>
      </div>
      
      <div className="flex overflow-x-auto pb-12 gap-6 px-6 md:px-12 no-scrollbar cursor-grab active:cursor-grabbing snap-x">
        {photos.map((src, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            className="flex-none w-[300px] md:w-[450px] aspect-[4/3] bg-gray-50 overflow-hidden shadow-lg snap-center"
          >
            <img src={src} alt={`Conceito Berti ${i + 1}`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" loading="lazy" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Footer = ({ onHome }: { onHome: (s: any) => void }) => (
  <footer id="footer" className="bg-berti-dark text-white pt-24 pb-12 px-6 md:px-12 border-t border-white/10">
    <div className="max-w-7xl mx-auto mb-20">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24">
        <div className="md:col-span-4 space-y-10">
          <Link to="/" className="font-display text-4xl font-extrabold tracking-tighter block">
            Berti<span className="text-berti-gold">.</span>
          </Link>
          <p className="text-white/70 text-base leading-relaxed font-light max-w-xs">
            Gestão e execução de obras de alto padrão com organização, clareza técnica e controle absoluto.
          </p>
        </div>

        <div className="md:col-span-2 space-y-10">
          <h4 className="text-berti-gold text-[10px] font-bold uppercase tracking-widest">Navegação</h4>
          <div className="flex flex-col gap-5 text-sm font-light text-white/50">
            <Link to="/" className="hover:text-berti-gold transition-colors text-left">Início</Link>
            <Link to="/jornada" className="hover:text-berti-gold transition-colors text-left">Jornada do Cliente</Link>
            <Link to="/portfolio" className="hover:text-berti-gold transition-colors text-left">Portfólio</Link>
            <button onClick={() => document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-berti-gold transition-colors text-left">Contato</button>
          </div>
        </div>
        
        <div className="md:col-span-3 space-y-10">
          <h4 className="text-berti-gold text-[10px] font-bold uppercase tracking-widest">Contato</h4>
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-white/80 hover:text-white transition-colors cursor-pointer group" onClick={() => window.location.href=`https://wa.me/5541991836651`}>
              <MessageSquare size={16} className="text-berti-gold" />
              <span className="text-sm font-medium tracking-tight">(41) 99183-6651</span>
            </div>
            <div className="flex items-center gap-4 text-white/80 hover:text-white transition-colors group">
              <Mail size={16} className="text-berti-gold" />
              <span className="text-sm font-medium tracking-tight text-xs lg:text-sm">berti@curitibaconstrutora.com.br</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-3 space-y-10">
          <h4 className="text-berti-gold text-[10px] font-bold uppercase tracking-widest">Digital</h4>
          <div className="flex gap-6">
            <a href="https://instagram.com/bertiengenharia" target="_blank" rel="noreferrer" className="p-3 border border-white/10 text-white/30 hover:text-berti-gold hover:border-berti-gold transition-all duration-500">
               <Instagram size={20} />
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-white/60 text-[9px] uppercase tracking-[0.2em] font-medium">
      <div className="space-y-3">
        <div className="text-white/80 font-bold tracking-[0.3em]">BERTI CONSTRUTORA LTDA</div>
        <div className="flex flex-col gap-1">
          <div>CNPJ: 59.622.624/0001-93</div>
          <div className="text-[10px] normal-case tracking-normal text-white/70">Rua Mateus Leme, 1970 — Centro Cívico</div>
          <div className="text-[10px] normal-case tracking-normal text-white/70">Curitiba/PR — CEP 80.530-010</div>
        </div>
      </div>
      <div className="flex flex-col md:items-end gap-2 text-right">
        <div className="flex gap-8">
           <span>Curitiba | Paraná</span>
        </div>
        <div className="text-white/70 text-[8px] mt-2">© {new Date().getFullYear()} Todos os direitos reservados.</div>
      </div>
    </div>
  </footer>
);

// --- Page Components ---

const InstitutionalLanding = ({ sections, projects, onProjectClick, testimonials, loading, concepts }: any) => {
  return (
    <div className="bg-berti-light text-berti-ink">
      {/* 1. Hero Section - Alto Padrão + Técnica */}
      <section ref={sections.hero} className="relative min-h-[100vh] flex flex-col items-center justify-end overflow-hidden pb-24 md:pb-32">
        <div className="absolute inset-0 z-0">
          <HeroBackground 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1440&auto=format&fit=crop" 
            alt="Arquitetura de Alto Padrão Berti" 
            priority={true}
          />
          <div className="absolute inset-0 bg-berti-ink/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-berti-ink via-transparent to-transparent" />
        </div>
        
        <div className="relative z-10 max-w-7xl w-full px-6 md:px-12 flex flex-col items-center text-center mt-auto">
          <div className="max-w-5xl flex flex-col items-center w-full">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] leading-[1.1] tracking-tight mb-10 font-bold text-white uppercase"
            >
              Menos improviso.<br />
              Mais controle na sua obra.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-4xl mb-16 font-light leading-relaxed mx-auto drop-shadow-md"
            >
              Você não precisa entender de obra.<br/>
              Precisa de alguém que controle cada etapa e conduza suas decisões com segurança.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="flex flex-col md:flex-row gap-4 justify-center w-full max-w-3xl"
            >
              <button 
                onClick={() => window.location.href = `https://wa.me/5541991836651`}
                className="flex-1 px-10 py-5 bg-berti-gold text-berti-ink font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-white transition-all duration-300 shadow-xl"
              >
                Falar no Whatsapp
              </button>
              <Link
                to="/jornada"
                className="flex-1 px-10 py-5 bg-white text-berti-ink font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-gray-100 transition-all duration-300 shadow-xl flex items-center justify-center"
              >
                Como funciona
              </Link>
              <Link
                to="/portfolio"
                className="flex-1 px-10 py-5 border border-white/40 text-white font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-white hover:text-berti-ink transition-all duration-300 flex items-center justify-center gap-3 bg-berti-ink/20 backdrop-blur-sm"
              >
                Ver Portfólio
              </Link>
            </motion.div>
          </div>
        </div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 opacity-40 text-white flex flex-col items-center gap-4 cursor-pointer"
        >
          <div className="w-[1px] h-20 bg-white" />
        </motion.div>
      </section>

      {/* 2. Como Funciona (Processo) */}
      <section className="py-40 bg-berti-light border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 items-start">
            <div className="lg:col-span-5 sticky top-32">
              <div className="text-berti-gold-dark text-xs font-bold uppercase tracking-[0.4em] mb-8">Processo de Gestão</div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl mb-10 leading-[1] tracking-tight">Como a Berti <br />conduz seu projeto</h2>
              <p className="text-xl text-gray-800 leading-relaxed font-light mt-6">
                Toda obra segue etapas. <br />
                <span className="font-medium text-berti-ink">O problema é quando elas não conversam entre si.</span>
              </p>
              <p className="text-lg text-gray-500 leading-relaxed font-light mt-6 border-l-2 border-berti-gold/30 pl-6">
                Nosso papel é integrar projeto, suprimentos, finanças e execução no canteiro de obras para que nada saia do controle.
              </p>
            </div>
            
            <div className="lg:col-span-1 hidden lg:block"></div>

            <div className="lg:col-span-6 space-y-4">
              {[
                { step: "01", title: "Análise técnica completa do projeto", desc: "Antes de iniciar, verificamos projetos de engenharia e arquitetura em busca de interferências e otimizações executivas." },
                { step: "02", title: "Orçamento e cronograma estruturados", desc: "Definição do fluxo físico-financeiro real da obra para alinhar os desembolsos ao escopo construtivo." },
                { step: "03", title: "Coordenação ativa das equipes", desc: "Mobilização e sincronização contínua das frentes de trabalho para evitar gargalos entre etapas produtivas." },
                { step: "04", title: "Controle logístico de suprimentos", desc: "Equalização de propostas, compras com mapa de cotação e validação do recebimento diretamente no canteiro." },
                { step: "05", title: "Condução técnica até a entrega", desc: "Direcionamento constante de método construtivo, normativas e fiscalização da qualidade em cada avanço de etapa." },
                { step: "06", title: "Transparência e prestação de contas", desc: "Fechamentos mensais detalhados de custo consolidado, fotos de avanço e controle documental impecável." }
              ].map((item, i) => (
                <div key={i} className="group border border-gray-100 bg-white p-8 hover:border-berti-gold/30 hover:shadow-lg transition-all cursor-default relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] text-8xl font-black group-hover:text-berti-gold transition-colors">{item.step}</div>
                  <div className="flex flex-col gap-4 relative z-10">
                    <div className="text-berti-gold-dark font-display font-black text-2xl">{item.step}</div>
                    <h3 className="text-2xl font-bold tracking-tight text-berti-ink pr-12">{item.title}</h3>
                    <p className="text-gray-500 leading-relaxed font-light">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Problema + Posicionamento */}
      <section ref={sections.pos} className="py-40 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-24 items-center">
             <div className="md:col-span-4 aspect-square bg-berti-ink p-16 flex flex-col justify-between shadow-2xl relative overflow-hidden">
                <div className="absolute -bottom-8 -right-8 text-[15rem] leading-none text-white/5 font-serif italic">B</div>
                <div className="text-berti-gold font-display text-4xl italic mb-auto">B<span className="text-white">.</span></div>
                <div className="space-y-6 relative z-10">
                   <div className="h-px w-12 bg-berti-gold/50"></div>
                   <h3 className="text-white text-5xl font-extrabold leading-[1.1] tracking-tight">O que fazemos</h3>
                </div>
             </div>
             <div className="md:col-span-8">
                <div className="text-berti-gold-dark text-xs font-bold uppercase tracking-[0.4em] mb-12">Nossa Atuação</div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl mb-12 leading-[1.1] tracking-tight text-berti-ink">A maioria das obras perde o controle porque não existe condução técnica clara.</h2>
                <div className="space-y-8">
                  <p className="text-xl text-gray-600 font-light leading-relaxed">
                    A Berti entra exatamente nesse ponto: <span className="font-medium text-berti-ink">organizar, estruturar e garantir que cada decisão seja tomada com base técnica</span> — do início ao fim.
                  </p>
                  <p className="text-xl text-gray-500 font-light leading-relaxed">
                    Não somos apenas executores, agimos como os curadores técnicos do investimento do cliente no processo de construção.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </section>



      {/* 5. Transparência */}
      <section className="py-40 bg-white border-b border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-32 opacity-[0.02] text-[25rem] font-black leading-none pointer-events-none select-none uppercase -translate-y-1/4 translate-x-1/4 text-berti-ink">Trust</div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row gap-24 items-center relative z-10">
          <div className="lg:w-1/2">
            <div className="text-berti-gold-dark text-xs font-bold uppercase tracking-[0.4em] mb-12">Transparência Total</div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl mb-10 leading-[1] font-black text-berti-ink tracking-tight">Sem margem escondida. <br /><span className="text-gray-500 font-light italic font-serif">Sem ruído.</span></h2>
            <p className="text-xl text-gray-600 mb-10 font-light leading-relaxed max-w-xl">
              Você sabe exatamente para onde está indo cada decisão e cada investimento.
            </p>
            <p className="text-lg text-gray-500 mb-16 font-light leading-relaxed max-w-xl">
              Nosso modelo privilegia orçamento claro e visibilidade real sobre a obra. A mão de obra é acompanhada por avanço técnico, materiais seguem cotação e o cliente acompanha a execução com critério.
            </p>
          </div>
          <div className="lg:w-1/2 w-full">
            <div className="bg-berti-light border border-gray-200 p-16 space-y-10">
              {[
                "Orçamento estruturado por etapa construtiva",
                "Acompanhamento técnico e fiscal rigoroso",
                "Relatórios detalhados com fotos e medições",
                "Auditoria e organização de notas fiscais",
                "Equalização e coordenação de cotações",
                "Decisão estratégica guiada por dados"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-8 group">
                  <div className="w-12 h-px bg-berti-gold/40 group-hover:w-16 group-hover:bg-berti-gold transition-all duration-500"></div>
                  <div className="text-gray-700 font-medium group-hover:text-berti-ink transition-colors">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. Escopo de Atuação */}
      <section className="py-40 bg-berti-ink relative">
        <div className="absolute inset-0 z-0 flex overflow-hidden opacity-10 pointer-events-none">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }} 
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="flex w-[200%] h-full"
          >
            {[...(concepts && concepts.length > 0 ? concepts.map((c: Concept) => c.url) : [
              "https://images.unsplash.com/photo-1590674251239-0f0e08f23783?q=80&w=1000",
              "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1000",
              "https://images.unsplash.com/photo-1503387762-592dea58ef23?q=80&w=1000",
              "https://images.unsplash.com/photo-1541976590-713941fbc1f6?q=80&w=1000"
            ]), ...(concepts && concepts.length > 0 ? concepts.map((c: Concept) => c.url) : [
              "https://images.unsplash.com/photo-1590674251239-0f0e08f23783?q=80&w=1000",
              "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1000",
              "https://images.unsplash.com/photo-1503387762-592dea58ef23?q=80&w=1000",
              "https://images.unsplash.com/photo-1541976590-713941fbc1f6?q=80&w=1000"
            ])].map((src, i) => (
              <div key={i} className="flex-none h-full w-[50vw] md:w-[33vw] lg:w-[25vw] shrink-0 border-r border-white/5">
                <img 
                  src={src as string} 
                  alt="" 
                  className="w-full h-full object-cover grayscale" 
                  loading="lazy" 
                />
              </div>
            ))}
          </motion.div>
        </div>
        
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-berti-ink via-berti-ink/95 to-berti-ink/80 pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 flex flex-col items-center text-center">
            <div className="text-berti-gold text-xs font-bold uppercase tracking-[0.4em] mb-8">Escopo Completo</div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl mb-12 leading-[1.1] text-white tracking-tight">Da fundação ao acabamento, <br /><span className="text-berti-sage font-light italic font-serif">com coordenação técnica.</span></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-12 mt-10 w-full max-w-5xl">
              {[
                "Integração de Projetos",
                "Controle Estrutural",
                "Gestão de Instalações",
                "Curadoria de Acabamentos"
              ].map(t => (
                <div key={t} className="text-white/90 text-[11px] sm:text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-4">
                  <div className="w-1.5 h-1.5 bg-berti-gold"></div>
                  {t}
                </div>
              ))}
            </div>
        </div>
      </section>



      {/* 9. CTA Final */}
      <section className="py-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
           <div className="flex flex-col lg:flex-row gap-24 items-center justify-between">
              <div className="max-w-3xl">
                 <div className="text-berti-gold-dark text-xs font-bold uppercase tracking-[0.4em] mb-12 flex items-center gap-6">
                    <span className="w-16 h-px bg-berti-gold-dark"></span>
                    Próximo Passo
                 </div>
                 <h2 className="text-5xl md:text-6xl lg:text-7xl leading-[1] font-bold tracking-tight mb-12 text-berti-ink">Envie seu projeto. <br /><span className="text-berti-gold-dark italic font-serif font-light">A Berti analisa.</span></h2>
                 <p className="text-xl text-gray-700 font-light leading-relaxed mb-6">
                   O próximo passo para uma obra organizada e previsível é uma análise técnica clara.
                 </p>
                 <p className="text-lg text-gray-500 font-light leading-relaxed mb-16">
                   Se você busca controle desde a primeira decisão, nós podemos guiar o processo construtivo. Arquitetura, orçamento, execução e tomada de decisão precisam falar a mesma língua.
                 </p>
                 
                 <div className="flex flex-col sm:flex-row gap-6 w-full lg:w-auto">
                    <button 
                     onClick={() => window.location.href = `https://wa.me/5541991836651`}
                     className="px-10 py-5 bg-berti-ink text-white font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-berti-gold transition-all duration-500 shadow-xl flex-1 md:flex-none"
                    >
                      Solicitar Análise
                    </button>
                    <button 
                     onClick={() => window.location.href = `mailto:berti@curitibaconstrutora.com.br`}
                     className="px-10 py-5 border border-gray-300 text-berti-ink font-bold text-[11px] uppercase tracking-[0.3em] hover:bg-gray-100 transition-all duration-500 flex-1 md:flex-none"
                    >
                      Enviar por E-mail
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};

const ProjectCard = ({ project, onClick, idx }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: idx * 0.1, duration: 1, ease: [0.22, 1, 0.36, 1] }}
    viewport={{ once: true }}
    className="group cursor-pointer"
    onClick={onClick}
  >
    <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-8 border border-gray-100 shadow-sm transition-all duration-700 hover:shadow-2xl">
      <div className="absolute inset-0 bg-berti-dark z-10 opacity-0 group-hover:opacity-20 transition-opacity duration-700" />
      {project.photos?.[0] ? (
        <ParallaxImage 
          src={project.photos[0]} 
          className="w-full h-full object-cover transition-all duration-[2000ms] ease-out group-hover:scale-110 saturate-125 contrast-110" 
          alt={project.title}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          <Building2 size={48} strokeWidth={0.5} />
        </div>
      )}
      <div className="absolute inset-0 z-20 flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0 text-white">
        <span className="text-berti-gold text-[9px] font-bold uppercase tracking-widest mb-1">{project.location}</span>
        <h4 className="text-xl font-display font-medium italic">Explorar Projeto</h4>
      </div>
    </div>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h3 className="text-4xl font-extrabold tracking-tighter leading-none group-hover:text-berti-gold transition-colors italic">
           {project.title}
         </h3>
         <div className="text-[9px] font-bold uppercase tracking-widest text-berti-gold opacity-0 group-hover:opacity-100 transition-opacity duration-500">Ver Obra</div>
      </div>
      <div className="flex items-center justify-between pt-6 border-t border-gray-100 text-berti-ink/40 text-[9px] font-bold uppercase tracking-widest tracking-[0.2em]">
        <span>{project.location}</span>
        <div className="flex gap-4">
           <span>{project.year}</span>
           <span>{project.area}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

const ProjectDetail = ({ project, onBack }: any) => (
  <div className="bg-white min-h-screen">
    <div className="relative h-[95vh] bg-berti-dark overflow-hidden">
      <ParallaxImage 
        src={project.photos[0]} 
        className="w-full h-full object-cover opacity-80 saturate-125 contrast-110"
        alt={project.title}
      />
      <div className="absolute inset-0 flex items-center justify-center text-center p-6 bg-gradient-to-t from-berti-dark/90 via-transparent to-transparent">
        <div className="max-w-5xl">
          <button 
            onClick={onBack}
            className="text-white text-[10px] font-bold uppercase tracking-[0.5em] mb-16 flex items-center justify-center gap-3 mx-auto hover:text-berti-gold transition-all"
          >
            <ArrowLeft size={16} className="text-berti-gold" /> Voltar ao Portfólio
          </button>
          <h2 className="text-white text-6xl md:text-[8rem] leading-[0.8] tracking-tightest mb-12 font-extrabold italic drop-shadow-2xl">
            {project.title}
          </h2>
          <div className="flex flex-wrap justify-center gap-6">
            {project.area && <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white border border-white/30 px-10 py-5 bg-white/10 backdrop-blur-md shadow-2xl">{project.area}</span>}
            {project.system && <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white border border-white/30 px-10 py-5 bg-white/10 backdrop-blur-md shadow-2xl">{project.system}</span>}
          </div>
        </div>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-6 md:px-16 py-40">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-32 items-start">
        <div className="lg:col-span-7 space-y-32">
          <div className="space-y-12">
            <div className="text-berti-gold-dark text-xs font-bold uppercase tracking-[0.5em]">Resumo Executivo</div>
            <p className="text-4xl md:text-5xl text-berti-ink leading-[1.2] font-light italic opacity-80">
              "{project.description}"
            </p>
          </div>
          <div className="grid grid-cols-1 gap-12">
            {project.photos.slice(1).map((url: string, i: number) => (
              <div key={i} className="aspect-video overflow-hidden bg-gray-50 border border-gray-100 shadow-sm relative group cursor-crosshair">
                <ParallaxImage 
                  src={url} 
                  className="w-full h-full object-cover saturate-110 contrast-105" 
                  alt="" 
                />
                <div className="absolute inset-0 bg-berti-dark/0 group-hover:bg-berti-dark/10 transition-colors duration-700 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5 sticky top-32 space-y-24">
          <div className="bg-[#FAF9F6] p-16 border border-gray-100 shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-berti-gold-dark mb-16">Especificações</div>
            <div className="space-y-12">
              <TechnicalItem icon={<MapPin size={22} />} label="Território" value={project.location} />
              <TechnicalItem icon={<Calendar size={22} />} label="Ano de Entrega" value={project.year} />
              <TechnicalItem icon={<Ruler size={22} />} label="Área Construída" value={project.area} />
              <TechnicalItem icon={<Hammer size={22} />} label="Sistema Construtivo" value={project.system} />
            </div>
          </div>
          <div className="p-16 border border-berti-ink/10 text-center space-y-10">
             <h4 className="font-display text-3xl font-extrabold italic">Conversão Directa</h4>
             <p className="text-gray-400 text-sm leading-relaxed font-light">Solicite um estudo de viabilidade para seu projeto com os mesmos padrões de engenharia Berti.</p>
             <button onClick={() => window.location.href="https://wa.me/5541991836651"} className="w-full py-6 bg-berti-dark text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-black transition-all">Iniciar Atendimento</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const TechnicalItem = ({ icon, label, value }: any) => (
  <div className="flex items-center gap-6 group">
    <div className="p-4 bg-white text-berti-sage shadow-md rounded-sm group-hover:bg-berti-gold group-hover:text-white transition-all">{icon}</div>
    <div>
      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-1">{label}</div>
      <div className="font-bold text-base">{value || 'Consulte'}</div>
    </div>
  </div>
);

const AdminLogin = ({ onLogin, onBack }: any) => (
  <div className="bg-berti-ink p-16 max-w-md w-full shadow-2xl shadow-berti-ink/50 text-center relative border border-white/5">
    <div className="absolute top-0 left-0 w-full h-1 bg-berti-gold"></div>
    <div className="text-berti-gold mb-8"><Lock size={40} className="mx-auto" strokeWidth={1.5} /></div>
    <div className="font-display text-4xl mb-4 text-white">Área do Cliente</div>
    <p className="text-white/50 text-[10px] mb-12 uppercase tracking-[0.2em] leading-relaxed font-bold">
      Acesso exclusivo para clientes e engenharia
    </p>
    <button 
      onClick={onLogin}
      className="w-full flex items-center justify-center gap-4 py-6 bg-berti-gold text-berti-ink hover:bg-white hover:text-berti-ink transition-all text-[11px] font-bold uppercase tracking-widest"
    >
      Acessar com Google
    </button>
    <button 
      onClick={onBack}
      className="mt-10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 hover:text-berti-gold transition-colors cursor-pointer w-full text-center"
    >
      Retornar ao Institucional
    </button>
  </div>
);

const ClientDashboard = ({ user, onLogout }: any) => (
  <div className="bg-white p-12 max-w-md w-full shadow-2xl text-center border-t-4 border-berti-gold">
    <div className="text-berti-gold mb-8"><Lock size={48} className="mx-auto" /></div>
    <div className="font-display text-2xl mb-4">Área do Cliente</div>
    <p className="text-gray-500 text-sm mb-12 leading-relaxed font-light">
      Olá, <strong>{user.displayName || user.email}</strong>. <br /><br />
      Seu ambiente exclusivo está sendo preparado. Em breve, você poderá acompanhar o status da sua obra e acessar todos os documentos diretamente por aqui.
    </p>
    <button onClick={onLogout} className="text-berti-sage font-bold hover:underline text-xs uppercase tracking-widest">Sair da Conta</button>
  </div>
);

// --- Admin Section ---

const JourneyImageCard = ({ url, index, journeyImages }: any) => {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    try {
      const imageUrl = await uploadToImgbb(file);
      const newImages = [...journeyImages];
      newImages[index] = imageUrl;
      await setDoc(doc(db, 'config', 'journey'), { images: newImages }, { merge: true });
    } catch(err) { 
      console.error(err);
      alert(uploadErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-100 p-4 relative group">
      <div className="font-bold mb-2 uppercase text-[10px] tracking-[0.3em] text-berti-gold">
        {index === 0 && "JORNADA - PASSO 01: DIAGNÓSTICO"}
        {index === 1 && "JORNADA - PASSO 02: ESTRUTURAÇÃO"}
        {index === 2 && "JORNADA - PASSO 03: PLANEJAMENTO"}
        {index === 3 && "JORNADA - PASSO 04: EXECUÇÃO"}
        {index === 4 && "BANNER: SEÇÃO NOSSOS SERVIÇOS"}
        {index > 4 && `EXTRA - IMAGEM ${index + 1}`}
      </div>
      <div className="aspect-video bg-gray-50 relative overflow-hidden flex items-center justify-center">
        {loading ? (
          <div className="animate-spin w-8 h-8 rounded-full border-4 border-berti-gold border-t-transparent" />
        ) : (
          <img src={url} className="w-full h-full object-contain" />
        )}
      </div>
      <div className="mt-4">
        <label className="cursor-pointer bg-berti-ink text-white py-3 px-4 w-full text-center block text-[10px] font-bold uppercase tracking-widest hover:bg-berti-gold transition-colors">
          Trocar Imagem
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={loading} />
        </label>
      </div>
    </div>
  );
};

const AdminDashboard = ({ projects, testimonials, onLogout, onViewSite, concepts, journeyImages }: any) => {
  const [activeTab, setActiveTab ] = useState<'projects' | 'testimonials' | 'concepts' | 'journey'>('projects');
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="max-w-6xl w-full bg-white shadow-2xl min-h-[85vh] flex flex-col self-start mt-12 mx-auto overflow-hidden">
      <header className="bg-berti-dark text-white p-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-display mb-2 tracking-tighter">Engenharia Berti</h2>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-[0.3em]">Gestão de Portfólio & Conceitos</p>
        </div>
        <div className="flex items-center gap-6">
          <button onClick={onViewSite} className="px-8 py-4 bg-white/10 hover:bg-white/20 text-[10px] font-bold uppercase tracking-widest transition-all">Preview Site</button>
          <button onClick={onLogout} className="p-4 bg-red-500/80 hover:bg-red-500 transition-all rounded-full"><LogOut size={16} /></button>
        </div>
      </header>
      
      <div className="flex border-b border-gray-100">
        {[
          { id: 'projects', label: 'Obras Executadas', icon: <LayoutGrid size={14} /> },
          { id: 'concepts', label: 'Galeria Conceito', icon: <ImageIcon size={14} /> },
          { id: 'testimonials', label: 'Depoimentos', icon: <Star size={14} /> },
          { id: 'journey', label: 'Imagens da Jornada', icon: <ImageIcon size={14} /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-10 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === tab.id ? 'border-b-2 border-berti-gold text-berti-gold bg-berti-light/30' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="p-12 flex-1">
        <div className="flex justify-between items-center mb-16">
          <h3 className="text-2xl font-bold font-display italic">
            {activeTab === 'projects' ? 'Obras de Alto Padrão' : activeTab === 'concepts' ? 'Fotos Conceito (Landing)' : activeTab === 'journey' ? 'Imagens da Jornada' : 'Avaliações de Clientes'}
          </h3>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-3 bg-berti-sage text-white px-8 py-4 text-[10px] font-bold uppercase tracking-widest hover:bg-berti-dark transition-all rounded-sm shadow-xl"
            disabled={activeTab === 'journey'}
            style={{ opacity: activeTab === 'journey' ? 0 : 1 }}
          >
            <Plus size={18} /> {activeTab === 'concepts' ? 'Anexar Conceito' : 'Adicionar Novo'}
          </button>
        </div>

        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-berti-ink">
            {projects.map((p: Project) => (
              <div key={p.id} className="border border-gray-100 group overflow-hidden relative shadow-sm hover:shadow-xl transition-all">
                <div className="aspect-video bg-gray-100">
                  <img src={p.photos?.[0]} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700 saturate-110" alt="" />
                </div>
                <div className="p-6">
                  <div className="font-bold text-lg mb-2">{p.title}</div>
                  <div className="text-gray-400 text-[10px] flex items-center gap-2 uppercase font-bold tracking-widest"><MapPin size={10} /> {p.location}</div>
                </div>
                <button 
                  onClick={async () => { if(confirm('Remover obra permanentemente?')) await deleteDoc(doc(db, 'projects', p.id)); }}
                  className="absolute top-4 right-4 p-3 bg-white/90 text-red-500 shadow-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'concepts' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 text-berti-ink">
            {concepts.map((c: Concept) => (
              <div key={c.id} className="relative group aspect-square bg-gray-50 border border-gray-100 rounded overflow-hidden">
                <img src={c.url} className="w-full h-full object-cover" loading="lazy" />
                <button 
                  onClick={async () => { if(confirm('Remover esta foto da galeria?')) await deleteDoc(doc(db, 'concepts', c.id)); }}
                  className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            ))}
            {concepts.length === 0 && <div className="col-span-full py-12 text-center text-gray-400 text-sm italic">Nenhuma foto conceito cadastrada.</div>}
          </div>
        )}

        {activeTab === 'testimonials' && (
          <div className="max-w-4xl space-y-6 text-berti-ink">
            {testimonials.map((t: Testimonial) => (
              <div key={t.id} className="p-8 border border-gray-100 flex justify-between items-center bg-gray-50/50 hover:bg-white transition-all shadow-sm">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-berti-dark text-white rounded-full flex items-center justify-center font-bold text-xl overflow-hidden border-2 border-white">
                    {t.imageUrl ? <img src={t.imageUrl} loading="lazy" className="w-full h-full object-cover" /> : t.clientName[0]}
                  </div>
                  <div>
                    <div className="font-bold text-lg">{t.clientName}</div>
                    <div className="text-berti-gold flex gap-1 mt-2">
                       {[...Array(5)].map((_, i) => <Star key={i} size={10} fill={i < t.rating ? "currentColor" : "none"} />)}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={async () => { if(confirm('Remover depoimento?')) await deleteDoc(doc(db, 'testimonials', t.id)); }}
                  className="p-4 text-red-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'journey' && (
          <div className="space-y-16">
            <div>
              <h4 className="text-berti-gold text-[10px] font-bold uppercase tracking-[0.3em] mb-8 border-b border-berti-gold/10 pb-4">Imagens das Etapas da Jornada</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-berti-ink">
                {journeyImages.slice(0, 4).map((url: string, index: number) => (
                  <JourneyImageCard key={index} url={url} index={index} journeyImages={journeyImages} />
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="text-berti-gold text-[10px] font-bold uppercase tracking-[0.3em] mb-8 border-b border-berti-gold/10 pb-4">Banners e Seções Globais</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-berti-ink">
                <JourneyImageCard url={journeyImages[4]} index={4} journeyImages={journeyImages} />
              </div>
            </div>
            
            {!journeyImages?.length && (
              <div className="col-span-full py-12 text-center text-gray-400 text-sm italic">As imagens não foram configuradas ainda.</div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <Modal onClose={() => setIsAdding(false)}>
            {activeTab === 'projects' ? (
              <AddProjectForm onComplete={() => setIsAdding(false)} />
            ) : activeTab === 'concepts' ? (
              <AddConceptForm onComplete={() => setIsAdding(false)} />
            ) : (
              <AddTestimonialForm projects={projects} onComplete={() => setIsAdding(false)} />
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};



const Modal = ({ children, onClose }: any) => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-berti-dark/95 backdrop-blur-md"
  >
    <motion.div 
      initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }}
      className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-sm p-12 relative shadow-2xl border-t-8 border-berti-gold"
    >
      <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-berti-dark transition-colors"><X size={28} /></button>
      {children}
    </motion.div>
  </motion.div>
);

const uploadErrorMessage = (err: unknown) => {
  if (err instanceof Error) {
    if (err.message === 'VITE_IMGBB_API_KEY não configurada.') {
      return 'Chave de upload não configurada.';
    }

    if (err.message === 'Arquivo não informado.' || err.message === 'Arquivo inválido.') {
      return err.message;
    }

    if (err.message === 'API recusou o upload.') {
      return err.message;
    }
  }

  return 'Falha no envio de uma ou mais imagens.';
};

const uploadToImgbb = async (file: File): Promise<string> => {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error('VITE_IMGBB_API_KEY não configurada.');
  }

  if (!file) {
    throw new Error('Arquivo não informado.');
  }

  if (!file.type?.startsWith('image/')) {
    console.error('Arquivo inválido para upload ImgBB:', file);
    throw new Error('Arquivo inválido.');
  }

  console.info('Enviando imagem para ImgBB:', {
    name: file.name,
    type: file.type,
    size: file.size,
  });

  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: formData
  });

  const responseText = await response.text();
  let data: any = null;

  try {
    data = responseText ? JSON.parse(responseText) : null;
  } catch (err) {
    console.error('Resposta da ImgBB não é JSON válido:', {
      status: response.status,
      body: responseText,
      error: err,
    });
  }

  if (!response.ok) {
    console.error('ImgBB recusou o upload:', {
      status: response.status,
      body: data || responseText,
    });
    throw new Error('API recusou o upload.');
  }

  const uploadedUrl = data?.data?.display_url || data?.data?.url;

  if (!uploadedUrl) {
    throw new Error('Resposta da ImgBB não contém URL da imagem.');
  }

  return uploadedUrl;
};

const AddProjectForm = ({ onComplete }: any) => {
  const [form, setForm] = useState({ title: '', location: '', year: '', duration: '', area: '', system: '', description: '', photos: [] as string[] });
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;
    let firstError: unknown;

    for (const file of files) {
      try {
        const url = await uploadToImgbb(file);
        setForm(prev => ({ ...prev, photos: [...prev.photos, url] }));
        successCount++;
      } catch (err) {
        console.error(`Falha ao enviar ${file.name}:`, err);
        firstError ||= err;
        failCount++;
      }
    }

    if (failCount > 0) {
      alert(`${uploadErrorMessage(firstError)} ${successCount} enviadas, ${failCount} falharam.`);
    }
    
    setIsUploading(false);
  };

  const removePhoto = (index: number) => {
    setForm(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault(); setSubmitting(true);
    try { await addDoc(collection(db, 'projects'), { ...form, createdAt: Timestamp.now() }); onComplete(); }
    catch (err) { alert('Falha técnica ao salvar.'); } finally { setSubmitting(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <h3 className="text-4xl font-display italic mb-12 uppercase tracking-tighter">Novos Dados Técnicos</h3>
      <div className="space-y-6">
        <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full p-5 bg-gray-50 border outline-none border-gray-100 focus:border-berti-sage font-bold" placeholder="Nome da Obra" />
        <div className="grid grid-cols-2 gap-4">
          <input required value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="p-5 bg-gray-50 border outline-none font-medium" placeholder="Cidade / Bairro" />
          <input value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="p-5 bg-gray-50 border outline-none" placeholder="Ano de Entrega" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <input value={form.area} onChange={e => setForm({...form, area: e.target.value})} className="p-5 bg-gray-50 border outline-none" placeholder="Área (m²) EX: 450" />
          <input value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="p-5 bg-gray-50 border outline-none" placeholder="Meses de Obra" />
          <input value={form.system} onChange={e => setForm({...form, system: e.target.value})} className="p-5 bg-gray-50 border outline-none" placeholder="Sistema" />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Fotos do Projeto</label>
          <div className="p-5 bg-gray-50 border border-gray-100 outline-none">
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleFileUpload} 
              disabled={isUploading}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-berti-gold/10 file:text-berti-gold hover:file:bg-berti-gold/20"
            />
            {isUploading && <span className="text-xs text-gray-500 ml-2 animate-pulse">Enviando...</span>}
          </div>
          {form.photos.length > 0 && (
            <div className="flex gap-4 flex-wrap mt-4">
              {form.photos.map((url, idx) => (
                <div key={idx} className="relative w-24 h-24 group">
                  <img src={url} className="w-full h-full object-cover rounded" />
                  <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full p-5 bg-gray-50 border outline-none border-gray-100 focus:border-berti-sage" placeholder="Descrição técnica da obra" />
      </div>
      <button disabled={submitting || isUploading} type="submit" className="w-full py-6 bg-berti-dark text-white font-bold uppercase tracking-widest hover:bg-berti-sage transition-all">Publicar no Portfólio</button>
    </form>
  );
};

const AddConceptForm = ({ onComplete }: any) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleFileUpload = async (e: any) => {
    const files = Array.from(e.target.files) as File[];
    if (files.length === 0) return;
    
    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;
    let firstError: unknown;

    for (const file of files) {
      try {
        const url = await uploadToImgbb(file);
        setPhotos(prev => [...prev, url]);
        successCount++;
      } catch (err) {
        console.error(`Falha ao enviar ${file.name}:`, err);
        firstError ||= err;
        failCount++;
      }
    }

    if (failCount > 0) {
      alert(`${uploadErrorMessage(firstError)} ${successCount} enviadas, ${failCount} falharam.`);
    }
    
    setIsUploading(false);
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault(); 
    if (photos.length === 0) return;
    setSubmitting(true);
    try { 
      for (const url of photos) {
        await addDoc(collection(db, 'concepts'), { url, createdAt: Timestamp.now() }); 
      }
      onComplete(); 
    }
    catch (err) { alert('Falha ao salvar conceito.'); } finally { setSubmitting(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <div className="flex items-center gap-4 mb-12">
        <ImageIcon size={32} className="text-berti-gold" />
        <h3 className="text-4xl font-display italic uppercase tracking-tighter">Adicionar Fotos Conceito</h3>
      </div>
      <p className="text-gray-500 text-sm mb-6">Estas fotos aparecerão no carrossel de background "Da fundação ao acabamento" na página inicial.</p>
      <div className="space-y-6">
        <div className="space-y-3">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Imagens do Carrossel</label>
          <div className="p-5 bg-gray-50 border border-gray-100 outline-none">
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              onChange={handleFileUpload} 
              disabled={isUploading}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-berti-gold/10 file:text-berti-gold hover:file:bg-berti-gold/20"
            />
            {isUploading && <span className="text-xs text-gray-500 ml-2 animate-pulse">Enviando...</span>}
          </div>
          {photos.length > 0 && (
            <div className="flex gap-4 flex-wrap mt-4">
              {photos.map((url, idx) => (
                <div key={idx} className="relative w-32 h-32 group">
                  <img src={url} className="w-full h-full object-cover rounded shadow-lg" />
                  <button type="button" onClick={() => removePhoto(idx)} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <button disabled={submitting || isUploading || photos.length === 0} type="submit" className="w-full py-6 bg-berti-ink text-white font-bold uppercase tracking-widest hover:bg-berti-gold transition-all">Salvar no Carrossel</button>
    </form>
  );
};

const AddTestimonialForm = ({ projects, onComplete }: any) => {
  const [form, setForm] = useState({ clientName: '', workTitle: '', rating: 5, review: '', imageUrl: '' });
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async (e: any) => {
    e.preventDefault(); setSubmitting(true);
    try { await addDoc(collection(db, 'testimonials'), { ...form, createdAt: Timestamp.now() }); onComplete(); }
    catch (err) { alert('Erro no servidor.'); } finally { setSubmitting(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <h3 className="text-4xl font-display italic mb-12">Registro de Feedback</h3>
      <div className="space-y-6">
        <input required value={form.clientName} onChange={e => setForm({...form, clientName: e.target.value})} className="w-full p-5 bg-gray-50 border outline-none" placeholder="Nome Completo do Cliente" />
        <div className="grid grid-cols-2 gap-4">
          <select value={form.workTitle} onChange={e => setForm({...form, workTitle: e.target.value})} className="w-full p-5 bg-gray-50 border outline-none">
            <option value="">Selecione a obra de referência</option>
            {projects.map((p: any) => <option key={p.id} value={p.title}>{p.title}</option>)}
          </select>
          <input type="number" min="1" max="5" required value={form.rating} onChange={e => setForm({...form, rating: Number(e.target.value)})} className="w-full p-5 bg-gray-50 border outline-none" placeholder="Estrelas (1-5)" />
        </div>
        <textarea rows={5} required value={form.review} onChange={e => setForm({...form, review: e.target.value})} className="w-full p-5 bg-gray-50 border outline-none" placeholder="Relato do cliente..." />
        <input value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} className="w-full p-5 bg-gray-50 border outline-none" placeholder="URL da foto do cliente (Opcional)" />
      </div>
      <button disabled={submitting} type="submit" className="w-full py-6 bg-berti-ink text-white font-bold uppercase tracking-widest hover:bg-berti-gold transition-all">Publicar Avaliação</button>
    </form>
  );
};

const ClientJourneyPage = ({ images }: any) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const defaultImages = [
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1440&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1440&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503387762-592dea58ef23?q=80&w=1440&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1440&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1440&auto=format&fit=crop"
  ];
  const displayImages = defaultImages.map((img, i) => (images && images[i]) ? images[i] : img);
  
  const phases = [
    { title: "Diagnóstico", subtitle: "Passos 01, 02 e 03" },
    { title: "Estruturação", subtitle: "Passos 04, 05 e 06" },
    { title: "Planejamento", subtitle: "Passos 07, 08 e 09" },
    { title: "Execução e Entrega", subtitle: "Passos 10, 11 e 12" }
  ];

  const journeyImagesList = displayImages.slice(0, 4);
  const servicesImage = displayImages[4];

  const [activeIndex, setActiveIndex] = useState(0);

  const nextPhase = () => {
    setActiveIndex((prev) => (prev + 1) % journeyImagesList.length);
  };

  const prevPhase = () => {
    setActiveIndex((prev) => (prev - 1 + journeyImagesList.length) % journeyImagesList.length);
  };

  return (
    <div 
      className="min-h-screen bg-berti-light pt-32 pb-40 overflow-x-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="text-berti-gold text-[10px] font-bold uppercase tracking-[0.5em] mb-6 flex items-center justify-center gap-4">
             <span className="w-8 h-px bg-berti-gold/40"></span>
             A JORNADA DA OBRA
             <span className="w-8 h-px bg-berti-gold/40"></span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl mb-8 font-display tracking-tight text-berti-ink">
            A jornada da sua obra, <br className="hidden md:block" />
            <span className="italic font-serif font-light text-berti-sage">conduzida com clareza.</span>
          </h1>
          <p className="text-lg md:text-xl text-berti-ink/60 font-light max-w-3xl mx-auto leading-relaxed">
            Do primeiro contato à entrega das chaves, cada etapa é organizada para garantir previsibilidade, segurança e controle sobre o seu investimento.
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Navigation Tabs (Desktop & Tablet) */}
        <div className="hidden md:flex justify-between items-center mb-10 max-w-5xl mx-auto border-b border-gray-200">
          {phases.map((phase, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`flex-1 pb-6 relative group transition-all duration-300 ${
                activeIndex === index ? 'text-berti-gold' : 'text-berti-ink/50 hover:text-berti-ink'
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest">0{index + 1} {phase.title}</span>
                <span className="text-xs font-light">{phase.subtitle}</span>
              </div>
              {activeIndex === index && (
                <motion.div 
                  layoutId="activeTabDesktop"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-berti-gold"
                />
              )}
            </button>
          ))}
        </div>
        
        {/* Mobile Navigation Tabs (Scrollable) */}
        <div className="flex md:hidden overflow-x-auto snap-x hide-scrollbar mb-8 -mx-6 px-6 gap-6">
          {phases.map((phase, index) => (
            <button
              key={index}
              onClick={() => setActiveIndex(index)}
              className={`flex-none w-[70vw] snap-center pb-4 relative transition-all duration-300 ${
                activeIndex === index ? 'text-berti-gold' : 'text-berti-ink/50'
              }`}
            >
              <div className="flex flex-col items-start gap-1">
                 <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">0{index + 1} {phase.title}</span>
                 <span className="text-[10px] font-light">{phase.subtitle}</span>
              </div>
               {activeIndex === index && (
                <motion.div 
                  layoutId="activeTabMobile"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-berti-gold"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Gallery Slider - Full Width */}
      <div className="relative w-full bg-white mb-32 overflow-hidden group">
        <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center bg-gray-50/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 1.01 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 w-full h-full flex items-center justify-center p-0"
            >
              <img 
                src={journeyImagesList[activeIndex]} 
                alt={`Fase ${activeIndex + 1}: ${phases[activeIndex].title}`}
                className="w-full h-full object-contain"
              />
            </motion.div>
          </AnimatePresence>

          {/* Clickable Navigation Sides - High Accessibility UX */}
          <div className="absolute inset-0 flex z-10">
            <div 
              onClick={prevPhase}
              className="flex-1 cursor-w-resize flex items-center justify-start pl-8 opacity-0 hover:opacity-100 transition-opacity duration-300"
            >
               <motion.div 
                className="p-6 rounded-full bg-berti-ink/5 backdrop-blur-md text-berti-ink border border-berti-ink/10 hidden md:flex hover:bg-berti-ink hover:text-white transition-all shadow-xl"
               >
                 <ArrowLeft className="w-8 h-8" />
               </motion.div>
            </div>
            <div 
              onClick={nextPhase}
              className="flex-1 cursor-e-resize flex items-center justify-end pr-8 opacity-0 hover:opacity-100 transition-opacity duration-300"
            >
               <motion.div 
                className="p-6 rounded-full bg-berti-ink/5 backdrop-blur-md text-berti-ink border border-berti-ink/10 hidden md:flex hover:bg-berti-ink hover:text-white transition-all shadow-xl"
               >
                 <ChevronRight className="w-8 h-8" />
               </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12">
         {/* CTA Section */}
         <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-5xl mx-auto text-center bg-white p-12 md:p-24 rounded-[3rem] shadow-2xl shadow-berti-dark/5 border border-gray-100 relative overflow-hidden mb-32"
         >
            {/* Subtle background decoration */}
            <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
              <ShieldCheck className="w-72 h-72 text-berti-gold" />
            </div>

            <div className="relative z-10">
              <h3 className="text-3xl md:text-5xl lg:text-6xl font-display tracking-tight text-berti-ink mb-8">
                Quer entender em qual etapa <br className="hidden md:block"/>está o seu projeto?
              </h3>
              <p className="text-lg md:text-xl text-berti-ink/60 font-light mb-12 max-w-3xl mx-auto leading-relaxed">
                Fale com a Berti e receba uma orientação inicial sobre o melhor caminho para estruturar sua obra com tranquilidade.
              </p>
              <button 
                onClick={() => window.open('https://wa.me/5541991836651', '_blank')}
                className="inline-flex items-center gap-6 px-12 py-6 bg-berti-dark text-white font-bold text-[12px] uppercase tracking-[0.2em] hover:bg-berti-gold transition-all duration-500 group shadow-2xl shadow-berti-dark/20"
              >
                <Phone className="w-4 h-4 text-berti-gold group-hover:text-white transition-colors" />
                Iniciar diagnóstico do projeto
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
         </motion.div>

         {/* Nossos Serviços Section */}
         <div className="space-y-24 mb-32">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="text-center max-w-3xl mx-auto"
            >
               <div className="text-berti-gold-dark text-[10px] font-bold uppercase tracking-[0.5em] mb-6">SOLUÇÕES COMPLETAS</div>
               <h2 className="text-5xl md:text-7xl font-display tracking-tight text-berti-ink mb-8">Nossos Serviços</h2>
               <p className="text-lg text-berti-ink/60 font-light leading-relaxed">
                  Oferecemos um escopo completo de gestão e execução para que você tenha total segurança em todas as etapas da construção.
               </p>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, y: 30 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
               className="relative h-[500px] md:h-[700px] overflow-hidden rounded-[2rem] md:rounded-[4rem] mx-auto max-w-7xl"
            >
               <img 
                  src={servicesImage} 
                  alt="Nossos Serviços Berti" 
                  className="w-full h-full object-cover"
               />
            </motion.div>

            <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="max-w-7xl mx-auto w-full pt-12"
            >
               <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-berti-ink">
                  <div className="space-y-6">
                     <div className="w-12 h-px bg-berti-gold"></div>
                     <h4 className="text-xl font-bold tracking-tight">Gestão de Obras</h4>
                     <p className="text-base font-light leading-relaxed text-berti-ink/60">Controle rigoroso de cronogramas, custos e fornecedores com total transparência e relatórios detalhados.</p>
                  </div>
                  <div className="space-y-6">
                     <div className="w-12 h-px bg-berti-gold"></div>
                     <h4 className="text-xl font-bold tracking-tight">Execução Técnica</h4>
                     <p className="text-base font-light leading-relaxed text-berti-ink/60">Mão de obra especializada e engenharia de alta performance em cada etapa do processo construtivo.</p>
                  </div>
                  <div className="space-y-6">
                     <div className="w-12 h-px bg-berti-gold"></div>
                     <h4 className="text-xl font-bold tracking-tight">Consultoria Estratégica</h4>
                     <p className="text-base font-light leading-relaxed text-berti-ink/60">Análise técnica aprofundada, orçamentação precisa e estudos de viabilidade para investimentos seguros.</p>
                  </div>
               </div>
            </motion.div>
         </div>
      </div>
    </div>
  );
};

// --- Main App Logic ---

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [journeyImages, setJourneyImages] = useState<string[]>([
    "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1440&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1440&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503387762-592dea58ef23?q=80&w=1440&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1440&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1440&auto=format&fit=crop"
  ]);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Intro Splash Timer
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // Section Refs
  const heroRef = useRef<HTMLDivElement>(null);
  const posRef = useRef<HTMLDivElement>(null);
  const portfolioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [pathname]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const adminDoc = await getDoc(doc(db, 'admins', u.uid));
        const isMasterAdmin = u.email === 'berti@curitibaconstrutora.com.br';
        setIsAdmin(adminDoc.exists() || isMasterAdmin);
        if (isMasterAdmin && !adminDoc.exists()) {
          try { await setDoc(doc(db, 'admins', u.uid), { role: 'admin', email: u.email }); } catch (e) {}
        }
      } else { setIsAdmin(false); }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubProjects = onSnapshot(query(collection(db, 'projects'), orderBy('createdAt', 'desc')), (snapshot) => {
      setProjects(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      setProjectsLoading(false);
    });
    const unsubTestimonials = onSnapshot(query(collection(db, 'testimonials'), orderBy('createdAt', 'desc')), (snapshot) => {
      setTestimonials(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Testimonial)));
      setTestimonialsLoading(false);
    });
    const unsubConcepts = onSnapshot(query(collection(db, 'concepts'), orderBy('createdAt', 'desc')), (snapshot) => {
      setConcepts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Concept)));
    });
    const unsubJourney = onSnapshot(doc(db, 'config', 'journey'), (docSnap) => {
      const defaultImages = [
        "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1440&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1440&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1503387762-592dea58ef23?q=80&w=1440&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?q=80&w=1440&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1440&auto=format&fit=crop"
      ];
      
      if (docSnap.exists() && docSnap.data()?.images) {
        const dbImages = docSnap.data().images;
        const mergedImages = defaultImages.map((img, i) => dbImages[i] || img);
        setJourneyImages(mergedImages);
      } else {
        setJourneyImages(defaultImages);
      }
    });
    return () => { unsubProjects(); unsubTestimonials(); unsubConcepts(); unsubJourney(); };
  }, []);

  const handleProjectClick = (p: Project) => {
    setActiveProject(p);
    navigate(`/portfolio/${p.id}`);
  };

  const handleLogin = async () => {
    try { 
      await signInWithPopup(auth, new GoogleAuthProvider()); 
    } catch (err: any) {
      console.error("Login failed:", err);
      if (err.code === 'auth/popup-blocked') {
        alert('O popup de login foi bloqueado pelo seu navegador. Por favor, habilite popups para este site.');
      } else {
        alert('Erro ao realizar login: ' + err.message + '\n\nVerifique se o domínio está autorizado no Firebase.');
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {loading || showSplash ? (
        <motion.div 
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-screen w-full flex items-center justify-center bg-berti-ink text-berti-gold fixed inset-0 z-[999]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: [0, 1, 0.5, 1, 0.5, 1],
              scale: [0.95, 1, 1, 1, 1, 1]
            }}
            transition={{ 
              duration: 2.5,
              times: [0, 0.2, 0.4, 0.6, 0.8, 1],
              ease: "easeInOut"
            }}
            className="flex flex-col items-center gap-4"
          >
            <div className="font-display text-6xl md:text-8xl tracking-tightest font-black">
              Berti<span className="text-white">.</span>
            </div>
            <motion.div 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 0.4, width: 40 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="h-px bg-berti-gold"
            />
          </motion.div>
        </motion.div>
      ) : (
        <motion.div 
          key="content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="min-h-screen selection:bg-berti-gold selection:text-white"
        >
          <Navbar onAdminClick={() => navigate('/admin')} />
          
          <main className="pt-0">
            <AnimatePresence mode="wait">
              <motion.div key={location.pathname} className="w-full">
                <Routes location={location}>
                  <Route path="/" element={
                    <PageTransition>
                      <InstitutionalLanding 
                        sections={{ hero: heroRef, pos: posRef, portfolio: portfolioRef }}
                        projects={projects}
                        onProjectClick={handleProjectClick}
                        testimonials={testimonials} 
                        loading={testimonialsLoading} 
                        concepts={concepts.map(c => c.url)}
                      />
                    </PageTransition>
                  } />
                  <Route path="/jornada" element={
                    <PageTransition>
                      <ClientJourneyPage images={journeyImages} />
                    </PageTransition>
                  } />
                  
                  <Route path="/portfolio" element={
                    <PageTransition>
                      <section className="bg-white py-40 px-6 md:px-12">
                        <div className="max-w-7xl mx-auto">
                          <header className="mb-32">
                            <div className="text-berti-gold-dark text-xs font-bold uppercase tracking-[0.5em] mb-10">Portfólio Berti</div>
                            <h2 className="text-6xl md:text-9xl mb-12 font-extrabold tracking-tightest leading-none">Portfólio de <br /><span className="text-berti-gold-dark">Obras.</span></h2>
                            <p className="text-xl text-gray-500 max-w-2xl font-light leading-relaxed">
                              Condução técnica e execução de projetos que exigem precisão. Em cada entrega, refletimos nosso compromisso com o resultado final.
                            </p>
                          </header>
                          
                          {projectsLoading ? <LoadingSpinner /> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
                              {projects.map((p, idx) => (
                                <ProjectCard key={p.id} project={p} onClick={() => handleProjectClick(p)} idx={idx} />
                              ))}
                            </div>
                          )}
                        </div>
                      </section>
                    </PageTransition>
                  } />

                  <Route path="/portfolio/:projectId" element={
                    <PageTransition>
                      <ProjectDetailWrapper projects={projects} onBack={() => navigate('/portfolio')} />
                    </PageTransition>
                  } />

                  <Route path="/admin" element={
                    <PageTransition>
                      <div className={!user ? "min-h-screen bg-berti-ink flex flex-col justify-center items-center py-24 px-6 relative" : "min-h-screen bg-berti-light/50 flex flex-col justify-center items-center py-24 px-6"}>
                        {!user && <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1440&auto=format&fit=crop')] bg-cover bg-center opacity-5"></div>}
                        <div className="relative z-10 w-full flex justify-center">
                          {!user ? <AdminLogin onLogin={handleLogin} onBack={() => navigate('/')} /> : isAdmin ? <AdminDashboard projects={projects} testimonials={testimonials} concepts={concepts} journeyImages={journeyImages} onLogout={() => signOut(auth)} onViewSite={() => navigate('/')} /> : <ClientDashboard user={user} onLogout={() => signOut(auth)} />}
                        </div>
                      </div>
                    </PageTransition>
                  } />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </main>

          <Footer onHome={() => navigate('/')} />
          <WhatsAppButton />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const ProjectDetailWrapper = ({ projects, onBack }: any) => {
  const { projectId } = useParams();
  const project = projects.find((p: any) => p.id === projectId);
  if (!project) return <div className="h-screen flex items-center justify-center">Obra não encontrada.</div>;
  return <ProjectDetail project={project} onBack={onBack} />;
};
