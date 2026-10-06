import * as XLSX from 'xlsx';
import type { Dataset, Filtros, Kpis, LucroRow, DespesaRow, RecFinRow, FaturamentoRow } from '../types';

export const MAPA_EMPRESAS: Record<string, string> = {
  'BC_MATRIZ': 'Bela Cereais Matriz',
  'BC_FILIAL': 'Bela Cereais Filial',
  'MM': 'MM Comercio de Grãos',
};

export const CATEGORIAS_DESP: Record<string, string[]> = {
  'FINANCEIROS': [
    'JUROS EMPRESTIMOS', 'JUROS EMPRESTIMO', 'JUROS S/ MUTUO SOCIO', 'IOF', 'TARIFA BANCARIA',
    'SEGURO DE CREDITO', 'TARIFA/CAMBIO EXPORTAÇÃO', 'TARIFA CAMBIO/EXPORTACAO', 'TARIFA CAMBIO'
  ],
  'IMPOSTOS': [
    'CSLL', 'ICMS S/ FRETE', 'IRPF', 'IRPJ', 'OUTROS IMPOSTOS E TAXAS', 'PARCELAMENTO SEFAZ', 'ITBI', 'FGTS'
  ],
  'PESSOAL': [
    'INSS', 'PRO-LABORE', 'HONORARIOS DIVERSOS', 'SALARIOS'
  ],
  'LOGÍSTICA': [
    'FRETE MARITIMO', 'FRETES/ENCOMENDAS', 'SEGURO CARGA'
  ],
  'OPERACIONAL': [
    'AGUA', 'ALUGUEL', 'COMBUSTIVEL', 'ENERGIA', 'HOSPEDAGEM', 'INFORMATICA',
    'INSTALACAO/MONTAGEM ESCRITORIO', 'INTERNET', 'MANUTENCAO VEICULOS',
    'MATERIAL BENS/CONSUMO', 'REFEICOES/ALIMENTACAO', 'SISTEMA GERENTE MAX',
    'TELEFONE MOVEL', 'CERTIFICADO', 'CONSULTORIA DE NEGOCIOS INTERNACIONAIS',
    'HONORARIO CONTABEL', 'PEDAGIO', 'CUSTAS CARTORIAIS'
  ],
};

export const CORES_CAT: Record<string, string> = {
  'FINANCEIROS': '#EF4444',
  'IMPOSTOS': '#F59E0B',
  'PESSOAL': '#8B5CF6',
  'LOGÍSTICA': '#3B82F6',
  'OPERACIONAL': '#10B981',
  'OUTROS': '#6B7280',
};

export function categorizarDespesa(item: string): string {
  const itemUp = String(item || '').toUpperCase().trim();
  for (const [cat, itens] of Object.entries(CATEGORIAS_DESP)) {
    if (itens.some(i => itemUp.includes(i))) return cat;
  }
  return 'OUTROS';
}

export function parseDateBr(val: any): Date | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') {
    const ms = Math.round((val - 25569) * 86400 * 1000);
    return new Date(ms);
  }
  const s = String(val).toLowerCase().trim();
  const mapa: Record<string, string> = {
    jan: '01', fev: '02', mar: '03', abr: '04', mai: '05', jun: '06',
    jul: '07', ago: '08', set: '09', out: '10', nov: '11', dez: '12'
  };
  let mod = s;
  for (const [k, v] of Object.entries(mapa)) {
    mod = mod.split(k).join(v);
  }
  const parts = mod.split(/[\/\-\.]/);
  if (parts.length >= 2) {
    let day = 1, month = 1, year = 2025;
    if (parts.length === 2) {
      month = parseInt(parts[0], 10);
      year = parseInt(parts[1], 10);
      if (year < 100) year += 2000;
    } else {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
    }
    return new Date(Date.UTC(year, month - 1, day));
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export function calcularKpis(
  df_l: LucroRow[],
  df_d: DespesaRow[],
  df_r: RecFinRow[] = [],
  df_f: FaturamentoRow[] = []
): Kpis {
  const sumCol = (arr: any[], col: string) => arr.reduce((acc, x) => acc + (x[col] || 0), 0);
  const fechados = df_l.filter(x => !x.Contrato_Aberto);

  const rb = sumCol(df_l, 'Lucro Bruto');
  const frt = sumCol(df_l, 'Total Frete');
  const imp = sumCol(df_l, 'Impostos');
  const com = sumCol(df_l, 'Comissão');
  const out = sumCol(df_l, 'Outros');
  const sac = sumCol(df_l, 'Sacas/Ton');
  const nc = fechados.length;
  const fat = sumCol(df_f, 'Valor Venda') || sumCol(df_f, 'Faturamento');
  const cmv = sumCol(df_f, 'Valor Compra') || (fat > rb ? fat - rb : 0);

  const lop = rb - frt - imp - com - out;
  const da = df_d.filter(x => x.Eh_Desp_Admin).reduce((acc, x) => acc + x.Valor, 0);

  let rec_bruta = 0;
  let desp_fin = df_d.filter(x => x.Categoria_Desp === 'FINANCEIRO').reduce((acc, x) => acc + x.Valor, 0);
  let rec_invest = 0;
  let aprop_icms = 0;

  if (df_r && df_r.length > 0) {
    rec_invest = df_r.filter(x => x.Item && x.Item.includes('INVESTIMENTO')).reduce((acc, x) => acc + x.Valor, 0);
    aprop_icms = df_r.filter(x => x.Item && x.Item.includes('ICMS')).reduce((acc, x) => acc + x.Valor, 0);
    rec_bruta = df_r.filter(x => x.Valor > 0 && !x.Item?.includes('ICMS') && !x.Item?.includes('INVESTIMENTO')).reduce((acc, x) => acc + x.Valor, 0);
    desp_fin += Math.abs(df_r.filter(x => x.Valor < 0).reduce((acc, x) => acc + x.Valor, 0));
  }

  const rec_fin_liq = rec_bruta - desp_fin;
  // Lucro Líquido Final: Lucro Operacional - Despesas Administrativas + Investimento + Resultado Financeiro Líquido + Apropriação ICMS
  const llf = lop - da + rec_invest + rec_fin_liq + aprop_icms;

  const baseCalculoMargem = fat > 0 ? fat : (rb > 0 ? rb : 1);
  const margem_bruta = fat > 0 ? (rb / fat * 100) : 0;
  const margem_op = (lop / baseCalculoMargem) * 100;
  const margem_liq = (llf / baseCalculoMargem) * 100;
  const indice_desp = baseCalculoMargem > 0 ? (da / baseCalculoMargem * 100) : 0;

  return {
    receita_bruta: rb,
    frete: frt,
    impostos_venda: imp,
    comissao: com,
    outros: out,
    faturamento_total: fat,
    cmv,
    custo_operacional: cmv,
    lucro_operacional: lop,
    despesas_admin: da,
    receitas_extras: rec_invest,
    rec_financeira: rec_bruta,
    desp_financeira: desp_fin,
    resultado_financeiro: rec_fin_liq,
    receita_financeira: rec_fin_liq,
    apropriacao_icms: aprop_icms,
    receitas_investimento: rec_invest,
    lucro_liquido_final: llf,
    margem_bruta,
    margem_op,
    margem_liq,
    indice_desp,
    n_contratos: df_l.length,
    n_contratos_fechados: nc,
    n_contratos_abertos: df_l.filter(x => x.Contrato_Aberto).length,
    peso_total: sumCol(df_l, 'Peso Kg'),
    sacas_total: sac,
    ticket_medio: nc > 0 ? rb / nc : 0,
    lucro_por_saca: sac > 0 ? llf / sac : 0,
  };
}

export function filtrarLucro(df: LucroRow[], f: Filtros): LucroRow[] {
  return df.filter(row => {
    if (f.anos.length > 0 && !f.anos.includes(row.Ano)) return false;
    if (!f.todasEmpresas && f.empresas.length > 0 && !f.empresas.includes(row.Empresa)) return false;
    if (!f.todosProdutos && f.produtos.length > 0 && !f.produtos.includes(row.Produto)) return false;
    if (!f.todosMeses && f.meses.length > 0 && !f.meses.includes(row.Mês_Filtro)) return false;
    if (f.termoBusca && f.termoBusca.trim()) {
      const t = f.termoBusca.toLowerCase().trim();
      const match =
        (row['Contrato V'] || '').toLowerCase().includes(t) ||
        (row['Contrato C'] || '').toLowerCase().includes(t) ||
        (row.Cliente || '').toLowerCase().includes(t) ||
        (row.Fornecedor || '').toLowerCase().includes(t) ||
        (row.Produto || '').toLowerCase().includes(t);
      if (!match) return false;
    }
    return true;
  });
}

export function filtrarDespesas(df: DespesaRow[], f: Filtros): DespesaRow[] {
  return df.filter(row => {
    if (f.anos.length > 0 && !f.anos.includes(row.Ano)) return false;
    if (!f.todasEmpresas && f.empresas.length > 0 && !f.empresas.includes(row.Empresa)) return false;
    if (!f.todosMeses && f.meses.length > 0 && !f.meses.includes(row.Mês_Filtro)) return false;
    if (f.termoBusca && f.termoBusca.trim()) {
      const t = f.termoBusca.toLowerCase().trim();
      const match = (row.Item || '').toLowerCase().includes(t);
      if (!match) return false;
    }
    return true;
  });
}

export function filtrarRecFin(df: RecFinRow[], f: Filtros): RecFinRow[] {
  return df.filter(row => {
    if (f.anos.length > 0 && !f.anos.includes(row.Ano)) return false;
    if (!f.todasEmpresas && f.empresas.length > 0 && !f.empresas.includes(row.Empresa)) return false;
    if (!f.todosMeses && f.meses.length > 0 && !f.meses.includes(row.Mês_Filtro)) return false;
    return true;
  });
}

export function filtrarFaturamento(df: FaturamentoRow[], f: Filtros): FaturamentoRow[] {
  return df.filter(row => {
    if (f.anos.length > 0 && !f.anos.includes(row.Ano)) return false;
    if (!f.todasEmpresas && f.empresas.length > 0 && !f.empresas.includes(row.Empresa)) return false;
    if (!f.todosMeses && f.meses.length > 0 && !f.meses.includes(row.Mês_Filtro)) return false;
    if (f.termoBusca && f.termoBusca.trim()) {
      const t = f.termoBusca.toLowerCase().trim();
      const match =
        String(row['Num Carregamento'] || '').toLowerCase().includes(t) ||
        String(row.Placa || '').toLowerCase().includes(t) ||
        String(row['Nota Fiscal'] || '').toLowerCase().includes(t);
      if (!match) return false;
    }
    return true;
  });
}

export function mensalPorAno(
  df_l: LucroRow[],
  df_d: DespesaRow[],
  df_r: RecFinRow[] = [],
  df_f: FaturamentoRow[] = []
) {
  const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const anosSet = new Set<number>();
  df_l.forEach(r => anosSet.add(r.Ano));
  const anos = Array.from(anosSet).sort();
  if (anos.length === 0) anos.push(2025, 2026);

  return nomes.map((nome, idx) => {
    const mesNum = idx + 1;
    const row: Record<string, any> = { Mês: nome, MesNum: mesNum };
    for (const ano of anos) {
      const subL = df_l.filter(x => x.Ano === ano && x.MesNum === mesNum);
      const subD = df_d.filter(x => x.Ano === ano && x.MesNum === mesNum);
      const subR = df_r.filter(x => x.Ano === ano && x.MesNum === mesNum);
      const subF = df_f.filter(x => x.Ano === ano && x.MesNum === mesNum);
      const k = calcularKpis(subL, subD, subR, subF);
      row[`Receita_${ano}`] = k.receita_bruta;
      row[`Lucro_Op_${ano}`] = k.lucro_operacional;
      row[`Lucro_Liq_${ano}`] = k.lucro_liquido_final;
      row[`Desp_${ano}`] = k.despesas_admin;
      row[`RecFin_${ano}`] = k.receita_financeira;
    }
    return row;
  });
}

export function trimestralPorAno(
  df_l: LucroRow[],
  df_d: DespesaRow[],
  df_r: RecFinRow[] = [],
  df_f: FaturamentoRow[] = []
) {
  const anosSet = new Set<number>();
  df_l.forEach(r => anosSet.add(r.Ano));
  const anos = Array.from(anosSet).sort();
  if (anos.length === 0) anos.push(2025, 2026);

  const trims: [string, number[]][] = [
    ['T1', [1, 2, 3]],
    ['T2', [4, 5, 6]],
    ['T3', [7, 8, 9]],
    ['T4', [10, 11, 12]],
  ];

  return trims.map(([lbl, meses]) => {
    const row: Record<string, any> = { Trimestre: lbl };
    for (const ano of anos) {
      const subL = df_l.filter(x => x.Ano === ano && meses.includes(x.MesNum));
      const subD = df_d.filter(x => x.Ano === ano && meses.includes(x.MesNum));
      const subR = df_r.filter(x => x.Ano === ano && meses.includes(x.MesNum));
      const subF = df_f.filter(x => x.Ano === ano && meses.includes(x.MesNum));
      const k = calcularKpis(subL, subD, subR, subF);
      row[`Receita_${ano}`] = k.receita_bruta;
      row[`Lucro_Op_${ano}`] = k.lucro_operacional;
      row[`Lucro_Liq_${ano}`] = k.lucro_liquido_final;
      row[`Desp_${ano}`] = k.despesas_admin;
    }
    return row;
  });
}

export function porProdutoAno(df_l: LucroRow[]) {
  if (!df_l || df_l.length === 0) return [];
  const anosSet = new Set<number>();
  const prodSet = new Set<string>();
  df_l.forEach(r => {
    if (r.Ano) anosSet.add(r.Ano);
    if (r.Produto) prodSet.add(r.Produto);
  });
  const anos = Array.from(anosSet).sort();
  const produtos = Array.from(prodSet).sort();

  return produtos.map(prod => {
    const row: Record<string, any> = { Produto: prod };
    for (const ano of anos) {
      const lp = df_l.filter(x => x.Ano === ano && x.Produto === prod);
      const lp_f = lp.filter(x => !x.Contrato_Aberto);
      row[`LB_${ano}`] = lp_f.reduce((acc, x) => acc + (x['Lucro Bruto'] || 0), 0);
      row[`LL_${ano}`] = lp_f.reduce((acc, x) => acc + (x['Lucro Líq.'] || 0), 0);
      row[`KG_${ano}`] = lp.reduce((acc, x) => acc + (x['Peso Kg'] || 0), 0);
      row[`SC_${ano}`] = lp.reduce((acc, x) => acc + (x['Sacas/Ton'] || 0), 0);
      row[`NC_${ano}`] = lp.length;
    }
    return row;
  });
}

export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<Dataset> {
  const wb = XLSX.read(buffer, { type: 'array' });

  function getSheetData(nameExact: string, namePartial: string): any[][] {
    for (const k of wb.SheetNames) {
      if (k.trim().toUpperCase() === nameExact.toUpperCase()) {
        return XLSX.utils.sheet_to_json(wb.Sheets[k], { header: 1 });
      }
    }
    for (const k of wb.SheetNames) {
      if (k.toUpperCase().includes(namePartial.toUpperCase())) {
        return XLSX.utils.sheet_to_json(wb.Sheets[k], { header: 1 });
      }
    }
    return [];
  }

  function adjustHeader(rows: any[][]): Record<string, any>[] {
    if (!rows || rows.length === 0) return [];
    let headerIdx = 0;
    for (let i = 0; i < Math.min(15, rows.length); i++) {
      const vals = (rows[i] || []).map(x => String(x || '').toUpperCase());
      if (vals.some(v => v.includes('VALOR') || v.includes('DATA') || v.includes('MÊS') || v.includes('MES') || v.includes('LUCRO BRUTO') || v.includes('VENDA'))) {
        headerIdx = i;
        break;
      }
    }
    const header = (rows[headerIdx] || []).map(c => String(c || '').trim());
    const results: Record<string, any>[] = [];
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const obj: Record<string, any> = {};
      for (let c = 0; c < header.length; c++) {
        if (header[c]) obj[header[c]] = row[c];
      }
      results.push(obj);
    }
    return results;
  }

  function findCol(row: Record<string, any>, possibleNames: string[]) {
    const keys = Object.keys(row);
    for (const p of possibleNames) {
      const match = keys.find(k => k.trim().toUpperCase() === p.toUpperCase());
      if (match) return match;
    }
    for (const p of possibleNames) {
      const match = keys.find(k => k.toUpperCase().includes(p.toUpperCase()));
      if (match) return match;
    }
    return null;
  }

  const rawL = adjustHeader(getSheetData('BD_LUCRO', 'LUCRO'));
  const rawDc = adjustHeader(getSheetData('BD_DESP', 'DESP'));
  const rawCompl = adjustHeader(getSheetData('BD_DESP_COMPL', 'COMPL'));
  const rawR = adjustHeader(getSheetData('BD_REC_FIN', 'REC_FIN'));
  const rawF = adjustHeader(getSheetData('BD_FATURAMENTO', 'FATURAMENTO'));

  const df_lucro: LucroRow[] = (rawL.map(r => {
    const colEmp = findCol(r, ['EMPRESA', 'FILIAL']);
    const colMes = findCol(r, ['MÊS', 'MES', 'DATA']);
    const empresaRaw = colEmp ? String(r[colEmp] || '') : '';
    if (empresaRaw.toUpperCase().includes('TOTAL')) return null;

    let dt = colMes ? parseDateBr(r[colMes]) : null;
    let ano = dt ? dt.getUTCFullYear() : (r['Ano'] ? parseInt(r['Ano'], 10) : 2025);
    if (ano < 2020 || ano > 2035) return null;

    const empresa = MAPA_EMPRESAS[empresaRaw.trim()] || empresaRaw.trim();
    const mesNum = dt ? (dt.getUTCMonth() + 1) : 0;
    const mesFiltro = dt ? `${String(mesNum).padStart(2, '0')}/${ano}` : 'Sem Data';
    const trimestre = mesNum <= 3 ? 'T1' : mesNum <= 6 ? 'T2' : mesNum <= 9 ? 'T3' : 'T4';

    const num = (k: string) => {
      const col = findCol(r, [k]);
      const val = col ? parseFloat(r[col]) : 0;
      return isNaN(val) ? 0 : val;
    };

    const lb = num('Lucro Bruto');
    const frete = num('Total Frete');
    const imp = num('Impostos');
    const com = num('Comissão');
    const out = num('Outros');
    const ll = num('Lucro Líq.');
    const peso = num('Peso Kg');
    const sacas = num('Sacas/Ton');
    const lucroScTn = num('Lucro Sc/Tn');

    const colsFinSum = Math.abs(lb) + Math.abs(peso) + Math.abs(imp) + Math.abs(frete) + Math.abs(com) + Math.abs(out);
    if (colsFinSum <= 0) return null;

    const prodCol = findCol(r, ['Produto', 'PRODUTO']);
    const cliCol = findCol(r, ['Cliente', 'CLIENTE']);
    const fornCol = findCol(r, ['Fornecedor', 'FORNECEDOR']);
    const contVCol = findCol(r, ['Contrato V', 'CONTRATO V']);
    const contCCol = findCol(r, ['Contrato C', 'CONTRATO C']);

    const item: LucroRow = {
      Empresa: empresa,
      Ano: ano,
      MesNum: mesNum,
      Mês_Filtro: mesFiltro,
      Trimestre: trimestre,
      Produto: prodCol ? String(r[prodCol] || '').trim() : '',
      Cliente: cliCol ? String(r[cliCol] || '').trim() : '',
      Fornecedor: fornCol ? String(r[fornCol] || '').trim() : '',
      'Contrato V': contVCol ? String(r[contVCol] || '').trim() : '',
      'Contrato C': contCCol ? String(r[contCCol] || '').trim() : '',
      'Lucro Bruto': lb,
      'Total Frete': frete,
      Impostos: imp,
      Comissão: com,
      Outros: out,
      'Lucro Líq.': ll,
      'Lucro Sc/Tn': lucroScTn || (sacas > 0 ? ll / sacas : 0),
      'Peso Kg': peso,
      'Sacas/Ton': sacas,
      Contrato_Aberto: lb === 0
    };
    return item;
  }) as (LucroRow | null)[]).filter((x): x is LucroRow => Boolean(x));

  function extrairDataOuPeriodo(r: Record<string, any>, colDataName?: string | null): Date | null {
    if (colDataName && r[colDataName]) {
      const parsed = parseDateBr(r[colDataName]);
      if (parsed) return parsed;
    }
    // Fallback: verificar se NDocumento contém MM/YYYY ou M/YYYY (ex: "7/2026", "06/2026")
    const colDoc = findCol(r, ['NDOCUMENTO', 'N DOCUMENTO', 'DOCUMENTO', 'DOC']);
    if (colDoc && r[colDoc]) {
      const docStr = String(r[colDoc]).trim();
      const match = docStr.match(/^(\d{1,2})[\/\-](\d{4})$/);
      if (match) {
        const m = parseInt(match[1], 10);
        const y = parseInt(match[2], 10);
        if (m >= 1 && m <= 12 && y >= 2020 && y <= 2035) {
          return new Date(Date.UTC(y, m - 1, 1));
        }
      }
    }
    return null;
  }

  function limparDespBase(rawRows: Record<string, any>[], defaultEmpresa: string = 'MM Comercio de Grãos'): DespesaRow[] {
    return rawRows.map(r => {
      const colEmp = findCol(r, ['EMPRESA', 'FILIAL']);
      const empresaRaw = colEmp ? String(r[colEmp] || '').trim() : '';
      if (empresaRaw.toUpperCase() === 'TOTAL') return null;
      const empresa = empresaRaw ? (MAPA_EMPRESAS[empresaRaw] || empresaRaw) : defaultEmpresa;

      const colData = findCol(r, ['DATALANC', 'DATA LANC', 'DATAPAGTO', 'DATA PAGTO', 'DATA', 'MÊS', 'MES', 'VENCIMENTO']);
      const dt = extrairDataOuPeriodo(r, colData);
      const ano = dt ? dt.getUTCFullYear() : (r['Ano'] ? parseInt(r['Ano'], 10) : 2025);
      const mesNum = dt ? (dt.getUTCMonth() + 1) : 0;
      const mesFiltro = dt ? `${String(mesNum).padStart(2, '0')}/${ano}` : 'Sem Data';

      const colVal = findCol(r, ['VLTOTAL', 'VL TOTAL', 'VALORLANC', 'VALOR LANC', 'VALORPAGOR$', 'VALOR PAGO', 'VALOR', 'R$', 'VALORPAGOR']);
      const val = colVal ? parseFloat(r[colVal]) : 0;
      const valor = isNaN(val) ? 0 : val;
      if (Math.abs(valor) <= 0) return null;

      const colCat = findCol(r, ['DESCRICAOPLANOCONTAS', 'PLANO DE CONTAS', 'ITEM', 'DESCRICAO', 'NOMECLIENTEOK', 'CATEGORIA']);
      const item = colCat ? String(r[colCat] || '').trim().toUpperCase() : '';
      if (!item || item.includes('TOTAL') || item.includes('SUBTOTAL')) return null;

      const itensFinanceiro = [
        'IOF', 'IRPJ', 'JUROS EMPRESTIMO', 'JUROS EMPRESTIMOS', 'JUROS S/ MUTUO SOCIO', 'TARIFA BANCARIA', 'RESGATE', 'TRANSFERENCIA', 'CAMBIO', 'TARIFA CAMBIO'
      ];
      let catDesp: 'ADMIN' | 'FINANCEIRO' = 'ADMIN';
      for (const ifin of itensFinanceiro) {
        if (item.includes(ifin)) {
          catDesp = 'FINANCEIRO';
          break;
        }
      }

      return {
        Empresa: empresa,
        Ano: ano,
        MesNum: mesNum,
        Mês_Filtro: mesFiltro,
        Item: item,
        Valor: valor,
        Categoria_Desp: catDesp,
        Eh_Desp_Admin: catDesp === 'ADMIN'
      };
    }).filter((x): x is DespesaRow => x !== null);
  }

  const df_desp_base = limparDespBase(rawDc, 'Bela Cereais Matriz');
  const df_compl_base = limparDespBase(rawCompl, 'MM Comercio de Grãos');

  const df_desp: DespesaRow[] = [];
  for (const d of df_desp_base) {
    if (d.Categoria_Desp === 'ADMIN') {
      df_desp.push(d);
    } else if (d.Categoria_Desp === 'FINANCEIRO' && d.Empresa !== 'MM Comercio de Grãos') {
      df_desp.push(d);
    }
  }
  for (const d of df_compl_base) {
    if (d.Categoria_Desp === 'FINANCEIRO') {
      df_desp.push(d);
    }
  }

  const df_rec_fin: RecFinRow[] = (rawR.map(r => {
    const colEmp = findCol(r, ['EMPRESA', 'FILIAL']);
    const empresaRaw = colEmp ? String(r[colEmp] || '').trim() : '';
    if (empresaRaw.toUpperCase() === 'TOTAL') return null;
    const empresa = empresaRaw ? (MAPA_EMPRESAS[empresaRaw] || empresaRaw) : 'Bela Cereais Matriz';

    const colData = findCol(r, ['DATALANC', 'DATA LANC', 'DATAPAGTO', 'DATA PAGTO', 'DATA', 'MÊS', 'MES']);
    const dt = extrairDataOuPeriodo(r, colData);
    const ano = dt ? dt.getUTCFullYear() : 2025;
    const mesNum = dt ? (dt.getUTCMonth() + 1) : 0;
    const mesFiltro = dt ? `${String(mesNum).padStart(2, '0')}/${ano}` : 'Sem Data';

    const colVal = findCol(r, ['VLTOTAL', 'VL TOTAL', 'VALORLANC', 'VALOR LANC', 'VALORPAGOR$', 'VALOR PAGO', 'VALOR', 'R$', 'VALORPAGOR']);
    const val = colVal ? parseFloat(r[colVal]) : 0;
    const valor = isNaN(val) ? 0 : val;
    if (Math.abs(valor) <= 0) return null;

    const colCat = findCol(r, ['DESCRICAOPLANOCONTAS', 'PLANO DE CONTAS', 'ITEM', 'DESCRICAO', 'NOMECLIENTEOK']);
    const item = colCat ? String(r[colCat] || '').trim().toUpperCase() : '';
    if (!item || item.includes('TOTAL') || item.includes('SUBTOTAL')) return null;

    const termos = ['NDF', 'RENDIMETO', 'RENDIMENTO', 'APLICACAO', 'CREDITO'];
    if (!termos.some(t => item.includes(t))) return null;

    const res: RecFinRow = {
      Empresa: empresa,
      Ano: ano,
      MesNum: mesNum,
      Mês_Filtro: mesFiltro,
      Item: item,
      Valor: valor,
      Descricao: r['Descricao'] ? String(r['Descricao']) : undefined,
      NomeClienteOk: r['NomeClienteOk'] ? String(r['NomeClienteOk']) : undefined,
      NDocumento: r['NDocumento'] ? String(r['NDocumento']) : undefined,
      DescricaoPlanoContas: r['DescricaoPlanoContas'] ? String(r['DescricaoPlanoContas']) : undefined,
      Parcela: r['Parcela'] ? String(r['Parcela']) : undefined,
      DescricaoFormaPagto: r['DescricaoFormaPagto'] ? String(r['DescricaoFormaPagto']) : undefined,
    };
    return res;
  }) as (RecFinRow | null)[]).filter((x): x is RecFinRow => Boolean(x));

  const df_fat: FaturamentoRow[] = (rawF.map(r => {
    const colEmp = findCol(r, ['EMPRESA', 'FILIAL']);
    const empresaRaw = colEmp ? String(r[colEmp] || '').trim() : '';
    if (empresaRaw.toUpperCase() === 'TOTAL') return null;
    const empresa = MAPA_EMPRESAS[empresaRaw] || (empresaRaw || 'Bela Cereais Matriz');

    const colData = findCol(r, ['DATA', 'DATAPAGTO', 'MÊS', 'MES']);
    const dt = colData ? parseDateBr(r[colData]) : null;
    const ano = dt ? dt.getUTCFullYear() : 2025;
    const mesNum = dt ? (dt.getUTCMonth() + 1) : 0;
    const mesFiltro = dt ? `${String(mesNum).padStart(2, '0')}/${ano}` : 'Sem Data';

    const num = (names: string[]) => {
      const col = findCol(r, names);
      const v = col ? parseFloat(r[col]) : 0;
      return isNaN(v) ? 0 : v;
    };

    const valorVenda = num(['VALOR VENDA', 'VLMERCADORIA', 'VL MERCADORIA', 'FATURAMENTO']);
    const valorCompra = num(['VALOR COMPRA', 'COMPRA']);
    const frete = num(['FRETE']);
    const impostos = num(['IMPOSTOS']);
    const outrosGastos = num(['OUTROS GASTOS', 'OUTROS']);
    const lucroContrato = num(['LUCRO CONTRATO', 'LUCRO']);
    const peso = num(['PESO', 'PESO KG']);

    const colCarreg = findCol(r, ['NUM CARREGAMENTO', 'CARREGAMENTO']);
    const colPlaca = findCol(r, ['PLACA']);
    const colNF = findCol(r, ['NOTA FISCAL', 'NF']);

    const res: FaturamentoRow = {
      Empresa: empresa,
      Ano: ano,
      MesNum: mesNum,
      Mês_Filtro: mesFiltro,
      Faturamento: valorVenda,
      'Valor Venda': valorVenda,
      'Valor Compra': valorCompra,
      Frete: frete,
      Impostos: impostos,
      'Outros Gastos': outrosGastos,
      'Lucro Contrato': lucroContrato,
      Peso: peso,
      'Num Carregamento': colCarreg ? r[colCarreg] : '',
      Placa: colPlaca ? String(r[colPlaca] || '').trim() : '',
      'Nota Fiscal': colNF ? r[colNF] : '',
    };
    return res;
  }) as (FaturamentoRow | null)[]).filter((x): x is FaturamentoRow => Boolean(x));

  return {
    df_lucro,
    df_desp,
    df_rec_fin,
    df_fat,
    generatedAt: new Date().toISOString()
  };
}

export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Dados') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
