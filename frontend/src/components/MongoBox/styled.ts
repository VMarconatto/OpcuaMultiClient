
import styled from "styled-components";

/**
 * Props da entrada da legenda.
 * @property color Cor indicativa do item na UI.
 */
export interface ILegendProps {
  color: string;
}

/** Níveis de status sintetizados localmente. */
type StatusLevel = "ok" | "warn" | "danger" | "unknown";

/**
 * Container principal do box.
 * @property $status Controla o filete superior (cor) e estilos derivados.
 * @remarks O filete usa a paleta “Itália” do tema quando disponível, com fallbacks.
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

  /* filete superior tema Itália */
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

/** Lado esquerdo: título, KPIs e legenda. */
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

/** Lado direito: wrapper do minigráfico (ops/min). */
export const SideRight = styled.div`
  flex: 0.8;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px 12px 4px;
  overflow: hidden;
`;

/** Linha do título + pill de status. */
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

/**
 * Indicador de status (ok/warn/danger/unknown).
 * @property $status Nível de severidade usado nas cores do gradiente.
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

/** Grade dos KPIs rápidos (2 colunas). */
export const StatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 12px;
`;

/** Cartãozinho de KPI. */
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
 * Lista de indicadores com rolagem.
 * @note Quando `disconnected`, destaca visualmente a área.
 */
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

/** Item da legenda (ícone + valor + nome). */
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

/** Área que contém o minigráfico de barras. */
export const ChartWrap = styled.div`
  width: 100%;
  height: 100%;
`;
