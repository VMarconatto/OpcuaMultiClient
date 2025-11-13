/**
** =======================================================
@SECTION  : UI — Button (Styles)
@FILE     : src/components/Button/styled.ts
@PURPOSE  : Estilos do botão base (dimensões, tipografia, cores e hover),
            utilizando tokens do tema atual (theme.*). Sem alterar regras.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import styled from "styled-components";

/**
 * Container visual do botão.
 * - Usa `theme.textPrimary` e `theme.danger` para cores.
 * - Mantém transição suave no hover.
 */
export const Container = styled.button`
  width: 100px;

  margin: 7px 0;
  padding: 10px;

  border-radius: 5px;

  font-weight: bold;
  color: ${props => props.theme.textPrimary};
  background-color: ${props => props.theme.danger};

  transition: opacity .3s;

  &:hover {
    opacity: .7;
  }
`;
