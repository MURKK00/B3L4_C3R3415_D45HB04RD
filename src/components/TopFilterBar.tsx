import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Building2,
  Wheat,
  Search,
  X,
  ChevronDown,
  Filter,
  Check,
  RotateCcw
} from 'lucide-react';
import type { Filtros } from '../types';

interface TopFilterBarProps {
  filtros: Filtros;
  setFiltros: React.Dispatch<React.SetStateAction<Filtros>>;
  anosDisponiveis: number[];
  empresasDisponiveis: string[];
  produtosDisponiveis: string[];
  mesesDisponiveis: string[];
  totalContratos: number;
  pesoTotalFormatado: string;
}

const MESES_ABREV = [
  { num: '01', label: 'Jan' },
  { num: '02', label: 'Fev' },
  { num: '03', label: 'Mar' },
  { num: '04', label: 'Abr' },
  { num: '05', label: 'Mai' },
  { num: '06', label: 'Jun' },
  { num: '07', label: 'Jul' },
  { num: '08', label: 'Ago' },
  { num: '09', label: 'Set' },
  { num: '10', label: 'Out' },
  { num: '11', label: 'Nov' },
  { num: '12', label: 'Dez' },
];

export const TopFilterBar: React.FC<TopFilterBarProps> = ({
  filtros,
  setFiltros,
  anosDisponiveis,
  empresasDisponiveis,
  produtosDisponiveis,
  mesesDisponiveis,
  totalContratos,
  pesoTotalFormatado,
}) => {
  const [empresaMenuOpen, setEmpresaMenuOpen] = useState(false);
  const [produtoMenuOpen, setProdutoMenuOpen] = useState(false);

  const empresaRef = useRef<HTMLDivElement>(null);
  const produtoRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (empresaRef.current && !empresaRef.current.contains(e.target as Node)) {
        setEmpresaMenuOpen(false);
      }
      if (produtoRef.current && !produtoRef.current.contains(e.target as Node)) {
        setProdutoMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasFiltrosAtivos =
    filtros.anos.length !== anosDisponiveis.length ||
    !filtros.todasEmpresas ||
    !filtros.todosProdutos ||
    !filtros.todosMeses ||
    Boolean(filtros.termoBusca && filtros.termoBusca.trim());

  const resetarFiltros = () => {
    setFiltros({
      anos: anosDisponiveis,
      todasEmpresas: true,
      empresas: empresasDisponiveis,
      todosProdutos: true,
      produtos: produtosDisponiveis,
      todosMeses: true,
      meses: mesesDisponiveis,
      termoBusca: '',
    });
  };

  const selecionarAno = (ano: number) => {
    setFiltros(prev => {
      return {
        ...prev,
        anos: [ano],
        todosMeses: true,
        meses: mesesDisponiveis,
      };
    });
  };

  const selecionarTodosAnos = () => {
    setFiltros(prev => ({
      ...prev,
      anos: anosDisponiveis,
      todosMeses: true,
      meses: mesesDisponiveis,
    }));
  };

  const toggleEmpresa = (emp: string) => {
    setFiltros(prev => {
      const exists = prev.empresas.includes(emp);
      const next = exists ? prev.empresas.filter(e => e !== emp) : [...prev.empresas, emp];
      return {
        ...prev,
        todasEmpresas: next.length === empresasDisponiveis.length,
        empresas: next,
      };
    });
  };

  const toggleAllEmpresas = () => {
    setFiltros(prev => ({
      ...prev,
      todasEmpresas: !prev.todasEmpresas,
      empresas: !prev.todasEmpresas ? empresasDisponiveis : [],
    }));
  };

  const toggleProduto = (prod: string) => {
    setFiltros(prev => {
      const exists = prev.produtos.includes(prod);
      const next = exists ? prev.produtos.filter(p => p !== prod) : [...prev.produtos, prod];
      return {
        ...prev,
        todosProdutos: next.length === produtosDisponiveis.length,
        produtos: next,
      };
    });
  };

  const toggleAllProdutos = () => {
    setFiltros(prev => ({
      ...prev,
      todosProdutos: !prev.todosProdutos,
      produtos: !prev.todosProdutos ? produtosDisponiveis : [],
    }));
  };

  // Month scrubbing
  const toggleMesAbrev = (mesNumStr: string) => {
    // Find matching months in dataset respecting currently selected year(s)
    const matching = mesesDisponiveis.filter(m => {
      const [mNum, yNum] = m.split('/');
      if (mNum !== mesNumStr) return false;
      if (filtros.anos.length > 0 && !filtros.anos.includes(parseInt(yNum, 10))) return false;
      return true;
    });
    if (matching.length === 0) return;

    setFiltros(prev => {
      if (prev.todosMeses) {
        // Switch to only this month
        return {
          ...prev,
          todosMeses: false,
          meses: matching,
        };
      }

      // Check if all matching are currently selected
      const allSelected = matching.every(m => prev.meses.includes(m));
      let nextMeses: string[];
      if (allSelected) {
        nextMeses = prev.meses.filter(m => !matching.includes(m));
      } else {
        nextMeses = Array.from(new Set([...prev.meses, ...matching]));
      }

      if (nextMeses.length === 0 || nextMeses.length === mesesDisponiveis.length) {
        return { ...prev, todosMeses: true, meses: mesesDisponiveis };
      }

      return {
        ...prev,
        todosMeses: false,
        meses: nextMeses,
      };
    });
  };

  const selectAllMeses = () => {
    setFiltros(prev => ({
      ...prev,
      todosMeses: true,
      meses: mesesDisponiveis,
    }));
  };

  // Label for company dropdown
  const labelEmpresa = filtros.todasEmpresas
    ? 'Todas as Empresas'
    : filtros.empresas.length === 1
    ? filtros.empresas[0]
    : `${filtros.empresas.length} Empresas`;

  // Label for product dropdown
  const labelProduto = filtros.todosProdutos
    ? 'Todas as Commodities'
    : filtros.produtos.length === 1
    ? filtros.produtos[0]
    : `${filtros.produtos.length} Commodities`;

  const isTodosAnosAtivo =
    filtros.anos.length === 0 || filtros.anos.length >= anosDisponiveis.length;

  return (
    <div className="bg-[#12141C] border border-white/[0.08] rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
      {/* Top row: Year pills, Company selector, Product selector, Search & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Year selector segmented control with explicit radio dot indicator */}
          <div className="flex items-center bg-[#090A0F] border border-white/[0.09] p-1 rounded-xl text-xs sm:text-sm font-semibold gap-1">
            <button
              type="button"
              onClick={selecionarTodosAnos}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                isTodosAnosAtivo
                  ? 'bg-[#E58B20] text-black font-extrabold shadow-sm'
                  : 'text-[#8E93A6] hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full transition-all ${
                  isTodosAnosAtivo ? 'bg-black' : 'border border-white/25 bg-transparent'
                }`}
              />
              <span>Todos</span>
            </button>
            {anosDisponiveis.map(ano => {
              const active = filtros.anos.length === 1 && filtros.anos[0] === ano;
              return (
                <button
                  type="button"
                  key={ano}
                  onClick={() => selecionarAno(ano)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all font-mono font-bold cursor-pointer ${
                    active
                      ? 'bg-[#E58B20] text-black font-extrabold shadow-sm'
                      : 'text-[#8E93A6] hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-all ${
                      active ? 'bg-black' : 'border border-white/25 bg-transparent'
                    }`}
                  />
                  <span>{ano}</span>
                </button>
              );
            })}
          </div>

          {/* Empresa Dropdown */}
          <div className="relative" ref={empresaRef}>
            <button
              onClick={() => setEmpresaMenuOpen(!empresaMenuOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                !filtros.todasEmpresas
                  ? 'bg-[#E58B20]/15 text-[#E58B20] border-[#E58B20]/40 font-bold'
                  : 'bg-[#090A0F] text-[#C8CAD4] hover:text-white border-white/[0.08] hover:border-white/[0.14]'
              }`}
            >
              <Building2 className="w-4 h-4 opacity-80" />
              <span className="max-w-[160px] truncate">{labelEmpresa}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
            </button>

            {empresaMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-[#161822] border border-white/[0.12] rounded-2xl shadow-2xl p-2.5 z-50 text-xs sm:text-sm animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] px-1 text-xs text-[#8E93A6] font-bold">
                  <span>Filtrar Empresas</span>
                  <button
                    onClick={toggleAllEmpresas}
                    className="text-[#E58B20] hover:underline"
                  >
                    {filtros.todasEmpresas ? 'Desmarcar' : 'Selecionar Todas'}
                  </button>
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {empresasDisponiveis.map(emp => {
                    const checked = filtros.todasEmpresas || filtros.empresas.includes(emp);
                    return (
                      <button
                        key={emp}
                        onClick={() => toggleEmpresa(emp)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.05] text-left transition-colors"
                      >
                        <span className="text-[#C8CAD4] truncate pr-2 font-medium" title={emp}>
                          {emp}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 border ${
                            checked
                              ? 'bg-[#E58B20] border-[#E58B20] text-black'
                              : 'border-white/[0.2] bg-transparent'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Commodity Dropdown */}
          <div className="relative" ref={produtoRef}>
            <button
              onClick={() => setProdutoMenuOpen(!produtoMenuOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
                !filtros.todosProdutos
                  ? 'bg-[#E58B20]/15 text-[#E58B20] border-[#E58B20]/40 font-bold'
                  : 'bg-[#090A0F] text-[#C8CAD4] hover:text-white border-white/[0.08] hover:border-white/[0.14]'
              }`}
            >
              <Wheat className="w-4 h-4 opacity-80" />
              <span className="max-w-[170px] truncate">{labelProduto}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
            </button>

            {produtoMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#161822] border border-white/[0.12] rounded-2xl shadow-2xl p-2.5 z-50 text-xs sm:text-sm animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.08] px-1 text-xs text-[#8E93A6] font-bold">
                  <span>Commodities</span>
                  <button
                    onClick={toggleAllProdutos}
                    className="text-[#E58B20] hover:underline"
                  >
                    {filtros.todosProdutos ? 'Desmarcar' : 'Todas'}
                  </button>
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                  {produtosDisponiveis.map(prod => {
                    const checked = filtros.todosProdutos || filtros.produtos.includes(prod);
                    return (
                      <button
                        key={prod}
                        onClick={() => toggleProduto(prod)}
                        className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/[0.05] text-left transition-colors"
                      >
                        <span className="text-[#C8CAD4] truncate pr-2 font-medium" title={prod}>
                          {prod}
                        </span>
                        <div
                          className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 border ${
                            checked
                              ? 'bg-[#E58B20] border-[#E58B20] text-black'
                              : 'border-white/[0.2] bg-transparent'
                          }`}
                        >
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right side: Search Input & Reset Button */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Quick Search */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Buscar contrato, parceiro, placa..."
              value={filtros.termoBusca || ''}
              onChange={(e) => setFiltros(prev => ({ ...prev, termoBusca: e.target.value }))}
              className="w-full bg-[#090A0F] border border-white/[0.08] focus:border-[#E58B20] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-[#686D82] focus:outline-none transition-colors"
            />
            <Search className="w-4 h-4 text-[#8E93A6] absolute left-3 top-2.5" />
            {filtros.termoBusca && (
              <button
                onClick={() => setFiltros(prev => ({ ...prev, termoBusca: '' }))}
                className="absolute right-2.5 top-2.5 text-[#8E93A6] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Reset Filters (Only when active) */}
          {hasFiltrosAtivos && (
            <button
              onClick={resetarFiltros}
              className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-[#E58B20] hover:text-white hover:bg-[#E58B20]/15 rounded-xl border border-[#E58B20]/30 transition-all flex-shrink-0"
              title="Restaurar todos os filtros"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: Month Scrubber & quiet unboxed metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-white/[0.06]">
        {/* Horizontal Month Scrubber */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={selectAllMeses}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filtros.todosMeses
                ? 'bg-white/12 text-white shadow-sm'
                : 'text-[#8E93A6] hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Todos os Meses
          </button>
          <span className="text-white/15 text-sm">|</span>
          {MESES_ABREV.map(m => {
            const hasDataForMonth = mesesDisponiveis.some(md => {
              const [mNum, yNum] = md.split('/');
              if (mNum !== m.num) return false;
              if (filtros.anos.length > 0 && !filtros.anos.includes(parseInt(yNum, 10))) return false;
              return true;
            });
            const isSelected =
              !filtros.todosMeses &&
              filtros.meses.some(md => {
                const [mNum, yNum] = md.split('/');
                if (mNum !== m.num) return false;
                if (filtros.anos.length > 0 && !filtros.anos.includes(parseInt(yNum, 10))) return false;
                return true;
              });

            return (
              <button
                key={m.num}
                onClick={() => toggleMesAbrev(m.num)}
                disabled={!hasDataForMonth}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  isSelected
                    ? 'bg-[#E58B20] text-black shadow-md'
                    : hasDataForMonth
                    ? 'text-[#C8CAD4] hover:text-white hover:bg-white/[0.05]'
                    : 'text-[#4A4E60] opacity-30 cursor-not-allowed'
                }`}
                title={hasDataForMonth ? `Filtrar mês ${m.label}` : 'Sem movimentação no mês'}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        {/* Quiet unboxed metadata counter per design constitution */}
        <div className="text-xs sm:text-[13px] text-[#8E93A6] font-medium flex items-center gap-2 flex-shrink-0 ml-auto">
          <span className="font-mono text-white font-bold">{totalContratos}</span>
          <span>contratos</span>
          <span aria-hidden="true" className="text-white/20">·</span>
          <span className="font-mono text-[#E58B20] font-bold">{pesoTotalFormatado}</span>
          <span>negociados</span>
        </div>
      </div>
    </div>
  );
};
