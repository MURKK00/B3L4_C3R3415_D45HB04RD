import React from 'react';
import { X, FileText, Building2, User, Truck, ShieldAlert, Award, ArrowUpRight } from 'lucide-react';
import { br, numFmt, pctFmt } from '../utils/formatters';
import type { LucroRow } from '../types';

interface ContractDrawerProps {
  contrato: LucroRow | null;
  onClose: () => void;
}

export const ContractDrawer: React.FC<ContractDrawerProps> = ({ contrato, onClose }) => {
  if (!contrato) return null;

  const margemContrato = contrato['Lucro Bruto'] > 0
    ? (contrato['Lucro Líq.'] / contrato['Lucro Bruto']) * 100
    : 0;

  const positivo = contrato['Lucro Líq.'] >= 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="relative w-full max-w-md bg-[#161822] border-l border-white/[0.1] h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-start justify-between bg-[#12141C]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono text-[#E58B20] font-bold">
                {contrato['Contrato V'] || 'CONTRATO'}
              </span>
              {contrato['Contrato C'] && (
                <span className="text-[11px] font-mono text-[#8E93A6]">
                  / {contrato['Contrato C']}
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-white font-heading">
              {contrato.Produto}
            </h3>
            <p className="text-xs text-[#8E93A6] mt-0.5">
              {contrato.Empresa} · {contrato.Mês_Filtro}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8E93A6] hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 text-xs">
          {/* Main Profit Card */}
          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: positivo ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
              borderColor: positivo ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
            }}
          >
            <div className="text-[11px] uppercase font-semibold text-[#8E93A6] mb-1">
              Resultado Líquido do Contrato
            </div>
            <div
              className="text-2xl font-bold font-mono"
              style={{ color: positivo ? '#10B981' : '#EF4444' }}
            >
              {br(contrato['Lucro Líq.'])}
            </div>
            <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-white/[0.06] text-[#8E93A6]">
              <span>Margem Líquida:</span>
              <span className="font-mono font-bold text-white">{pctFmt(margemContrato)}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1 text-[#8E93A6]">
              <span>Lucro por Saca / Ton:</span>
              <span className="font-mono font-bold text-[#E58B20]">{br(contrato['Lucro Sc/Tn'])}</span>
            </div>
          </div>

          {/* Volume & Physicals */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E93A6]">
              Dados Físicos & Volume
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#12141C] border border-white/[0.06] rounded-xl p-3">
                <div className="text-[10px] text-[#8E93A6] uppercase">Peso Negociado</div>
                <div className="text-sm font-bold font-mono text-white mt-1">
                  {numFmt(contrato['Peso Kg'])} kg
                </div>
              </div>
              <div className="bg-[#12141C] border border-white/[0.06] rounded-xl p-3">
                <div className="text-[10px] text-[#8E93A6] uppercase">Sacas / Toneladas</div>
                <div className="text-sm font-bold font-mono text-white mt-1">
                  {numFmt(contrato['Sacas/Ton'])} scs
                </div>
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E93A6]">
              Partes Negociais
            </h4>
            <div className="bg-[#12141C] border border-white/[0.06] rounded-xl p-3.5 space-y-3">
              <div>
                <div className="text-[10px] text-[#8E93A6] uppercase flex items-center gap-1 mb-1">
                  <Building2 className="w-3 h-3 text-[#E58B20]" />
                  <span>Fornecedor (Origem)</span>
                </div>
                <div className="font-semibold text-white leading-relaxed">
                  {contrato.Fornecedor || 'Não Informado'}
                </div>
              </div>
              <div className="border-t border-white/[0.06] pt-2.5">
                <div className="text-[10px] text-[#8E93A6] uppercase flex items-center gap-1 mb-1">
                  <User className="w-3 h-3 text-[#3B82F6]" />
                  <span>Cliente (Destino)</span>
                </div>
                <div className="font-semibold text-white leading-relaxed">
                  {contrato.Cliente || 'Não Informado'}
                </div>
              </div>
            </div>
          </div>

          {/* DRE deste Contrato */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#8E93A6]">
              Composição Contábil do Contrato
            </h4>
            <div className="bg-[#12141C] border border-white/[0.06] rounded-xl divide-y divide-white/[0.06]">
              <div className="flex justify-between p-3 font-semibold">
                <span className="text-[#C8CAD4]">(+) Lucro Bruto</span>
                <span className="font-mono text-[#E58B20]">{br(contrato['Lucro Bruto'])}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-[#8E93A6]">(-) Total Frete</span>
                <span className="font-mono text-[#EF4444]">{br(-contrato['Total Frete'])}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-[#8E93A6]">(-) Impostos</span>
                <span className="font-mono text-[#EF4444]">{br(-contrato.Impostos)}</span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-[#8E93A6]">(-) Comissão</span>
                <span className="font-mono text-[#EF4444]">{br(-contrato.Comissão)}</span>
              </div>
              {contrato.Outros > 0 && (
                <div className="flex justify-between p-3">
                  <span className="text-[#8E93A6]">(-) Outros Gastos</span>
                  <span className="font-mono text-[#EF4444]">{br(-contrato.Outros)}</span>
                </div>
              )}
              <div className="flex justify-between p-3 bg-white/[0.02] font-bold">
                <span className="text-white">(=) Lucro Líquido</span>
                <span
                  className="font-mono"
                  style={{ color: positivo ? '#10B981' : '#EF4444' }}
                >
                  {br(contrato['Lucro Líq.'])}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] mt-auto bg-[#12141C]">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-semibold text-xs transition-colors"
          >
            Fechar Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};
