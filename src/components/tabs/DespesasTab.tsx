import React, { useState, useMemo } from 'react';
import { Search, Download, ChevronDown, ChevronUp, Layers, ArrowUpDown } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';
import { CardKpi } from '../CardKpi';
import { br, pctFmt, numFmt } from '../../utils/formatters';
import { categorizarDespesa, CORES_CAT, exportToExcel } from '../../utils/dataLoader';
import type { DespesaRow } from '../../types';

interface DespesasTabProps {
  df_df: DespesaRow[];
}

export const DespesasTab: React.FC<DespesasTabProps> = ({ df_df }) => {
  const [busca, setBusca] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState<string>('TODAS');
  const [expandedCat, setExpandedCat] = useState<Record<string, boolean>>({});

  const df = useMemo(() => {
    return df_df.map(d => ({
      ...d,
      Categoria: categorizarDespesa(d.Item),
    }));
  }, [df_df]);

  const totalGeral = useMemo(() => {
    return df.reduce((acc, d) => acc + (d.Valor || 0), 0);
  }, [df]);

  // Group by category
  const categoriasAgg = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    df.forEach(d => {
      const curr = map.get(d.Categoria) || { total: 0, count: 0 };
      curr.total += d.Valor || 0;
      curr.count += 1;
      map.set(d.Categoria, curr);
    });

    return Array.from(map.entries())
      .map(([cat, data]) => ({
        categoria: cat,
        total: data.total,
        count: data.count,
        pct: totalGeral > 0 ? (data.total / totalGeral) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [df, totalGeral]);

  // Filtered expenses
  const despesasFiltradas = useMemo(() => {
    return df.filter(d => {
      if (categoriaAtiva !== 'TODAS' && d.Categoria !== categoriaAtiva) return false;
      if (busca.trim()) {
        const b = busca.toLowerCase().trim();
        const item = (d.Item || '').toLowerCase();
        const emp = (d.Empresa || '').toLowerCase();
        if (!item.includes(b) && !emp.includes(b)) return false;
      }
      return true;
    }).sort((a, b) => b.Valor - a.Valor);
  }, [df, categoriaAtiva, busca]);

  const maiorCat = categoriasAgg[0] || null;

  const toggleExpand = (cat: string) => {
    setExpandedCat(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleExport = () => {
    exportToExcel(
      despesasFiltradas.map(d => ({
        Empresa: d.Empresa,
        Mês: d.Mês_Filtro,
        Item: d.Item,
        Categoria: d.Categoria,
        'Tipo Despesa': d.Categoria_Desp,
        'Valor (R$)': d.Valor,
      })),
      'Despesas_Administrativas_Bela_Cereais',
      'Despesas'
    );
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        titulo="Centro de Custos & Despesas (BD_DESP / BD_DESP_COMPL)"
        subtitulo="Auditoria do plano de contas, segregação de despesas administrativas e financeiras"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <CardKpi
          titulo="Total de Despesas"
          valor={br(totalGeral)}
          icone="📉"
          cor="#EF4444"
          subtitulo="Período selecionado"
        />
        <CardKpi
          titulo="Centros de Custo"
          valor={numFmt(categoriasAgg.length)}
          icone="📂"
          cor="#E58B20"
          subtitulo={`${numFmt(df.length)} lançamentos`}
        />
        <CardKpi
          titulo="Maior Grupo de Custo"
          valor={maiorCat ? maiorCat.categoria : '-'}
          icone="🎯"
          cor="#8B5CF6"
          subtitulo={maiorCat ? `${br(maiorCat.total)} (${pctFmt(maiorCat.pct)})` : ''}
        />
      </div>

      {/* Distribution by Category */}
      <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E58B20]" />
            <h4 className="text-sm font-bold text-white font-heading m-0">
              Distribuição por Categoria
            </h4>
          </div>
          <span className="text-xs text-[#8E93A6]">
            Total: <span className="font-mono text-white font-bold">{br(totalGeral)}</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {categoriasAgg.map(cat => {
            const cor = CORES_CAT[cat.categoria] || '#6B7280';
            const active = categoriaAtiva === cat.categoria;
            return (
              <button
                key={cat.categoria}
                onClick={() => setCategoriaAtiva(active ? 'TODAS' : cat.categoria)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  active
                    ? 'bg-[#161822] border-[#E58B20] shadow-md ring-1 ring-[#E58B20]'
                    : 'bg-[#161822] border-white/[0.06] hover:border-white/[0.14]'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cor }} />
                  <span className="text-[11px] font-semibold text-white truncate" title={cat.categoria}>
                    {cat.categoria}
                  </span>
                </div>
                <div className="text-sm font-bold font-mono text-white truncate">
                  {br(cat.total)}
                </div>
                <div className="text-[10px] text-[#8E93A6] mt-0.5">
                  {pctFmt(cat.pct)} do total
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Table */}
      <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Buscar item de despesa, plano de contas..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-[#090A0F] border border-white/[0.08] focus:border-[#E58B20] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#686D82] focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-[#8E93A6] absolute left-2.5 top-2.5" />
            </div>
            {categoriaAtiva !== 'TODAS' && (
              <button
                onClick={() => setCategoriaAtiva('TODAS')}
                className="px-2.5 py-1 text-xs bg-white/[0.08] hover:bg-white/[0.12] rounded-lg text-white font-medium whitespace-nowrap"
              >
                Ver Todas
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#8E93A6]">
            <span>{despesasFiltradas.length} itens</span>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E58B20] text-black font-bold text-xs hover:bg-[#ff9d2e] transition-all shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
          <table className="w-full text-left text-xs text-[#C8CAD4]">
            <thead className="bg-[#161822] text-[11px] font-semibold text-[#8E93A6] uppercase tracking-wider border-b border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-3">Rubrica / Item</th>
                <th className="py-2.5 px-3">Categoria</th>
                <th className="py-2.5 px-3">Empresa</th>
                <th className="py-2.5 px-3">Mês</th>
                <th className="py-2.5 px-3 text-right">Valor (R$)</th>
                <th className="py-2.5 px-3 text-right">% do Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {despesasFiltradas.slice(0, 50).map((d, i) => {
                const cor = CORES_CAT[d.Categoria] || '#6B7280';
                const pct = totalGeral > 0 ? (d.Valor / totalGeral) * 100 : 0;
                return (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-medium text-white">{d.Item}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#C8CAD4]">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cor }} />
                        {d.Categoria}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#8E93A6]">{d.Empresa}</td>
                    <td className="py-2.5 px-3 font-mono text-[#8E93A6]">{d.Mês_Filtro}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-[#EF4444]">
                      {br(d.Valor)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#8E93A6]">
                      {pctFmt(pct)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
