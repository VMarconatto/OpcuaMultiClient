
import styled from "styled-components";

const italianGreen = "#21bd3a";

const italianGlow = "rgba(46,203,18,.28)";

export const Container = styled.div`
  width: 100%;

  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 2rem;             /* (mesma medida) */
  border-radius: 10px;       /* (mesma medida) */

  background:
    radial-gradient(10% 220% at 78% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.32) 78%,
      rgba(0,0,0,0.48) 100%),
    linear-gradient(135deg, #454444ff, rgba(5,0,0,0.35), #454444ff);
  background-blend-mode: overlay, normal;

  color: ${({ theme }) => theme.textPrimary};
  margin-top: -10px;         /* (mesma medida) */
`;

export const Wrapper = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
`;

export const ConnectionList = styled.div`
  display: flex;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 1.5rem;
  max-width: 800px;
`;

export const ConnectionCard = styled.button<{ selected: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  width: 6.5rem;   /* mantém o tamanho original */
  height: 6.5rem;  /* mantém o tamanho original */

  background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
  border-radius: 12px;
  border: 1px solid ${({ selected }) => (selected ? italianGreen : "#333")};
  box-shadow: ${({ selected }) =>
    selected
      ? `0 0 0 1px rgba(255,255,255,0.06) inset, 0 8px 22px ${italianGlow}`
      : "0 2px 6px rgba(0,0,0,0.3)"};
  transition: transform .12s ease, box-shadow .2s ease, border-color .2s ease, filter .2s ease;
  cursor: pointer;
  color: ${({ theme }) => theme.textPrimary};

  &:hover {
    box-shadow: 0 0 0 1px rgba(255,255,255,0.06) inset, 0 8px 22px ${italianGlow};
    filter: brightness(1.03);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(46,203,18,.22), 0 8px 22px ${italianGlow};
  }
`;

export const ConnectionName = styled.div`
  font-size: 0.95rem;
  font-weight: 700;
  margin-top: 0.45rem;
  text-align: center;
  max-width: 90%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ConnectionIcon = styled.div<{ active: boolean }>`
  color: ${({ active }) => (active ? italianGreen : "#666")};
  margin-top: 2px;
`;

export const StatusBadge = styled.span<{ active: boolean }>`
  margin-top: 4px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  border-radius: 999px;
  border: 1px solid ${({ active }) => (active ? italianGreen : "#666")};
  background-color: ${({ active }) => (active ? "rgba(33,189,58,0.10)" : "rgba(255,255,255,0.08)")};
  color: ${({ active }) => (active ? italianGreen : "#999")};
`;

export const Title = styled.h2`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.textPrimary};
  margin-bottom: 1rem;
  text-align: left;
  border-bottom: solid rgba(5, 239, 71, 0.6);
  padding-bottom: 8px;
`;

export const Subtitle = styled.p`
  font-size: 1.5rem;
  color: ${({ theme }) => theme.textPrimary};
  margin-bottom: 1.5rem;
`;
