import React, { useState, useMemo, useEffect } from 'react';
import { Menu, FileSpreadsheet, RotateCcw, Check, RefreshCw } from 'lucide-react';
import initialDataJson from './data/initialData.json';
import { Sidebar } from './components/Sidebar';
import { AuthModal } from './components/AuthModal';
import { DashboardTab } from './components/tabs/DashboardTab';
import { DreTab } from './components/tabs/DreTab';
import { GraficosTab } from './components/tabs/GraficosTab';
import { ComparativoTab } from './components/tabs/ComparativoTab';
import { ContratosTab } from './components/tabs/ContratosTab';
import { DespesasTab } from './components/tabs/DespesasTab';
import { ExecutivoTab } from './components/tabs/ExecutivoTab';
import {
  calcularKpis,
  filtrarLucro,
  filtrarDespesas,
  filtrarRecFin,
  filtrarFaturamento,
  parseExcelBuffer,
} from './utils/dataLoader';
import type { Dataset, Filtros } from './types';

export const App: React.FC = () => {
  // Authentication
  const [autenticado, setAutenticado] = useState<boolean>(() => {
    return localStorage.getItem('bela_cereais_auth') === 'true';
  });

  // Dataset
  const [dataset, setDataset] = useState<Dataset>(() => initialDataJson as unknown as Dataset);
  const [carregandoArquivo, setCarregandoArquivo] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);

  // Active tab
  const [abaAtiva, setAbaAtiva] = useState<
    'Dashboard' | 'DRE' | 'Gráficos' | 'Comparativo' | 'Contratos' | 'Despesas' | 'Executivo'
  >('Dashboard');

  // Mobile sidebar
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState<boolean>(false);

  // Available filter options
  const anosDisponiveis = useMemo(() => {
    const s = new Set<number>();
    dataset.df_lucro.forEach(r => { if (r.Ano) s.add(r.Ano); });
    const arr = Array.from(s).sort();
    return arr.length > 0 ? arr : [2025, 2026];
  }, [dataset]);

  const empresasDisponiveis = useMemo(() => {
    const s = new Set<string>();
    dataset.df_lucro.forEach(r => { if (r.Empresa) s.add(r.Empresa); });
    return Array.from(s).sort();
  }, [dataset]);

  const produtosDisponiveis = useMemo(() => {
    const s = new Set<string>();
    dataset.df_lucro.forEach(r => { if (r.Produto) s.add(r.Produto); });
    return Array.from(s).sort();
  }, [dataset]);

  const mesesDisponiveis = useMemo(() => {
    const s = new Set<string>();
    dataset.df_lucro.forEach(r => {
      if (r.Mês_Filtro && r.Mês_Filtro !== 'Sem Data') s.add(r.Mês_Filtro);
    });
    return Array.from(s).sort((a, b) => {
      const [m1, y1] = a.split('/').map(Number);
      const [m2, y2] = b.split('/').map(Number);
      return (y1 * 12 + m1) - (y2 * 12 + m2);
    });
  }, [dataset]);

  // Filters State
  const [filtros, setFiltros] = useState<Filtros>(() => ({
    anos: [2025, 2026],
    todasEmpresas: true,
    empresas: [],
    todosProdutos: true,
    produtos: [],
    todosMeses: true,
    meses: [],
  }));

  // Update filter options if anosDisponiveis change
  useEffect(() => {
    setFiltros(prev => ({
      ...prev,
      anos: prev.anos.length === 0 ? anosDisponiveis : prev.anos,
      empresas: prev.todasEmpresas ? empresasDisponiveis : prev.empresas,
      produtos: prev.todosProdutos ? produtosDisponiveis : prev.produtos,
      meses: prev.todosMeses ? mesesDisponiveis : prev.meses,
    }));
  }, [anosDisponiveis, empresasDisponiveis, produtosDisponiveis, mesesDisponiveis]);

  // Filtered dataframes
  const df_lf = useMemo(() => filtrarLucro(dataset.df_lucro, filtros), [dataset.df_lucro, filtros]);
  const df_df = useMemo(() => filtrarDespesas(dataset.df_desp, filtros), [dataset.df_desp, filtros]);
  const df_rf = useMemo(() => filtrarRecFin(dataset.df_rec_fin, filtros), [dataset.df_rec_fin, filtros]);
  const df_ff = useMemo(() => filtrarFaturamento(dataset.df_fat, filtros), [dataset.df_fat, filtros]);

  // KPIs
  const kpis = useMemo(() => calcularKpis(df_lf, df_df, df_rf, df_ff), [df_lf, df_df, df_rf, df_ff]);

  // Comparative dataframes (respect company, product, month filters, but keep all years)
  const df_comp_l = useMemo(() => {
    return dataset.df_lucro.filter(row => {
      if (!filtros.todasEmpresas && filtros.empresas.length > 0 && !filtros.empresas.includes(row.Empresa)) return false;
      if (!filtros.todosProdutos && filtros.produtos.length > 0 && !filtros.produtos.includes(row.Produto)) return false;
      if (!filtros.todosMeses && filtros.meses.length > 0 && !filtros.meses.includes(row.Mês_Filtro)) return false;
      return true;
    });
  }, [dataset.df_lucro, filtros]);

  const df_comp_d = useMemo(() => {
    return dataset.df_desp.filter(row => {
      if (!filtros.todasEmpresas && filtros.empresas.length > 0 && !filtros.empresas.includes(row.Empresa)) return false;
      if (!filtros.todosMeses && filtros.meses.length > 0 && !filtros.meses.includes(row.Mês_Filtro)) return false;
      return true;
    });
  }, [dataset.df_desp, filtros]);

  // Upload handler
  const handleUploadExcel = async (file: File) => {
    try {
      setCarregandoArquivo(true);
      const buffer = await file.arrayBuffer();
      const parsed = await parseExcelBuffer(buffer);
      setDataset(parsed);
      setMensagemSucesso(`Arquivo "${file.name}" carregado com sucesso!`);
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (err) {
      console.error('Erro ao ler Excel:', err);
      alert('Erro ao carregar o arquivo Excel. Verifique a formatação das abas.');
    } finally {
      setCarregandoArquivo(false);
    }
  };

  const handleResetData = () => {
    setDataset(initialDataJson as unknown as Dataset);
    setMensagemSucesso('Dados originais restaurados com sucesso.');
    setTimeout(() => setMensagemSucesso(null), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('bela_cereais_auth');
    setAutenticado(false);
  };

  const anosStr = filtros.anos.slice().sort().join(' & ') || 'Todos';

  const tabs: Array<'Dashboard' | 'DRE' | 'Gráficos' | 'Comparativo' | 'Contratos' | 'Despesas' | 'Executivo'> = [
    'Dashboard',
    'DRE',
    'Gráficos',
    'Comparativo',
    'Contratos',
    'Despesas',
    'Executivo',
  ];

  return (
    <div className="min-h-screen bg-[#0F1117] text-[#C8CAD4] flex">
      {/* Auth Protection */}
      {!autenticado && <AuthModal onSuccess={() => setAutenticado(true)} />}

      {/* Sidebar */}
      <Sidebar
        filtros={filtros}
        setFiltros={setFiltros}
        anosDisponiveis={anosDisponiveis}
        empresasDisponiveis={empresasDisponiveis}
        produtosDisponiveis={produtosDisponiveis}
        mesesDisponiveis={mesesDisponiveis}
        onUploadExcel={handleUploadExcel}
        onResetData={handleResetData}
        onLogout={handleLogout}
        isOpenMobile={sidebarMobileOpen}
        setIsOpenMobile={setSidebarMobileOpen}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="p-4 sm:p-6 pb-3 border-b border-[#2A2D38] bg-[#12141A]/60 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarMobileOpen(true)}
                className="p-2 rounded-lg bg-[#1E2029] border border-[#2A2D38] text-white lg:hidden hover:bg-[#252834]"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white font-heading m-0 tracking-tight">
                  Dashboard Executivo
                </h1>
                <p className="text-xs text-[#8B8FA8] mt-0.5 m-0 font-medium">
                  Grupo Bela Cereais — Comercialização de Grãos ({anosStr})
                </p>
              </div>
            </div>

            {/* Quick Status / Reset feedback */}
            {mensagemSucesso && (
              <div className="hidden sm:flex items-center gap-2 bg-[#2ECC71]/10 border border-[#2ECC71]/30 text-[#2ECC71] px-3 py-1.5 rounded-lg text-xs font-semibold animate-fade-in">
                <Check className="w-4 h-4" />
                <span>{mensagemSucesso}</span>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto mt-4 pt-1 no-scrollbar border-b border-[#2A2D38]">
            {tabs.map(tab => {
              const active = abaAtiva === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setAbaAtiva(tab)}
                  className={`px-3.5 sm:px-5 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all border-b-2 font-heading ${
                    active
                      ? 'border-[#F29124] text-[#F29124] bg-[#F29124]/5'
                      : 'border-transparent text-[#6B7080] hover:text-[#C8CAD4] hover:border-[#3E4252]'
                  }`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </header>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {carregandoArquivo ? (
            <div className="py-24 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-[#F29124] animate-spin mx-auto" />
              <div className="text-sm font-bold text-white">Processando DASHBOARD.xlsx...</div>
              <div className="text-xs text-[#8B8FA8]">Lendo abas, recalculando DRE e indicadores.</div>
            </div>
          ) : (
            <>
              {abaAtiva === 'Dashboard' && (
                <DashboardTab df_lf={df_lf} df_df={df_df} kpis={kpis} />
              )}
              {abaAtiva === 'DRE' && <DreTab kpis={kpis} />}
              {abaAtiva === 'Gráficos' && <GraficosTab df_lf={df_lf} df_df={df_df} />}
              {abaAtiva === 'Comparativo' && (
                <ComparativoTab df_lucro={df_comp_l} df_desp={df_comp_d} kpis={kpis} />
              )}
              {abaAtiva === 'Contratos' && <ContratosTab df_lf={df_lf} />}
              {abaAtiva === 'Despesas' && <DespesasTab df_df={df_df} />}
              {abaAtiva === 'Executivo' && (
                <ExecutivoTab kpis={kpis} df_lf={df_lf} df_df={df_df} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
