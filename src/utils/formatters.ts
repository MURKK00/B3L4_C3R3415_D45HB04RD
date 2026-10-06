// Brazilian Currency and number formatters matching utils/formatters.py

export function br(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
  const fix = Number(valor).toFixed(2);
  const parts = fix.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `R$ ${intPart},${parts[1]}`;
}

export function brMil(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
  const abs = Math.abs(valor);
  if (abs >= 1_000_000) {
    const v = (valor / 1_000_000).toFixed(2).replace('.', ',');
    return `R$ ${v} M`;
  }
  if (abs >= 1_000) {
    const v = (valor / 1_000).toFixed(1).replace('.', ',');
    return `R$ ${v} K`;
  }
  return br(valor);
}

export function kgFmt(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || isNaN(valor)) return '0 kg';
  const abs = Math.abs(valor);
  if (abs >= 1_000_000) {
    const v = (valor / 1_000_000).toFixed(2).replace('.', ',');
    return `${v} M kg`;
  }
  const intPart = Math.round(valor).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${intPart} kg`;
}

export function numFmt(valor: number | null | undefined, dec = 0): string {
  if (valor === null || valor === undefined || isNaN(valor)) return '0';
  const parts = Number(valor).toFixed(dec).split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec > 0 ? `${intPart},${parts[1]}` : intPart;
}

export function pctFmt(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || isNaN(valor)) return '0,0%';
  return `${Number(valor).toFixed(1).replace('.', ',')}%`;
}

export function sinal(valor: number): string {
  return valor >= 0 ? '▲' : '▼';
}
