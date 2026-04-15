import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogIn, Mail, Loader2, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { signInWithOtp } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await signInWithOtp(email);
      if (error) throw error;
      setMessage({ type: 'success', text: 'Link de login enviado! Verifique seu e-mail.' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao enviar o link de login.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-[400px] animate-fade-in">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-green/10 border border-brand-green/30 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(63,185,80,0.1)]">
            <Sparkles className="text-brand-green w-8 h-8" />
          </div>
          <h1 className="text-[28px] font-bold text-t1 tracking-tight">EVIS AI</h1>
          <p className="text-t3 text-[14px] mt-1">Sua obra controlada por inteligência.</p>
        </div>

        {/* Login Card */}
        <div className="bg-s1 border border-b1 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-green/50 to-transparent"></div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[12px] font-bold text-t3 uppercase tracking-wider mb-2 ml-1">
                E-mail institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-t4" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@evis.ai"
                  required
                  className="w-full bg-s2 border border-b1 rounded-xl py-3 pl-10 pr-4 text-t1 placeholder:text-t4 outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green/20 transition-all text-[15px]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-green hover:bg-brand-green2 disabled:opacity-50 disabled:cursor-not-allowed text-bg font-extrabold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_12px_rgba(63,185,80,0.2)] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Enviar magic link</span>
                </>
              )}
            </button>
          </form>

          {message && (
            <div className={`mt-6 p-4 rounded-xl border text-[13px] font-medium animate-fade-in ${
              message.type === 'success' 
                ? 'bg-brand-green/10 border-brand-green/30 text-brand-green' 
                : 'bg-brand-red/10 border-brand-red/30 text-brand-red'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="text-center text-t4 text-[12px] mt-8 px-4">
          Ao entrar, você concorda com nossos termos de serviço e política de privacidade da Berti Construtora.
        </p>
      </div>
    </div>
  );
}
