import React, { useState } from 'react';
import { SectionHeader } from '../SectionHeader';
import { br, brMil, pctFmt, numFmt } from '../../utils/formatters';
import { calcularKpis, mensalPorAno, trimestralPorAno, porProdutoAno } from '../../utils/dataLoader';
import type { LucroRow, DespesaRow, Kpis } from '../../types';

interface ComparativoTabProps {
  df_lucro: LucroRow[];
  df_desp: DespesaRow[];
  kpis: Kpis;
}

const C25 = '#3B82F6';
const C26 = '#F29124';

const DeltaCard: React.FC<{
  titulo: string;
  v25: number;
  v26: number;
  pct?: boolean;
  icone?: string;
}> = ({ titulo, v25, v26, pct = false, icone = '' }) => {
  let s25: string, s26: string, pctChg: number;
  if (pct) {
    s25 = pctFmt(v25);
    s26 = pctFmt(v26);
    pctChg = v26 - v25;
  } else {
    s25 = brMil(v25);
    s26 = brMil(v26);
    const delta = v26 - v25;
    pctChg = v25 ? (delta / Math.abs(v25)) * 100 : 0;
  }

  const pos = pctChg >= 0;
  const cor = pos ? '#2ECC71' : '#E74C3C';
  const sig = pos ? '▲' : '▼';

  return (
    <div className="bg-[#16181F] border border-[#2A2D38] rounded-xl p-4 flex flex-col justify-between">
      <div className="text-[10px] text-[#8B8FA8] uppercase font-semibold tracking-wider mb-2 flex items-center gap-1.5">
        <span>{icone}</span>
        <span>{titulo}</span>
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[10px] font-semibold text-[#3B82F6] mb-0.5">2025</div>
          <div className="font-mono text-sm sm:text-base font-bold text-[#3B82F6]">{s25}</div>
        </div>
        <div className="text-center px-1">
          <div className="text-sm font-bold" style={{ color: cor }}>{sig}</div>
          <div className="text-[11px] font-bold font-mono" style={{ color: cor }}>
            {pctFmt(Math.abs(pctChg))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-semibold text-[#F29124] mb-0.5">2026</div>
          <div className="font-mono text-sm sm:text-base font-bold text-[#F29124]">{s26}</div>
        </div>
      </div>
      <div className="bg-[#2A2D38] rounded-full h-1 mt-3 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            backgroundColor: cor,
            width: `${Math.min(100, Math.max(5, Math.abs(pctChg)))}%`,
          }}
        />
      </div>
    </div>
  );
};

export const ComparativoTab: React.FC<ComparativoTabProps> = ({ df_lucro, df_desp }) => {
  const [subAba, setSubAba] = useState<'anual' | 'trimestral' | 'produto'>('anual');

  const l25 = df_lucro.filter(r => r.Ano === 2025);
  const l26 = df_lucro.filter(r => r.Ano === 2026);
  const d25 = df_desp.filter(r => r.Ano === 2025);
  const d26 = df_desp.filter(r => r.Ano === 2026);

  const k25 = calcularKpis(l25, d25);
  const k26 = calcularKpis(l26, d26);

  const dfMen = mensalPorAno(df_lucro, df_desp);
  const dfTrim = trimestralPorAno(df_lucro, df_desp);
  const dfProd = porProdutoAno(df_lucro);

  return (
    <div className="space-y-6">
      {/* Sub tabs pills */}
      <div className="flex gap-2 border-b border-[#2A2D38] pb-3">
        {[
          { id: 'anual', label: '📊 Anual' },
          { id: 'trimestral', label: '📆 Trimestral' },
          { id: 'produto', label: '🌱 Por Produto' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubAba(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              subAba === tab.id
                ? 'bg-[#F29124] text-black shadow-md'
                : 'bg-[#16181F] text-[#8B8FA8] hover:text-white border border-[#2A2D38]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. ABA ANUAL */}
      {subAba === 'anual' && (
        <div className="space-y-6">
          <SectionHeader
            titulo="KPIs Anuais — 2025 × 2026"
            subtitulo="Comparação direta de performance consolidada entre as duas safras"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-3">
              <DeltaCard
                titulo="Lucro Bruto"
                v25={k25.receita_bruta}
                v26={k26.receita_bruta}
                icone="💰"
              />
              <DeltaCard
                titulo="Despesas Administrativas"
                v25={k25.despesas_admin}
                v26={k26.despesas_admin}
                icone="📉"
              />
            </div>
            <div className="space-y-3">
              <DeltaCard
                titulo="Lucro Líq. Operacional"
                v25={k25.lucro_operacional}
                v26={k26.lucro_operacional}
                icone="⚙️"
              />
              <DeltaCard
                titulo="Margem Operacional"
                v25={k25.margem_op}
                v26={k26.margem_op}
                pct={true}
                icone="📊"
              />
            </div>
            <div className="space-y-3">
              <DeltaCard
                titulo="Lucro Líquido Final"
                v25={k25.lucro_liquido_final}
                v26={k26.lucro_liquido_final}
                icone="🏆"
              />
              <DeltaCard
                titulo="Margem Líquida"
                v25={k25.margem_liq}
                v26={k26.margem_liq}
                pct={true}
                icone="📈"
              />
            </div>
          </div>

          {/* Gráfico Mensal Comparativo */}
          <div className="bg-[#16181F] border border-[#2A2D38] rounded-2xl p-6">
            <SectionHeader
              titulo="Evolução Mensal: Lucro Líquido Operacional"
              subtitulo="2025 (Azul) vs 2026 (Laranja) por mês"
            />

            <div className="flex items-center gap-4 text-xs font-semibold mb-4 text-[#8B8FA8]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: C25 }} />
                <span>2025</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded" style={{ backgroundColor: C26 }} />
                <span>2026</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <svg className="w-full h-full" viewBox="0 0 800 220">
                <line x1="40" y1="140" x2="780" y2="140" stroke="#E74C3C" strokeDasharray="4 4" strokeWidth="1" />
                <text x="35" y="144" fill="#E74C3C" fontSize="9" textAnchor="end">0</text>

                {dfMen.map((d, i) => {
                  const step = 720 / 12;
                  const x = 50 + i * step;
                  const v25 = d['Lucro_Op_2025'] || 0;
                  const v26 = d['Lucro_Op_2026'] || 0;

                  // Normalize to 140 base (up is positive, down is negative)
                  const scale = 0.0001;
                  const h25 = Math.min(100, Math.abs(v25) * scale);
                  const h26 = Math.min(100, Math.abs(v26) * scale);
                  const y25 = v25 >= 0 ? 140 - h25 : 140;
                  const y26 = v26 >= 0 ? 140 - h26 : 140;

                  return (
                    <g key={i}>
                      <rect x={x} y={y25} width="16" height={Math.max(2, h25)} rx="2" fill={C25} opacity="0.85" />
                      <rect x={x + 18} y={y26} width="16" height={Math.max(2, h26)} rx="2" fill={C26} opacity="0.9" />
                      <text x={x + 17} y="210" fill="#8B8FA8" fontSize="10" textAnchor="middle" fontFamily="Montserrat">
                        {d.Mês}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA TRIMESTRAL */}
      {subAba === 'trimestral' && (
        <div className="space-y-6">
          <SectionHeader
            titulo="Comparativo Trimestral"
            subtitulo="Lucro Líquido por trimestre — 2025 vs 2026"
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {dfTrim.map((t, idx) => {
              const liq25 = t['Lucro_Liq_2025'] || 0;
              const liq26 = t['Lucro_Liq_2026'] || 0;
              const delta = liq26 - liq25;
              const deltaPct = liq25 ? (delta / Math.abs(liq25)) * 100 : 0;

              return (
                <div key={idx} className="bg-[#16181F] border border-[#2A2D38] rounded-xl p-4">
                  <div className="text-xs font-bold text-white mb-2">{t.Trimestre}</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#3B82F6]">2025:</span>
                      <span className="font-mono text-[#3B82F6]">{brMil(liq25)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#F29124]">2026:</span>
                      <span className="font-mono text-[#F29124]">{brMil(liq26)}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#2A2D38] flex justify-between items-center text-xs">
                    <span className="text-[#8B8FA8]">Δ Variação:</span>
                    <span
                      className="font-mono font-bold"
                      style={{ color: delta >= 0 ? '#2ECC71' : '#E74C3C' }}
                    >
                      {pctFmt(deltaPct)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabela Trimestral */}
          <div className="overflow-x-auto rounded-xl border border-[#2A2D38] bg-[#16181F]">
            <table className="w-full text-left text-xs text-[#C8CAD4]">
              <thead className="bg-[#1E2029] text-[11px] font-semibold text-[#8B8FA8] uppercase tracking-wider border-b border-[#2A2D38]">
                <tr>
                  <th className="py-3 px-4">📆 Trimestre</th>
                  <th className="py-3 px-4 text-right">Receita 2025</th>
                  <th className="py-3 px-4 text-right">Receita 2026</th>
                  <th className="py-3 px-4 text-right">L.Op. 2025</th>
                  <th className="py-3 px-4 text-right">L.Op. 2026</th>
                  <th className="py-3 px-4 text-right">L.Líq. 2025</th>
                  <th className="py-3 px-4 text-right">L.Líq. 2026</th>
                  <th className="py-3 px-4 text-right">Δ L.Líq.</th>
                  <th className="py-3 px-4 text-right">Δ %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2D38]">
                {dfTrim.map((t, idx) => {
                  const r25 = t['Receita_2025'] || 0;
                  const r26 = t['Receita_2026'] || 0;
                  const op25 = t['Lucro_Op_2025'] || 0;
                  const op26 = t['Lucro_Op_2026'] || 0;
                  const liq25 = t['Lucro_Liq_2025'] || 0;
                  const liq26 = t['Lucro_Liq_2026'] || 0;
                  const delta = liq26 - liq25;
                  const deltaPct = liq25 ? (delta / Math.abs(liq25)) * 100 : 0;

                  return (
                    <tr key={idx} className="hover:bg-[#1E2029]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{t.Trimestre}</td>
                      <td className="py-3 px-4 text-right font-mono">{br(r25)}</td>
                      <td className="py-3 px-4 text-right font-mono">{br(r26)}</td>
                      <td className="py-3 px-4 text-right font-mono">{br(op25)}</td>
                      <td className="py-3 px-4 text-right font-mono">{br(op26)}</td>
                      <td className="py-3 px-4 text-right font-mono">{br(liq25)}</td>
                      <td className="py-3 px-4 text-right font-mono">{br(liq26)}</td>
                      <td
                        className="py-3 px-4 text-right font-mono font-bold"
                        style={{ color: delta >= 0 ? '#2ECC71' : '#E74C3C' }}
                      >
                        {br(delta)}
                      </td>
                      <td
                        className="py-3 px-4 text-right font-mono font-bold"
                        style={{ color: deltaPct >= 0 ? '#2ECC71' : '#E74C3C' }}
                      >
                        {pctFmt(deltaPct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ABA PRODUTO */}
      {subAba === 'produto' && (
        <div className="space-y-6">
          <SectionHeader
            titulo="Comparativo por Produto / Commodity"
            subtitulo="Resultados 2025 x 2026 por grão"
          />

          <div className="overflow-x-auto rounded-xl border border-[#2A2D38] bg-[#16181F]">
            <table className="w-full text-left text-xs text-[#C8CAD4]">
              <thead className="bg-[#1E2029] text-[11px] font-semibold text-[#8B8FA8] uppercase tracking-wider border-b border-[#2A2D38]">
                <tr>
                  <th className="py-3 px-4">🌱 Produto</th>
                  <th className="py-3 px-4 text-right">L.Bruto 2025</th>
                  <th className="py-3 px-4 text-right">L.Bruto 2026</th>
                  <th className="py-3 px-4 text-right">L.Líq. 2025</th>
                  <th className="py-3 px-4 text-right">L.Líq. 2026</th>
                  <th className="py-3 px-4 text-right">Peso 2025 (Kg)</th>
                  <th className="py-3 px-4 text-right">Peso 2026 (Kg)</th>
                  <th className="py-3 px-4 text-right">Contratos 2025</th>
                  <th className="py-3 px-4 text-right">Contratos 2026</th>
                  <th className="py-3 px-4 text-right">Δ L.Líq.</th>
                  <th className="py-3 px-4 text-right">Δ %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2D38]">
                {dfProd.map((p, idx) => {
                  const lb25 = p['LB_2025'] || 0;
                  const lb26 = p['LB_2026'] || 0;
                  const ll25 = p['LL_2025'] || 0;
                  const ll26 = p['LL_2026'] || 0;
                  const kg25 = p['KG_2025'] || 0;
                  const kg26 = p['KG_2026'] || 0;
                  const nc25 = p['NC_2025'] || 0;
                  const nc26 = p['NC_2026'] || 0;
                  const delta = ll26 - ll25;
                  const deltaPct = ll25 ? (delta / Math.abs(ll25)) * 100 : 0;

                  return (
                    <tr key={idx} className="hover:bg-[#1E2029]/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">{p.Produto}</td>
                      <td className="py-3 px-4 text-right font-mono">{br(lb25)}</td>
                      <td className="py-3 px-4 text-right font-mono">{br(lb26)}</td>
                      <td className="py-3 px-4 text-right font-mono">{br(ll25)}</td>
                      <td className="py-3 px-4 text-right font-mono">{br(ll26)}</td>
                      <td className="py-3 px-4 text-right font-mono">{numFmt(kg25)}</td>
                      <td className="py-3 px-4 text-right font-mono">{numFmt(kg26)}</td>
                      <td className="py-3 px-4 text-right font-mono">{nc25}</td>
                      <td className="py-3 px-4 text-right font-mono">{nc26}</td>
                      <td
                        className="py-3 px-4 text-right font-mono font-bold"
                        style={{ color: delta >= 0 ? '#2ECC71' : '#E74C3C' }}
                      >
                        {br(delta)}
                      </td>
                      <td
                        className="py-3 px-4 text-right font-mono font-bold"
                        style={{ color: deltaPct >= 0 ? '#2ECC71' : '#E74C3C' }}
                      >
                        {pctFmt(deltaPct)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
