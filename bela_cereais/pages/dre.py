import streamlit as st
import pandas as pd
from utils.formatters import br, pct_fmt

def render(kpis: dict):
    # Proteção: Se a planilha vier vazia no filtro, mostra aviso em vez de tela vermelha de erro
    if not kpis:
        st.warning("⚠️ Nenhum dado retornado para o período selecionado.")
        return

    k = kpis
    pos = k.get('lucro_liquido_final', 0) >= 0
    cor_status = "#2ECC71" if pos else "#E74C3C"
    texto_status = "RESULTADO POSITIVO" if pos else "RESULTADO NEGATIVO"

    st.markdown(f"""
    <div style="display:flex; justify-content:space-between; align-items:center; 
                margin-bottom:24px; padding-bottom:12px; border-bottom:1px solid #2A2D38">
        <div>
            <h2 style='margin:0; color:#FFFFFF; font-weight:800; font-size: 24px; font-family:"Montserrat", sans-serif;'>Demonstração do Resultado</h2>
            <span style='color:#8B8FA8; font-size:14px;'>Período selecionado via filtros</span>
        </div>
        <div style="background:{cor_status}22; border:1px solid {cor_status}; border-radius:6px; 
                    padding:6px 12px; display:flex; align-items:center; gap:8px">
            <div style="width:8px; height:8px; background:{cor_status}; border-radius:50%"></div>
            <span style="color:{cor_status}; font-size:11px; font-weight:700; letter-spacing:0.5px;">{texto_status}</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    col_dre, col_info = st.columns([2, 1])

    with col_dre:
        cor_final = "#2ECC71" if k.get('lucro_liquido_final', 0) >= 0 else "#E74C3C"
        cor_fin = "#2ECC71" if k.get('resultado_financeiro', 0) >= 0 else "#E74C3C"
        
        html_dre = (
            "<div style='background:#16181F;border:1px solid #2A2D38;border-radius:16px;padding:32px'>"
            
            # --- BLOCO 1: OPERACIONAL ---
            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:rgba(255,255,255,0.03);border-radius:10px;margin-bottom:12px'>"
            f"<span style='color:#C8CAD4;font-size:16px;font-weight:800'>(+) Receita / Lucro Bruto dos Contratos</span>"
            f"<span style='color:#F29124;font-size:18px;font-weight:800;font-family:\"Montserrat\",sans-serif'>{br(k.get('receita_bruta', 0))}</span>"
            "</div>"
            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:10px 20px;border-bottom:1px solid #2A2D38'>"
            f"<span style='color:#C8CAD4;font-size:14px;font-weight:500'>(-) Total de Fretes</span>"
            f"<span style='color:#E74C3C;font-size:15px;font-weight:500;font-family:\"Montserrat\",sans-serif'>{br(-k.get('frete', 0))}</span>"
            "</div>"
            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:10px 20px;border-bottom:1px solid #2A2D38'>"
            f"<span style='color:#C8CAD4;font-size:14px;font-weight:500'>(-) Impostos sobre Contratos</span>"
            f"<span style='color:#E74C3C;font-size:15px;font-weight:500;font-family:\"Montserrat\",sans-serif'>{br(-k.get('impostos_venda', 0))}</span>"
            "</div>"
            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:10px 20px;border-bottom:1px solid #2A2D38'>"
            f"<span style='color:#C8CAD4;font-size:14px;font-weight:500'>(-) Comissões Pagas</span>"
            f"<span style='color:#E74C3C;font-size:15px;font-weight:500;font-family:\"Montserrat\",sans-serif'>{br(-k.get('comissao', 0))}</span>"
            "</div>"
            
            # --- NOVA LINHA: OUTROS ---
            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:10px 20px;border-bottom:1px solid #2A2D38'>"
            f"<span style='color:#C8CAD4;font-size:14px;font-weight:500'>(-) Outros Gastos Contrato</span>"
            f"<span style='color:#E74C3C;font-size:15px;font-weight:500;font-family:\"Montserrat\",sans-serif'>{br(-k.get('outros', 0))}</span>"
            "</div>"

            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:10px 20px;margin-bottom:10px'>"
            f"<span style='color:#C8CAD4;font-size:14px;font-weight:500'>(-) Custo Operacional (FETHAB, Terceiros)</span>"
            f"<span style='color:#E74C3C;font-size:15px;font-weight:500;font-family:\"Montserrat\",sans-serif'>{br(-k.get('custo_operacional', 0))}</span>"
            "</div>"
            
            # --- RESULTADO OPERACIONAL ---
            "<div style='height:2px;background:#2A2D38;margin:10px 0'></div>"
            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:rgba(59,130,246,0.05);border-radius:10px;margin:12px 0'>"
            f"<span style='color:#C8CAD4;font-size:15px;font-weight:800'>(=) Lucro Líquido Operacional</span>"
            f"<span style='color:#3B82F6;font-size:17px;font-weight:800;font-family:\"Montserrat\",sans-serif'>{br(k.get('lucro_operacional', 0))}</span>"
            "</div>"
            
            # --- BLOCO 2: DESPESAS ADMINISTRATIVAS ---
            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:10px 20px;border-bottom:1px solid #2A2D38'>"
            f"<span style='color:#C8CAD4;font-size:14px;font-weight:500'>(-) Despesas Administrativas</span>"
            f"<span style='color:#E74C3C;font-size:15px;font-weight:500;font-family:\"Montserrat\",sans-serif'>{br(-k.get('despesas_admin', 0))}</span>"
            "</div>"
            
            # --- BLOCO 3: RECEITAS EXTRAS (ICMS) ---
            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:10px 20px;border-bottom:1px solid #2A2D38'>"
            f"<span style='color:#C8CAD4;font-size:14px;font-weight:500'>(+) Apropriação de Crédito ICMS</span>"
            f"<span style='color:#2ECC71;font-size:15px;font-weight:500;font-family:\"Montserrat\",sans-serif'>{br(k.get('receitas_extras', 0))}</span>"
            "</div>"

            # --- BLOCO 4: FINANCEIRO ---
            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:10px 20px;border-bottom:1px solid #2A2D38'>"
            f"<span style='color:#C8CAD4;font-size:14px;font-weight:500'>(+/-) Resultado Financeiro</span>"
            f"<span style='color:{cor_fin};font-size:15px;font-weight:700;font-family:\"Montserrat\",sans-serif'>{br(k.get('resultado_financeiro', 0))}</span>"
            "</div>"
            
            # --- RESULTADO FINAL ---
            "<div style='height:2px;background:#2A2D38;margin:10px 0'></div>"
            f"<div style='display:flex;justify-content:space-between;align-items:center;padding:22px 20px;background:rgba(46,204,113,0.08);border-radius:10px;margin-top:12px'>"
            f"<span style='color:#C8CAD4;font-size:17px;font-weight:900'>(=) LUCRO LÍQUIDO FINAL</span>"
            f"<span style='color:{cor_final};font-size:20px;font-weight:900;font-family:\"Montserrat\",sans-serif'>{br(k.get('lucro_liquido_final', 0))}</span>"
            "</div>"
            "</div>"
        )
        st.markdown(html_dre, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        
        st.markdown("<p style='font-family:\"Montserrat\",sans-serif;font-size:16px;font-weight:700;color:#E0E2EB;margin:0 0 16px 0'>Impacto Financeiro (Deduções)</p>", unsafe_allow_html=True)
        
        # --- CARDS DE IMPACTO COM 5 COLUNAS PARA INCLUIR 'OUTROS' ---
        itens = [
            ("Fretes",           k.get('frete', 0),           k.get('receita_bruta', 0)),
            ("Impostos",         k.get('impostos_venda', 0),  k.get('receita_bruta', 0)),
            ("Comissões",        k.get('comissao', 0),        k.get('receita_bruta', 0)),
            ("Outros",           k.get('outros', 0),          k.get('receita_bruta', 0)),
            ("Desp. Admin.",     k.get('despesas_admin', 0),  k.get('receita_bruta', 0)),
        ]
        
        cols = st.columns(5) # Modificado para 5 colunas
        for i, (nome, val, base) in enumerate(itens):
            pct = val / base * 100 if base else 0
            with cols[i]:
                h = (
                    f"<div style='background:#16181F;border:1px solid #2A2D38;border-radius:12px;padding:16px;text-align:center'>"
                    f"<div style='font-size:11px;color:#6B7080;font-weight:600;text-transform:uppercase;margin-bottom:8px'>{nome}</div>"
                    f"<div style='font-size:18px;font-weight:800;color:#E74C3C;font-family:\"Montserrat\",sans-serif'>{br(val)}</div>"
                    f"<div style='font-size:12px;color:#F59E0B;margin-top:4px'>{pct_fmt(pct)} da receita</div>"
                    f"<div style='background:#2A2D38;border-radius:6px;height:6px;margin-top:10px'><div style='background:#E74C3C;height:6px;border-radius:6px;width:{min(pct,100):.1f}%'></div></div></div>"
                )
                st.markdown(h, unsafe_allow_html=True)

    with col_info:
        st.markdown("<div style='background:#16181F;border:1px solid #2A2D38;border-radius:16px;padding:24px'><p style='font-family:\"Montserrat\",sans-serif;font-size:16px;font-weight:700;color:#E0E2EB;margin:0 0 20px 0'>Análise de Margens</p>", unsafe_allow_html=True)

        margens = [
            ("Margem Bruta",         k.get('margem_bruta', 0),  "% após custos diretos"),
            ("Margem Operacional",   k.get('margem_op', 0),     "% após fretes e impostos"),
            ("Margem Líquida Final", k.get('margem_liq', 0),    "% após todas as despesas"),
            ("Desp. Adm/Lucro Bruto",      k.get('indice_desp', 0),   "% da receita consumida"),
        ]

        html_info = ""
        for nome, val, desc in margens:
            cor = "#2ECC71" if val >= 15 else "#F59E0B" if val >= 0 else "#E74C3C"
            html_info += (
                f"<div style='margin-bottom:16px;padding:18px;background:#1E2029;border-radius:12px;border-left:5px solid {cor}'>"
                f"<div style='font-size:12px;color:#6B7080;font-weight:600;text-transform:uppercase;letter-spacing:1px'>{nome}</div>"
                f"<div style='font-size:28px;font-weight:800;color:{cor};font-family:\"Montserrat\",sans-serif'>{pct_fmt(val)}</div>"
                f"<div style='font-size:12px;color:#8B8FA8;margin-top:4px'>{desc}</div></div>"
            )
            
        st.markdown(html_info + "</div>", unsafe_allow_html=True)