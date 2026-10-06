import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  ArrowRight,
  Database,
  Calendar,
  Package,
  RotateCcw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { parseExcelBuffer } from '../utils/dataLoader';
import { numFmt, kgFmt } from '../utils/formatters';
import type { Dataset } from '../types';

export interface ParsedSummary {
  fileName: string;
  fileSizeStr: string;
  totalContratos: number;
  totalCargas: number;
  totalDespesas: number;
  totalRecFin: number;
  pesoKg: number;
  anos: number[];
  empresas: string[];
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetLoaded: (dataset: Dataset, fileName: string, summary?: ParsedSummary) => void;
  nomeArquivoAtual?: string;
  ultimaAtualizacao?: string;
  onRestaurarPadrao?: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetLoaded,
  nomeArquivoAtual = 'DASHBOARD.xlsx',
  ultimaAtualizacao = 'Base padrão',
  onRestaurarPadrao,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileSizeStr, setFileSizeStr] = useState<string>('');
  const [parsing, setParsing] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [sheetStats, setSheetStats] = useState<Record<string, number> | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<ParsedSummary | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Reset local state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setFileSizeStr('');
      setParsing(false);
      setSucesso(false);
      setSheetStats(null);
      setErrorMsg(null);
      setSummaryData(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return Math.round(bytes / 1024) + ' KB';
  };

  const handleFiles = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setErrorMsg('Por favor selecione um arquivo válido do Excel (.xlsx ou .xls)');
      return;
    }

    try {
      setParsing(true);
      setErrorMsg(null);
      setSucesso(false);
      setFile(selectedFile);
      setFileSizeStr(formatFileSize(selectedFile.size));

      const buffer = await selectedFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      const stats: Record<string, number> = {};
      const expectedSheets = ['BD_LUCRO', 'BD_FATURAMENTO', 'BD_DESP', 'BD_REC_FIN', 'BD_DESP_COMPL'];

      for (const sheet of expectedSheets) {
        const found = wb.SheetNames.find(n => n.toUpperCase().includes(sheet.toUpperCase()));
        if (found) {
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[found]);
          stats[sheet] = rows.length;
        } else {
          stats[sheet] = 0;
        }
      }

      setSheetStats(stats);
      setParsing(false);
    } catch (err: any) {
      setErrorMsg('Erro ao ler a planilha: ' + (err.message || 'Formato incompatível'));
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    try {
      setParsing(true);
      setErrorMsg(null);
      const buffer = await file.arrayBuffer();
      const newDataset = await parseExcelBuffer(buffer);

      const totalContratos = newDataset.df_lucro.length;
      const totalCargas = newDataset.df_fat.length;
      const totalDespesas = newDataset.df_desp.length;
      const totalRecFin = newDataset.df_rec_fin.length;
      const pesoKg = newDataset.df_lucro.reduce((acc, r) => acc + (r['Peso Kg'] || 0), 0);
      const anos = Array.from(new Set(newDataset.df_lucro.map(r => r.Ano))).sort();
      const empresas = Array.from(new Set(newDataset.df_lucro.map(r => r.Empresa))).sort();

      const summary: ParsedSummary = {
        fileName: file.name,
        fileSizeStr,
        totalContratos,
        totalCargas,
        totalDespesas,
        totalRecFin,
        pesoKg,
        anos,
        empresas,
      };

      setSummaryData(summary);
      setParsing(false);
      setSucesso(true);

      // Immediately propagate to parent
      onDatasetLoaded(newDataset, file.name, summary);

      // Also persist binary copy to server
      try {
        fetch('/api/save-dashboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: buffer,
        }).catch(() => {});
      } catch {}
    } catch (err: any) {
      setErrorMsg('Falha ao processar os dados: ' + (err.message || 'Erro inesperado'));
      setParsing(false);
      setSucesso(false);
    }
  };

  const handleDownloadCurrent = () => {
    window.open('/DASHBOARD.xlsx', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-xl bg-[#141622] border border-white/[0.12] rounded-2xl p-5 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E58B20]/15 border border-[#E58B20]/30 flex items-center justify-center text-[#E58B20] shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-heading m-0">
                Atualizar Planilha Base
              </h3>
              <p className="text-xs text-[#8E93A6] m-0 mt-0.5">
                Carregue o arquivo DASHBOARD.xlsx atualizado para recalcular todo o sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#8E93A6] hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active File Banner */}
        <div className="mt-4 p-3 rounded-xl bg-[#0B0D13] border border-white/[0.07] flex flex-wrap items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse shrink-0"></span>
            <span className="text-[#8E93A6]">Planilha atual em uso:</span>
            <strong className="text-white font-mono bg-white/[0.06] px-2 py-0.5 rounded">
              {nomeArquivoAtual}
            </strong>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#8E93A6]">
            <span>Sincronização: {ultimaAtualizacao}</span>
            {onRestaurarPadrao && nomeArquivoAtual !== 'DASHBOARD.xlsx' && (
              <button
                onClick={() => {
                  onRestaurarPadrao();
                  onClose();
                }}
                className="flex items-center gap-1 text-[#E58B20] hover:underline cursor-pointer ml-1 font-semibold"
                title="Voltar para a planilha inicial do sistema"
              >
                <RotateCcw className="w-3 h-3" />
                Restaurar Padrão
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        {sucesso && summaryData ? (
          <div className="py-6 space-y-5 animate-in zoom-in-95 fade-in">
            {/* Success badge */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white font-heading">
                  Planilha Atualizada com Sucesso!
                </h3>
                <p className="text-xs text-emerald-300 font-semibold mt-1">
                  Arquivo: <strong className="text-white underline">{summaryData.fileName}</strong> ({summaryData.fileSizeStr})
                </p>
                <p className="text-xs text-[#8E93A6] mt-1.5 max-w-md mx-auto">
                  Todos os dados foram lidos, validados e aplicados com sucesso em todos os gráficos, KPIs, DRE Gerencial e tabelas.
                </p>
              </div>
            </div>

            {/* Extracted Data Summary Box */}
            <div className="bg-[#0B0D13] border border-emerald-500/30 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 pb-2 border-b border-white/[0.06]">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5" />
                  Resumo dos Dados Carregados
                </span>
                <span className="text-[11px] text-[#8E93A6]">
                  Status: <strong className="text-emerald-400">100% Sincronizado</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-[#141622] border border-white/[0.06] text-center">
                  <div className="text-[11px] text-[#8E93A6]">Contratos Grãos</div>
                  <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                    {numFmt(summaryData.totalContratos)}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-medium">BD_LUCRO</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141622] border border-white/[0.06] text-center">
                  <div className="text-[11px] text-[#8E93A6]">Cargas Expedidas</div>
                  <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                    {numFmt(summaryData.totalCargas)}
                  </div>
                  <div className="text-[10px] text-blue-400 font-medium">BD_FATURAMENTO</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141622] border border-white/[0.06] text-center">
                  <div className="text-[11px] text-[#8E93A6]">Lançamentos Desp.</div>
                  <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                    {numFmt(summaryData.totalDespesas)}
                  </div>
                  <div className="text-[10px] text-purple-400 font-medium">BD_DESP</div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#141622] border border-white/[0.06] text-center">
                  <div className="text-[11px] text-[#8E93A6]">Receitas / Fin.</div>
                  <div className="text-base sm:text-lg font-black font-mono text-white mt-0.5">
                    {numFmt(summaryData.totalRecFin)}
                  </div>
                  <div className="text-[10px] text-amber-400 font-medium">BD_REC_FIN</div>
                </div>
              </div>

              {/* Volume & Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#141622] border border-white/[0.05]">
                  <Package className="w-4 h-4 text-[#E58B20] shrink-0" />
                  <span className="text-[#8E93A6]">Volume Comercializado:</span>
                  <strong className="text-white font-mono ml-auto">
                    {kgFmt(summaryData.pesoKg)}
                  </strong>
                </div>

                <div className="flex items-center gap-2 p-2 rounded-lg bg-[#141622] border border-white/[0.05]">
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-[#8E93A6]">Anos Detectados:</span>
                  <strong className="text-white font-mono ml-auto">
                    {summaryData.anos.join(', ')}
                  </strong>
                </div>
              </div>
            </div>

            {/* Action to confirm and dismiss */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
              >
                <span>Acessar Dashboard Atualizado</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-5 space-y-4 text-xs">
            {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFiles(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-[#E58B20] bg-[#E58B20]/10'
                : 'border-white/[0.15] bg-[#12141C] hover:border-white/[0.3]'
            }`}
          >
            <input
              type="file"
              ref={inputRef}
              accept=".xlsx, .xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFiles(e.target.files[0]);
                }
              }}
            />
            <Upload className="w-8 h-8 text-[#E58B20] mx-auto mb-2 opacity-80" />
            <div className="font-semibold text-white text-sm">
              {file ? file.name : 'Clique ou arraste a planilha aqui'}
            </div>
            <div className="text-[#8E93A6] text-[11px] mt-1">
              Formato aceito: .xlsx ou .xls contendo as abas do sistema
            </div>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Verification of Sheets */}
          {sheetStats && (
            <div className="space-y-2 bg-[#090A0F] border border-white/[0.08] p-3.5 rounded-xl">
              <div className="text-[11px] uppercase tracking-wider font-semibold text-[#8E93A6]">
                Validação de Abas Detectadas:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(sheetStats).map(([sheetName, count]) => {
                  const ok = count > 0;
                  return (
                    <div
                      key={sheetName}
                      className="flex items-center justify-between p-2 rounded-lg bg-[#161822] border border-white/[0.05]"
                    >
                      <span className="font-mono text-[#C8CAD4] truncate pr-1">{sheetName}</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        {ok ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            <span className="text-[#10B981]">{count}</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-amber-500">vazia</span>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick download template action */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-[#8E93A6]">
            <span>Precisa da planilha modelo original?</span>
            <button
              onClick={handleDownloadCurrent}
              className="flex items-center gap-1 text-[#E58B20] hover:underline font-semibold"
            >
              <Download className="w-3 h-3" />
              Baixar Modelo (.xlsx)
            </button>
          </div>
        </div>
        )}

        {/* Footer */}
        {!sucesso && (
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/[0.08]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#8E93A6] hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!file || parsing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#E58B20] hover:bg-[#ff9d2e] text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md cursor-pointer active:scale-95"
            >
              {parsing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processando Planilha...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 stroke-[2.5]" />
                  <span>Confirmar e Carregar Dados</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
