import React from 'react';
import { br, pctFmt } from '../../utils/formatters';
import type { Kpis } from '../../types';

interface DreTabProps {
  kpis: Kpis;
}

export const DreTab: React.FC<DreTabProps> = ({ kpis }) => {
  const k = kpis;
  const pos = (k.lucro_liquido_final ?? 0) >= 0;
  const corStatus = pos ? '#2ECC71' : '#E74C3C';
  const textoStatus = pos ? 'RESULTADO POSITIVO' : 'RESULTADO NEGATIVO';

  const baseReceita = k.receita_bruta || 1;
  const deducoes = [
    { nome: 'Fretes', val: k.frete },
    { nome: 'Impostos', val: k.impostos_venda },
    { nome: 'Comissões', val: k.comissao },
    { nome: 'Outros', val: k.outros },
    { nome: 'Desp. Admin.', val: k.despesas_admin },
  ];

  const margens = [
    {
      nome: 'Margem Bruta',
      val: k.margem_bruta,
      desc: '% após custos diretos (sobre faturamento)',
      cor: k.margem_bruta >= 15 ? '#2ECC71' : k.margem_bruta >= 0 ? '#F59E0B' : '#E74C3C',
    },
    {
      nome: 'Margem Operacional',
      val: k.margem_op,
      desc: '% após fretes, impostos e comissões',
      cor: k.margem_op >= 15 ? '#2ECC71' : k.margem_op >= 0 ? '#F59E0B' : '#E74C3C',
    },
    {
      nome: 'Margem Líquida Final',
      val: k.margem_liq,
      desc: '% após todas as despesas e financeiro',
      cor: k.margem_liq >= 15 ? '#2ECC71' : k.margem_liq >= 0 ? '#F59E0B' : '#E74C3C',
    },
    {
      nome: 'Desp. Adm/Lucro Bruto',
      val: k.indice_desp,
      desc: '% da receita bruta consumida por despesas',
      cor: k.indice_desp <= 60 ? '#2ECC71' : k.indice_desp <= 80 ? '#F59E0B' : '#E74C3C',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#2A2D38]">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white font-heading m-0">
            Demonstração do Resultado (DRE)
          </h2>
          <span className="text-xs text-[#8B8FA8]">
            Período selecionado via filtros consolidados
          </span>
        </div>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wide uppercase font-heading"
          style={{
            backgroundColor: `${corStatus}15`,
            borderColor: corStatus,
            color: corStatus,
          }}
        >
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: corStatus }} />
          <span>{textoStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: DRE Estruturada */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6 sm:p-8 space-y-3">
            {/* 1. Receita Bruta */}
            <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/[0.04]">
              <span className="text-sm sm:text-base font-extrabold text-[#E0E2EB]">
                (+) Receita / Lucro Bruto dos Contratos
              </span>
              <span className="text-base sm:text-lg font-extrabold font-mono text-[#F29124]">
                {br(k.receita_bruta)}
              </span>
            </div>

            {/* Deduções Operacionais */}
            <div className="flex items-center justify-between py-2 px-4 border-b border-[#2A2D38] text-xs sm:text-sm">
              <span className="text-[#C8CAD4]">(-) Total de Fretes</span>
              <span className="font-mono text-[#E74C3C]">{br(-k.frete)}</span>
            </div>

            <div className="flex items-center justify-between py-2 px-4 border-b border-[#2A2D38] text-xs sm:text-sm">
              <span className="text-[#C8CAD4]">(-) Impostos sobre Contratos</span>
              <span className="font-mono text-[#E74C3C]">{br(-k.impostos_venda)}</span>
            </div>

            <div className="flex items-center justify-between py-2 px-4 border-b border-[#2A2D38] text-xs sm:text-sm">
              <span className="text-[#C8CAD4]">(-) Comissões Pagas</span>
              <span className="font-mono text-[#E74C3C]">{br(-k.comissao)}</span>
            </div>

            <div className="flex items-center justify-between py-2 px-4 border-b border-[#2A2D38] text-xs sm:text-sm">
              <span className="text-[#C8CAD4]">(-) Outros Gastos Contrato</span>
              <span className="font-mono text-[#E74C3C]">{br(-k.outros)}</span>
            </div>

            <div className="flex items-center justify-between py-2 px-4 text-xs sm:text-sm">
              <span className="text-[#C8CAD4]">(-) Custo Operacional (FETHAB, Terceiros)</span>
              <span className="font-mono text-[#E74C3C]">{br(-k.custo_operacional)}</span>
            </div>

            {/* Resultado Operacional */}
            <div className="flex items-center justify-between p-4 bg-[#3B82F6]/10 rounded-xl border border-[#3B82F6]/20 my-2">
              <span className="text-sm sm:text-base font-bold text-[#E0E2EB]">
                (=) Lucro Líquido Operacional
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-[#3B82F6]">
                {br(k.lucro_operacional)}
              </span>
            </div>

            {/* Despesas Administrativas */}
            <div className="flex items-center justify-between py-2.5 px-4 border-b border-[#2A2D38] text-xs sm:text-sm">
              <span className="text-[#C8CAD4]">(-) Despesas Administrativas</span>
              <span className="font-mono text-[#E74C3C]">{br(-k.despesas_admin)}</span>
            </div>

            {/* Receitas Extras (ICMS) */}
            <div className="flex items-center justify-between py-2.5 px-4 border-b border-[#2A2D38] text-xs sm:text-sm">
              <span className="text-[#C8CAD4]">(+) Apropriação de Crédito ICMS</span>
              <span className="font-mono text-[#2ECC71]">{br(k.receitas_extras)}</span>
            </div>

            {/* Financeiro */}
            <div className="flex items-center justify-between py-2.5 px-4 border-b border-[#2A2D38] text-xs sm:text-sm">
              <span className="text-[#C8CAD4]">(+/-) Resultado Financeiro</span>
              <span
                className="font-mono font-bold"
                style={{ color: k.resultado_financeiro >= 0 ? '#2ECC71' : '#E74C3C' }}
              >
                {br(k.resultado_financeiro)}
              </span>
            </div>

            {/* Lucro Líquido Final */}
            <div
              className="flex items-center justify-between p-5 rounded-xl border mt-4"
              style={{
                backgroundColor: pos ? 'rgba(46,204,113,0.1)' : 'rgba(231,76,60,0.1)',
                borderColor: pos ? '#2ECC71' : '#E74C3C',
              }}
            >
              <span className="text-base sm:text-lg font-extrabold text-white uppercase tracking-tight">
                (=) LUCRO LÍQUIDO FINAL
              </span>
              <span
                className="text-xl sm:text-2xl font-black font-mono"
                style={{ color: pos ? '#2ECC71' : '#E74C3C' }}
              >
                {br(k.lucro_liquido_final)}
              </span>
            </div>
          </div>

          {/* Cards de Impacto Financeiro (Deduções) */}
          <div>
            <h4 className="text-sm font-bold text-[#E0E2EB] font-heading mb-3 uppercase tracking-wider">
              Impacto Financeiro (Deduções da Receita)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {deducoes.map((item, idx) => {
                const pct = (item.val / baseReceita) * 100;
                return (
                  <div
                    key={idx}
                    className="bg-[#16181F] border border-[#2A2D38] rounded-xl p-3.5 text-center flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[10px] text-[#8B8FA8] font-bold uppercase tracking-wider mb-1 truncate">
                        {item.nome}
                      </div>
                      <div className="text-sm font-bold text-[#E74C3C] font-mono truncate" title={br(item.val)}>
                        {br(item.val)}
                      </div>
                      <div className="text-[11px] text-[#F59E0B] font-medium mt-1">
                        {pctFmt(pct)} da receita
                      </div>
                    </div>
                    <div className="bg-[#2A2D38] rounded-full h-1.5 mt-3 overflow-hidden">
                      <div
                        className="bg-[#E74C3C] h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coluna 3: Análise de Margens */}
        <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6 h-fit space-y-4">
          <h4 className="text-base font-bold text-[#E0E2EB] font-heading m-0 tracking-tight">
            Análise de Margens
          </h4>
          <p className="text-xs text-[#8B8FA8] -mt-2">
            Métricas de rentabilidade e retenção de receita
          </p>

          <div className="space-y-3.5 pt-2">
            {margens.map((m, i) => (
              <div
                key={i}
                className="p-4 bg-[#1E2029] rounded-xl border border-[#2A2D38] transition-all hover:border-[#3E4252]"
                style={{ borderLeft: `4px solid ${m.cor}` }}
              >
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B8FA8]">
                  {m.nome}
                </div>
                <div
                  className="text-2xl font-black font-heading mt-1"
                  style={{ color: m.cor }}
                >
                  {pctFmt(m.val)}
                </div>
                <div className="text-[11px] text-[#8B8FA8] mt-1 font-medium">
                  {m.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
