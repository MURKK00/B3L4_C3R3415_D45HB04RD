export interface LucroRow {
  Empresa: string;
  Ano: number;
  MesNum: number;
  Mês_Filtro: string;
  Trimestre: string;
  Produto: string;
  Cliente: string;
  Fornecedor: string;
  'Contrato V': string;
  'Contrato C': string;
  'Lucro Bruto': number;
  'Total Frete': number;
  Impostos: number;
  Comissão: number;
  Outros: number;
  'Lucro Líq.': number;
  'Peso Kg': number;
  'Sacas/Ton': number;
  Contrato_Aberto: boolean;
}

export interface DespesaRow {
  Empresa: string;
  Ano: number;
  MesNum: number;
  Mês_Filtro: string;
  Item: string;
  Valor: number;
  Categoria_Desp: 'ADMIN' | 'FINANCEIRO';
  Eh_Desp_Admin: boolean;
  Categoria?: string;
}

export interface RecFinRow {
  Empresa: string;
  Ano: number;
  MesNum: number;
  Mês_Filtro: string;
  Item: string;
  Valor: number;
}

export interface FaturamentoRow {
  Empresa: string;
  Ano: number;
  MesNum: number;
  Mês_Filtro: string;
  Faturamento: number;
}

export interface Dataset {
  df_lucro: LucroRow[];
  df_desp: DespesaRow[];
  df_rec_fin: RecFinRow[];
  df_fat: FaturamentoRow[];
  generatedAt?: string;
}

export interface Kpis {
  receita_bruta: number;
  frete: number;
  impostos_venda: number;
  comissao: number;
  outros: number;
  faturamento_total: number;
  custo_operacional: number;
  lucro_operacional: number;
  despesas_admin: number;
  receitas_extras: number;
  rec_financeira: number;
  desp_financeira: number;
  resultado_financeiro: number;
  receita_financeira: number;
  lucro_liquido_final: number;
  margem_bruta: number;
  margem_op: number;
  margem_liq: number;
  indice_desp: number;
  n_contratos: number;
  n_contratos_fechados: number;
  n_contratos_abertos: number;
  peso_total: number;
  sacas_total: number;
  ticket_medio: number;
  lucro_por_saca: number;
}

export interface Filtros {
  anos: number[];
  todasEmpresas: boolean;
  empresas: string[];
  todosProdutos: boolean;
  produtos: string[];
  todosMeses: boolean;
  meses: string[];
}
