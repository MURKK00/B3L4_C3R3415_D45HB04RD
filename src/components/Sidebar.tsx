import React, { useRef } from 'react';
import { Upload, RotateCcw, Filter, Building2, Calendar, Wheat, FileSpreadsheet, Lock } from 'lucide-react';
import type { Filtros } from '../types';

interface SidebarProps {
  filtros: Filtros;
  setFiltros: React.Dispatch<React.SetStateAction<Filtros>>;
  anosDisponiveis: number[];
  empresasDisponiveis: string[];
  produtosDisponiveis: string[];
  mesesDisponiveis: string[];
  onUploadExcel: (file: File) => void;
  onResetData: () => void;
  onLogout: () => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  filtros,
  setFiltros,
  anosDisponiveis,
  empresasDisponiveis,
  produtosDisponiveis,
  mesesDisponiveis,
  onUploadExcel,
  onResetData,
  onLogout,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleAno = (ano: number) => {
    setFiltros(prev => {
      const exists = prev.anos.includes(ano);
      const newAnos = exists ? prev.anos.filter(a => a !== ano) : [...prev.anos, ano];
      return { ...prev, anos: newAnos.length === 0 ? anosDisponiveis : newAnos };
    });
  };

  const handleEmpresaAll = (checked: boolean) => {
    setFiltros(prev => ({
      ...prev,
      todasEmpresas: checked,
      empresas: checked ? empresasDisponiveis : [],
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

  const handleProdutoAll = (checked: boolean) => {
    setFiltros(prev => ({
      ...prev,
      todosProdutos: checked,
      produtos: checked ? produtosDisponiveis : [],
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

  const handleMesAll = (checked: boolean) => {
    setFiltros(prev => ({
      ...prev,
      todosMeses: checked,
      meses: checked ? mesesDisponiveis : [],
    }));
  };

  const toggleMes = (mes: string) => {
    setFiltros(prev => {
      const exists = prev.meses.includes(mes);
      const next = exists ? prev.meses.filter(m => m !== mes) : [...prev.meses, mes];
      return {
        ...prev,
        todosMeses: next.length === mesesDisponiveis.length,
        meses: next,
      };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onUploadExcel(e.target.files[0]);
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-72 bg-[#16181F] border-r border-[#2A2D38] flex flex-col z-50 transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-5 border-b border-[#2A2D38] flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Bela Cereais Logo"
            className="w-10 h-10 object-contain rounded-lg bg-[#1E2029] p-1 border border-[#2A2D38]"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div>
            <h2 className="font-heading font-extrabold text-white text-base leading-tight tracking-tight">
              Bela Cereais
            </h2>
            <span className="text-[11px] text-[#8B8FA8] font-medium tracking-wide">
              Comercialização de Grãos
            </span>
          </div>
        </div>

        {/* Filters Body */}
        <div className="flex-1 p-5 space-y-6 text-sm">
          {/* Ano filter */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#8B8FA8] text-xs font-semibold uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-[#F29124]" />
              <span>Ano</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {anosDisponiveis.map(ano => {
                const isSelected = filtros.anos.includes(ano);
                return (
                  <button
                    key={ano}
                    onClick={() => toggleAno(ano)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-[#F29124] text-black shadow-sm'
                        : 'bg-[#1E2029] text-[#8B8FA8] hover:text-white border border-[#2A2D38]'
                    }`}
                  >
                    {ano}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#2A2D38]" />

          {/* Empresa filter */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#8B8FA8] text-xs font-semibold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-[#F29124]" />
              <span>Empresa</span>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#C8CAD4] hover:text-white">
                <input
                  type="checkbox"
                  checked={filtros.todasEmpresas}
                  onChange={(e) => handleEmpresaAll(e.target.checked)}
                  className="rounded border-[#2A2D38] bg-[#1E2029] text-[#F29124] focus:ring-0 focus:ring-offset-0 accent-[#F29124]"
                />
                <span className="font-semibold">Todas</span>
              </label>
              {empresasDisponiveis.map(emp => {
                const checked = filtros.todasEmpresas || filtros.empresas.includes(emp);
                return (
                  <label
                    key={emp}
                    className="flex items-center gap-2 cursor-pointer text-xs text-[#8B8FA8] hover:text-white pl-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleEmpresa(emp)}
                      className="rounded border-[#2A2D38] bg-[#1E2029] text-[#F29124] focus:ring-0 focus:ring-offset-0 accent-[#F29124]"
                    />
                    <span className="truncate" title={emp}>{emp}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#2A2D38]" />

          {/* Produto filter */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#8B8FA8] text-xs font-semibold uppercase tracking-wider">
              <Wheat className="w-3.5 h-3.5 text-[#F29124]" />
              <span>Produto</span>
            </div>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#C8CAD4] hover:text-white">
                <input
                  type="checkbox"
                  checked={filtros.todosProdutos}
                  onChange={(e) => handleProdutoAll(e.target.checked)}
                  className="rounded border-[#2A2D38] bg-[#1E2029] text-[#F29124] focus:ring-0 focus:ring-offset-0 accent-[#F29124]"
                />
                <span className="font-semibold">Todos</span>
              </label>
              {produtosDisponiveis.map(prod => {
                const checked = filtros.todosProdutos || filtros.produtos.includes(prod);
                return (
                  <label
                    key={prod}
                    className="flex items-center gap-2 cursor-pointer text-xs text-[#8B8FA8] hover:text-white pl-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleProduto(prod)}
                      className="rounded border-[#2A2D38] bg-[#1E2029] text-[#F29124] focus:ring-0 focus:ring-offset-0 accent-[#F29124]"
                    />
                    <span className="truncate" title={prod}>{prod}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="border-t border-[#2A2D38]" />

          {/* Mês filter */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#8B8FA8] text-xs font-semibold uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-[#F29124]" />
              <span>Mês</span>
            </div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-[#C8CAD4] hover:text-white">
                <input
                  type="checkbox"
                  checked={filtros.todosMeses}
                  onChange={(e) => handleMesAll(e.target.checked)}
                  className="rounded border-[#2A2D38] bg-[#1E2029] text-[#F29124] focus:ring-0 focus:ring-offset-0 accent-[#F29124]"
                />
                <span className="font-semibold">Todos</span>
              </label>
              {mesesDisponiveis.map(mes => {
                const checked = filtros.todosMeses || filtros.meses.includes(mes);
                return (
                  <label
                    key={mes}
                    className="flex items-center gap-2 cursor-pointer text-xs text-[#8B8FA8] hover:text-white pl-2"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMes(mes)}
                      className="rounded border-[#2A2D38] bg-[#1E2029] text-[#F29124] focus:ring-0 focus:ring-offset-0 accent-[#F29124]"
                    />
                    <span>{mes}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-[#2A2D38] space-y-2 bg-[#12141A]">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium bg-[#1E2029] hover:bg-[#252834] text-[#C8CAD4] hover:text-white rounded-lg border border-[#2A2D38] transition-all"
            title="Importar novo arquivo DASHBOARD.xlsx"
          >
            <Upload className="w-3.5 h-3.5 text-[#F29124]" />
            Carregar Novo Excel
          </button>
          <div className="flex gap-2">
            <button
              onClick={onResetData}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8B8FA8] hover:text-white hover:bg-[#1E2029] rounded-lg transition-all border border-transparent hover:border-[#2A2D38]"
              title="Restaurar dados originais"
            >
              <RotateCcw className="w-3 h-3" />
              Restaurar
            </button>
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#8B8FA8] hover:text-[#E74C3C] hover:bg-[#1E2029] rounded-lg transition-all border border-transparent hover:border-[#2A2D38]"
              title="Bloquear sessão"
            >
              <Lock className="w-3 h-3" />
              Sair
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
