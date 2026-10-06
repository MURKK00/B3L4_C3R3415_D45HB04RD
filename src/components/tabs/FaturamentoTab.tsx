import React, { useState, useMemo } from 'react';
import { Truck, Search, Download, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';
import { CardKpi } from '../CardKpi';
import { br, brMil, numFmt, pctFmt } from '../../utils/formatters';
import { exportToExcel } from '../../utils/dataLoader';
import type { FaturamentoRow } from '../../types';

interface FaturamentoTabProps {
  df_ff: FaturamentoRow[];
}

export const FaturamentoTab: React.FC<FaturamentoTabProps> = ({ df_ff }) => {
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [ordenacao, setOrdenacao] = useState<{ campo: keyof FaturamentoRow; dir: 'asc' | 'desc' }>({
    campo: 'Lucro Contrato',
    dir: 'desc',
  });
  const itensPorPagina = 20;

  // KPIs
  const totais = useMemo(() => {
    const venda = df_ff.reduce((acc, r) => acc + (r['Valor Venda'] || r.Faturamento || 0), 0);
    const compra = df_ff.reduce((acc, r) => acc + (r['Valor Compra'] || 0), 0);
    const frete = df_ff.reduce((acc, r) => acc + (r.Frete || 0), 0);
    const impostos = df_ff.reduce((acc, r) => acc + (r.Impostos || 0), 0);
    const lucro = df_ff.reduce((acc, r) => acc + (r['Lucro Contrato'] || 0), 0);
    const peso = df_ff.reduce((acc, r) => acc + (r.Peso || 0), 0);
    const nCargas = df_ff.length;
    const spreadBruto = venda - compra;
    const mgLucro = venda > 0 ? (lucro / venda) * 100 : 0;

    return {
      venda,
      compra,
      frete,
      impostos,
      lucro,
      peso,
      nCargas,
      spreadBruto,
      mgLucro,
    };
  }, [df_ff]);

  // Filtered
  const filtrados = useMemo(() => {
    return df_ff.filter(r => {
      if (!busca.trim()) return true;
      const b = busca.toLowerCase();
      const placa = String(r.Placa || '').toLowerCase();
      const nf = String(r['Nota Fiscal'] || '').toLowerCase();
      const numCarreg = String(r['Num Carregamento'] || '').toLowerCase();
      const emp = String(r.Empresa || '').toLowerCase();
      return placa.includes(b) || nf.includes(b) || numCarreg.includes(b) || emp.includes(b);
    });
  }, [df_ff, busca]);

  // Sorted
  const ordenados = useMemo(() => {
    return [...filtrados].sort((a, b) => {
      const vA = (a[ordenacao.campo] as any) ?? 0;
      const vB = (b[ordenacao.campo] as any) ?? 0;
      if (typeof vA === 'number' && typeof vB === 'number') {
        return ordenacao.dir === 'asc' ? vA - vB : vB - vA;
      }
      return ordenacao.dir === 'asc'
        ? String(vA).localeCompare(String(vB))
        : String(vB).localeCompare(String(vA));
    });
  }, [filtrados, ordenacao]);

  // Pagination
  const totalPaginas = Math.ceil(ordenados.length / itensPorPagina) || 1;
  const paginados = useMemo(() => {
    const start = (pagina - 1) * itensPorPagina;
    return ordenados.slice(start, start + itensPorPagina);
  }, [ordenados, pagina]);

  const toggleSort = (campo: keyof FaturamentoRow) => {
    setOrdenacao(prev => ({
      campo,
      dir: prev.campo === campo && prev.dir === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleExport = () => {
    exportToExcel(
      ordenados.map(r => ({
        Empresa: r.Empresa,
        Mês: r.Mês_Filtro,
        'Carregamento Nº': r['Num Carregamento'],
        Placa: r.Placa,
        'Nota Fiscal': r['Nota Fiscal'],
        'Peso (Kg)': r.Peso,
        'Valor Venda (R$)': r['Valor Venda'],
        'Valor Compra (R$)': r['Valor Compra'],
        'Frete (R$)': r.Frete,
        'Impostos (R$)': r.Impostos,
        'Outros Gastos (R$)': r['Outros Gastos'],
        'Lucro Contrato (R$)': r['Lucro Contrato'],
      })),
      'Faturamento_Carregamentos_Bela_Cereais',
      'Faturamento'
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        titulo="Faturamento & Logística (BD_FATURAMENTO)"
        subtitulo="Gestão de carregamentos, notas fiscais, placas e resultado por despacho"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <CardKpi
          titulo="Faturamento Bruto"
          valor={brMil(totais.venda)}
          icone="💵"
          cor="#E58B20"
          subtitulo="Receita faturada"
        />
        <CardKpi
          titulo="Custo Mercadoria"
          valor={brMil(totais.compra)}
          icone="🏷️"
          cor="#8E93A6"
          subtitulo="Custo de compra (CPV)"
        />
        <CardKpi
          titulo="Frete Logístico"
          valor={brMil(totais.frete)}
          icone="🚚"
          cor="#EF4444"
          subtitulo="Transporte rodoviário"
        />
        <CardKpi
          titulo="Lucro Despachos"
          valor={brMil(totais.lucro)}
          icone="🎯"
          cor={totais.lucro >= 0 ? '#10B981' : '#EF4444'}
          alerta={true}
          positivo={totais.lucro >= 0}
          subtitulo="Resultado das cargas"
        />
        <CardKpi
          titulo="Margem Média"
          valor={pctFmt(totais.mgLucro)}
          icone="📈"
          cor={totais.mgLucro >= 0 ? '#10B981' : '#EF4444'}
          subtitulo="% retida por despacho"
        />
        <CardKpi
          titulo="Cargas Faturadas"
          valor={numFmt(totais.nCargas)}
          subtitulo={`${numFmt(totais.peso / 1000, 1)} toneladas`}
          icone="📦"
          cor="#3B82F6"
        />
      </div>

      {/* Filter and Export bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12141C] border border-white/[0.07] p-3 rounded-xl">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Buscar por placa, nota fiscal, carregamento..."
            value={busca}
            onChange={(e) => { setBusca(e.target.value); setPagina(1); }}
            className="w-full bg-[#090A0F] border border-white/[0.08] focus:border-[#E58B20] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#686D82] focus:outline-none"
          />
          <Search className="w-3.5 h-3.5 text-[#8E93A6] absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center gap-3 text-xs text-[#8E93A6]">
          <span>{filtrados.length} carregamentos</span>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E58B20] text-black font-bold text-xs hover:bg-[#ff9d2e] transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#12141C]">
        <table className="w-full text-left text-xs text-[#C8CAD4]">
          <thead className="bg-[#161822] text-[11px] font-semibold text-[#8E93A6] uppercase tracking-wider border-b border-white/[0.06]">
            <tr>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('Num Carregamento')}>
                <div className="flex items-center gap-1">
                  <span>Carreg. Nº</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('Nota Fiscal')}>
                <div className="flex items-center gap-1">
                  <span>Nota Fiscal</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('Placa')}>
                <div className="flex items-center gap-1">
                  <span>Placa</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3">Empresa</th>
              <th className="py-3 px-3">Mês</th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('Peso')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Peso Kg</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('Valor Venda')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Venda (R$)</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('Valor Compra')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Compra (R$)</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('Frete')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Frete (R$)</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('Lucro Contrato')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Lucro Carga</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {paginados.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-[#8E93A6]">
                  Nenhum registro de faturamento encontrado para os filtros atuais.
                </td>
              </tr>
            ) : (
              paginados.map((r, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                    {r['Num Carregamento'] || '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#8E93A6] whitespace-nowrap">
                    {r['Nota Fiscal'] || '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#E58B20] whitespace-nowrap">
                    {r.Placa || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-[#8E93A6] whitespace-nowrap">{r.Empresa}</td>
                  <td className="py-2.5 px-3 font-mono text-[#8E93A6] whitespace-nowrap">{r.Mês_Filtro}</td>
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">{numFmt(r.Peso)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-white whitespace-nowrap">{br(r['Valor Venda'])}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#8E93A6] whitespace-nowrap">{br(r['Valor Compra'])}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#EF4444] whitespace-nowrap">{br(r.Frete)}</td>
                  <td
                    className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap"
                    style={{ color: (r['Lucro Contrato'] || 0) >= 0 ? '#10B981' : '#EF4444' }}
                  >
                    {br(r['Lucro Contrato'])}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="p-1.5 rounded-lg bg-[#12141C] border border-white/[0.08] text-[#8E93A6] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-[#8E93A6] px-2 font-mono">
            {pagina} / {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="p-1.5 rounded-lg bg-[#12141C] border border-white/[0.08] text-[#8E93A6] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
