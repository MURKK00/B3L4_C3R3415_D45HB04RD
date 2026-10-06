import React, { useState, useMemo } from 'react';
import {
  Download,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  Calendar,
  Layers,
  Percent
} from 'lucide-react';
import { br, pctFmt, numFmt } from '../../utils/formatters';
import { exportToExcel } from '../../utils/dataLoader';
import type { Kpis, LucroRow, DespesaRow, RecFinRow, FaturamentoRow, Filtros } from '../../types';

interface DreTabProps {
  kpis: Kpis;
  df_lf: LucroRow[];
  df_df: DespesaRow[];
  df_rf: RecFinRow[];
  df_ff: FaturamentoRow[];
  filtros: Filtros;
  dataset?: any;
}

export const DreTab: React.FC<DreTabProps> = ({
  df_lf,
  df_df,
  df_rf,
  df_ff,
  filtros,
}) => {
  const [expandirDeducoes, setExpandirDeducoes] = useState<boolean>(true);
  const [expandirDespAdmin, setExpandirDespAdmin] = useState<boolean>(false);
  const [expandirResultadoFin, setExpandirResultadoFin] = useState<boolean>(true);

  // Computa o DRE diretamente sobre os dados filtrados pela barra de filtros
  const dre = useMemo(() => {
    const sumCol = (arr: any[], col: string) => arr.reduce((acc, x) => acc + (x[col] || 0), 0);

    const faturamento = sumCol(df_ff, 'Valor Venda') || sumCol(df_ff, 'Faturamento');
    const lucroBruto = sumCol(df_lf, 'Lucro Bruto');
    const cmv = sumCol(df_ff, 'Valor Compra') || (faturamento > lucroBruto ? faturamento - lucroBruto : 0);

    const frete = sumCol(df_lf, 'Total Frete');
    const impostos = sumCol(df_lf, 'Impostos');
    const comissao = sumCol(df_lf, 'Comissão');
    const outros = sumCol(df_lf, 'Outros');
    const deducaoOp = frete + impostos + comissao + outros;

    const lucroOperacional = lucroBruto - deducaoOp;

    // Despesas Administrativas
    const despAdminRows = df_df.filter(x => x.Eh_Desp_Admin);
    const despesasAdmin = despAdminRows.reduce((acc, x) => acc + x.Valor, 0);

    const despesasPorItem: Record<string, number> = {};
    despAdminRows.forEach(row => {
      const item = row.Item || 'OUTRAS DESPESAS';
      despesasPorItem[item] = (despesasPorItem[item] || 0) + row.Valor;
    });

    // Despesas Financeiras
    const despFinRows = df_df.filter(x => x.Categoria_Desp === 'FINANCEIRO');
    const despesaFinanceira = despFinRows.reduce((acc, x) => acc + x.Valor, 0);

    const despFinPorItem: Record<string, number> = {};
    despFinRows.forEach(row => {
      const item = row.Item || 'OUTRAS DESPESAS FINANCEIRAS';
      despFinPorItem[item] = (despFinPorItem[item] || 0) + row.Valor;
    });

    // Receitas Financeiras
    const receitaFinanceira = df_rf.reduce((acc, x) => acc + x.Valor, 0);
    const receitasPorItem: Record<string, number> = {};
    df_rf.forEach(row => {
      const item = row.Item || 'OUTRAS RECEITAS FINANCEIRAS';
      receitasPorItem[item] = (receitasPorItem[item] || 0) + row.Valor;
    });

    // Resultado Financeiro Líquido
    const resultadoFinanceiro = receitaFinanceira - despesaFinanceira;

    // Lucro Líquido Final: Lucro Operacional - Despesas Administrativas + Resultado Financeiro Líquido
    const lucroLiquido = lucroOperacional - despesasAdmin + resultadoFinanceiro;

    // Percentuais sobre Faturamento
    const base = faturamento > 0 ? faturamento : (lucroBruto > 0 ? lucroBruto : 1);
    const cmvPct = (cmv / base) * 100;
    const mgBruta = (lucroBruto / base) * 100;
    const fretePct = (frete / base) * 100;
    const impostosPct = (impostos / base) * 100;
    const comissaoPct = (comissao / base) * 100;
    const outrosPct = (outros / base) * 100;
    const deducaoOpPct = (deducaoOp / base) * 100;
    const mgOp = (lucroOperacional / base) * 100;
    const despesasAdminPct = (despesasAdmin / base) * 100;
    const recFinPct = (receitaFinanceira / base) * 100;
    const despFinPct = (despesaFinanceira / base) * 100;
    const resFinPct = (resultadoFinanceiro / base) * 100;
    const mgLiq = (lucroLiquido / base) * 100;

    return {
      faturamento,
      cmv,
      cmvPct,
      lucroBruto,
      mgBruta,
      frete,
      fretePct,
      impostos,
      impostosPct,
      comissao,
      comissaoPct,
      outros,
      outrosPct,
      deducaoOp,
      deducaoOpPct,
      lucroOperacional,
      mgOp,
      despesasAdmin,
      despesasAdminPct,
      receitaFinanceira,
      recFinPct,
      despesaFinanceira,
      despFinPct,
      resultadoFinanceiro,
      resFinPct,
      lucroLiquido,
      mgLiq,
      despesasPorItem,
      despFinPorItem,
      receitasPorItem,
    };
  }, [df_lf, df_df, df_rf, df_ff]);

  // Lista ordenada de despesas administrativas por item (maior valor primeiro)
  const itensAdminOrdenados = useMemo(() => {
    return Object.entries(dre.despesasPorItem)
      .map(([item, valor]) => ({ item, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [dre.despesasPorItem]);

  // Itens de receita financeira
  const itensRecFinOrdenados = useMemo(() => {
    return Object.entries(dre.receitasPorItem)
      .map(([item, valor]) => ({ item, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [dre.receitasPorItem]);

  // Itens de despesa financeira
  const itensDespFinOrdenados = useMemo(() => {
    return Object.entries(dre.despFinPorItem)
      .map(([item, valor]) => ({ item, valor }))
      .sort((a, b) => b.valor - a.valor);
  }, [dre.despFinPorItem]);

  // Escopo descritivo para o título
  const escopoEmpresa = filtros.todasEmpresas
    ? 'Consolidado Grupo Bela Cereais'
    : filtros.empresas.length === 1
    ? filtros.empresas[0]
    : `${filtros.empresas.length} Empresas Selecionadas`;

  const escopoPeriodo = `Ano(s): ${filtros.anos.join(', ')} · ${
    filtros.todosMeses ? 'Todos os Meses' : filtros.meses.join(', ')
  }`;

  // Exportação limpa para Excel
  const handleExportDre = () => {
    const base = dre.faturamento > 0 ? dre.faturamento : 1;
    const linhas: any[] = [
      { Rubrica: '(+) RECEITA OPERACIONAL BRUTA (FATURAMENTO)', 'Valor (R$)': dre.faturamento, '% s/ Faturamento': pctFmt(100) },
      { Rubrica: '(-) CUSTO DAS MERCADORIAS VENDIDAS (CMV)', 'Valor (R$)': -dre.cmv, '% s/ Faturamento': pctFmt(dre.cmvPct) },
      { Rubrica: '(=) LUCRO BRUTO OPERACIONAL', 'Valor (R$)': dre.lucroBruto, '% s/ Faturamento': pctFmt(dre.mgBruta) },
      { Rubrica: '(-) Frete de Venda / Expedição', 'Valor (R$)': -dre.frete, '% s/ Faturamento': pctFmt(dre.fretePct) },
      { Rubrica: '(-) Impostos Contratuais', 'Valor (R$)': -dre.impostos, '% s/ Faturamento': pctFmt(dre.impostosPct) },
      { Rubrica: '(-) Comissões sobre Vendas', 'Valor (R$)': -dre.comissao, '% s/ Faturamento': pctFmt(dre.comissaoPct) },
      { Rubrica: '(-) Outros Gastos Operacionais', 'Valor (R$)': -dre.outros, '% s/ Faturamento': pctFmt(dre.outrosPct) },
      { Rubrica: '(=) LUCRO OPERACIONAL LÍQUIDO', 'Valor (R$)': dre.lucroOperacional, '% s/ Faturamento': pctFmt(dre.mgOp) },
      { Rubrica: '(-) DESPESAS ADMINISTRATIVAS', 'Valor (R$)': -dre.despesasAdmin, '% s/ Faturamento': pctFmt(dre.despesasAdminPct) },
    ];

    itensAdminOrdenados.forEach(i => {
      linhas.push({
        Rubrica: `    • ${i.item}`,
        'Valor (R$)': -i.valor,
        '% s/ Faturamento': pctFmt((i.valor / base) * 100),
      });
    });

    linhas.push(
      { Rubrica: '(+) Receitas Financeiras', 'Valor (R$)': dre.receitaFinanceira, '% s/ Faturamento': pctFmt(dre.recFinPct) },
      { Rubrica: '(-) Despesas Financeiras', 'Valor (R$)': -dre.despesaFinanceira, '% s/ Faturamento': pctFmt(dre.despFinPct) },
      { Rubrica: '(=) RESULTADO FINANCEIRO LÍQUIDO', 'Valor (R$)': dre.resultadoFinanceiro, '% s/ Faturamento': pctFmt(dre.resFinPct) },
      { Rubrica: '(=) LUCRO LÍQUIDO DO EXERCÍCIO', 'Valor (R$)': dre.lucroLiquido, '% s/ Faturamento': pctFmt(dre.mgLiq) }
    );

    exportToExcel(linhas, `DRE_${filtros.anos.join('_')}_Bela_Cereais`, 'DRE_Gerencial');
  };

  const baseCalculo = dre.faturamento > 0 ? dre.faturamento : 1;

  return (
    <div className="space-y-6">
      {/* 1. Header simples e direto */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-white font-heading m-0">
              Demonstração do Resultado do Exercício (DRE)
            </h2>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#E58B20]/15 text-[#E58B20] border border-[#E58B20]/30 uppercase tracking-wider">
              Gerencial
            </span>
          </div>
          <p className="text-xs text-[#8E93A6] mt-1 m-0">
            {escopoEmpresa} · <span className="text-[#E58B20] font-semibold">{escopoPeriodo}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportDre}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E58B20] hover:bg-[#ff9d2e] text-black font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
            title="Exportar planilha DRE em Excel"
          >
            <Download className="w-4 h-4" />
            <span>Exportar DRE Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="text-[11px] font-bold text-[#8E93A6] uppercase tracking-wider">
            Faturamento Bruto
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-white">
            {br(dre.faturamento)}
          </div>
          <div className="text-xs text-[#8E93A6]">
            Base de cálculo operacional
          </div>
        </div>

        <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="text-[11px] font-bold text-[#8E93A6] uppercase tracking-wider">
            Lucro Bruto
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#E58B20]">
            {br(dre.lucroBruto)}
          </div>
          <div className="text-xs text-[#8E93A6]">
            Margem Bruta: <strong className="text-white">{pctFmt(dre.mgBruta)}</strong>
          </div>
        </div>

        <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl p-4 space-y-1 shadow-sm">
          <div className="text-[11px] font-bold text-[#8E93A6] uppercase tracking-wider">
            Resultado Financeiro
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${dre.resultadoFinanceiro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {br(dre.resultadoFinanceiro)}
          </div>
          <div className="text-xs text-[#8E93A6]">
            Rec: <span className="text-emerald-400">{br(dre.receitaFinanceira)}</span> | Desp: <span className="text-red-400">{br(-dre.despesaFinanceira)}</span>
          </div>
        </div>

        <div className={`rounded-2xl p-4 space-y-1 border shadow-sm ${
          dre.lucroLiquido >= 0
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
            : 'bg-red-950/20 border-red-500/40 text-red-400'
        }`}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-white">
            Lucro Líquido Final
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono">
            {br(dre.lucroLiquido)}
          </div>
          <div className="text-xs text-[#C8CAD4]">
            Margem Líquida: <strong className="text-white">{pctFmt(dre.mgLiq)}</strong>
          </div>
        </div>
      </div>

      {/* 3. Tabela DRE Gerencial Padrão e Simples */}
      <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#161822] text-[#8E93A6] uppercase text-[11px] font-semibold border-b border-white/[0.08]">
              <tr>
                <th className="py-3.5 px-4 sm:px-6 w-3/5">Rubrica Contábil / Descrição</th>
                <th className="py-3.5 px-4 text-right w-1/5 font-mono">Valor Realizado (R$)</th>
                <th className="py-3.5 px-4 text-right w-1/5 font-mono">% s/ Faturamento</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.05]">
              {/* 1. FATURAMENTO BRUTO */}
              <tr className="bg-white/[0.02] hover:bg-white/[0.04] transition-colors font-bold">
                <td className="py-3.5 px-4 sm:px-6 text-white text-sm">
                  (+) RECEITA OPERACIONAL BRUTA (FATURAMENTO)
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-white text-sm">
                  {br(dre.faturamento)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-white text-sm">
                  {pctFmt(100)}
                </td>
              </tr>

              {/* 2. CMV */}
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-4 sm:px-6 text-[#C8CAD4] pl-6 sm:pl-8">
                  (-) Custo das Mercadorias Vendidas (CMV)
                </td>
                <td className="py-3 px-4 text-right font-mono text-red-400">
                  {br(-dre.cmv)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-red-400">
                  {pctFmt(dre.cmvPct)}
                </td>
              </tr>

              {/* 3. LUCRO BRUTO */}
              <tr className="bg-[#161824] hover:bg-[#1a1d2c] transition-colors font-extrabold border-t border-b border-[#E58B20]/30">
                <td className="py-3.5 px-4 sm:px-6 text-white text-sm sm:text-base flex items-center gap-2">
                  <span>(=) LUCRO BRUTO OPERACIONAL</span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-[#E58B20] text-sm sm:text-base">
                  {br(dre.lucroBruto)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-[#E58B20] text-sm sm:text-base">
                  {pctFmt(dre.mgBruta)}
                </td>
              </tr>

              {/* 4. DEDUÇÕES OPERACIONAIS HEADER (Expansível) */}
              <tr
                onClick={() => setExpandirDeducoes(!expandirDeducoes)}
                className="bg-white/[0.015] hover:bg-white/[0.035] transition-colors cursor-pointer select-none"
              >
                <td className="py-3 px-4 sm:px-6 text-white font-bold flex items-center gap-2">
                  {expandirDeducoes ? (
                    <ChevronDown className="w-4 h-4 text-[#E58B20]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#8E93A6]" />
                  )}
                  <span>(-) Deduções Operacionais & Gastos de Expedição</span>
                  <span className="text-[10px] text-[#8E93A6] font-normal">
                    ({expandirDeducoes ? 'ocultar' : 'ver frete, impostos e comissões'})
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-red-400 font-bold">
                  {br(-dre.deducaoOp)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-red-400 font-bold">
                  {pctFmt(dre.deducaoOpPct)}
                </td>
              </tr>

              {/* Deduções Detalhadas */}
              {expandirDeducoes && (
                <>
                  <tr className="bg-black/20 hover:bg-black/30 transition-colors text-[11px]">
                    <td className="py-2 px-4 sm:px-6 text-[#9DA3B4] pl-10 sm:pl-12">
                      • Frete sobre Vendas
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-red-400/90">
                      {br(-dre.frete)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-red-400/90">
                      {pctFmt(dre.fretePct)}
                    </td>
                  </tr>
                  <tr className="bg-black/20 hover:bg-black/30 transition-colors text-[11px]">
                    <td className="py-2 px-4 sm:px-6 text-[#9DA3B4] pl-10 sm:pl-12">
                      • Impostos sobre Operação (ICMS / Fethab / Senar)
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-red-400/90">
                      {br(-dre.impostos)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-red-400/90">
                      {pctFmt(dre.impostosPct)}
                    </td>
                  </tr>
                  <tr className="bg-black/20 hover:bg-black/30 transition-colors text-[11px]">
                    <td className="py-2 px-4 sm:px-6 text-[#9DA3B4] pl-10 sm:pl-12">
                      • Comissões sobre Vendas
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-red-400/90">
                      {br(-dre.comissao)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono text-red-400/90">
                      {pctFmt(dre.comissaoPct)}
                    </td>
                  </tr>
                  {dre.outros > 0 && (
                    <tr className="bg-black/20 hover:bg-black/30 transition-colors text-[11px]">
                      <td className="py-2 px-4 sm:px-6 text-[#9DA3B4] pl-10 sm:pl-12">
                        • Outras Deduções Operacionais
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-red-400/90">
                        {br(-dre.outros)}
                      </td>
                      <td className="py-2 px-4 text-right font-mono text-red-400/90">
                        {pctFmt(dre.outrosPct)}
                      </td>
                    </tr>
                  )}
                </>
              )}

              {/* 5. LUCRO OPERACIONAL */}
              <tr className="bg-[#141724] hover:bg-[#181B2B] transition-colors font-bold border-t border-b border-white/[0.08]">
                <td className="py-3.5 px-4 sm:px-6 text-white text-sm">
                  (=) LUCRO OPERACIONAL
                </td>
                <td
                  className={`py-3.5 px-4 text-right font-mono text-sm ${
                    dre.lucroOperacional >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {br(dre.lucroOperacional)}
                </td>
                <td
                  className={`py-3.5 px-4 text-right font-mono text-sm ${
                    dre.lucroOperacional >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {pctFmt(dre.mgOp)}
                </td>
              </tr>

              {/* 6. DESPESAS ADMINISTRATIVAS (Expansível) */}
              <tr
                onClick={() => setExpandirDespAdmin(!expandirDespAdmin)}
                className="bg-white/[0.015] hover:bg-white/[0.035] transition-colors cursor-pointer select-none"
              >
                <td className="py-3 px-4 sm:px-6 text-white font-bold flex items-center gap-2">
                  {expandirDespAdmin ? (
                    <ChevronDown className="w-4 h-4 text-[#E58B20]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#8E93A6]" />
                  )}
                  <span>(-) Despesas Administrativas & Estruturais</span>
                  <span className="text-[10px] text-[#8E93A6] font-normal">
                    ({itensAdminOrdenados.length} contas · {expandirDespAdmin ? 'recolher' : 'expandir detalhamento'})
                  </span>
                </td>
                <td className="py-3 px-4 text-right font-mono text-red-400 font-bold">
                  {br(-dre.despesasAdmin)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-red-400 font-bold">
                  {pctFmt(dre.despesasAdminPct)}
                </td>
              </tr>

              {/* Lista Detalhada de Despesas Administrativas */}
              {expandirDespAdmin &&
                itensAdminOrdenados.map((item, idx) => (
                  <tr key={idx} className="bg-black/20 hover:bg-black/30 transition-colors text-[11px]">
                    <td className="py-1.5 px-4 sm:px-6 text-[#9DA3B4] pl-10 sm:pl-12">
                      • {item.item}
                    </td>
                    <td className="py-1.5 px-4 text-right font-mono text-red-400/80">
                      {br(-item.valor)}
                    </td>
                    <td className="py-1.5 px-4 text-right font-mono text-red-400/80">
                      {pctFmt((item.valor / baseCalculo) * 100)}
                    </td>
                  </tr>
                ))}

              {/* 7. RESULTADO FINANCEIRO (Expansível) */}
              <tr
                onClick={() => setExpandirResultadoFin(!expandirResultadoFin)}
                className="bg-white/[0.015] hover:bg-white/[0.035] transition-colors cursor-pointer select-none"
              >
                <td className="py-3 px-4 sm:px-6 text-white font-bold flex items-center gap-2">
                  {expandirResultadoFin ? (
                    <ChevronDown className="w-4 h-4 text-[#E58B20]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#8E93A6]" />
                  )}
                  <span>(+/-) Resultado Financeiro Líquido</span>
                  <span className="text-[10px] text-[#8E93A6] font-normal">
                    ({expandirResultadoFin ? 'recolher' : 'ver receitas e despesas financeiras'})
                  </span>
                </td>
                <td
                  className={`py-3 px-4 text-right font-mono font-bold ${
                    dre.resultadoFinanceiro >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {br(dre.resultadoFinanceiro)}
                </td>
                <td
                  className={`py-3 px-4 text-right font-mono font-bold ${
                    dre.resultadoFinanceiro >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {pctFmt(dre.resFinPct)}
                </td>
              </tr>

              {/* Detalhamento de Resultado Financeiro */}
              {expandirResultadoFin && (
                <>
                  <tr className="bg-black/20 text-[11px]">
                    <td className="py-1.5 px-4 sm:px-6 text-emerald-400 pl-10 sm:pl-12 font-semibold">
                      (+) Receitas Financeiras (Rendimentos, Juros Ativos, Washout, Aplicações)
                    </td>
                    <td className="py-1.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                      {br(dre.receitaFinanceira)}
                    </td>
                    <td className="py-1.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                      {pctFmt(dre.recFinPct)}
                    </td>
                  </tr>
                  {itensRecFinOrdenados.map((it, idx) => (
                    <tr key={`rec-${idx}`} className="bg-black/30 text-[10px]">
                      <td className="py-1 px-4 sm:px-6 text-[#8E93A6] pl-14 sm:pl-16">
                        ↳ {it.item}
                      </td>
                      <td className="py-1 px-4 text-right font-mono text-emerald-400/80">
                        {br(it.valor)}
                      </td>
                      <td className="py-1 px-4 text-right font-mono text-emerald-400/80">
                        {pctFmt((it.valor / baseCalculo) * 100)}
                      </td>
                    </tr>
                  ))}

                  <tr className="bg-black/20 text-[11px]">
                    <td className="py-1.5 px-4 sm:px-6 text-red-400 pl-10 sm:pl-12 font-semibold">
                      (-) Despesas Financeiras (Juros Financiamento, Tarifas, IOF, Mútuo)
                    </td>
                    <td className="py-1.5 px-4 text-right font-mono text-red-400 font-semibold">
                      {br(-dre.despesaFinanceira)}
                    </td>
                    <td className="py-1.5 px-4 text-right font-mono text-red-400 font-semibold">
                      {pctFmt(dre.despFinPct)}
                    </td>
                  </tr>
                  {itensDespFinOrdenados.map((it, idx) => (
                    <tr key={`desp-${idx}`} className="bg-black/30 text-[10px]">
                      <td className="py-1 px-4 sm:px-6 text-[#8E93A6] pl-14 sm:pl-16">
                        ↳ {it.item}
                      </td>
                      <td className="py-1 px-4 text-right font-mono text-red-400/80">
                        {br(-it.valor)}
                      </td>
                      <td className="py-1 px-4 text-right font-mono text-red-400/80">
                        {pctFmt((it.valor / baseCalculo) * 100)}
                      </td>
                    </tr>
                  ))}
                </>
              )}

              {/* 8. LUCRO LÍQUIDO FINAL (Grande Destaque) */}
              <tr className="bg-[#1C2030] hover:bg-[#202538] transition-colors font-black border-t-2 border-b-2 border-emerald-500/50">
                <td className="py-4 px-4 sm:px-6 text-white text-base sm:text-lg">
                  (=) LUCRO LÍQUIDO DO EXERCÍCIO
                </td>
                <td
                  className={`py-4 px-4 text-right font-mono text-base sm:text-lg font-black ${
                    dre.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {br(dre.lucroLiquido)}
                </td>
                <td
                  className={`py-4 px-4 text-right font-mono text-base sm:text-lg font-black ${
                    dre.lucroLiquido >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {pctFmt(dre.mgLiq)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
