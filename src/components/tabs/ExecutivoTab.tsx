import React from 'react';
import { Download, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';
import { br, brMil, pctFmt, numFmt } from '../../utils/formatters';
import { exportToExcel } from '../../utils/dataLoader';
import type { Kpis, LucroRow, DespesaRow } from '../../types';

interface ExecutivoTabProps {
  kpis: Kpis;
  df_lf: LucroRow[];
  df_df: DespesaRow[];
}

export const ExecutivoTab: React.FC<ExecutivoTabProps> = ({ kpis, df_lf }) => {
  const k = kpis;
  const pos = k.lucro_liquido_final >= 0;

  // Alertas
  const alertas: { tipo: string; msg: string; cor: string }[] = [];
  if (k.indice_desp > 80) {
    alertas.push({
      tipo: 'Alerta de Custo',
      msg: `Despesas administrativas consomem ${pctFmt(k.indice_desp)} da receita bruta gerada.`,
      cor: '#EF4444',
    });
  } else if (k.indice_desp > 60) {
    alertas.push({
      tipo: 'Atenção Operacional',
      msg: `Índice de despesas sobre receita em ${pctFmt(k.indice_desp)}.`,
      cor: '#F59E0B',
    });
  }

  if (k.lucro_liquido_final < 0) {
    alertas.push({
      tipo: 'Resultado Deficitário',
      msg: 'Resultado líquido consolidado negativo no período selecionado.',
      cor: '#EF4444',
    });
  }

  if (alertas.length === 0) {
    alertas.push({
      tipo: 'Operação Saudável',
      msg: 'Todos os indicadores operacionais e financeiros em conformidade.',
      cor: '#10B981',
    });
  }

  // Performance por Commodity
  const prodMap = new Map<string, { produto: string; peso: number; lb: number; ll: number }>();
  df_lf.forEach(r => {
    const p = r.Produto || 'Outros';
    const curr = prodMap.get(p) || { produto: p, peso: 0, lb: 0, ll: 0 };
    curr.peso += r['Peso Kg'] || 0;
    curr.lb += r['Lucro Bruto'] || 0;
    curr.ll += r['Lucro Líq.'] || 0;
    prodMap.set(p, curr);
  });
  const prodRanking = Array.from(prodMap.values()).sort((a, b) => b.ll - a.ll);

  const handleExportRelatorio = () => {
    const dreData = [
      { Rubrica: 'Faturamento Total (Vendas)', 'Valor (R$)': k.faturamento_total },
      { Rubrica: 'Lucro Bruto (Contratos)', 'Valor (R$)': k.receita_bruta },
      { Rubrica: '(-) Total de Fretes', 'Valor (R$)': -k.frete },
      { Rubrica: '(-) Impostos sobre Venda', 'Valor (R$)': -k.impostos_venda },
      { Rubrica: '(-) Comissões Pagas', 'Valor (R$)': -k.comissao },
      { Rubrica: '(-) Outros Gastos', 'Valor (R$)': -k.outros },
      { Rubrica: '(=) RESULTADO OPERACIONAL LÍQUIDO', 'Valor (R$)': k.lucro_operacional },
      { Rubrica: '(-) Despesas Administrativas Fixas', 'Valor (R$)': -k.despesas_admin },
      { Rubrica: '(+/-) Resultado Financeiro', 'Valor (R$)': k.resultado_financeiro },
      { Rubrica: '(=) LUCRO LÍQUIDO FINAL', 'Valor (R$)': k.lucro_liquido_final },
    ];
    exportToExcel(dreData, 'Relatorio_Executivo_Bela_Cereais', 'Resumo Executivo');
  };

  return (
    <div className="space-y-6">
      {/* Banner Executivo */}
      <div className="bg-[#12141C] border border-white/[0.08] rounded-xl p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold text-[#8E93A6] uppercase tracking-wider font-heading mb-1">
              Bela Cereais · Resumo Executivo da Operação
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading m-0 tracking-tight">
              Comercialização & Margens de Grãos
            </h2>
            <p className="text-xs text-[#8E93A6] mt-1">
              Consolidação financeira e operacional para diretoria e conselho
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: pos ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                borderColor: pos ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
                color: pos ? '#10B981' : '#EF4444',
              }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: pos ? '#10B981' : '#EF4444' }} />
              <span>{pos ? 'Superavitário' : 'Deficitário'}</span>
            </div>

            <button
              onClick={handleExportRelatorio}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#E58B20] hover:bg-[#ff9d2e] text-black font-bold text-xs transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Resumo</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5 KPIs de Destaque */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { titulo: 'Receita / Lucro Bruto', val: brMil(k.receita_bruta), cor: '#E58B20' },
          { titulo: 'Lucro Líq. Operacional', val: brMil(k.lucro_operacional), cor: k.lucro_operacional >= 0 ? '#10B981' : '#EF4444' },
          { titulo: 'Lucro Líquido Final', val: brMil(k.lucro_liquido_final), cor: pos ? '#10B981' : '#EF4444' },
          { titulo: 'Margem Líquida', val: pctFmt(k.margem_liq), cor: k.margem_liq >= 0 ? '#10B981' : '#EF4444' },
          { titulo: 'Desp. sobre Receita', val: pctFmt(k.indice_desp), cor: k.indice_desp <= 60 ? '#10B981' : k.indice_desp <= 80 ? '#F59E0B' : '#EF4444' },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-[#12141C] border border-white/[0.07] rounded-xl p-4 text-center"
          >
            <div className="text-[10px] text-[#8E93A6] uppercase font-bold tracking-wider mb-1 truncate">
              {item.titulo}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono tabular-nums" style={{ color: item.cor }}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* DRE Consolidada e Análise de Risco */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* DRE (3 cols) */}
        <div className="lg:col-span-3 bg-[#12141C] border border-white/[0.07] rounded-xl p-5 space-y-3">
          <SectionHeader titulo="DRE Consolidada" subtitulo="Demonstrativo contábil em rubricas" />

          <div className="overflow-hidden rounded-lg border border-white/[0.06] mt-2">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#161822] text-[11px] font-semibold text-[#8E93A6] uppercase border-b border-white/[0.06]">
                <tr>
                  <th className="py-2.5 px-4">Rubrica</th>
                  <th className="py-2.5 px-4 text-right">Valor Total (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                <tr>
                  <td className="py-2.5 px-4 text-white font-medium">Lucro Bruto (Contratos)</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-white">{br(k.receita_bruta)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#C8CAD4]">(-) Custos de Frete</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#EF4444]">{br(-k.frete)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#C8CAD4]">(-) Impostos e Taxas</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#EF4444]">{br(-k.impostos_venda)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#C8CAD4]">(-) Comissões sobre Venda</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#EF4444]">{br(-k.comissao)}</td>
                </tr>
                <tr className="bg-white/[0.02] font-bold">
                  <td className="py-2.5 px-4 text-[#3B82F6] uppercase">= RESULTADO OPERACIONAL</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#3B82F6]">{br(k.lucro_operacional)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#C8CAD4]">(-) Despesas Administrativas Fixas</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#EF4444]">{br(-k.despesas_admin)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#C8CAD4]">(+/-) Resultado Financeiro</td>
                  <td
                    className="py-2.5 px-4 text-right font-mono font-medium"
                    style={{ color: k.resultado_financeiro >= 0 ? '#10B981' : '#EF4444' }}
                  >
                    {br(k.resultado_financeiro)}
                  </td>
                </tr>
                <tr className="bg-white/[0.04] font-black">
                  <td className="py-3 px-4 text-[#E58B20] uppercase text-sm">= LUCRO LÍQUIDO FINAL</td>
                  <td
                    className="py-3 px-4 text-right font-mono text-base font-black"
                    style={{ color: pos ? '#10B981' : '#EF4444' }}
                  >
                    {br(k.lucro_liquido_final)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Análise de Risco & Destaques (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Análise de Risco */}
          <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-5 space-y-2.5">
            <SectionHeader titulo="Diagnóstico Operacional" subtitulo="Monitoramento de riscos e estrutura de custos" />
            <div className="space-y-2 pt-1">
              {alertas.map((a, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border text-xs"
                  style={{
                    backgroundColor: `${a.cor}08`,
                    borderColor: `${a.cor}25`,
                  }}
                >
                  <div className="font-bold uppercase tracking-wider mb-0.5 text-[11px]" style={{ color: a.cor }}>
                    {a.tipo}
                  </div>
                  <div className="text-[#C8CAD4] leading-relaxed">{a.msg}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Destaques Operacionais */}
          <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-5">
            <SectionHeader titulo="Sumário de Volumes" />
            <div className="space-y-2 text-xs pt-1 divide-y divide-white/[0.05]">
              <div className="flex justify-between py-2">
                <span className="text-[#8E93A6]">Contratos Ativos:</span>
                <span className="font-bold text-white font-mono">{k.n_contratos}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8E93A6]">Ticket Médio:</span>
                <span className="font-bold text-[#E58B20] font-mono">{brMil(k.ticket_medio)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8E93A6]">Lucro p/ Saca:</span>
                <span className="font-bold text-[#10B981] font-mono">{br(k.lucro_por_saca)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8E93A6]">Volume Negociado:</span>
                <span className="font-bold text-white font-mono">{numFmt(k.sacas_total)} scs</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8E93A6]">Peso Total:</span>
                <span className="font-bold text-white font-mono">{numFmt(k.peso_total)} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commodity Performance Table */}
      <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-5">
        <SectionHeader
          titulo="Performance Consolidada por Grão"
          subtitulo="Ranking de margem gerada por commodity"
        />
        <div className="overflow-x-auto rounded-lg border border-white/[0.06] mt-3">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161822] text-[11px] font-semibold text-[#8E93A6] uppercase border-b border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-4">Commodity</th>
                <th className="py-2.5 px-4 text-right">Peso Kg</th>
                <th className="py-2.5 px-4 text-right">L. Bruto</th>
                <th className="py-2.5 px-4 text-right">L. Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {prodRanking.map((p, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-4 font-semibold text-white">{p.produto}</td>
                  <td className="py-2.5 px-4 text-right font-mono">{numFmt(p.peso)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#E58B20]">{br(p.lb)}</td>
                  <td
                    className="py-2.5 px-4 text-right font-mono font-bold"
                    style={{ color: p.ll >= 0 ? '#10B981' : '#EF4444' }}
                  >
                    {br(p.ll)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
