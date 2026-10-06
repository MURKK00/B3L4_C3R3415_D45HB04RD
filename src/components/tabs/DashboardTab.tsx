import React from 'react';
import { CardKpi } from '../CardKpi';
import { SectionHeader } from '../SectionHeader';
import { br, brMil, kgFmt, pctFmt, numFmt } from '../../utils/formatters';
import type { Kpis, LucroRow, DespesaRow } from '../../types';

interface DashboardTabProps {
  df_lf: LucroRow[];
  df_df: DespesaRow[];
  kpis: Kpis;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ df_lf, kpis }) => {
  const k = kpis;

  // Aggregate by Commodity
  const prodMap = new Map<string, {
    produto: string;
    peso: number;
    sacas: number;
    lucroBruto: number;
    frete: number;
    impostos: number;
    comissao: number;
    lucroLiq: number;
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
    };
    curr.peso += row['Peso Kg'] || 0;
    curr.sacas += row['Sacas/Ton'] || 0;
    curr.lucroBruto += row['Lucro Bruto'] || 0;
    curr.frete += row['Total Frete'] || 0;
    curr.impostos += row['Impostos'] || 0;
    curr.comissao += row['Comissão'] || 0;
    curr.lucroLiq += row['Lucro Líq.'] || 0;
    prodMap.set(p, curr);
  });

  const produtosAgg = Array.from(prodMap.values()).map(p => {
    const mgLiq = p.lucroBruto > 0 ? (p.lucroLiq / p.lucroBruto) * 100 : 0;
    return { ...p, mgLiq };
  }).sort((a, b) => b.lucroLiq - a.lucroLiq);

  // Aggregate Top 5 Clientes by Lucro Líquido
  const cliMap = new Map<string, number>();
  df_lf.forEach(row => {
    const cli = row.Cliente || 'Não Informado';
    cliMap.set(cli, (cliMap.get(cli) || 0) + (row['Lucro Líq.'] || 0));
  });

  const allClients = Array.from(cliMap.entries())
    .map(([cliente, lucroLiq]) => ({ cliente, lucroLiq }))
    .sort((a, b) => b.lucroLiq - a.lucroLiq);

  const top5Clientes = allClients.slice(0, 5);
  const totalTopLiq = top5Clientes.reduce((acc, c) => acc + c.lucroLiq, 0);

  return (
    <div className="space-y-6">
      {/* Operacionais */}
      <div>
        <SectionHeader
          titulo="Indicadores Operacionais"
          subtitulo="Resumo do período selecionado"
        />

        {/* Closed contracts pill */}
        <div className="mb-4 inline-flex items-center gap-2 bg-[#2ECC71]/10 text-[#2ECC71] border border-[#2ECC71]/30 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider">
          <span>📦</span>
          <span>{k.n_contratos_fechados} Contratos Fechados</span>
          <span className="text-[#8B8FA8] font-normal normal-case ml-1">
            ({k.n_contratos_abertos} abertos)
          </span>
        </div>

        {/* Row 1: Volume e Receita */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CardKpi
            titulo="Faturamento Total"
            valor={brMil(k.faturamento_total)}
            icone="💵"
            cor="#F29124"
          />
          <CardKpi
            titulo="Peso Total Negociado"
            valor={kgFmt(k.peso_total)}
            icone="⚖️"
            cor="#F29124"
          />
          <CardKpi
            titulo="Sacas / Toneladas"
            valor={numFmt(k.sacas_total, 0)}
            icone="📦"
            cor="#F29124"
          />
          <CardKpi
            titulo="Ticket Médio / Contrato"
            valor={brMil(k.ticket_medio)}
            icone="🎫"
            cor="#8B5CF6"
          />
        </div>
      </div>

      {/* Row 2: Financeiros */}
      <div>
        <SectionHeader titulo="Indicadores Financeiros" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CardKpi
            titulo="Lucro Bruto"
            valor={brMil(k.receita_bruta)}
            subtitulo="Total dos contratos"
            icone="💰"
            cor="#F29124"
          />
          <CardKpi
            titulo="Lucro Líq. Operacional"
            valor={brMil(k.lucro_operacional)}
            subtitulo={`Margem op.: ${pctFmt(k.margem_op)}`}
            icone="⚙️"
            cor={k.lucro_operacional >= 0 ? '#2ECC71' : '#E74C3C'}
            alerta={true}
            positivo={k.lucro_operacional >= 0}
          />
          <CardKpi
            titulo="Desp. Administrativas"
            valor={brMil(k.despesas_admin)}
            subtitulo={`${pctFmt(k.indice_desp)} da receita bruta`}
            icone="📉"
            cor={k.indice_desp > 80 ? '#E74C3C' : '#F29124'}
            alerta={k.indice_desp > 80}
            positivo={false}
          />
          <CardKpi
            titulo="Lucro Líquido Final"
            valor={brMil(k.lucro_liquido_final)}
            subtitulo={`Margem líq.: ${pctFmt(k.margem_liq)}`}
            icone={k.lucro_liquido_final >= 0 ? '🏆' : '🚨'}
            cor={k.lucro_liquido_final >= 0 ? '#2ECC71' : '#E74C3C'}
            alerta={true}
            positivo={k.lucro_liquido_final >= 0}
          />
        </div>
      </div>

      {/* Row 3: Eficiência */}
      <div>
        <SectionHeader titulo="Indicadores de Eficiência" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CardKpi
            titulo="Lucro por Saca/Ton"
            valor={br(k.lucro_por_saca)}
            subtitulo="Eficiência por unidade"
            icone="📐"
            cor="#3B82F6"
          />
          <CardKpi
            titulo="Margem Bruta"
            valor={pctFmt(k.margem_bruta)}
            icone="📊"
            cor="#8B5CF6"
          />
          <CardKpi
            titulo="Margem Operacional"
            valor={pctFmt(k.margem_op)}
            icone="📈"
            cor={k.margem_op >= 0 ? '#2ECC71' : '#E74C3C'}
          />
          <CardKpi
            titulo="Índice Desp./Receita"
            valor={pctFmt(k.indice_desp)}
            subtitulo={k.indice_desp > 80 ? '⚠️ Crítico (> 80%)' : k.indice_desp > 60 ? 'Atenção (60-80%)' : 'Saudável (< 60%)'}
            icone="🎚️"
            cor={k.indice_desp > 80 ? '#E74C3C' : k.indice_desp > 60 ? '#F59E0B' : '#2ECC71'}
          />
        </div>
      </div>

      {/* Tabela por Commodity */}
      <div className="pt-2">
        <SectionHeader
          titulo="Resultados por Produto / Commodity"
          subtitulo="Detalhamento operacional por grão negociado"
        />
        <div className="overflow-x-auto rounded-xl border border-[#2A2D38] bg-[#16181F]">
          <table className="w-full text-left text-xs text-[#C8CAD4]">
            <thead className="bg-[#1E2029] text-[11px] font-semibold text-[#8B8FA8] uppercase tracking-wider border-b border-[#2A2D38]">
              <tr>
                <th className="py-3.5 px-4">🌱 Commodity</th>
                <th className="py-3.5 px-4 text-right">⚖️ Peso (Kg)</th>
                <th className="py-3.5 px-4 text-right">📦 Sacas/Ton</th>
                <th className="py-3.5 px-4 text-right">💰 L. Bruto</th>
                <th className="py-3.5 px-4 text-right">🚚 Frete</th>
                <th className="py-3.5 px-4 text-right">🏛️ Impostos</th>
                <th className="py-3.5 px-4 text-right">🤝 Comissão</th>
                <th className="py-3.5 px-4 text-right">🎯 L. Líquido</th>
                <th className="py-3.5 px-4 min-w-[140px]">📈 Mg. Líq. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D38]">
              {produtosAgg.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-[#8B8FA8]">
                    Nenhum produto encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                produtosAgg.map((p, idx) => (
                  <tr key={idx} className="hover:bg-[#1E2029]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{p.produto}</td>
                    <td className="py-3 px-4 text-right font-mono">{numFmt(p.peso, 0)}</td>
                    <td className="py-3 px-4 text-right font-mono">{numFmt(p.sacas, 0)}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#F29124]">{br(p.lucroBruto)}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#E74C3C]">{br(p.frete)}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#E74C3C]">{br(p.impostos)}</td>
                    <td className="py-3 px-4 text-right font-mono text-[#E74C3C]">{br(p.comissao)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold" style={{ color: p.lucroLiq >= 0 ? '#2ECC71' : '#E74C3C' }}>
                      {br(p.lucroLiq)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#2A2D38] rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.max(0, Math.min(100, p.mgLiq))}%`,
                              backgroundColor: p.mgLiq >= 15 ? '#2ECC71' : p.mgLiq >= 0 ? '#F59E0B' : '#E74C3C',
                            }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold min-w-[40px] text-right font-mono">
                          {pctFmt(p.mgLiq)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Clientes */}
      <div className="pt-2">
        <SectionHeader
          titulo="Top 5 Clientes por Lucro Líquido"
          subtitulo="Concentração de carteira e resultado líquido"
        />
        <div className="overflow-x-auto rounded-xl border border-[#2A2D38] bg-[#16181F]">
          <table className="w-full text-left text-xs text-[#C8CAD4]">
            <thead className="bg-[#1E2029] text-[11px] font-semibold text-[#8B8FA8] uppercase tracking-wider border-b border-[#2A2D38]">
              <tr>
                <th className="py-3 px-4">👤 Cliente</th>
                <th className="py-3 px-4 text-right">🎯 Lucro Líquido</th>
                <th className="py-3 px-4 min-w-[160px]">📊 Participação %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D38]">
              {top5Clientes.map((c, i) => {
                const part = totalTopLiq > 0 ? (c.lucroLiq / totalTopLiq) * 100 : 0;
                return (
                  <tr key={i} className="hover:bg-[#1E2029]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-white">{c.cliente}</td>
                    <td
                      className="py-3 px-4 text-right font-mono font-bold"
                      style={{ color: c.lucroLiq >= 0 ? '#2ECC71' : '#E74C3C' }}
                    >
                      {br(c.lucroLiq)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#2A2D38] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#8B5CF6] h-full rounded-full"
                            style={{ width: `${Math.min(100, Math.max(0, part))}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-semibold min-w-[42px] text-right font-mono">
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
