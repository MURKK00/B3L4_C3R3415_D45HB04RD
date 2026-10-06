import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Upload,
  Lock,
  Layers,
  LayoutDashboard,
  FileSpreadsheet,
  RotateCcw,
  BarChart3,
  ScrollText,
  DollarSign,
  TrendingUp,
  Truck,
  Briefcase,
  PieChart,
  ShieldCheck,
  ChevronDown,
  Database,
  CheckCircle2,
  Check,
  X
} from 'lucide-react';
import initialDataJson from './data/initialData.json';
import { AuthModal } from './components/AuthModal';
import { TopFilterBar } from './components/TopFilterBar';
import { UploadModal } from './components/UploadModal';
import { DashboardTab } from './components/tabs/DashboardTab';
import { DreTab } from './components/tabs/DreTab';
import { GraficosTab } from './components/tabs/GraficosTab';
import { ComparativoTab } from './components/tabs/ComparativoTab';
import { ContratosTab } from './components/tabs/ContratosTab';
import { DespesasTab } from './components/tabs/DespesasTab';
import { FaturamentoTab } from './components/tabs/FaturamentoTab';
import { ExecutivoTab } from './components/tabs/ExecutivoTab';
import {
  calcularKpis,
  filtrarLucro,
  filtrarDespesas,
  filtrarRecFin,
  filtrarFaturamento,
} from './utils/dataLoader';
import { kgFmt, brMil, numFmt } from './utils/formatters';
import type { Dataset, Filtros } from './types';

type TabKey =
  | 'Dashboard'
  | 'DRE'
  | 'Contratos'
  | 'Despesas'
  | 'Faturamento'
  | 'Gráficos'
  | 'Comparativo'
  | 'Executivo';

export const App: React.FC = () => {
  // Authentication
  const [autenticado, setAutenticado] = useState<boolean>(() => {
    return localStorage.getItem('bela_cereais_auth') === 'true';
  });

  // Dataset
  const [dataset, setDataset] = useState<Dataset>(() => {
    try {
      const saved = localStorage.getItem('bela_cereais_saved_dataset');
      if (saved) return JSON.parse(saved) as Dataset;
    } catch {}
    return initialDataJson as unknown as Dataset;
  });
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [nomeArquivoAtivo, setNomeArquivoAtivo] = useState<string>(() => {
    return localStorage.getItem('bela_cereais_saved_filename') || 'DASHBOARD.xlsx';
  });
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>(() => {
    return localStorage.getItem('bela_cereais_saved_time') || 'Base padrão';
  });
  const [confirmacaoCard, setConfirmacaoCard] = useState<{
    arquivo: string;
    hora: string;
    contratos: number;
    despesas: number;
    cargas: number;
    recFin: number;
    pesoKg: number;
  } | null>(null);

  // Active tab
  const [abaAtiva, setAbaAtiva] = useState<TabKey>('Dashboard');

  // Available filter options
  const anosDisponiveis = useMemo(() => {
    const s = new Set<number>();
    dataset.df_lucro?.forEach(r => { if (r.Ano) s.add(r.Ano); });
    dataset.df_fat?.forEach(r => { if (r.Ano) s.add(r.Ano); });
    dataset.df_desp?.forEach(r => { if (r.Ano) s.add(r.Ano); });
    dataset.df_rec_fin?.forEach(r => { if (r.Ano) s.add(r.Ano); });
    const arr = Array.from(s).sort();
    return arr.length > 0 ? arr : [2025, 2026];
  }, [dataset]);

  const empresasDisponiveis = useMemo(() => {
    const s = new Set<string>();
    dataset.df_lucro?.forEach(r => { if (r.Empresa) s.add(r.Empresa); });
    dataset.df_fat?.forEach(r => { if (r.Empresa) s.add(r.Empresa); });
    dataset.df_desp?.forEach(r => { if (r.Empresa) s.add(r.Empresa); });
    return Array.from(s).sort();
  }, [dataset]);

  const produtosDisponiveis = useMemo(() => {
    const s = new Set<string>();
    dataset.df_lucro?.forEach(r => { if (r.Produto) s.add(r.Produto); });
    return Array.from(s).sort();
  }, [dataset]);

  const mesesDisponiveis = useMemo(() => {
    const s = new Set<string>();
    const addMes = (r: { Mês_Filtro?: string }) => {
      if (r?.Mês_Filtro && r.Mês_Filtro !== 'Sem Data') s.add(r.Mês_Filtro);
    };
    dataset.df_lucro?.forEach(addMes);
    dataset.df_fat?.forEach(addMes);
    dataset.df_desp?.forEach(addMes);
    dataset.df_rec_fin?.forEach(addMes);
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
    termoBusca: '',
  }));

  // Update filter options if dataset changes
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

  // Comparative dataframes (respect company, product, month filters, but preserve years)
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

  const handleDatasetLoaded = (newDataset: Dataset, fileName: string) => {
    setDataset(newDataset);
    setNomeArquivoAtivo(fileName);
    const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const timeStr = `Hoje às ${agora}`;
    setUltimaAtualizacao(timeStr);
    try {
      localStorage.setItem('bela_cereais_saved_dataset', JSON.stringify(newDataset));
      localStorage.setItem('bela_cereais_saved_filename', fileName);
      localStorage.setItem('bela_cereais_saved_time', timeStr);
    } catch {}
    const pesoTotal = newDataset.df_lucro.reduce((acc, r) => acc + (r['Peso Kg'] || 0), 0);
    setConfirmacaoCard({
      arquivo: fileName,
      hora: agora,
      contratos: newDataset.df_lucro.length,
      despesas: newDataset.df_desp.length,
      cargas: newDataset.df_fat.length,
      recFin: newDataset.df_rec_fin.length,
      pesoKg: pesoTotal,
    });
  };

  const handleRestaurarPadrao = () => {
    try {
      localStorage.removeItem('bela_cereais_saved_dataset');
      localStorage.removeItem('bela_cereais_saved_filename');
      localStorage.removeItem('bela_cereais_saved_time');
    } catch {}
    setDataset(initialDataJson as unknown as Dataset);
    setNomeArquivoAtivo('DASHBOARD.xlsx');
    setUltimaAtualizacao('Base padrão restaurada');
    setConfirmacaoCard(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('bela_cereais_auth');
    setAutenticado(false);
  };

  // Navigation dropdown menu state
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setMenuAberto(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  interface SubItem {
    id: TabKey;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    badge?: string | number;
  }

  interface NavModule {
    id: string;
    label: string;
    icon: React.ReactNode;
    activeTabs: TabKey[];
    directTab?: TabKey;
    subItems?: SubItem[];
  }

  const modulosNav: NavModule[] = [
    {
      id: 'visao_geral',
      label: 'Visão Geral',
      icon: <LayoutDashboard className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      activeTabs: ['Dashboard'],
      directTab: 'Dashboard',
    },
    {
      id: 'operacoes',
      label: 'Contratos & Operações',
      icon: <ScrollText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      activeTabs: ['Contratos', 'Faturamento'],
      subItems: [
        {
          id: 'Contratos',
          label: 'Contratos de Grãos',
          sublabel: 'Detalhamento analítico de compra e venda (BD_LUCRO)',
          icon: <ScrollText className="w-4 h-4 text-[#E58B20]" />,
          badge: `${df_lf.length} contratos`,
        },
        {
          id: 'Faturamento',
          label: 'Faturamento & Cargas',
          sublabel: 'Expedição física, frete e notas fiscais (BD_FATURAMENTO)',
          icon: <Truck className="w-4 h-4 text-[#3B82F6]" />,
          badge: `${df_ff.length} cargas`,
        },
      ],
    },
    {
      id: 'financeiro',
      label: 'Financeiro & DRE',
      icon: <DollarSign className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      activeTabs: ['DRE', 'Despesas'],
      subItems: [
        {
          id: 'DRE',
          label: 'DRE Gerencial',
          sublabel: 'Demonstração de resultados e apuração de margens líquidas',
          icon: <DollarSign className="w-4 h-4 text-[#10B981]" />,
          badge: 'DRE',
        },
        {
          id: 'Despesas',
          label: 'Despesas Administrativas',
          sublabel: 'Plano de contas, custos fixos e categorização (BD_DESP)',
          icon: <Briefcase className="w-4 h-4 text-[#F59E0B]" />,
          badge: `${df_df.length} itens`,
        },
      ],
    },
    {
      id: 'inteligencia',
      label: 'Análises & Inteligência',
      icon: <BarChart3 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />,
      activeTabs: ['Gráficos', 'Comparativo', 'Executivo'],
      subItems: [
        {
          id: 'Gráficos',
          label: 'Gráficos & Indicadores',
          sublabel: 'Evolução mensal, waterfall DRE e dispersão de contratos',
          icon: <BarChart3 className="w-4 h-4 text-[#8B5CF6]" />,
        },
        {
          id: 'Comparativo',
          label: 'Comparativo 2025 vs 2026',
          sublabel: 'Análise comparativa anual, trimestres e commodities',
          icon: <TrendingUp className="w-4 h-4 text-[#E58B20]" />,
          badge: '2025/2026',
        },
        {
          id: 'Executivo',
          label: 'Resumo Executivo',
          sublabel: 'Síntese estratégica para diretoria e exportação completa',
          icon: <ShieldCheck className="w-4 h-4 text-[#10B981]" />,
          badge: 'Diretoria',
        },
      ],
    },
  ];

  // Active module & sub-item labels
  const currentActiveModule = modulosNav.find(m => m.activeTabs.includes(abaAtiva));
  const currentSubItem = currentActiveModule?.subItems?.find(s => s.id === abaAtiva);
  const currentActiveLabel = currentSubItem?.label || currentActiveModule?.label || abaAtiva;

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#C8CAD4] flex flex-col antialiased selection:bg-[#E58B20]/20 selection:text-white">
      {/* Auth Protection */}
      {!autenticado && <AuthModal onSuccess={() => setAutenticado(true)} />}

      {/* Spreadsheet Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onDatasetLoaded={handleDatasetLoaded}
        nomeArquivoAtual={nomeArquivoAtivo}
        ultimaAtualizacao={ultimaAtualizacao}
        onRestaurarPadrao={handleRestaurarPadrao}
      />

      {/* Executive Master Header */}
      <header className="z-40">
        {/* Tier 1: Brand & Executive Control Bar */}
        <div className="bg-[#0C0E15] border-b border-white/[0.08] px-4 sm:px-8 py-3.5">
          <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
            {/* Brand Identity */}
            <div className="flex items-center gap-3.5 shrink-0">
              <div className="relative group">
                <img
                  src="/logo.png"
                  alt="Bela Cereais Logo"
                  className="w-10 h-10 sm:w-11 sm:h-11 object-contain rounded-xl bg-[#141724] p-1.5 border border-[#E58B20]/40 shadow-md shadow-[#E58B20]/10 transition-transform group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-base sm:text-xl font-black text-white font-heading tracking-tight leading-tight m-0">
                    BELA CEREAIS
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-[#E58B20]/15 text-[#E58B20] border border-[#E58B20]/30 tracking-wider uppercase">
                    Portal Gerencial
                  </span>
                </div>
                <p className="text-xs text-[#8E93A6] font-medium tracking-normal mt-0.5 hidden xs:block m-0">
                  Inteligência Comercial & Gestão de Grãos
                </p>
              </div>
            </div>

            {/* Center Live Data Status Pill (md+) - Clickable to see details or upload */}
            <button
              onClick={() => setUploadModalOpen(true)}
              className="hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#12141F] hover:bg-[#181B28] border border-white/[0.08] hover:border-[#E58B20]/40 text-xs transition-all cursor-pointer group"
              title="Clique para ver detalhes da planilha ou atualizar"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
              </span>
              <span className="font-semibold text-white group-hover:text-[#E58B20] transition-colors">
                {nomeArquivoAtivo}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-[#10B981] font-semibold text-[11px]">
                {ultimaAtualizacao}
              </span>
              <span className="text-white/20">·</span>
              <span className="text-[#8E93A6]">
                <strong className="text-white font-mono">{df_lf.length}</strong> contratos
              </span>
              <span className="text-white/20">·</span>
              <span className="text-[#8E93A6]">
                <strong className="text-white font-mono">{df_ff.length}</strong> cargas
              </span>
            </button>

            {/* Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#E58B20] to-[#F59E0B] text-black font-extrabold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-[#E58B20]/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
                title="Importar novo arquivo DASHBOARD.xlsx"
              >
                <Upload className="w-4 h-4 stroke-[2.5]" />
                <span>Atualizar Planilha</span>
              </button>

              <button
                onClick={handleLogout}
                className="p-2 sm:p-2.5 rounded-xl text-[#8E93A6] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all cursor-pointer"
                title="Bloquear sessão"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Dedicated Grouped Navigation Bar (NO horizontal scrollbar) */}
        <div className="bg-[#0E1017]/98 backdrop-blur-md border-b border-white/[0.09] shadow-lg sticky top-0 z-30">
          <div className="max-w-[1500px] mx-auto px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4">
            {/* Primary Modules Group */}
            <nav ref={navRef} className="flex flex-wrap items-center gap-2 sm:gap-3">
              {modulosNav.map(mod => {
                const isModuleActive = mod.activeTabs.includes(abaAtiva);
                const isOpen = menuAberto === mod.id;

                // Direct Single Tab (Visão Geral)
                if (mod.directTab) {
                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setAbaAtiva(mod.directTab!);
                        setMenuAberto(null);
                      }}
                      className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                        isModuleActive
                          ? 'bg-[#E58B20] text-slate-950 font-black shadow-lg shadow-[#E58B20]/25'
                          : 'text-[#9DA3B4] hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className={isModuleActive ? 'text-black' : 'text-[#8E93A6]'}>
                        {mod.icon}
                      </span>
                      <span>{mod.label}</span>
                    </button>
                  );
                }

                // Group with Vertical Dropdown
                const activeSub = mod.subItems?.find(s => s.id === abaAtiva);

                return (
                  <div key={mod.id} className="relative">
                    <button
                      onClick={() => setMenuAberto(isOpen ? null : mod.id)}
                      className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer select-none ${
                        isModuleActive
                          ? 'bg-[#E58B20] text-slate-950 font-black shadow-lg shadow-[#E58B20]/25'
                          : isOpen
                          ? 'bg-white/[0.1] text-white ring-1 ring-white/[0.2]'
                          : 'text-[#9DA3B4] hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      <span className={isModuleActive ? 'text-black' : 'text-[#8E93A6]'}>
                        {mod.icon}
                      </span>
                      <span>{mod.label}</span>

                      {/* Pill indicating active sub-tab inside group */}
                      {isModuleActive && activeSub && (
                        <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-black/20 text-black">
                          {activeSub.label.split(' ')[0]}
                        </span>
                      )}

                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        } ${isModuleActive ? 'text-black' : 'opacity-60'}`}
                      />
                    </button>

                    {/* Vertical Dropdown List */}
                    {isOpen && (
                      <div className="absolute top-full left-0 mt-2 w-80 sm:w-96 bg-[#141724] border border-white/[0.14] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
                        <div className="px-3 py-2 border-b border-white/[0.06] mb-1.5 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#8E93A6] uppercase tracking-wider">
                            {mod.label}
                          </span>
                          <span className="text-[10px] text-white/40">Selecione uma área</span>
                        </div>

                        <div className="space-y-1">
                          {mod.subItems?.map(sub => {
                            const isSubActive = abaAtiva === sub.id;
                            return (
                              <button
                                key={sub.id}
                                onClick={() => {
                                  setAbaAtiva(sub.id);
                                  setMenuAberto(null);
                                }}
                                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all cursor-pointer ${
                                  isSubActive
                                    ? 'bg-[#E58B20]/15 border border-[#E58B20]/40 text-white'
                                    : 'hover:bg-white/[0.06] text-[#C8CAD4] border border-transparent'
                                }`}
                              >
                                <div
                                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                                    isSubActive ? 'bg-[#E58B20] text-black' : 'bg-[#090A0F] border border-white/[0.08]'
                                  }`}
                                >
                                  {sub.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`text-sm font-bold ${isSubActive ? 'text-[#E58B20]' : 'text-white'}`}>
                                      {sub.label}
                                    </span>
                                    {sub.badge && (
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold shrink-0 ${
                                          isSubActive
                                            ? 'bg-[#E58B20] text-black'
                                            : 'bg-white/[0.08] text-[#9DA3B4]'
                                        }`}
                                      >
                                        {sub.badge}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-[#8E93A6] mt-0.5 line-clamp-1 leading-snug">
                                    {sub.sublabel}
                                  </p>
                                </div>
                                {isSubActive && (
                                  <div className="w-2 h-2 rounded-full bg-[#E58B20] self-center shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Current Active Location Pill */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-[#8E93A6] shrink-0 bg-[#090A0F] border border-white/[0.07] px-3.5 py-1.5 rounded-xl">
              <span>Visão Ativa:</span>
              <span className="font-bold text-[#E58B20] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E58B20]"></span>
                {currentActiveLabel}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Persistent Upload Success Confirmation Card */}
        {confirmacaoCard && (
          <div className="relative overflow-hidden bg-gradient-to-r from-[#0C1D15] via-[#10241A] to-[#0E1520] border-2 border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-emerald-950/40 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Top decorative gradient glow bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-[#E58B20]" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
                  <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-extrabold text-white font-heading m-0 flex items-center gap-2">
                      Planilha Atualizada com Sucesso!
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Sincronizado às {confirmacaoCard.hora}
                    </span>
                  </div>
                  <p className="text-xs text-[#9DA3B4] m-0 mt-0.5">
                    O arquivo <strong className="text-white underline">{confirmacaoCard.arquivo}</strong> foi validado e aplicado em todos os relatórios, gráficos, DRE e filtros.
                  </p>
                </div>
              </div>

              {/* Data Summary Pills & Actions */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-xs font-mono">
                    <strong className="text-white">{numFmt(confirmacaoCard.contratos)}</strong>{' '}
                    <span className="text-[#8E93A6]">contratos</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-xs font-mono">
                    <strong className="text-white">{numFmt(confirmacaoCard.cargas)}</strong>{' '}
                    <span className="text-[#8E93A6]">cargas</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-xs font-mono hidden sm:inline-flex">
                    <strong className="text-white">{numFmt(confirmacaoCard.despesas)}</strong>{' '}
                    <span className="text-[#8E93A6]">despesas</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/[0.08] text-xs font-mono hidden md:inline-flex">
                    <strong className="text-white">{kgFmt(confirmacaoCard.pesoKg)}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 ml-auto md:ml-0">
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="text-xs font-bold text-[#E58B20] hover:text-[#ff9d2e] underline cursor-pointer px-2 py-1"
                  >
                    Ver Detalhes
                  </button>
                  <button
                    onClick={() => setConfirmacaoCard(null)}
                    className="p-1.5 rounded-lg text-[#8E93A6] hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
                    title="Dispensar aviso"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module Sub-Tabs Switcher (Fast direct switching between sibling views) */}
        {currentActiveModule?.subItems && currentActiveModule.subItems.length > 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12141C] border border-white/[0.08] p-2 rounded-2xl shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs font-bold text-[#8E93A6] uppercase tracking-wider px-2 hidden sm:inline">
                {currentActiveModule.label}:
              </span>
              {currentActiveModule.subItems.map(item => {
                const active = abaAtiva === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setAbaAtiva(item.id)}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      active
                        ? 'bg-[#E58B20] text-black shadow-md font-extrabold'
                        : 'text-[#8E93A6] hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                          active ? 'bg-black/25 text-black' : 'bg-white/[0.08] text-[#8E93A6]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Interactive Filter Dock */}
        <TopFilterBar
          filtros={filtros}
          setFiltros={setFiltros}
          anosDisponiveis={anosDisponiveis}
          empresasDisponiveis={empresasDisponiveis}
          produtosDisponiveis={produtosDisponiveis}
          mesesDisponiveis={mesesDisponiveis}
          totalContratos={df_lf.length}
          pesoTotalFormatado={kgFmt(kpis.peso_total)}
        />

        {/* Tab Viewport */}
        <div className="min-h-[500px]">
          {abaAtiva === 'Dashboard' && (
            <DashboardTab df_lf={df_lf} df_df={df_df} kpis={kpis} />
          )}
          {abaAtiva === 'DRE' && (
            <DreTab
              kpis={kpis}
              df_lf={df_lf}
              df_df={df_df}
              df_rf={df_rf}
              df_ff={df_ff}
              dataset={dataset}
              filtros={filtros}
            />
          )}
          {abaAtiva === 'Contratos' && <ContratosTab df_lf={df_lf} />}
          {abaAtiva === 'Despesas' && <DespesasTab df_df={df_df} />}
          {abaAtiva === 'Faturamento' && <FaturamentoTab df_ff={df_ff} />}
          {abaAtiva === 'Gráficos' && <GraficosTab df_lf={df_lf} df_df={df_df} />}
          {abaAtiva === 'Comparativo' && (
            <ComparativoTab df_lucro={df_comp_l} df_desp={df_comp_d} kpis={kpis} />
          )}
          {abaAtiva === 'Executivo' && (
            <ExecutivoTab kpis={kpis} df_lf={df_lf} df_df={df_df} />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
