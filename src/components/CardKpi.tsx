import React from 'react';

interface CardKpiProps {
  titulo: string;
  valor: string;
  subtitulo?: string;
  cor?: string;
  icone?: React.ReactNode | string;
  alerta?: boolean;
  positivo?: boolean;
  kicker?: string;
}

export const CardKpi: React.FC<CardKpiProps> = ({
  titulo,
  valor,
  subtitulo = '',
  cor = '#E58B20',
  icone = '',
  alerta = false,
  positivo = true,
  kicker = '',
}) => {
  const accentColor = alerta ? (positivo ? '#10B981' : '#EF4444') : cor;

  return (
    <div className="group relative bg-[#12141C] border border-white/[0.07] hover:border-white/[0.14] rounded-xl p-4 sm:p-5 transition-all duration-200">
      {/* Top row: Kicker / Label + Icon */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0 mt-1"
            style={{ backgroundColor: accentColor }}
          />
          <span
            className="text-xs font-bold uppercase tracking-normal text-[#9DA3B4] font-heading leading-snug line-clamp-2 min-h-[28px] flex items-center"
            title={titulo}
          >
            {titulo}
          </span>
        </div>
        {icone && (
          <div className="text-base opacity-80 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1 mt-0.5">
            {icone}
          </div>
        )}
      </div>

      {/* Main Metric Value */}
      <div
        className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-white tabular-nums truncate"
        title={valor}
      >
        {valor}
      </div>

      {/* Subtitle / Kicker */}
      {(subtitulo || kicker) && (
        <div className="mt-2.5 text-xs sm:text-[13px] text-[#9DA3B4] flex items-center justify-between gap-2 font-medium">
          <span className="truncate">{subtitulo}</span>
          {kicker && (
            <span
              className="text-xs font-mono font-bold flex-shrink-0"
              style={{ color: accentColor }}
            >
              {kicker}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
