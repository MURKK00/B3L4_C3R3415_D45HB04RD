import pandas as pd
import streamlit as st

MAPA_EMPRESAS = {
    'BC_MATRIZ': 'Bela Cereais Matriz',
    'BC_FILIAL': 'Bela Cereais Filial',
    'MM':        'MM Comercio de Grãos',
}

def _ajustar_cabecalho(df):
    if df.empty: return df
    for i in range(min(15, len(df))):
        valores = [str(x).upper() for x in df.iloc[i].values]
        if (any('VALOR' in v for v in valores) or any('DATA' in v or 'MÊS' in v or 'MES' in v for v in valores) or any('LUCRO BRUTO' in v for v in valores) or any('VENDA' in v for v in valores)):
            df.columns = df.iloc[i]
            df = df.iloc[i + 1:].reset_index(drop=True)
            df.columns = [str(c).strip() for c in df.columns]
            return df
    df.columns = df.iloc[0]
    df = df.iloc[1:].reset_index(drop=True)
    df.columns = [str(c).strip() for c in df.columns]
    return df

def _encontrar_col(df, possiveis_nomes):
    col_map = {str(c).strip().upper(): c for c in df.columns}
    for p in possiveis_nomes:
        if p.upper() in col_map: return col_map[p.upper()]
    for c in df.columns:
        for p in possiveis_nomes:
            if p.upper() in str(c).upper(): return c
    return None

def _traduzir_data_br(serie):
    s = serie.fillna('').astype(str).str.lower().str.strip()
    mapa = {'jan':'01','fev':'02','mar':'03','abr':'04','mai':'05','jun':'06',
            'jul':'07','ago':'08','set':'09','out':'10','nov':'11','dez':'12'}
    for pt, num in mapa.items():
        s = s.str.replace(pt, num, regex=False)
    return pd.to_datetime(s, errors='coerce', dayfirst=True, format='mixed')

def _item_str(serie):
    return (serie.fillna('').astype(str).str.strip().replace('nan', '', regex=False))

@st.cache_data(ttl=300, show_spinner=False)
def carregar_dados(arquivo='DASHBOARD.xlsx'):
    xls = pd.read_excel(arquivo, sheet_name=None, header=None)
    
    def _get_sheet(nome_exato, nome_parcial):
        for k in xls.keys():
            if nome_exato.upper() == str(k).strip().upper(): return xls[k]
        for k in xls.keys():
            if nome_parcial.upper() in str(k).upper(): return xls[k]
        return pd.DataFrame()
        
    raw_l     = _ajustar_cabecalho(_get_sheet('BD_LUCRO', 'LUCRO'))
    raw_dc    = _ajustar_cabecalho(_get_sheet('BD_DESP', 'DESP')) 
    raw_compl = _ajustar_cabecalho(_get_sheet('BD_DESP_COMPL', 'COMPL'))
    raw_r     = _ajustar_cabecalho(_get_sheet('BD_REC_FIN', 'REC_FIN'))
    raw_f     = _ajustar_cabecalho(_get_sheet('BD_FATURAMENTO', 'FATURAMENTO'))
    
    return _limpar_lucro(raw_l), _limpar_desp(raw_dc, raw_compl), _limpar_rec(raw_r), _limpar_fat(raw_f)

def _limpar_lucro(df):
    if df.empty: return df
    df = df.copy()

    col_emp = _encontrar_col(df, ['EMPRESA', 'FILIAL'])
    col_mes = _encontrar_col(df, ['MÊS', 'MES', 'DATA'])

    if col_emp: df = df[~df[col_emp].astype(str).str.upper().str.contains('TOTAL', na=False)]

    if col_mes:
        df['Mês'] = _traduzir_data_br(df[col_mes])
        df['Ano'] = df['Mês'].dt.year.fillna(2025).astype(int)
    else:
        df['Mês'] = pd.NaT
        df['Ano'] = 2025

    df = df[df['Ano'].isin([2024, 2025, 2026])]
    if col_emp: df['Empresa'] = df[col_emp].map(MAPA_EMPRESAS).fillna(df[col_emp])

    # VOLTOU PARA A LEITURA ORIGINAL E PERFEITA (Sem quebrar Sacas/Ton)
    for c_name in ['Lucro Bruto', 'Total Frete', 'Impostos', 'Comissão', 'Outros', 'Lucro Líq.', 'Peso Kg', 'Sacas/Ton']:
        col_real = _encontrar_col(df, [c_name])
        if col_real:
            df[c_name] = pd.to_numeric(df[col_real], errors='coerce').fillna(0)
        else:
            df[c_name] = 0.0

    df['Mês_Filtro'] = df['Mês'].dt.strftime('%m/%Y').fillna('Sem Data')
    df['MesNum']     = df['Mês'].dt.month.fillna(0).astype(int)
    df['Trimestre']  = df['MesNum'].map({1:'T1',2:'T1',3:'T1',4:'T2',5:'T2',6:'T2',7:'T3',8:'T3',9:'T3',10:'T4',11:'T4',12:'T4'}).fillna('T?')
    df['Contrato_Aberto'] = df['Lucro Bruto'] == 0

    cols_fin = [c for c in ['Lucro Bruto', 'Peso Kg', 'Impostos', 'Total Frete', 'Comissão', 'Outros'] if c in df.columns]
    if cols_fin: df = df[df[cols_fin].abs().sum(axis=1) > 0]

    if col_emp and 'Produto' in df.columns:
        for col in ['Produto', 'Cliente', 'Fornecedor']:
            c = _encontrar_col(df, [col])
            if c and c != col: df[col] = df[c]

    return df.reset_index(drop=True)

def _limpar_desp_base(df):
    if df.empty: return df
    df = df.copy()
    
    col_emp = _encontrar_col(df, ['EMPRESA', 'FILIAL'])
    if col_emp:
        df = df[df[col_emp].astype(str).str.strip().str.upper() != 'TOTAL']
        df['Empresa'] = df[col_emp].map(MAPA_EMPRESAS).fillna(df[col_emp])

    col_data = _encontrar_col(df, ['DATAPAGTO', 'DATA PAGTO', 'DATA', 'MÊS', 'MES', 'VENCIMENTO'])
    if col_data:
        df['_data'] = _traduzir_data_br(df[col_data])
        df['Ano']    = df['_data'].dt.year.fillna(2025).astype(int)
        df['MesNum'] = df['_data'].dt.month.fillna(0).astype(int)
    else:
        df['Ano'], df['MesNum'] = 2025, 0

    col_val = _encontrar_col(df, ['VALORPAGOR$', 'VALOR PAGO', 'VALOR', 'R$'])
    df['Valor'] = pd.to_numeric(df[col_val], errors='coerce').fillna(0) if col_val else 0.0
    
    col_cat = _encontrar_col(df, ['DESCRICAOPLANOCONTAS', 'PLANO DE CONTAS', 'ITEM', 'DESCRICAO', 'CATEGORIA'])
    df['Item'] = _item_str(df[col_cat]).str.upper()
    
    df = df[df['Item'] != '']
    df = df[df['Valor'].abs() > 0]
    df = df[~df['Item'].str.contains('TOTAL', case=False, na=False)]
    df = df[~df['Item'].str.contains('SUBTOTAL', case=False, na=False)]

    def _classificar(item):
        s = item.upper().strip()
        itens_financeiro = [
            'IOF', 'IRPJ', 'JUROS EMPRESTIMO', 'JUROS EMPRESTIMOS', 'JUROS S/ MUTUO SOCIO', 'TARIFA BANCARIA'
        ]
        for i in itens_financeiro:
            if i in s: return 'FINANCEIRO' 
        return 'ADMIN'

    df['Categoria_Desp'] = df['Item'].apply(_classificar)
    df['Eh_Desp_Admin']  = df['Categoria_Desp'] == 'ADMIN'
    df['Mês_Filtro'] = df['_data'].dt.strftime('%m/%Y').fillna('Sem Data') if '_data' in df.columns else 'Sem Data'
    return df.reset_index(drop=True)

def _limpar_desp(raw_dc, raw_compl):
    df_desp = _limpar_desp_base(raw_dc)
    df_compl = _limpar_desp_base(raw_compl)
    
    dfs_para_juntar = []
    if not df_desp.empty:
        df_admin = df_desp[df_desp['Categoria_Desp'] == 'ADMIN']
        if not df_admin.empty: dfs_para_juntar.append(df_admin)
        df_fin_bela = df_desp[(df_desp['Categoria_Desp'] == 'FINANCEIRO') & (df_desp['Empresa'] != 'MM Comercio de Grãos')]
        if not df_fin_bela.empty: dfs_para_juntar.append(df_fin_bela)
        
    if not df_compl.empty:
        df_fin_mm = df_compl[(df_compl['Categoria_Desp'] == 'FINANCEIRO') & (df_compl['Empresa'] == 'MM Comercio de Grãos')]
        if not df_fin_mm.empty: dfs_para_juntar.append(df_fin_mm)
        
    if dfs_para_juntar: return pd.concat(dfs_para_juntar, ignore_index=True)
    return pd.DataFrame()

def _limpar_rec(df):
    _empty = pd.DataFrame(columns=['Empresa','Ano','MesNum','Mês_Filtro','Item','Valor'])
    if df.empty: return _empty
    df = df.copy()

    col_emp = _encontrar_col(df, ['EMPRESA', 'FILIAL'])
    if col_emp:
        df = df[df[col_emp].astype(str).str.strip().str.upper() != 'TOTAL']
        df['Empresa'] = df[col_emp].map(MAPA_EMPRESAS).fillna(df[col_emp])

    col_data = _encontrar_col(df, ['DATAPAGTO', 'DATA PAGTO', 'DATA', 'MÊS', 'MES'])
    df['_data'] = _traduzir_data_br(df[col_data]) if col_data else pd.NaT
    df['Ano']    = df['_data'].dt.year.fillna(2025).astype(int)
    df['MesNum'] = df['_data'].dt.month.fillna(0).astype(int)

    col_val = _encontrar_col(df, ['VALORPAGOR$', 'VALOR PAGO', 'VALOR', 'R$'])
    df['Valor'] = pd.to_numeric(df[col_val], errors='coerce').fillna(0) if col_val else 0.0

    df = df[df['Valor'].abs() > 0]
    col_cat = _encontrar_col(df, ['DESCRICAOPLANOCONTAS', 'PLANO DE CONTAS', 'ITEM', 'DESCRICAO'])
    df['Item'] = _item_str(df[col_cat]).str.upper()
    df = df[df['Item'] != '']
    df = df[~df['Item'].str.contains('TOTAL', case=False, na=False)]
    df = df[~df['Item'].str.contains('SUBTOTAL', case=False, na=False)]

    def _manter_receita(item):
        s = item.upper().strip()
        termos_para_manter = ['NDF', 'RENDIMETO', 'RENDIMENTO', 'APLICACAO']
        for termo in termos_para_manter:
            if termo in s: return True
        return False

    df = df[df['Item'].apply(_manter_receita)]
    df['Mês_Filtro'] = df['_data'].dt.strftime('%m/%Y').fillna('Sem Data') if '_data' in df.columns else 'Sem Data'
    return df.reset_index(drop=True)

def _limpar_fat(df):
    _empty = pd.DataFrame(columns=['Empresa','Ano','MesNum','Mês_Filtro','Faturamento'])
    if df.empty: return _empty
    df = df.copy()

    col_emp = _encontrar_col(df, ['EMPRESA', 'FILIAL'])
    if col_emp:
        df = df[df[col_emp].astype(str).str.strip().str.upper() != 'TOTAL']
        mapa_upper = {k.strip().upper(): v for k, v in MAPA_EMPRESAS.items()}
        df['Empresa'] = df[col_emp].astype(str).str.strip().str.upper().map(mapa_upper).fillna(df[col_emp])
    else:
        df['Empresa'] = 'Bela Cereais Matriz'

    col_data = _encontrar_col(df, ['DATA', 'DATAPAGTO', 'MÊS', 'MES'])
    if col_data:
        df['_data'] = _traduzir_data_br(df[col_data])
        df['Ano']    = df['_data'].dt.year.fillna(2025).astype(int)
        df['MesNum'] = df['_data'].dt.month.fillna(0).astype(int)
        df['Mês_Filtro'] = df['_data'].dt.strftime('%m/%Y').fillna('Sem Data')
    else:
        df['Ano'], df['MesNum'], df['Mês_Filtro'] = 2025, 0, 'Sem Data'

    col_val = _encontrar_col(df, ['VALOR VENDA', 'VLMERCADORIA', 'VL MERCADORIA', 'FATURAMENTO'])
    if col_val:
        df['Faturamento'] = pd.to_numeric(df[col_val], errors='coerce').fillna(0)
    else:
        df['Faturamento'] = 0.0

    return df.reset_index(drop=True)

def calcular_kpis(df_l, df_d, df_r=None, df_f=None):
    def s(df, col): return df[col].sum() if (df is not None and not df.empty and col in df.columns) else 0.0

    df_fechados = df_l[~df_l['Contrato_Aberto']].copy() if not df_l.empty and 'Contrato_Aberto' in df_l.columns else df_l.copy()

    rb  = s(df_l, 'Lucro Bruto')
    frt = s(df_l, 'Total Frete')
    imp = s(df_l, 'Impostos')
    com = s(df_l, 'Comissão')
    out = s(df_l, 'Outros')
    sac = s(df_l, 'Sacas/Ton')
    nc  = len(df_fechados)

    # LENDO O FATURAMENTO:
    fat = s(df_f, 'Faturamento')
    
    lop = rb - frt - imp - com - out
    da = (df_d[df_d['Eh_Desp_Admin']]['Valor'].sum() if (not df_d.empty and 'Eh_Desp_Admin' in df_d.columns) else 0.0)
    receitas_extras = abs(imp)

    rec_bruta = s(df_r, 'Valor') if df_r is not None else 0.0
    desp_fin  = (df_d[df_d['Categoria_Desp'] == 'FINANCEIRO']['Valor'].sum() if (not df_d.empty and 'Categoria_Desp' in df_d.columns) else 0.0)
    
    if df_r is not None and not df_r.empty:
        rec_bruta = df_r[df_r['Valor'] > 0]['Valor'].sum()
        desp_fin += abs(df_r[df_r['Valor'] < 0]['Valor'].sum())

    rec_fin_liq = rec_bruta - desp_fin
    llf = lop - da + receitas_extras + rec_fin_liq

    return dict(
        receita_bruta=rb, frete=frt, impostos_venda=imp, comissao=com, 
        outros=out, faturamento_total=fat,
        custo_operacional=0.0, lucro_operacional=lop, despesas_admin=da, receitas_extras=receitas_extras,
        rec_financeira=rec_bruta, desp_financeira=desp_fin, resultado_financeiro=rec_fin_liq,
        receita_financeira=rec_fin_liq, lucro_liquido_final=llf,
        
        # A MATEMÁTICA CORRETA: (Lucro Bruto / Faturamento Total)
        margem_bruta= (rb / fat * 100) if fat > 0 else 0.0, 
        
        margem_op= (lop / rb * 100) if rb else 0.0,
        margem_liq= (llf / rb * 100) if rb else 0.0, indice_desp= (da / rb * 100) if rb else 0.0,
        n_contratos=len(df_l), n_contratos_fechados=nc,
        n_contratos_abertos=int(df_l['Contrato_Aberto'].sum()) if 'Contrato_Aberto' in df_l.columns else 0,
        peso_total=s(df_l, 'Peso Kg'), sacas_total=s(df_l, 'Sacas/Ton'),
        ticket_medio=rb / nc if nc else 0.0, lucro_por_saca=llf / sac if sac else 0.0,
    )

def _f(df, ano, mes):
    if df is None or df.empty: return pd.DataFrame()
    m = pd.Series([True] * len(df), index=df.index)
    if 'Ano' in df.columns:    m &= df['Ano'] == ano
    if 'MesNum' in df.columns: m &= df['MesNum'] == mes
    return df[m].copy()

def _fm(df, ano, meses):
    if df is None or df.empty: return pd.DataFrame()
    m = pd.Series([True] * len(df), index=df.index)
    if 'Ano' in df.columns:    m &= df['Ano'] == ano
    if 'MesNum' in df.columns: m &= df['MesNum'].isin(meses)
    return df[m].copy()

def mensal_por_ano(df_l, df_d, df_r=None, df_f=None):
    nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
    anos  = sorted(df_l['Ano'].unique()) if 'Ano' in df_l.columns else [2025, 2026]
    rows  = []
    for mi, nome in enumerate(nomes, 1):
        row = {'Mês': nome, 'MesNum': mi}
        for ano in anos:
            k = calcular_kpis(_f(df_l, ano, mi), _f(df_d, ano, mi), _f(df_r, ano, mi) if df_r is not None else None, _f(df_f, ano, mi) if df_f is not None else None)
            row[f'Receita_{ano}']   = k['receita_bruta']
            row[f'Lucro_Op_{ano}']  = k['lucro_operacional']
            row[f'Lucro_Liq_{ano}'] = k['lucro_liquido_final']
            row[f'Desp_{ano}']      = k['despesas_admin']
            row[f'RecFin_{ano}']    = k['receita_financeira']
        rows.append(row)
    return pd.DataFrame(rows)

def trimestral_por_ano(df_l, df_d, df_r=None, df_f=None):
    anos  = sorted(df_l['Ano'].unique()) if 'Ano' in df_l.columns else [2025, 2026]
    trims = [('T1',[1,2,3]),('T2',[4,5,6]),('T3',[7,8,9]),('T4',[10,11,12])]
    rows  = []
    for lbl, meses in trims:
        row = {'Trimestre': lbl}
        for ano in anos:
            k = calcular_kpis(_fm(df_l, ano, meses), _fm(df_d, ano, meses), _fm(df_r, ano, meses) if df_r is not None else None, _fm(df_f, ano, meses) if df_f is not None else None)
            row[f'Receita_{ano}']   = k['receita_bruta']
            row[f'Lucro_Op_{ano}']  = k['lucro_operacional']
            row[f'Lucro_Liq_{ano}'] = k['lucro_liquido_final']
            row[f'Desp_{ano}']      = k['despesas_admin']
        rows.append(row)
    return pd.DataFrame(rows)

def por_produto_ano(df_l):
    if df_l.empty or 'Produto' not in df_l.columns: return pd.DataFrame()
    anos     = sorted(df_l['Ano'].unique()) if 'Ano' in df_l.columns else [2025, 2026]
    produtos = sorted(df_l['Produto'].dropna().unique())
    rows = []
    for prod in produtos:
        row = {'Produto': prod}
        for ano in anos:
            lp  = df_l[(df_l['Ano'] == ano) & (df_l['Produto'] == prod)]
            lp_f = lp[~lp['Contrato_Aberto']] if 'Contrato_Aberto' in lp.columns else lp
            row[f'LB_{ano}'] = lp_f['Lucro Bruto'].sum() if 'Lucro Bruto' in lp_f.columns else 0
            row[f'LL_{ano}'] = lp_f['Lucro Líq.'].sum()  if 'Lucro Líq.' in lp_f.columns  else 0
            row[f'KG_{ano}'] = lp['Peso Kg'].sum()        if 'Peso Kg' in lp.columns        else 0
            row[f'SC_{ano}'] = lp['Sacas/Ton'].sum()      if 'Sacas/Ton' in lp.columns      else 0
            row[f'NC_{ano}'] = len(lp)
        rows.append(row)
    return pd.DataFrame(rows)