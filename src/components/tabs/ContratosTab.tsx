import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, ArrowUpDown, Filter, Eye } from 'lucide-react';
import { SectionHeader } from '../SectionHeader';
import { ContractDrawer } from '../ContractDrawer';
import { br, numFmt, pctFmt } from '../../utils/formatters';
import { exportToExcel } from '../../utils/dataLoader';
import type { LucroRow } from '../../types';

interface ContratosTabProps {
  df_lf: LucroRow[];
}

export const ContratosTab: React.FC<ContratosTabProps> = ({ df_lf }) => {
  const [selProd, setSelProd] = useState<string>('Todos');
  const [selCli, setSelCli] = useState<string>('Todos');
  const [termoBusca, setTermoBusca] = useState<string>('');
  const [pagina, setPagina] = useState<number>(1);
  const [contratoSelecionado, setContratoSelecionado] = useState<LucroRow | null>(null);
  const [ordenacao, setOrdenacao] = useState<{ campo: keyof LucroRow; dir: 'asc' | 'desc' }>({
    campo: 'Lucro Líq.',
    dir: 'desc',
  });
  const itensPorPagina = 20;

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

  // Sort
  const contratosOrdenados = useMemo(() => {
    return [...contratosFiltrados].sort((a, b) => {
      const vA = (a[ordenacao.campo] as any) ?? 0;
      const vB = (b[ordenacao.campo] as any) ?? 0;
      if (typeof vA === 'number' && typeof vB === 'number') {
        return ordenacao.dir === 'asc' ? vA - vB : vB - vA;
      }
      return ordenacao.dir === 'asc'
        ? String(vA).localeCompare(String(vB))
        : String(vB).localeCompare(String(vA));
    });
  }, [contratosFiltrados, ordenacao]);

  // Pagination
  const totalPaginas = Math.ceil(contratosOrdenados.length / itensPorPagina) || 1;
  const contratosPaginados = useMemo(() => {
    const start = (pagina - 1) * itensPorPagina;
    return contratosOrdenados.slice(start, start + itensPorPagina);
  }, [contratosOrdenados, pagina]);

  const toggleSort = (campo: keyof LucroRow) => {
    setOrdenacao(prev => ({
      campo,
      dir: prev.campo === campo && prev.dir === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handleExport = () => {
    exportToExcel(
      contratosOrdenados.map(r => ({
        'Contrato V': r['Contrato V'],
        'Contrato C': r['Contrato C'],
        Fornecedor: r.Fornecedor,
        Cliente: r.Cliente,
        Produto: r.Produto,
        Empresa: r.Empresa,
        Mês: r.Mês_Filtro,
        'Peso (Kg)': r['Peso Kg'],
        'Sacas/Ton': r['Sacas/Ton'],
        'Lucro Bruto (R$)': r['Lucro Bruto'],
        'Frete (R$)': r['Total Frete'],
        'Impostos (R$)': r.Impostos,
        'Comissão (R$)': r.Comissão,
        'Lucro Líquido (R$)': r['Lucro Líq.'],
        'Lucro Sc/Tn (R$)': r['Lucro Sc/Tn'],
      })),
      'Contratos_Bela_Cereais',
      'Contratos'
    );
  };

  return (
    <div className="space-y-6">
      {/* Drawer */}
      <ContractDrawer
        contrato={contratoSelecionado}
        onClose={() => setContratoSelecionado(null)}
      />

      <SectionHeader
        titulo="Central de Contratos (BD_LUCRO)"
        subtitulo="Listagem analítica de operações de compra e venda com visualização detalhada"
      />

      {/* Control bar */}
      <div className="bg-[#12141C] border border-white/[0.07] rounded-xl p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-[#090A0F] border border-white/[0.08] px-2.5 py-1 rounded-lg text-xs">
              <span className="text-[#8E93A6]">Commodity:</span>
              <select
                value={selProd}
                onChange={(e) => { setSelProd(e.target.value); setPagina(1); }}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                {produtos.map(p => (
                  <option key={p} value={p} className="bg-[#161822]">{p}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#090A0F] border border-white/[0.08] px-2.5 py-1 rounded-lg text-xs">
              <span className="text-[#8E93A6]">Cliente:</span>
              <select
                value={selCli}
                onChange={(e) => { setSelCli(e.target.value); setPagina(1); }}
                className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer max-w-[140px]"
              >
                {clientes.map(c => (
                  <option key={c} value={c} className="bg-[#161822]">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search & Export */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Buscar contrato, parceiro..."
                value={termoBusca}
                onChange={(e) => { setTermoBusca(e.target.value); setPagina(1); }}
                className="w-full bg-[#090A0F] border border-white/[0.08] focus:border-[#E58B20] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#686D82] focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-[#8E93A6] absolute left-2.5 top-2.5" />
            </div>

            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#E58B20] text-black font-bold text-xs hover:bg-[#ff9d2e] transition-all shadow-sm flex-shrink-0"
              title="Exportar contratos filtrados para Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#8E93A6] pt-1">
          <span>{contratosFiltrados.length} contratos encontrados (clique em qualquer linha para inspecionar)</span>
          <span>Página {pagina} de {totalPaginas}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-[#12141C]">
        <table className="w-full text-left text-xs text-[#C8CAD4]">
          <thead className="bg-[#161822] text-[11px] font-semibold text-[#8E93A6] uppercase tracking-wider border-b border-white/[0.06]">
            <tr>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('Contrato V')}>
                <div className="flex items-center gap-1">
                  <span>Contrato V</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3">Contrato C</th>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('Fornecedor')}>
                <div className="flex items-center gap-1">
                  <span>Fornecedor</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('Cliente')}>
                <div className="flex items-center gap-1">
                  <span>Cliente</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3">Produto</th>
              <th className="py-3 px-3">Mês</th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('Sacas/Ton')}>
                <div className="flex items-center justify-end gap-1">
                  <span>Sacas</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('Lucro Bruto')}>
                <div className="flex items-center justify-end gap-1">
                  <span>L. Bruto</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('Lucro Líq.')}>
                <div className="flex items-center justify-end gap-1">
                  <span>L. Líquido</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('Lucro Sc/Tn')}>
                <div className="flex items-center justify-end gap-1">
                  <span>R$/Sc</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-2 text-center w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {contratosPaginados.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-[#8E93A6]">
                  Nenhum contrato encontrado.
                </td>
              </tr>
            ) : (
              contratosPaginados.map((row, idx) => {
                const pos = row['Lucro Líq.'] >= 0;
                return (
                  <tr
                    key={idx}
                    onClick={() => setContratoSelecionado(row)}
                    className="hover:bg-white/[0.03] cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-white whitespace-nowrap">
                      {row['Contrato V'] || '-'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[#8E93A6] whitespace-nowrap">
                      {row['Contrato C'] || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[#C8CAD4] max-w-[160px] truncate" title={row.Fornecedor}>
                      {row.Fornecedor || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-white max-w-[160px] truncate" title={row.Cliente}>
                      {row.Cliente || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-[#E58B20] whitespace-nowrap">{row.Produto}</td>
                    <td className="py-2.5 px-3 font-mono text-[#8E93A6] whitespace-nowrap">{row.Mês_Filtro}</td>
                    <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">{numFmt(row['Sacas/Ton'])}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-[#E58B20] whitespace-nowrap">{br(row['Lucro Bruto'])}</td>
                    <td
                      className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap"
                      style={{ color: pos ? '#10B981' : '#EF4444' }}
                    >
                      {br(row['Lucro Líq.'])}
                    </td>
                    <td
                      className="py-2.5 px-3 text-right font-mono font-semibold whitespace-nowrap"
                      style={{ color: (row['Lucro Sc/Tn'] || 0) >= 0 ? '#10B981' : '#EF4444' }}
                    >
                      {br(row['Lucro Sc/Tn'])}
                    </td>
                    <td className="py-2.5 px-2 text-center text-[#8E93A6] group-hover:text-white">
                      <Eye className="w-3.5 h-3.5 mx-auto opacity-40 group-hover:opacity-100" />
                    </td>
                  </tr>
                );
              })
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
