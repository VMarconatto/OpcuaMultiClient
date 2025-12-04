/**
** =======================================================
@SECTION  : UI — DateRangePicker (Styles)
@FILE     : src/components/DateRangePicker/styled.ts
@PURPOSE  : Estilos do seletor de intervalo (wrapper, botão, dropdown e selects)
            com foco em legibilidade e contraste no tema escuro.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import styled from "styled-components";

/**
 * Contêiner raiz do picker.
 * @note `overflow: visible` garante que o dropdown não seja cortado.
 */
export const Wrapper = styled.div`
  position: relative;
  display: inline-block;
  overflow: visible; /* garante que nada corte o dropdown */
`;

/**
 * Botão que exibe o intervalo escolhido e abre/fecha o dropdown.
 * @remarks Usa contraste suave para tema escuro e realce no hover.
 */
export const ToggleButton = styled.button`
  background-color: #1e1e1e;
  color: #ccc;
  padding: 10px 16px;
  border-radius: 20px;
  border: 1px solid #333;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover {
    background-color: #2a2a2a;
  }
`;

/**
 * Container do dropdown com sombra e z-index alto
 * para sobrepor cabeçalhos estreitos.
 */
export const Dropdown = styled.div`
  position: absolute;
  top: 110%;
  right: 0;            /* alinhar à direita ajuda quando o header é estreito */
  background: #1b1b1b;
  border: 1px solid #333;
  padding: 1rem;
  border-radius: 12px;
  z-index: 2000;       /* bem alto */
  box-shadow: 0 4px 12px rgba(0,0,0,.6);
`;

/** Linha com os selects (ano, mês, dias e horas). */
export const SelectRow = styled.div`
  display: flex;
  gap: 1rem;
`;

/**
 * Select genérico com foco destacado.
 * @note Em foco, a borda usa tom quente para guiar a interação.
 */
export const StyledSelect = styled.select`
  padding: 0.5rem;
  background: #121212;
  color: #eee;
  border: 1px solid #444;
  border-radius: 8px;
  font-size: 14px;

  &:focus {
    outline: none;
    border-color: #f7931b;
  }
`;
