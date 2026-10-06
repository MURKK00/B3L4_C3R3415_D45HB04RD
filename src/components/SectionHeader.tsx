import React from 'react';

interface SectionHeaderProps {
  titulo: string;
  subtitulo?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ titulo, subtitulo }) => {
  return (
    <div className="my-5">
      <h3 className="text-lg sm:text-xl font-extrabold text-white font-heading m-0 tracking-tight">
        {titulo}
      </h3>
      {subtitulo && (
        <p className="text-xs sm:text-sm text-[#9DA3B4] mt-1 m-0">
          {subtitulo}
        </p>
      )}
    </div>
  );
};
