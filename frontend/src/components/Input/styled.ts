/**
** =======================================================
@SECTION  : UI — Input (Styles)
@FILE     : src/components/Input/styled.ts
@PURPOSE  : Estilos base do input utilizando styled-components.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import styled from 'styled-components';

/**
 * `Container` — elemento `<input>` estilizado.
 * @remarks Usa `styled.input`, portanto herda todos os atributos padrão de `<input />`.
 * @note Ajuste dimensões e espaçamentos conforme o design system do projeto.
 */
export const Container = styled.input`
  display: flex;
  width: 100px;

  margin: 7px 0;
  padding: 10px;

  border-radius: 5px;
`;
