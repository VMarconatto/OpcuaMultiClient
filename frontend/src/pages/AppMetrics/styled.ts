/**
** =======================================================
@SECTION  : App Metrics — Infra & Telemetry (UI)
@FILE     : src/pages/AppMetrics/styled.ts
@PURPOSE  : Estilização do painel de métricas: container com vinheta/gradiente,
            grid responsivo dos cards (BoxesRow) e span completo (FullSpan).
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import styled from "styled-components";

/** Paleta neutra usada no gradiente do topo. */
const italianGreen = "#444445ff";
const italianWhite = "#444445ff";
const italianRed = "#444445ff";

/**
 * Container do AppMetrics com vinheta lateral e gradiente neutro.
 */
export const Container = styled.div`
  margin-bottom: 0px;
  padding-bottom: 20px;

  background:
    /* vinheta/contraste — focalizada à direita (onde ficam os ícones) */
    radial-gradient(
      10% 220% at 78% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.32) 78%,
      rgba(0,0,0,0.48) 100%
    ),
    /* degradê principal Itália */
    linear-gradient(135deg, ${italianGreen}, ${italianWhite}, ${italianRed});
  background-blend-mode: overlay, normal;

  > div {
    margin-top: -10px;
    margin-bottom: 30px;
  }
`;

/** Área de conteúdo genérica (mantida para compat). */
export const Content = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
`;

/**
 * Grid dos cards de métricas (2 colunas → 1 no mobile).
 * - Força cada card a ocupar 100% da coluna do grid.
 */
export const BoxesRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;

  /* garante 100% de largura por coluna mesmo com width interna fixa */
  & > * {
    width: 100% !important;
  }

  @media (max-width: 770px) {
    grid-template-columns: 1fr;
  }
`;

/** Linha que ocupa toda a largura do grid (ex.: MorganMetrics). */
export const FullSpan = styled.div`
  grid-column: 1 / -1;
  width: 100%;
`;

/**
 * Wrapper para selects/pickers caso seja necessário no topo do painel.
 * (Mantido aqui por paridade com outras páginas; opcional.)
 */
export const SelectWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 16px;
  padding: 0 16px;
  width: 100%;
  box-sizing: border-box;
`;
