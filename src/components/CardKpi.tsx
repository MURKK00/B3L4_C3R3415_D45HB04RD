import React from 'react';

interface CardKpiProps {
  titulo: string;
  valor: string;
  subtitulo?: string;
  cor?: string;
  icone?: React.ReactNode | string;
  alerta?: boolean;
  positivo?: boolean;
}

export const CardKpi: React.FC<CardKpiProps> = ({
  titulo,
  valor,
  subtitulo = '',
  cor = '#F29124',
  icone = '',
  alerta = false,
  positivo = true,
}) => {
  const corBorda = alerta ? (positivo ? '#2ECC71' : '#E74C3C') : cor;
  const corValor = corBorda;
  const bgAlerta = alerta
    ? (!positivo ? 'rgba(231,76,60,0.06)' : 'rgba(46,204,113,0.06)')
    : '#16181F';

  return (
    <div
      className="rounded-xl border border-[#2A2D38] p-4 transition-all duration-200 hover:border-[#3E4252] shadow-sm relative overflow-hidden"
      style={{
        backgroundColor: bgAlerta,
        borderLeft: `4px solid ${corBorda}`,
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {typeof icone === 'string' ? (
          <span className="text-lg leading-none">{icone}</span>
        ) : (
          <span className="text-[#8B8FA8]">{icone}</span>
        )}
        <span className="text-[11px] font-semibold text-[#8B8FA8] uppercase tracking-wider font-heading">
          {titulo}
        </span>
      </div>
      <div
        className="text-xl md:text-2xl font-bold font-heading truncate"
        style={{ color: corValor }}
        title={valor}
      >
        {valor}
      </div>
      {subtitulo && (
        <div className="text-xs text-[#8B8FA8] mt-1.5 font-medium flex items-center gap-1">
          {subtitulo}
        </div>
      )}
    </div>
  );
};
