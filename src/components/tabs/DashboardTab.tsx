import React, { useState, useMemo } from 'react';
import { Download, ArrowUpDown, Wheat, Users, TrendingUp } from 'lucide-react';
import { CardKpi } from '../CardKpi';
import { SectionHeader } from '../SectionHeader';
import { br, brMil, kgFmt, pctFmt, numFmt } from '../../utils/formatters';
import { exportToExcel } from '../../utils/dataLoader';
import type { Kpis, LucroRow, DespesaRow } from '../../types';

interface DashboardTabProps {
  df_lf: LucroRow[];
  df_df: DespesaRow[];
  kpis: Kpis;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ df_lf, kpis }) => {
  const k = kpis;
  const [buscaProd, setBuscaProd] = useState('');
  const [sortField, setSortField] = useState<'lucroLiq' | 'lucroBruto' | 'peso' | 'sacas' | 'mgLiq'>('lucroLiq');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Aggregate by Commodity
  const produtosAgg = useMemo(() => {
    const prodMap = new Map<string, {
      produto: string;
      peso: number;
      sacas: number;
      lucroBruto: number;
      frete: number;
      impostos: number;
      comissao: number;
      lucroLiq: number;
      nContratos: number;
    }>();

    df_lf.forEach(row => {
      const p = row.Produto || 'Outros';
      const curr = prodMap.get(p) || {
        produto: p,
        peso: 0,
        sacas: 0,
        lucroBruto: 0,
        frete: 0,
        impostos: 0,
        comissao: 0,
        lucroLiq: 0,
        nContratos: 0,
      };
      curr.peso += row['Peso Kg'] || 0;
      curr.sacas += row['Sacas/Ton'] || 0;
      curr.lucroBruto += row['Lucro Bruto'] || 0;
      curr.frete += row['Total Frete'] || 0;
      curr.impostos += row['Impostos'] || 0;
      curr.comissao += row['Comissão'] || 0;
      curr.lucroLiq += row['Lucro Líq.'] || 0;
      curr.nContratos += 1;
      prodMap.set(p, curr);
    });

    return Array.from(prodMap.values()).map(p => {
      const mgLiq = p.lucroBruto > 0 ? (p.lucroLiq / p.lucroBruto) * 100 : 0;
      return { ...p, mgLiq };
    });
  }, [df_lf]);

  // Filtered & Sorted Commodities
  const produtosFiltrados = useMemo(() => {
    return produtosAgg
      .filter(p => !buscaProd.trim() || p.produto.toLowerCase().includes(buscaProd.toLowerCase().trim()))
      .sort((a, b) => {
        const diff = a[sortField] - b[sortField];
        return sortDir === 'asc' ? diff : -diff;
      });
  }, [produtosAgg, buscaProd, sortField, sortDir]);

  // Aggregate Top 5 Clientes by Lucro Líquido
  const top5Clientes = useMemo(() => {
    const cliMap = new Map<string, { lucroLiq: number; peso: number; nContratos: number }>();
    df_lf.forEach(row => {
      const cli = row.Cliente || 'Não Informado';
      const curr = cliMap.get(cli) || { lucroLiq: 0, peso: 0, nContratos: 0 };
      curr.lucroLiq += row['Lucro Líq.'] || 0;
      curr.peso += row['Peso Kg'] || 0;
      curr.nContratos += 1;
      cliMap.set(cli, curr);
    });

    const list = Array.from(cliMap.entries())
      .map(([cliente, data]) => ({ cliente, ...data }))
      .sort((a, b) => b.lucroLiq - a.lucroLiq);

    return list.slice(0, 5);
  }, [df_lf]);

  const totalTopLiq = useMemo(() => {
    return top5Clientes.reduce((acc, c) => acc + c.lucroLiq, 0);
  }, [top5Clientes]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const handleExportCommodities = () => {
    exportToExcel(
      produtosFiltrados.map(p => ({
        Commodity: p.produto,
        'Contratos': p.nContratos,
        'Peso (Kg)': p.peso,
        'Sacas/Ton': p.sacas,
        'Lucro Bruto (R$)': p.lucroBruto,
        'Frete (R$)': p.frete,
        'Impostos (R$)': p.impostos,
        'Comissão (R$)': p.comissao,
        'Lucro Líquido (R$)': p.lucroLiq,
        'Margem Líquida (%)': p.mgLiq,
      })),
      'Performance_Commodities_Bela_Cereais',
      'Commodities'
    );
  };

  return (
    <div className="space-y-7">
      {/* 1. Indicadores Operacionais */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionHeader
            titulo="Indicadores Operacionais"
            subtitulo="Volume físico e capacidade de movimentação comercial"
          />
          <div className="text-xs text-[#8E93A6] font-medium hidden sm:flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="font-mono text-white font-bold">{k.n_contratos_fechados}</span>
            <span>fechados</span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-amber-500 font-bold">{k.n_contratos_abertos}</span>
            <span>abertos</span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <CardKpi
            titulo="Faturamento Total"
            valor={brMil(k.faturamento_total)}
            icone="💵"
            cor="#E58B20"
            subtitulo="Base notas fiscais"
          />
          <CardKpi
            titulo="Peso Movimentado"
            valor={kgFmt(k.peso_total)}
            icone="⚖️"
            cor="#E58B20"
            subtitulo="Total expedido"
          />
          <CardKpi
            titulo="Sacas / Toneladas"
            valor={numFmt(k.sacas_total, 0)}
            icone="📦"
            cor="#E58B20"
            subtitulo="Granel agrícola"
          />
          <CardKpi
            titulo="Ticket Médio / Carga"
            valor={brMil(k.ticket_medio)}
            icone="🎫"
            cor="#3B82F6"
            subtitulo="Por contrato fechado"
          />
        </div>
      </div>

      {/* 2. Indicadores Financeiros & Resultado */}
      <div>
        <SectionHeader
          titulo="Performance Financeira & Rentabilidade"
          subtitulo="Formação de receita, resultado operacional e margens"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <CardKpi
            titulo="Lucro Bruto (Contratos)"
            valor={brMil(k.receita_bruta)}
            subtitulo="Receita operacional bruta"
            icone="💰"
            cor="#E58B20"
          />
          <CardKpi
            titulo="Lucro Líq. Operacional"
            valor={brMil(k.lucro_operacional)}
            subtitulo={`Margem op.: ${pctFmt(k.margem_op)}`}
            icone="⚙️"
            cor={k.lucro_operacional >= 0 ? '#10B981' : '#EF4444'}
            alerta={true}
            positivo={k.lucro_operacional >= 0}
            kicker={pctFmt(k.margem_op)}
          />
          <CardKpi
            titulo="Desp. Administrativas"
            valor={brMil(k.despesas_admin)}
            subtitulo={`${pctFmt(k.indice_desp)} do lucro bruto`}
            icone="📉"
            cor={k.indice_desp > 80 ? '#EF4444' : '#E58B20'}
            alerta={k.indice_desp > 80}
            positivo={false}
          />
          <CardKpi
            titulo="Lucro Líquido Final"
            valor={brMil(k.lucro_liquido_final)}
            subtitulo={`Margem líq.: ${pctFmt(k.margem_liq)}`}
            icone={k.lucro_liquido_final >= 0 ? '🏆' : '🚨'}
            cor={k.lucro_liquido_final >= 0 ? '#10B981' : '#EF4444'}
            alerta={true}
            positivo={k.lucro_liquido_final >= 0}
            kicker={pctFmt(k.margem_liq)}
          />
        </div>
      </div>

      {/* 3. Indicadores de Eficiência */}
      <div>
        <SectionHeader
          titulo="Eficiência Unificada"
          subtitulo="Rentabilidade unitária por saca e absorção de despesas"
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <CardKpi
            titulo="Lucro por Saca / Ton"
            valor={br(k.lucro_por_saca)}
            subtitulo="Spread líquido unitário"
            icone="📐"
            cor="#3B82F6"
          />
          <CardKpi
            titulo="Margem Bruta"
            valor={pctFmt(k.margem_bruta)}
            subtitulo="Sobre faturamento"
            icone="📊"
            cor="#8B5CF6"
          />
          <CardKpi
            titulo="Margem Operacional"
            valor={pctFmt(k.margem_op)}
            subtitulo="Pós frete e comissões"
            icone="📈"
            cor={k.margem_op >= 0 ? '#10B981' : '#EF4444'}
          />
          <CardKpi
            titulo="Índice Desp. / Receita"
            valor={pctFmt(k.indice_desp)}
            subtitulo={k.indice_desp > 80 ? 'Crítico (> 80%)' : k.indice_desp > 60 ? 'Alerta (60–80%)' : 'Saudável (< 60%)'}
            icone="🎚️"
            cor={k.indice_desp > 80 ? '#EF4444' : k.indice_desp > 60 ? '#F59E0B' : '#10B981'}
          />
        </div>
      </div>

      {/* 4. Tabela de Commodities */}
      <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Wheat className="w-4 h-4 text-[#E58B20]" />
            <h4 className="text-sm font-bold text-white font-heading m-0">
              Desempenho por Commodity / Cultura
            </h4>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filtrar grão..."
              value={buscaProd}
              onChange={(e) => setBuscaProd(e.target.value)}
              className="bg-[#090A0F] border border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-white placeholder-[#686D82] focus:outline-none focus:border-[#E58B20] w-36 sm:w-48"
            />
            <button
              onClick={handleExportCommodities}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-[#C8CAD4] hover:text-white rounded-lg transition-colors border border-white/[0.08]"
              title="Exportar tabela de commodities"
            >
              <Download className="w-3 h-3 text-[#E58B20]" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
          <table className="w-full text-left text-xs text-[#C8CAD4]">
            <thead className="bg-[#161822] text-[11px] font-semibold text-[#8E93A6] uppercase tracking-wider border-b border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-3">🌱 Commodity</th>
                <th className="py-2.5 px-3 text-right">Contratos</th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('peso')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Peso (Kg)</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('sacas')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Sacas/Ton</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('lucroBruto')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>L. Bruto</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right">Frete</th>
                <th className="py-2.5 px-3 text-right">Impostos</th>
                <th className="py-2.5 px-3 text-right">Comissão</th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('lucroLiq')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>L. Líquido</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-2.5 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('mgLiq')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Mg. Líq.</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {produtosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-6 text-center text-[#8E93A6]">
                    Nenhum produto correspondente.
                  </td>
                </tr>
              ) : (
                produtosFiltrados.map((p, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">{p.produto}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#8E93A6]">{p.nContratos}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{numFmt(p.peso, 0)}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{numFmt(p.sacas, 0)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#E58B20]">{br(p.lucroBruto)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#EF4444]">{br(p.frete)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#EF4444]">{br(p.impostos)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#EF4444]">{br(p.comissao)}</td>
                    <td
                      className="py-2.5 px-3 text-right font-mono font-bold"
                      style={{ color: p.lucroLiq >= 0 ? '#10B981' : '#EF4444' }}
                    >
                      {br(p.lucroLiq)}
                    </td>
                    <td
                      className="py-2.5 px-3 text-right font-mono font-semibold"
                      style={{ color: p.mgLiq >= 15 ? '#10B981' : p.mgLiq >= 0 ? '#F59E0B' : '#EF4444' }}
                    >
                      {pctFmt(p.mgLiq)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Top 5 Clientes */}
      <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#3B82F6]" />
          <h4 className="text-sm font-bold text-white font-heading m-0">
            Top 5 Clientes por Resultado Líquido
          </h4>
        </div>

        <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
          <table className="w-full text-left text-xs text-[#C8CAD4]">
            <thead className="bg-[#161822] text-[11px] font-semibold text-[#8E93A6] uppercase tracking-wider border-b border-white/[0.06]">
              <tr>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3 text-right">Contratos</th>
                <th className="py-2.5 px-3 text-right">Volume (Kg)</th>
                <th className="py-2.5 px-3 text-right">Lucro Líquido</th>
                <th className="py-2.5 px-3 text-right min-w-[140px]">Participação na Carteira</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {top5Clientes.map((c, i) => {
                const part = totalTopLiq > 0 ? (c.lucroLiq / totalTopLiq) * 100 : 0;
                return (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-white">{c.cliente}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#8E93A6]">{c.nContratos}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{numFmt(c.peso, 0)} kg</td>
                    <td
                      className="py-2.5 px-3 text-right font-mono font-bold"
                      style={{ color: c.lucroLiq >= 0 ? '#10B981' : '#EF4444' }}
                    >
                      {br(c.lucroLiq)}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-20 bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#3B82F6] h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, part))}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-semibold text-[#8E93A6] w-12 text-right">
                          {pctFmt(part)}
                        </span>
                      </div>
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
