import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';
import { br, numFmt } from '../../utils/formatters';
import type { LucroRow } from '../../types';

interface ContratosTabProps {
  df_lf: LucroRow[];
}

export const ContratosTab: React.FC<ContratosTabProps> = ({ df_lf }) => {
  const [selProd, setSelProd] = useState<string>('Todos');
  const [selCli, setSelCli] = useState<string>('Todos');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [pagina, setPagina] = useState<number>(1);
  const itensPorPagina = 15;

  const produtos = useMemo(() => {
    const set = new Set<string>();
    df_lf.forEach(r => { if (r.Produto) set.add(r.Produto); });
    return ['Todos', ...Array.from(set).sort()];
  }, [df_lf]);

  const clientes = useMemo(() => {
    const set = new Set<string>();
    df_lf.forEach(r => { if (r.Cliente) set.add(r.Cliente); });
    return ['Todos', ...Array.from(set).sort()];
  }, [df_lf]);

  const contratosFiltrados = useMemo(() => {
    return df_lf.filter(row => {
      if (selProd !== 'Todos' && row.Produto !== selProd) return false;
      if (selCli !== 'Todos' && row.Cliente !== selCli) return false;
      if (termoBusca.trim()) {
        const t = termoBusca.toLowerCase();
        const v = (row['Contrato V'] || '').toLowerCase();
        const c = (row['Contrato C'] || '').toLowerCase();
        const f = (row.Fornecedor || '').toLowerCase();
        const cli = (row.Cliente || '').toLowerCase();
        const p = (row.Produto || '').toLowerCase();
        if (!v.includes(t) && !c.includes(t) && !f.includes(t) && !cli.includes(t) && !p.includes(t)) {
          return false;
        }
      }
      return true;
    });
  }, [df_lf, selProd, selCli, termoBusca]);

  // Ranking de fornecedores
  const rankingFornecedores = useMemo(() => {
    const fornMap = new Map<string, {
      fornecedor: string;
      lucroBruto: number;
      lucroLiq: number;
      peso: number;
    }>();

    contratosFiltrados.forEach(row => {
      const f = row.Fornecedor || 'Não Informado';
      const curr = fornMap.get(f) || {
        fornecedor: f,
        lucroBruto: 0,
        lucroLiq: 0,
        peso: 0,
      };
      curr.lucroBruto += row['Lucro Bruto'] || 0;
      curr.lucroLiq += row['Lucro Líq.'] || 0;
      curr.peso += row['Peso Kg'] || 0;
      fornMap.set(f, curr);
    });

    return Array.from(fornMap.values())
      .sort((a, b) => b.lucroLiq - a.lucroLiq)
      .map((item, idx) => ({ ...item, posicao: idx + 1 }));
  }, [contratosFiltrados]);

  // Pagination
  const totalPaginas = Math.ceil(contratosFiltrados.length / itensPorPagina) || 1;
  const contratosPaginados = useMemo(() => {
    const start = (pagina - 1) * itensPorPagina;
    return contratosFiltrados.slice(start, start + itensPorPagina);
  }, [contratosFiltrados, pagina]);

  return (
    <div className="space-y-6">
      <SectionHeader
        titulo="Detalhamento de Contratos"
        subtitulo="Todos os contratos de compra e venda do período selecionado"
      />

      {/* Filtros rápidos e busca */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#16181F] p-4 rounded-xl border border-[#2A2D38]">
        <div>
          <label className="block text-xs font-semibold text-[#8B8FA8] mb-1">
            🌱 Filtrar por Produto
          </label>
          <select
            value={selProd}
            onChange={(e) => { setSelProd(e.target.value); setPagina(1); }}
            className="w-full bg-[#1E2029] border border-[#2A2D38] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F29124]"
          >
            {produtos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#8B8FA8] mb-1">
            👤 Filtrar por Cliente
          </label>
          <select
            value={selCli}
            onChange={(e) => { setSelCli(e.target.value); setPagina(1); }}
            className="w-full bg-[#1E2029] border border-[#2A2D38] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#F29124]"
          >
            {clientes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#8B8FA8] mb-1">
            🔍 Buscar Contrato / Parceiro
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Ex: 0194, Soja, Bunge..."
              value={termoBusca}
              onChange={(e) => { setTermoBusca(e.target.value); setPagina(1); }}
              className="w-full bg-[#1E2029] border border-[#2A2D38] rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#F29124]"
            />
            <Search className="w-3.5 h-3.5 text-[#8B8FA8] absolute left-2.5 top-2.5" />
          </div>
        </div>
      </div>

      <div className="text-xs text-[#8B8FA8] font-medium flex justify-between items-center">
        <span>{contratosFiltrados.length} contratos exibidos</span>
        <span>Página {pagina} de {totalPaginas}</span>
      </div>

      {/* Tabela de Contratos */}
      <div className="overflow-x-auto rounded-xl border border-[#2A2D38] bg-[#16181F]">
        <table className="w-full text-left text-xs text-[#C8CAD4]">
          <thead className="bg-[#1E2029] text-[11px] font-semibold text-[#8B8FA8] uppercase tracking-wider border-b border-[#2A2D38]">
            <tr>
              <th className="py-3 px-3 whitespace-nowrap">📄 Contrato V</th>
              <th className="py-3 px-3 whitespace-nowrap">📋 Contrato C</th>
              <th className="py-3 px-3">🏭 Fornecedor</th>
              <th className="py-3 px-3">👤 Cliente</th>
              <th className="py-3 px-3 whitespace-nowrap">🌱 Produto</th>
              <th className="py-3 px-3 whitespace-nowrap">🏢 Empresa</th>
              <th className="py-3 px-3 whitespace-nowrap">📅 Mês</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">⚖️ Peso Kg</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">📦 Sacas/Ton</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">💰 L. Bruto</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">🚚 Frete</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">🏛️ Impostos</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">🤝 Comissão</th>
              <th className="py-3 px-3 text-right whitespace-nowrap">🎯 L. Líquido</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2A2D38]">
            {contratosPaginados.length === 0 ? (
              <tr>
                <td colSpan={14} className="py-8 text-center text-[#8B8FA8]">
                  Nenhum contrato encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              contratosPaginados.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#1E2029]/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono font-semibold text-white whitespace-nowrap">
                    {row['Contrato V'] || '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[#8B8FA8] whitespace-nowrap">
                    {row['Contrato C'] || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-white max-w-[150px] truncate" title={row.Fornecedor}>
                    {row.Fornecedor || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-white max-w-[150px] truncate" title={row.Cliente}>
                    {row.Cliente || '-'}
                  </td>
                  <td className="py-2.5 px-3 text-[#F29124] whitespace-nowrap">{row.Produto}</td>
                  <td className="py-2.5 px-3 text-[#8B8FA8] whitespace-nowrap">{row.Empresa}</td>
                  <td className="py-2.5 px-3 font-mono text-[#8B8FA8] whitespace-nowrap">{row.Mês_Filtro}</td>
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">{numFmt(row['Peso Kg'])}</td>
                  <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">{numFmt(row['Sacas/Ton'])}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#F29124] whitespace-nowrap">{br(row['Lucro Bruto'])}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#E74C3C] whitespace-nowrap">{br(row['Total Frete'])}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#E74C3C] whitespace-nowrap">{br(row['Impostos'])}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-[#E74C3C] whitespace-nowrap">{br(row['Comissão'])}</td>
                  <td
                    className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap"
                    style={{ color: row['Lucro Líq.'] >= 0 ? '#2ECC71' : '#E74C3C' }}
                  >
                    {br(row['Lucro Líq.'])}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            onClick={() => setPagina(p => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="p-1.5 rounded-lg bg-[#16181F] border border-[#2A2D38] text-[#8B8FA8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-[#8B8FA8] px-2 font-mono">
            {pagina} / {totalPaginas}
          </span>
          <button
            onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
            disabled={pagina === totalPaginas}
            className="p-1.5 rounded-lg bg-[#16181F] border border-[#2A2D38] text-[#8B8FA8] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Ranking por Fornecedor */}
      <div className="pt-4">
        <SectionHeader
          titulo="Resumo por Fornecedor (Ranking)"
          subtitulo="Ranking dos parceiros agrícolas por lucro líquido gerado"
        />

        <div className="overflow-x-auto rounded-xl border border-[#2A2D38] bg-[#16181F]">
          <table className="w-full text-left text-xs text-[#C8CAD4]">
            <thead className="bg-[#1E2029] text-[11px] font-semibold text-[#8B8FA8] uppercase tracking-wider border-b border-[#2A2D38]">
              <tr>
                <th className="py-3 px-4 w-16">🏆 Rank</th>
                <th className="py-3 px-4">🏭 Fornecedor</th>
                <th className="py-3 px-4 text-right">💰 L. Bruto</th>
                <th className="py-3 px-4 text-right">🎯 L. Líquido</th>
                <th className="py-3 px-4 text-right">⚖️ Peso Kg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2D38]">
              {rankingFornecedores.slice(0, 15).map(f => (
                <tr key={f.posicao} className="hover:bg-[#1E2029]/50 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-[#F29124]">{f.posicao}º</td>
                  <td className="py-2.5 px-4 font-semibold text-white">{f.fornecedor}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-[#F29124]">{br(f.lucroBruto)}</td>
                  <td
                    className="py-2.5 px-4 text-right font-mono font-bold"
                    style={{ color: f.lucroLiq >= 0 ? '#2ECC71' : '#E74C3C' }}
                  >
                    {br(f.lucroLiq)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono">{numFmt(f.peso)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
