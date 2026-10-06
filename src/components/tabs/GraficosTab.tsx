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
      const [m1, y1] = a.mes.split('/').map(Number);
      const [m2, y2] = b.mes.split('/').map(Number);
      return (y1 * 12 + m1) - (y2 * 12 + m2);
    });

  // 2. Cascata da DRE (Waterfall)
  const k = calcularKpis(df_lf, df_df);
  const waterfallSteps = [
    { label: 'Lucro Bruto', val: k.receita_bruta, type: 'total', color: '#E58B20' },
    { label: '(-) Fretes', val: -k.frete, type: 'diff', color: '#EF4444' },
    { label: '(-) Impostos', val: -k.impostos_venda, type: 'diff', color: '#EF4444' },
    { label: '(-) Comissões', val: -k.comissao, type: 'diff', color: '#EF4444' },
    { label: 'Luc. Operacional', val: k.lucro_operacional, type: 'total', color: '#3B82F6' },
    { label: '(-) Desp. Admin.', val: -k.despesas_admin, type: 'diff', color: '#EF4444' },
    { label: 'Luc. Líquido Final', val: k.lucro_liquido_final, type: 'total', color: k.lucro_liquido_final >= 0 ? '#10B981' : '#EF4444' },
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
  const maxMensalVal = Math.max(
    ...dadosMensais.map(d => Math.max(d.lucroBruto, Math.abs(d.lucroOp), Math.abs(d.lucroLiq))),
    1000
  );

  return (
    <div className="space-y-6">
      {/* 1. Evolução Financeira Mensal */}
      <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-5 space-y-4">
        <SectionHeader
          titulo="Evolução Financeira Mensal"
          subtitulo="Comparação entre lucro bruto, resultado operacional e lucro líquido"
        />

        {dadosMensais.length === 0 ? (
          <div className="py-12 text-center text-[#8E93A6] text-xs">
            Dados mensais insuficientes para o período selecionado.
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold mb-3 text-[#8E93A6]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#E58B20]" />
                <span>Lucro Bruto</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#3B82F6]" />
                <span>Lucro Operacional</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#10B981]" />
                <span>Lucro Líquido</span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full relative">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 800 240" preserveAspectRatio="none">
                {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
                  <line
                    key={i}
                    x1="40"
                    y1={200 - pct * 180}
                    x2="780"
                    y2={200 - pct * 180}
                    stroke="rgba(255,255,255,0.06)"
                    strokeDasharray="4 4"
                  />
                ))}

                <line x1="40" y1="200" x2="780" y2="200" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

                {/* Bars for Lucro Bruto */}
                {dadosMensais.map((d, i) => {
                  const step = 740 / dadosMensais.length;
                  const x = 50 + i * step;
                  const barW = Math.max(12, Math.min(32, step * 0.45));
                  const h = Math.max(2, (d.lucroBruto / maxMensalVal) * 180);
                  const y = 200 - h;

                  return (
                    <g key={i} className="cursor-pointer group">
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={h}
                        rx="3"
                        fill="#E58B20"
                        opacity="0.85"
                        className="transition-opacity group-hover:opacity-100"
                      />
                      <text
                        x={x + barW / 2}
                        y="218"
                        fill="#8E93A6"
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
                      const x = 50 + i * step + Math.max(6, Math.min(16, step * 0.22));
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
                      const x = 50 + i * step + Math.max(6, Math.min(16, step * 0.22));
                      const y = 200 - (Math.max(0, d.lucroLiq) / maxMensalVal) * 180;
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 2. Cascata da DRE (Waterfall) */}
      <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-5 space-y-4">
        <SectionHeader
          titulo="Cascata Contábil da DRE"
          subtitulo="Decomposição passo a passo da formação do resultado líquido final"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
          {waterfallSteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-[#161822] border border-white/[0.06] rounded-xl p-3 flex flex-col justify-between"
            >
              <div className="text-[10px] font-semibold text-[#8E93A6] uppercase tracking-wider truncate mb-2">
                {step.label}
              </div>
              <div
                className="text-sm font-bold font-mono truncate tabular-nums"
                style={{ color: step.color }}
                title={br(step.val)}
              >
                {brMil(step.val)}
              </div>
              <div className="mt-2.5 w-full bg-white/[0.05] rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full"
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
        <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-5 space-y-3">
          <SectionHeader
            titulo="Top 10 Despesas Administrativas"
            subtitulo="Maiores contas do período consolidado"
          />
          <div className="space-y-2.5 pt-1">
            {top10Despesas.map((d, i) => {
              const cat = categorizarDespesa(d.item);
              const cor = CORES_CAT[cat] || '#E58B20';
              const pct = (d.valor / maxDespVal) * 100;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white truncate max-w-[220px]" title={d.item}>
                      {d.item}
                    </span>
                    <span className="font-mono text-[#EF4444] font-medium">{br(d.valor)}</span>
                  </div>
                  <div className="w-full bg-[#161822] rounded-full h-1.5 overflow-hidden">
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
        <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-5 space-y-3">
          <SectionHeader
            titulo="Lucro Líquido por Commodity"
            subtitulo="Rentabilidade líquida gerada por cultura agrícola"
          />
          <div className="space-y-3 pt-1">
            {prodLiq.map((p, i) => {
              const pct = (p.valor / maxProdVal) * 100;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-white">{p.produto}</span>
                    <span className="font-mono text-[#10B981] font-bold">{br(p.valor)}</span>
                  </div>
                  <div className="w-full bg-[#161822] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#E58B20] to-[#10B981] transition-all"
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
      <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-5 space-y-3">
        <SectionHeader
          titulo="Dispersão de Contratos (Volume × Lucro Líquido)"
          subtitulo="Passe o cursor sobre os pontos para visualizar o contrato, cliente e valores"
        />

        <div className="relative h-64 sm:h-72 w-full bg-[#090A0F] rounded-xl border border-white/[0.06] p-4 overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 280">
            <line x1="60" y1="20" x2="60" y2="250" stroke="rgba(255,255,255,0.08)" />
            <line x1="60" y1="250" x2="780" y2="250" stroke="rgba(255,255,255,0.08)" />
            <line x1="60" y1="180" x2="780" y2="180" stroke="#EF4444" strokeDasharray="4 4" strokeWidth="1" />

            <text x="50" y="184" fill="#EF4444" fontSize="10" textAnchor="end" fontFamily="Montserrat">
              R$ 0
            </text>

            {scatterPoints.slice(0, 150).map((pt, i) => {
              const cx = 70 + (pt.peso / maxPeso) * 690;
              const normLiq = (pt.lucroLiq - minLiq) / ((maxLiq - minLiq) || 1);
              const cy = 240 - normLiq * 210;
              const cor = pt.lucroLiq >= 0 ? '#10B981' : '#EF4444';

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

          {hoveredScatter && (
            <div className="absolute top-4 right-4 bg-[#161822] border border-white/[0.1] rounded-xl p-3 text-xs shadow-xl z-10 pointer-events-none">
              <div className="font-bold text-white mb-1">{hoveredScatter.produto}</div>
              <div className="text-[#8E93A6]">Cliente: <span className="text-white">{hoveredScatter.cliente || 'N/A'}</span></div>
              <div className="text-[#8E93A6]">Peso: <span className="text-[#E58B20] font-mono">{numFmt(hoveredScatter.peso)} kg</span></div>
              <div className="text-[#8E93A6]">
                Lucro Líq.:{' '}
                <span
                  className="font-mono font-bold"
                  style={{ color: hoveredScatter.lucroLiq >= 0 ? '#10B981' : '#EF4444' }}
                >
                  {br(hoveredScatter.lucroLiq)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
