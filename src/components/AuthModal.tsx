import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.trim() === 'bela2026') {
      localStorage.setItem('bela_cereais_auth', 'true');
      onSuccess();
    } else {
      setErro(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A0B0F]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#16181F] border border-[#2A2D38] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#F29124]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#1E2029] border border-[#2A2D38] flex items-center justify-center mx-auto mb-4 text-[#F29124] shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white font-heading tracking-tight">
            Acesso Restrito
          </h2>
          <p className="text-xs text-[#8B8FA8] mt-1.5 font-medium">
            Bela Cereais — Dashboard Executivo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#8B8FA8] uppercase tracking-wider mb-2">
              Digite a senha para acessar o dashboard:
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErro(false); }}
              placeholder="Digite sua senha..."
              autoFocus
              className="w-full bg-[#1E2029] border border-[#2A2D38] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#F29124] transition-colors"
            />
          </div>

          {erro && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[#E74C3C]/10 border border-[#E74C3C]/30 text-xs text-[#E74C3C]">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Senha incorreta! Verifique as credenciais de acesso.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-[#F29124] hover:bg-[#ff9d2e] text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
          >
            <span>Acessar Painel</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-[#6B7080] inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2ECC71]" />
              Senha padrão do sistema: <code className="text-[#F29124] font-mono font-bold">bela2026</code>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
