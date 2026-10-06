import React, { useState } from 'react';
import { SectionHeader } from '../SectionHeader';
import { br, brMil, numFmt } from '../../utils/formatters';
import { calcularKpis, CORES_CAT, categorizarDespesa } from '../../utils/dataLoader';
import type { LucroRow, DespesaRow } from '../../types';

interface GraficosTabProps {
  df_lf: LucroRow[];
  df_df: DespesaRow[];
}

export const GraficosTab: React.FC<GraficosTabProps> = ({ df_lf, df_df }) => {
  const [hoveredScatter, setHoveredScatter] = useState<any | null>(null);

  // 1. Evolução Financeira Mensal
  const mesMap = new Map<string, {
    mes: string;
    lucroBruto: number;
    frete: number;
    impostos: number;
    comissao: number;
    lucroLiq: number;
  }>();

  df_lf.forEach(r => {
    const m = r.Mês_Filtro || 'Sem Data';
    if (m === 'Sem Data') return;
    const curr = mesMap.get(m) || {
      mes: m,
      lucroBruto: 0,
      frete: 0,
      impostos: 0,
      comissao: 0,
      lucroLiq: 0,
    };
    curr.lucroBruto += r['Lucro Bruto'] || 0;
    curr.frete += r['Total Frete'] || 0;
    curr.impostos += r['Impostos'] || 0;
    curr.comissao += r['Comissão'] || 0;
    curr.lucroLiq += r['Lucro Líq.'] || 0;
    mesMap.set(m, curr);
  });

  const dadosMensais = Array.from(mesMap.values())
    .map(d => ({
      ...d,
      lucroOp: d.lucroBruto - d.frete - d.impostos - d.comissao,
    }))
    .sort((a, b) => {
      // sort by MM/YYYY
      const [m1, y1] = a.mes.split('/').map(Number);
      const [m2, y2] = b.mes.split('/').map(Number);
      return (y1 * 12 + m1) - (y2 * 12 + m2);
    });

  // 2. Cascata da DRE (Waterfall)
  const k = calcularKpis(df_lf, df_df);
  const waterfallSteps = [
    { label: 'Lucro Bruto', val: k.receita_bruta, type: 'total', color: '#F29124' },
    { label: '(-) Fretes', val: -k.frete, type: 'diff', color: '#E74C3C' },
    { label: '(-) Impostos', val: -k.impostos_venda, type: 'diff', color: '#E74C3C' },
    { label: '(-) Comissões', val: -k.comissao, type: 'diff', color: '#E74C3C' },
    { label: 'Luc. Operacional', val: k.lucro_operacional, type: 'total', color: '#3B82F6' },
    { label: '(-) Desp. Admin.', val: -k.despesas_admin, type: 'diff', color: '#E74C3C' },
    { label: 'Luc. Líquido Final', val: k.lucro_liquido_final, type: 'total', color: k.lucro_liquido_final >= 0 ? '#2ECC71' : '#E74C3C' },
  ];

  // 3. Top 10 Despesas
  const despMap = new Map<string, number>();
  df_df.forEach(d => {
    const item = d.Item || 'Outros';
    despMap.set(item, (despMap.get(item) || 0) + (d.Valor || 0));
  });
  const top10Despesas = Array.from(despMap.entries())
    .map(([item, valor]) => ({ item, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 10);
  const maxDespVal = top10Despesas[0]?.valor || 1;

  // 4. Lucro Líquido por Produto
  const prodLiqMap = new Map<string, number>();
  df_lf.forEach(r => {
    const p = r.Produto || 'Outros';
    prodLiqMap.set(p, (prodLiqMap.get(p) || 0) + (r['Lucro Líq.'] || 0));
  });
  const prodLiq = Array.from(prodLiqMap.entries())
    .map(([produto, valor]) => ({ produto, valor }))
    .filter(p => p.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  const maxProdVal = prodLiq[0]?.valor || 1;

  // 5. Eficiência por Contrato (Scatter plot)
  const scatterPoints = df_lf.map(r => ({
    produto: r.Produto,
    cliente: r.Cliente,
    fornecedor: r.Fornecedor,
    peso: r['Peso Kg'] || 0,
    lucroLiq: r['Lucro Líq.'] || 0,
    contrato: r['Contrato V'] || r['Contrato C'] || 'Contrato',
  })).filter(p => p.peso > 0);

  const maxPeso = Math.max(...scatterPoints.map(p => p.peso), 1000);
  const minLiq = Math.min(...scatterPoints.map(p => p.lucroLiq), 0);
  const maxLiq = Math.max(...scatterPoints.map(p => p.lucroLiq), 1000);

  // 6. Evolução das Despesas Admin por Período
  const despMesMap = new Map<string, number>();
  df_df.filter(d => d.Eh_Desp_Admin).forEach(d => {
    const m = d.Mês_Filtro || 'Sem Data';
    if (m === 'Sem Data') return;
    despMesMap.set(m, (despMesMap.get(m) || 0) + d.Valor);
  });
  const despMensais = Array.from(despMesMap.entries())
    .map(([mes, valor]) => ({ mes, valor }))
    .sort((a, b) => {
      const [m1, y1] = a.mes.split('/').map(Number);
      const [m2, y2] = b.mes.split('/').map(Number);
      return (y1 * 12 + m1) - (y2 * 12 + m2);
    });

  const maxDespMes = Math.max(...despMensais.map(d => d.valor), 1);

  // Maximum value for monthly chart
  const maxMensalVal = Math.max(
    ...dadosMensais.map(d => Math.max(d.lucroBruto, Math.abs(d.lucroOp), Math.abs(d.lucroLiq))),
    1000
  );

  return (
    <div className="space-y-8">
      {/* 1. Evolução Financeira Mensal */}
      <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
        <SectionHeader
          titulo="Evolução Financeira Mensal"
          subtitulo="Receita bruta, resultado operacional e lucro líquido por período"
        />

        {dadosMensais.length === 0 ? (
          <div className="py-12 text-center text-[#8B8FA8] text-sm">
            Dados mensais insuficientes para o período selecionado.
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold mb-4 text-[#8B8FA8]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-[#F29124]" />
                <span>Lucro Bruto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#3B82F6]" />
                <span>Lucro Operacional</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#2ECC71]" />
                <span>Lucro Líquido</span>
              </div>
            </div>

            {/* Custom Bar & Trend SVG Chart */}
            <div className="h-64 sm:h-72 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
                {/* Horizontal grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                  <line
                    key={i}
                    x1="40"
                    y1={200 - pct * 180}
                    x2="780"
                    y2={200 - pct * 180}
                    stroke="#2A2D38"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Zero line */}
                <line x1="40" y1="200" x2="780" y2="200" stroke="#3E4252" strokeWidth="1.5" />

                {/* Bars for Lucro Bruto */}
                {dadosMensais.map((d, i) => {
                  const step = 740 / dadosMensais.length;
                  const x = 50 + i * step;
                  const barW = Math.max(12, Math.min(36, step * 0.5));
                  const h = Math.max(2, (d.lucroBruto / maxMensalVal) * 180);
                  const y = 200 - h;

                  return (
                    <g key={i} className="cursor-pointer group">
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={h}
                        rx="4"
                        fill="#F29124"
                        opacity="0.85"
                        className="transition-opacity group-hover:opacity-100"
                      />
                      {/* Label under */}
                      <text
                        x={x + barW / 2}
                        y="220"
                        fill="#8B8FA8"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="Montserrat"
                      >
                        {d.mes}
                      </text>
                      <title>{`${d.mes}: Lucro Bruto: ${br(d.lucroBruto)} | Op: ${br(d.lucroOp)} | Líq: ${br(d.lucroLiq)}`}</title>
                    </g>
                  );
                })}

                {/* Line for Lucro Operacional */}
                <path
                  d={dadosMensais
                    .map((d, i) => {
                      const step = 740 / dadosMensais.length;
                      const x = 50 + i * step + Math.max(6, Math.min(18, step * 0.25));
                      const y = 200 - (Math.max(0, d.lucroOp) / maxMensalVal) * 180;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                />

                {/* Line for Lucro Líquido */}
                <path
                  d={dadosMensais
                    .map((d, i) => {
                      const step = 740 / dadosMensais.length;
                      const x = 50 + i * step + Math.max(6, Math.min(18, step * 0.25));
                      const y = 200 - (Math.max(0, d.lucroLiq) / maxMensalVal) * 180;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#2ECC71"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* Dots */}
                {dadosMensais.map((d, i) => {
                  const step = 740 / dadosMensais.length;
                  const x = 50 + i * step + Math.max(6, Math.min(18, step * 0.25));
                  const yOp = 200 - (Math.max(0, d.lucroOp) / maxMensalVal) * 180;
                  const yLiq = 200 - (Math.max(0, d.lucroLiq) / maxMensalVal) * 180;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={yOp} r="3.5" fill="#3B82F6" stroke="#16181F" strokeWidth="1" />
                      <circle cx={x} cy={yLiq} r="3.5" fill="#2ECC71" stroke="#16181F" strokeWidth="1" />
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 2. Cascata da DRE (Waterfall) */}
      <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
        <SectionHeader
          titulo="Cascata da DRE (Waterfall)"
          subtitulo="Decomposição visual do resultado — do lucro bruto ao lucro líquido final"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-2">
          {waterfallSteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-[#1E2029] border border-[#2A2D38] rounded-xl p-3 flex flex-col justify-between"
            >
              <div className="text-[11px] font-semibold text-[#8B8FA8] uppercase tracking-wider truncate mb-2">
                {step.label}
              </div>
              <div
                className="text-sm font-bold font-mono truncate"
                style={{ color: step.color }}
                title={br(step.val)}
              >
                {brMil(step.val)}
              </div>
              <div className="mt-2.5 w-full bg-[#16181F] rounded-md h-2 overflow-hidden">
                <div
                  className="h-full rounded-md"
                  style={{
                    backgroundColor: step.color,
                    width: `${Math.min(100, Math.max(10, (Math.abs(step.val) / (k.receita_bruta || 1)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3 & 4. Top 10 Despesas e Lucro por Produto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Despesas */}
        <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
          <SectionHeader
            titulo="Top 10 Despesas Administrativas"
            subtitulo="Maiores contas do período consolidado"
          />
          <div className="space-y-3 pt-2">
            {top10Despesas.map((d, i) => {
              const cat = categorizarDespesa(d.item);
              const cor = CORES_CAT[cat] || '#F29124';
              const pct = (d.valor / maxDespVal) * 100;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white truncate max-w-[220px]" title={d.item}>
                      {d.item}
                    </span>
                    <span className="font-mono text-[#E74C3C] font-medium">{br(d.valor)}</span>
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

        {/* Lucro Líquido por Produto */}
        <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
          <SectionHeader
            titulo="Lucro Líquido por Commodity"
            subtitulo="Rentabilidade líquida gerada por cultura agrícola"
          />
          <div className="space-y-3 pt-2">
            {prodLiq.map((p, i) => {
              const pct = (p.valor / maxProdVal) * 100;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white">{p.produto}</span>
                    <span className="font-mono text-[#2ECC71] font-bold">{br(p.valor)}</span>
                  </div>
                  <div className="w-full bg-[#1E2029] rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#F29124] to-[#2ECC71] transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Eficiência por Contrato (Volume vs Lucro) */}
      <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
        <SectionHeader
          titulo="Eficiência por Contrato"
          subtitulo="Volume negociado (Kg) × Lucro Líquido gerado por contrato"
        />

        <div className="relative h-64 sm:h-80 w-full bg-[#12141A] rounded-xl border border-[#2A2D38] p-4 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 280">
            {/* Grid & Zero line */}
            <line x1="60" y1="20" x2="60" y2="250" stroke="#2A2D38" />
            <line x1="60" y1="250" x2="780" y2="250" stroke="#2A2D38" />
            <line x1="60" y1="180" x2="780" y2="180" stroke="#E74C3C" strokeDasharray="4 4" strokeWidth="1" />

            {/* Zero label */}
            <text x="50" y="184" fill="#E74C3C" fontSize="10" textAnchor="end" fontFamily="Montserrat">
              R$ 0
            </text>

            {/* Scatter points */}
            {scatterPoints.slice(0, 150).map((pt, i) => {
              const cx = 70 + (pt.peso / maxPeso) * 690;
              // Map liq to Y: minLiq -> 240, 0 -> 180, maxLiq -> 30
              const normLiq = (pt.lucroLiq - minLiq) / ((maxLiq - minLiq) || 1);
              const cy = 240 - normLiq * 210;
              const cor = pt.lucroLiq >= 0 ? '#2ECC71' : '#E74C3C';

              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill={cor}
                  opacity="0.75"
                  className="cursor-pointer hover:opacity-100 hover:r-7 transition-all"
                  onMouseEnter={() => setHoveredScatter(pt)}
                  onMouseLeave={() => setHoveredScatter(null)}
                />
              );
            })}
          </svg>

          {/* Hover tooltip */}
          {hoveredScatter && (
            <div className="absolute top-4 right-4 bg-[#1E2029] border border-[#2A2D38] rounded-xl p-3 text-xs shadow-xl z-10 pointer-events-none">
              <div className="font-bold text-white mb-1">{hoveredScatter.produto}</div>
              <div className="text-[#8B8FA8]">Cliente: <span className="text-[#C8CAD4]">{hoveredScatter.cliente || 'N/A'}</span></div>
              <div className="text-[#8B8FA8]">Peso: <span className="text-[#F29124] font-mono">{numFmt(hoveredScatter.peso)} kg</span></div>
              <div className="text-[#8B8FA8]">
                Lucro Líq.:{' '}
                <span
                  className="font-mono font-bold"
                  style={{ color: hoveredScatter.lucroLiq >= 0 ? '#2ECC71' : '#E74C3C' }}
                >
                  {br(hoveredScatter.lucroLiq)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. Evolução das Despesas Administrativas */}
      <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
        <SectionHeader
          titulo="Evolução das Despesas Administrativas"
          subtitulo="Total mensal de custos fixos e administrativos"
        />

        <div className="h-56 w-full relative">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
            {/* Area path */}
            <path
              d={`
                M 50 170
                ${despMensais.map((d, i) => {
                  const step = 730 / despMensais.length;
                  const x = 50 + i * step + step * 0.5;
                  const y = 170 - (d.valor / maxDespMes) * 140;
                  return `L ${x} ${y}`;
                }).join(' ')}
                L 780 170 Z
              `}
              fill="rgba(242, 145, 36, 0.08)"
            />

            {/* Line path */}
            <path
              d={despMensais.map((d, i) => {
                const step = 730 / despMensais.length;
                const x = 50 + i * step + step * 0.5;
                const y = 170 - (d.valor / maxDespMes) * 140;
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#F29124"
              strokeWidth="2.5"
            />

            {/* Dots & Labels */}
            {despMensais.map((d, i) => {
              const step = 730 / despMensais.length;
              const x = 50 + i * step + step * 0.5;
              const y = 170 - (d.valor / maxDespMes) * 140;
              return (
                <g key={i} className="group cursor-pointer">
                  <circle cx={x} cy={y} r="4" fill="#F29124" stroke="#16181F" strokeWidth="1.5" />
                  <text
                    x={x}
                    y="190"
                    fill="#8B8FA8"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="Montserrat"
                  >
                    {d.mes}
                  </text>
                  <title>{`${d.mes}: ${br(d.valor)}`}</title>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
