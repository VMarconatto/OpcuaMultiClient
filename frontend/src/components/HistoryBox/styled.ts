
import styled from 'styled-components';

export interface ILegendProps {
  /** Cor aplicada ao quadradinho indicador da série. */
  color?: string;
}

export const Container = styled.div`
  width: 120%;
  height: 550px;
  position: relative;
  background: 
    linear-gradient(135deg, #373737ff 0%, #121212 100%),
    rgba(0, 0, 0, 0.3);

  border-radius: 40px;
  padding: 20px;
  margin: 20px 0;
  bottom: -0px;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 0;
    border-radius: 12px;
    // (ok manter)
    pointer-events: none; // ESSENCIAL: overlay não intercepta cliques
  }

  > * {
    position: relative;
    z-index: 1;
  }
`;

export const ChartContainer = styled.div`
  position: relative;

  &::before {
    pointer-events: none;
    z-index: 1;
  }

  .recharts-wrapper {
    position: relative;
    z-index: 2;
    pointer-events: auto;
 }
`;

export const Header = styled.header`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;

  > span {
    font-size: 28px;
    color: ${({ theme }) => theme.textPrimary};
    padding-right: 16px;
    font-weight: 600;
  }
`;

export const LegendContainer = styled.ul`
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-height: 90px;
  overflow-y: auto;
  padding-right: 16px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.textSecondary};
    border-radius: 4px;
  }
`;

export const Legend = styled.li<ILegendProps>`
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  > div {
    background-color: ${(props) => props.color};
    width: 14px;
    height: 14px;
    border-radius: 3px;
    margin-right: 6px;
  }

  > span {
    font-size: 16px;
    color: ${({ theme }) => theme.textPrimary};
    font-weight: 500;
  }
`;

export const UnitLabel = styled.span`
  width: 100%;
  textAlign: right;
  font-size: 13px;
  font-style: italic;
  color: ${({ theme }) => theme.textSecondary};
  margin-top: -12px;
  margin-bottom: 8px;
  padding-right: 12px;
  display: block;
`;

export const NavArrows = styled.div`
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  z-index: 9999;
  pointer-events: none; 
`;

export const ArrowBtn = styled.button`
  pointer-events: auto;   /* o botão captura cliques */
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: ${({ theme }) => theme.textPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  backdrop-filter: blur(2px);
  transition: background .15s ease;

  &:hover { background: rgba(255,255,255,0.12); }

  &[data-disabled="true"] {
    opacity: .35;
    cursor: not-allowed;
  }
`;
