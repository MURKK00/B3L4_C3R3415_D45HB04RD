import React from 'react';
import { Download, AlertTriangle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { SectionHeader } from '../SectionHeader';
import { br, brMil, pctFmt, numFmt } from '../../utils/formatters';
import type { Kpis, LucroRow, DespesaRow } from '../../types';

interface ExecutivoTabProps {
  kpis: Kpis;
  df_lf: LucroRow[];
  df_df: DespesaRow[];
}

export const ExecutivoTab: React.FC<ExecutivoTabProps> = ({ kpis, df_lf, df_df }) => {
  const k = kpis;
  const pos = k.lucro_liquido_final >= 0;

  // Alertas
  const alertas: { tipo: string; msg: string; cor: string }[] = [];
  if (k.indice_desp > 80) {
    alertas.push({
      tipo: '🔴 CRÍTICO',
      msg: `Despesas administrativas consomem ${pctFmt(k.indice_desp)} da receita bruta`,
      cor: '#E74C3C',
    });
  } else if (k.indice_desp > 60) {
    alertas.push({
      tipo: '🟡 ATENÇÃO',
      msg: `Índice de despesas sobre receita elevado: ${pctFmt(k.indice_desp)}`,
      cor: '#F59E0B',
    });
  }

  if (k.lucro_liquido_final < 0) {
    alertas.push({
      tipo: '🔴 CRÍTICO',
      msg: 'Resultado líquido consolidado deficitário no período',
      cor: '#E74C3C',
    });
  }

  if (alertas.length === 0) {
    alertas.push({
      tipo: '🟢 SAUDÁVEL',
      msg: 'Todos os indicadores operacionais e financeiros dentro dos parâmetros esperados',
      cor: '#2ECC71',
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
    const wb = XLSX.utils.book_new();

    // 1. DRE Sheet
    const dreData = [
      ['RELATÓRIO EXECUTIVO — GRUPO BELA CEREAIS'],
      ['Indicador', 'Valor (R$)'],
      ['Lucro Bruto (Contratos)', k.receita_bruta],
      ['(-) Total de Fretes', -k.frete],
      ['(-) Impostos sobre Venda', -k.impostos_venda],
      ['(-) Comissões Pagas', -k.comissao],
      ['(-) Outros Gastos', -k.outros],
      ['(=) LUCRO LÍQUIDO OPERACIONAL', k.lucro_operacional],
      ['(-) Despesas Administrativas Fixas', -k.despesas_admin],
      ['(+) Apropriação Crédito ICMS', k.receitas_extras],
      ['(+/-) Resultado Financeiro', k.resultado_financeiro],
      ['(=) LUCRO LÍQUIDO FINAL', k.lucro_liquido_final],
      [''],
      ['Margem Bruta (%)', k.margem_bruta],
      ['Margem Operacional (%)', k.margem_op],
      ['Margem Líquida (%)', k.margem_liq],
      ['Índice Despesas (%)', k.indice_desp],
    ];
    const wsDre = XLSX.utils.aoa_to_sheet(dreData);
    XLSX.utils.book_append_sheet(wb, wsDre, 'DRE Executiva');

    // 2. Commodities Sheet
    const wsProd = XLSX.utils.json_to_sheet(
      prodRanking.map(p => ({
        Commodity: p.produto,
        'Peso (Kg)': p.peso,
        'Lucro Bruto (R$)': p.lb,
        'Lucro Líquido (R$)': p.ll,
      }))
    );
    XLSX.utils.book_append_sheet(wb, wsProd, 'Commodities');

    XLSX.writeFile(wb, 'Relatorio_Executivo_Bela_Cereais.xlsx');
  };

  return (
    <div className="space-y-6">
      {/* Banner Executivo */}
      <div className="bg-gradient-to-r from-[#16181F] to-[#1E2029] border border-[#2A2D38] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-[#8B8FA8] uppercase tracking-widest font-heading mb-1">
              Resumo Executivo — Grupo Bela Cereais
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-heading m-0 tracking-tight">
              Comercialização de Grãos
            </h2>
            <p className="text-xs text-[#8B8FA8] mt-1.5">
              Consolidação gerencial e financeira para diretoria e investidores
            </p>
          </div>
          <div className="text-right flex items-center gap-3">
            <div className="text-3xl">{pos ? '✅' : '🚨'}</div>
            <div>
              <div
                className="text-sm sm:text-base font-extrabold font-heading"
                style={{ color: pos ? '#2ECC71' : '#E74C3C' }}
              >
                {pos ? 'Superavitário' : 'Deficitário'}
              </div>
              <div className="text-[11px] text-[#8B8FA8]">Status do Período</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 KPIs de Destaque */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { titulo: 'Receita / Lucro Bruto', val: brMil(k.receita_bruta), cor: '#F29124' },
          { titulo: 'Lucro Líq. Operacional', val: brMil(k.lucro_operacional), cor: k.lucro_operacional >= 0 ? '#2ECC71' : '#E74C3C' },
          { titulo: 'Lucro Líquido Final', val: brMil(k.lucro_liquido_final), cor: pos ? '#2ECC71' : '#E74C3C' },
          { titulo: 'Margem Líquida', val: pctFmt(k.margem_liq), cor: k.margem_liq >= 0 ? '#2ECC71' : '#E74C3C' },
          { titulo: 'Desp. sobre Receita', val: pctFmt(k.indice_desp), cor: k.indice_desp <= 60 ? '#2ECC71' : k.indice_desp <= 80 ? '#F59E0B' : '#E74C3C' },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-[#16181F] border border-[#2A2D38] rounded-xl p-4 text-center"
            style={{ borderTop: `3px solid ${item.cor}` }}
          >
            <div className="text-[10px] text-[#8B8FA8] uppercase font-bold tracking-wider mb-1 truncate">
              {item.titulo}
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono" style={{ color: item.cor }}>
              {item.val}
            </div>
          </div>
        ))}
      </div>

      {/* DRE Consolidada e Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* DRE Consolidada (3 cols) */}
        <div className="lg:col-span-3 bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
          <SectionHeader titulo="DRE Consolidada" subtitulo="Demonstrativo contábil em rubricas" />

          <div className="overflow-hidden rounded-xl border border-[#2A2D38] mt-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#1E2029] text-[11px] font-semibold text-[#8B8FA8] uppercase border-b border-[#2A2D38]">
                <tr>
                  <th className="py-3 px-4">Descrição da Rubrica</th>
                  <th className="py-3 px-4 text-right">Valor Total (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2D38]">
                <tr>
                  <td className="py-3 px-4 text-white font-medium">Lucro Bruto (Contratos)</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">{br(k.receita_bruta)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#C8CAD4]">(-) Custos de Frete</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#E74C3C]">{br(-k.frete)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#C8CAD4]">(-) Impostos e Taxas</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#E74C3C]">{br(-k.impostos_venda)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#C8CAD4]">(-) Comissões sobre Venda</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#E74C3C]">{br(-k.comissao)}</td>
                </tr>
                <tr className="bg-[#2ECC71]/10 font-bold border-y-2 border-[#2ECC71]/30">
                  <td className="py-3 px-4 text-[#2ECC71] uppercase">= RESULTADO OPERACIONAL</td>
                  <td className="py-3 px-4 text-right font-mono text-[#2ECC71]">{br(k.lucro_operacional)}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#C8CAD4]">(-) Despesas Administrativas Fixas</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#E74C3C]">{br(-k.despesas_admin)}</td>
                </tr>
                <tr className="bg-gradient-to-r from-[#1E2029] to-[#252833] font-black">
                  <td className="py-3.5 px-4 text-[#F29124] uppercase text-sm">= LUCRO LÍQUIDO FINAL</td>
                  <td
                    className="py-3.5 px-4 text-right font-mono text-base font-black"
                    style={{ color: pos ? '#2ECC71' : '#E74C3C' }}
                  >
                    {br(k.lucro_liquido_final)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Análise de Risco & Destaques (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Análise de Risco */}
          <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
            <SectionHeader titulo="Análise de Risco" subtitulo="Monitoramento de alavancagem de custos" />
            <div className="space-y-2.5 pt-2">
              {alertas.map((a, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border-l-4 text-xs"
                  style={{
                    backgroundColor: `${a.cor}12`,
                    borderLeftColor: a.cor,
                    borderTop: '1px solid #2A2D38',
                    borderRight: '1px solid #2A2D38',
                    borderBottom: '1px solid #2A2D38',
                  }}
                >
                  <div className="font-bold uppercase tracking-wider mb-1" style={{ color: a.cor }}>
                    {a.tipo}
                  </div>
                  <div className="text-[#C8CAD4] font-medium leading-relaxed">{a.msg}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Destaques Operacionais */}
          <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
            <SectionHeader titulo="Destaques Operacionais" />
            <div className="space-y-2 text-xs pt-1 divide-y divide-[#2A2D38]">
              <div className="flex justify-between py-2">
                <span className="text-[#8B8FA8]">Contratos Ativos:</span>
                <span className="font-bold text-[#F29124] font-mono">{k.n_contratos}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8B8FA8]">Ticket Médio:</span>
                <span className="font-bold text-[#F29124] font-mono">{brMil(k.ticket_medio)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8B8FA8]">Lucro p/ Saca:</span>
                <span className="font-bold text-[#F29124] font-mono">{br(k.lucro_por_saca)}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8B8FA8]">Volume Negociado:</span>
                <span className="font-bold text-[#F29124] font-mono">{numFmt(k.sacas_total)} scs</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8B8FA8]">Peso Total:</span>
                <span className="font-bold text-[#F29124] font-mono">{numFmt(k.peso_total)} kg</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Commodity Performance & Export */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-3 bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
          <SectionHeader
            titulo="Performance por Commodity"
            subtitulo="Resultados consolidados por grão negociado"
          />
          <div className="overflow-x-auto rounded-xl border border-[#2A2D38] mt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1E2029] text-[11px] font-semibold text-[#8B8FA8] uppercase border-b border-[#2A2D38]">
                <tr>
                  <th className="py-2.5 px-4">🌱 Commodity</th>
                  <th className="py-2.5 px-4 text-right">⚖️ Kg</th>
                  <th className="py-2.5 px-4 text-right">💰 L. Bruto</th>
                  <th className="py-2.5 px-4 text-right">🎯 L. Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2D38]">
                {prodRanking.map((p, i) => (
                  <tr key={i} className="hover:bg-[#1E2029]/50">
                    <td className="py-2.5 px-4 font-semibold text-white">{p.produto}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{numFmt(p.peso)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-[#F29124]">{br(p.lb)}</td>
                    <td
                      className="py-2.5 px-4 text-right font-mono font-bold"
                      style={{ color: p.ll >= 0 ? '#2ECC71' : '#E74C3C' }}
                    >
                      {br(p.ll)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Card */}
        <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6 space-y-4">
          <SectionHeader titulo="Exportar Dados" subtitulo="Relatório consolidado pronto para diretoria" />
          <button
            onClick={handleExportRelatorio}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#F29124] hover:bg-[#ff9d2e] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
          >
            <Download className="w-4 h-4" />
            Gerar Relatório (.xlsx)
          </button>
        </div>
      </div>
    </div>
  );
};
