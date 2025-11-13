/**
** =======================================================
@SECTION  : UI — Morgan HTTP Metrics Styles
@FILE     : src/components/MorganMetricsBox/styled.ts
@PURPOSE  : Estilos do painel de métricas HTTP (container, layout, KPIs,
            legenda e área de gráfico) com filete superior por severidade.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import styled from "styled-components";

/** Severidade de status suportada pelo painel. */
export type StatusLevel = "ok" | "warn" | "danger" | "unknown";

/**
 * Pill — badge/indicador visual de status (ok/warn/danger/unknown).
 * @property $status Controla a paleta do gradiente de fundo.
 * @note Mantém compatibilidade com demais boxes (Host/Mongo/etc.).
 */
export const Pill = styled.span<{ $status: StatusLevel }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${({ theme }) => (theme as any).textPrimary || "#fff"};
  background: ${({ $status, theme }) => {
    const red   = (theme as any)?.italiaRed   || "#ff2e2e";
    const amber = (theme as any)?.italiaAmber || "#ffb02e";
    const green = (theme as any)?.italiaGreen || "#2eff7e";
    const gray  = (theme as any)?.italiaGray  || "#3a3a3a";
    switch ($status) {
      case "danger": return `linear-gradient(135deg, ${red}33, ${red}22)`;
      case "warn":   return `linear-gradient(135deg, ${amber}33, ${amber}22)`;
      case "ok":     return `linear-gradient(135deg, ${green}2b, ${green}1a)`;
      default:       return `linear-gradient(135deg, ${gray}44, ${gray}22)`;
    }
  }};
`;

/**
 * Container principal do box de métricas HTTP.
 * @property $status Define o filete superior (cor) por severidade.
 * @remarks Usa gradiente neutro de fundo e borda leve para destacar no tema escuro.
 */
export const Container = styled.div<{ $status: StatusLevel }>`
  width: 100%;
  height: 450px;
  margin: -10px 0;
  background: linear-gradient(135deg, #1e1e1e 0%, #121212 100%);
  color: ${(props) => props.theme.textPrimary};
  border-radius: 12px;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  overflow: hidden;
  border: 1px solid rgba(255,255,255,0.06);
  position: relative;

  /* Filete superior colorido por severidade */
  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: ${({ $status, theme }) => {
      const red   = (theme as any)?.italiaRed   || "#ff2e2e";
      const amber = (theme as any)?.italiaAmber || "#ffb02e";
      const green = (theme as any)?.italiaGreen || "#2eff7e";
      const gray  = (theme as any)?.italiaGray  || "#3a3a3a";
      switch ($status) {
        case "danger": return `linear-gradient(90deg, ${red}, ${red})`;
        case "warn":   return `linear-gradient(90deg, ${amber}, ${amber})`;
        case "ok":     return `linear-gradient(90deg, ${green}, ${green})`;
        default:       return `linear-gradient(90deg, ${gray}, ${gray})`;
      }
    }};
  }
`;

/** Coluna esquerda — título, KPIs e legenda. */
export const SideLeft = styled.aside`
  flex: 1.2;
  padding: 14px 16px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  img { display: block; }
`;

/** Coluna direita — área do minigráfico. */
export const SideRight = styled.div`
  flex: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px 12px 4px;
  overflow: hidden;
`;

/** Linha do título com pill de status. */
export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

/** Título do box. */
export const Title = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
`;

/** Grade de KPIs (2 colunas). */
export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
`;

/** Cartão de KPI. */
export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

/** Rótulo do KPI. */
export const Label = styled.span`
  font-size: 0.75rem;
  opacity: 0.85;
`;

/** Valor do KPI. */
export const Value = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
`;

/**
 * Lista de itens de legenda (sem scroll para priorizar leitura rápida).
 * @note Se futuramente houver overflow, considere limitar altura e ativar rolagem.
 */
export const LegendContainer = styled.ul`
  list-style: none;
  padding-left: 6px;
  padding-right: 6px;
  margin-top: 4px;

  max-height: none;    /* sem limite */
  overflow: visible;   /* sem scroll */

  /* oculta barras caso algum user agent aplique por padrão */
  scrollbar-width: none;                 /* Firefox */
  &::-webkit-scrollbar { display: none; } /* WebKit */
`;

/** Item da legenda: marcador colorido + valor + rótulo. */
export const Legend = styled.li<{ color: string }>`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 7px;
  gap: 10px;

  > span { margin-left: 2px; }
`;

/** Wrapper da área gráfica. */
export const ChartWrap = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;
