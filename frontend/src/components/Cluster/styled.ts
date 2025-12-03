
import styled from "styled-components";

/** Cor para itens da legenda. */
export interface ILegendProps {
  color: string;
}

/** Nível heurístico de status propagado aos estilos. */
type StatusLevel = "ok" | "warn" | "danger" | "unknown";

/**
 * Container principal do card.
 * @param $status Nível de status para variar acentos (top border/pill).
 */
export const Container = styled.div<{ $status: StatusLevel }>`
  width: 49.8%;
  height: 300px;
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

  /* filete superior tema Itália (varia por $status) */
  &::before {
    content: "";
    position: absolute;
    inset: 0 0 auto 0;
    height: 3px;
    background: ${({ $status, theme }) => {
      const red = (theme as any)?.italiaRed || "#ff2e2e";
      const amber = (theme as any)?.italiaAmber || "#ffb02e";
      const green = (theme as any)?.italiaGreen || "#2eff7e";
      const gray = (theme as any)?.italiaGray || "#3a3a3a";
      switch ($status) {
        case "danger":
          return `linear-gradient(90deg, ${red}, ${red})`;
        case "warn":
          return `linear-gradient(90deg, ${amber}, ${amber})`;
        case "ok":
          return `linear-gradient(90deg, ${green}, ${green})`;
        default:
          return `linear-gradient(90deg, ${gray}, ${gray})`;
      }
    }};
  }

  @media (max-width: 770px) {
    width: 100%;
  }
`;

/* Lado esquerdo: título, stats e legenda */
export const SideLeft = styled.aside`
  flex: 1.2;
  padding: 14px 16px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  img {
    display: block;
  }
`;

/* Lado direito: wrapper do gráfico */
export const SideRight = styled.div`
  flex: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px 12px 4px;
  overflow: hidden;
`;

export const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Title = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
`;

/**
 * Pílula de status (cor varia por $status).
 * @param $status Nível "ok" | "warn" | "danger" | "unknown".
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
    const red = (theme as any)?.italiaRed || "#ff2e2e";
    const amber = (theme as any)?.italiaAmber || "#ffb02e";
    const green = (theme as any)?.italiaGreen || "#2eff7e";
    const gray = (theme as any)?.italiaGray || "#3a3a3a";
    switch ($status) {
      case "danger":
        return `linear-gradient(135deg, ${red}33, ${red}22)`;
      case "warn":
        return `linear-gradient(135deg, ${amber}33, ${amber}22)`;
      case "ok":
        return `linear-gradient(135deg, ${green}2b, ${green}1a)`;
      default:
        return `linear-gradient(135deg, ${gray}44, ${gray}22)`;
    }
  }};
`;

export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
`;

export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const Label = styled.span`
  font-size: 0.75rem;
  opacity: 0.85;
`;

export const Value = styled.span`
  font-size: 1.1rem;
  font-weight: 700;
`;

export const LegendContainer = styled.ul`
  list-style: none;
  max-height: 120px;
  padding-right: 6px;
  overflow-y: auto;
  padding-left: 6px;
  margin-top: 4px;

  &.disconnected {
    background-color: #ff4d4f;
    border-radius: 8px;
    padding: 6px;
  }
`;

export const Legend = styled.li<ILegendProps>`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 7px;
  gap: 10px;

  > span {
    margin-left: 2px;
  }
`;

export const ChartWrap = styled.div`
  width: 100%;
  height: 100%;
  position: relative; /* necessário para posicionar o badge */
`;

/** Badge com o % usado do plano (canto superior direito do gráfico). */
export const PctBadge = styled.span`
  position: absolute;
  top: 6px;
  right: 8px;
  font-size: 0.8rem;
  font-weight: 700;
  opacity: 0.9;
  padding: 2px 6px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  pointer-events: none;
`;
