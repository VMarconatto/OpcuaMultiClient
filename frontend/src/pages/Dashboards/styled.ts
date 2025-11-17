/**
** =======================================================
@SECTION  : Dashboard — Analytics & History (UI)
@FILE     : src/pages/Dashboard/styled.ts
@PURPOSE  : Estilização da página de Dashboard (container principal,
            grid de conteúdo e wrapper dos selects de filtro).
@LAST_EDIT: 2025-11-11
** =======================================================
*/

import styled from "styled-components";

/** Paleta neutra (tons de cinza usados no fundo). */
const italianGreen = "#444445ff";
const italianWhite = "#444445ff";
const italianRed = "#444445ff";

/**
 * Container principal do Dashboard.
 * - Aplica vinheta e gradiente base.
 */
export const Container = styled.div`
  margin-bottom: 0px;
  padding-bottom: 20px;

  background:
    /* vinheta lateral direita (ícones) */
    radial-gradient(
      10% 220% at 78% 50%,
      rgba(0, 0, 0, 0) 40%,
      rgba(0, 0, 0, 0.32) 78%,
      rgba(0, 0, 0, 0.48) 100%
    ),
    /* gradiente principal */
    linear-gradient(135deg, ${italianGreen}, ${italianWhite}, ${italianRed});
  background-blend-mode: overlay, normal;
`;

/**
 * Área de conteúdo do Dashboard (totalizerboxes, gráficos, histórico).
 * - Layout flexível com quebra automática em telas menores.
 */
export const Content = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
`;

/**
 * Wrapper para selects e pickers (ClientPicker, DateRangePicker).
 * - Organiza controles no cabeçalho com espaçamento responsivo.
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
