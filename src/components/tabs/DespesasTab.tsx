import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';
import { br, pctFmt } from '../../utils/formatters';
import { categorizarDespesa, CORES_CAT } from '../../utils/dataLoader';
import type { DespesaRow } from '../../types';

interface DespesasTabProps {
  df_df: DespesaRow[];
}

export const DespesasTab: React.FC<DespesasTabProps> = ({ df_df }) => {
  const [expandedCat, setExpandedCat] = useState<Record<string, boolean>>({
    FINANCEIROS: true,
    OPERACIONAL: true,
  });

  if (df_df.length === 0) {
    return (
      <div className="py-12 text-center text-[#8B8FA8] text-sm">
        Dados de despesas não disponíveis para o período selecionado.
      </div>
    );
  }

  const df = df_df.map(d => ({
    ...d,
    Categoria: categorizarDespesa(d.Item),
  }));

  const totalGeral = df.reduce((acc, d) => acc + (d.Valor || 0), 0);
  const itensUnicos = new Set(df.map(d => d.Item)).size;

  // Group by category
  const catMap = new Map<string, number>();
  df.forEach(d => {
    catMap.set(d.Categoria, (catMap.get(d.Categoria) || 0) + (d.Valor || 0));
  });

  const dfCat = Array.from(catMap.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);

  const maiorCat = dfCat[0] || null;

  // Top 10 items
  const itemMap = new Map<string, number>();
  df.forEach(d => {
    itemMap.set(d.Item, (itemMap.get(d.Item) || 0) + (d.Valor || 0));
  });
  const top10Itens = Array.from(itemMap.entries())
    .map(([item, valor]) => ({ item, valor, categoria: categorizarDespesa(item) }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
  const maxItemVal = top10Itens[0]?.valor || 1;

  const toggleExpand = (cat: string) => {
    setExpandedCat(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        titulo="Análise de Despesas Administrativas"
        subtitulo="Plano de contas detalhado com categorização automática e segregação de centros de custo"
      />

      {/* Top 3 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#16181F] border border-[#2A2D38] border-l-4 border-l-[#E74C3C] rounded-xl p-5">
          <div className="text-[11px] text-[#8B8FA8] uppercase font-semibold tracking-wider">
            Total Despesas
          </div>
          <div className="text-2xl font-bold font-mono text-[#E74C3C] mt-1 truncate">
            {br(totalGeral)}
          </div>
        </div>

        <div className="bg-[#16181F] border border-[#2A2D38] border-l-4 border-l-[#F59E0B] rounded-xl p-5">
          <div className="text-[11px] text-[#8B8FA8] uppercase font-semibold tracking-wider">
            Itens de Custo
          </div>
          <div className="text-2xl font-bold font-mono text-[#F59E0B] mt-1">
            {itensUnicos}
          </div>
        </div>

        <div className="bg-[#16181F] border border-[#2A2D38] border-l-4 border-l-[#8B5CF6] rounded-xl p-5">
          <div className="text-[11px] text-[#8B8FA8] uppercase font-semibold tracking-wider">
            Maior Categoria
          </div>
          <div className="text-lg font-bold text-[#8B5CF6] mt-1 truncate">
            {maiorCat?.categoria || '-'}
          </div>
          <div className="text-xs text-[#8B8FA8] mt-0.5 font-mono">
            {br(maiorCat?.valor || 0)} ({pctFmt(totalGeral ? ((maiorCat?.valor || 0) / totalGeral) * 100 : 0)})
          </div>
        </div>
      </div>

      {/* 2 Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Despesas por Categoria */}
        <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
          <SectionHeader
            titulo="Despesas por Categoria"
            subtitulo="Distribuição percentual dos gastos por centro"
          />

          <div className="space-y-3 pt-2">
            {dfCat.map(cat => {
              const cor = CORES_CAT[cat.categoria] || '#6B7080';
              const pct = totalGeral ? (cat.valor / totalGeral) * 100 : 0;
              return (
                <div key={cat.categoria} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cor }} />
                      {cat.categoria}
                    </span>
                    <span className="font-mono text-white font-medium">
                      {br(cat.valor)} <span className="text-[#8B8FA8]">({pctFmt(pct)})</span>
                    </span>
                  </div>
                  <div className="w-full bg-[#1E2029] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: cor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 10 Itens de Custo */}
        <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
          <SectionHeader
            titulo="Top 10 Itens de Custo"
            subtitulo="Principais rubricas financeiras e operacionais"
          />

          <div className="space-y-2.5 pt-2">
            {top10Itens.map((it, idx) => {
              const cor = CORES_CAT[it.categoria] || '#6B7080';
              const pct = (it.valor / maxItemVal) * 100;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white truncate max-w-[220px]" title={it.item}>
                      {it.item}
                    </span>
                    <span className="font-mono text-[#E74C3C] font-semibold">{br(it.valor)}</span>
                  </div>
                  <div className="w-full bg-[#1E2029] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: cor }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detalhamento por Categoria (Expansível) */}
      <div className="space-y-3">
        <SectionHeader
          titulo="Detalhamento por Categoria"
          subtitulo="Clique para abrir e analisar os itens de cada grupo"
        />

        {dfCat.map(cat => {
          const isExp = !!expandedCat[cat.categoria];
          const cor = CORES_CAT[cat.categoria] || '#6B7080';
          const pct = totalGeral ? (cat.valor / totalGeral) * 100 : 0;

          // Items inside this category
          const itemsSubMap = new Map<string, number>();
          df.filter(d => d.Categoria === cat.categoria).forEach(d => {
            itemsSubMap.set(d.Item, (itemsSubMap.get(d.Item) || 0) + (d.Valor || 0));
          });
          const itemsSub = Array.from(itemsSubMap.entries())
            .map(([item, valor]) => ({ item, valor }))
            .sort((a, b) => b.valor - a.valor);

          return (
            <div
              key={cat.categoria}
              className="bg-[#16181F] border border-[#2A2D38] rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleExpand(cat.categoria)}
                className="w-full flex items-center justify-between p-4 bg-[#1E2029]/60 hover:bg-[#1E2029] text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }} />
                  <span className="font-bold text-white text-sm">{cat.categoria}</span>
                  <span className="text-xs text-[#8B8FA8] font-mono">
                    {br(cat.valor)} ({pctFmt(pct)})
                  </span>
                </div>
                <div className="text-[#8B8FA8]">
                  {isExp ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isExp && (
                <div className="p-4 border-t border-[#2A2D38] overflow-x-auto">
                  <table className="w-full text-left text-xs text-[#C8CAD4]">
                    <thead className="bg-[#1E2029] text-[10px] uppercase font-semibold text-[#8B8FA8]">
                      <tr>
                        <th className="py-2 px-3">📌 Item</th>
                        <th className="py-2 px-3 text-right">💸 Valor</th>
                        <th className="py-2 px-3 min-w-[120px]">📊 % do Total</th>
                        <th className="py-2 px-3 min-w-[120px]">📈 % da Categoria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A2D38]">
                      {itemsSub.map((item, i) => {
                        const pctTot = totalGeral ? (item.valor / totalGeral) * 100 : 0;
                        const pctSub = cat.valor ? (item.valor / cat.valor) * 100 : 0;
                        return (
                          <tr key={i} className="hover:bg-[#1E2029]/40">
                            <td className="py-2 px-3 font-medium text-white">{item.item}</td>
                            <td className="py-2 px-3 text-right font-mono text-[#E74C3C]">{br(item.valor)}</td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-[#2A2D38] rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-[#F29124] h-full rounded-full"
                                    style={{ width: `${Math.min(100, pctTot * 3)}%` }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] text-[#8B8FA8] min-w-[35px] text-right">
                                  {pctFmt(pctTot)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-[#2A2D38] rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ width: `${Math.min(100, pctSub)}%`, backgroundColor: cor }}
                                  />
                                </div>
                                <span className="font-mono text-[11px] text-[#8B8FA8] min-w-[35px] text-right">
                                  {pctFmt(pctSub)}
                                </span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
