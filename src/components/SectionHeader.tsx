import React from 'react';

interface SectionHeaderProps {
  titulo: string;
  subtitulo?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ titulo, subtitulo }) => {
  return (
    <div className="my-5">
      <h3 className="text-base font-bold text-[#E0E2EB] font-heading m-0 tracking-tight">
        {titulo}
      </h3>
      {subtitulo && (
        <p className="text-xs text-[#8B8FA8] mt-1 m-0">
          {subtitulo}
        </p>
      )}
    </div>
  );
};
