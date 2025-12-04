/**
** =======================================================
@SECTION  : UI — History Alerts Card (Styles)
@FILE     : src/components/HistoryAlertsCard/style.ts
@PURPOSE  : Estilização do cartão de histórico de alertas com tag colorida,
            tipografia ajustada e efeitos de hover.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import styled from 'styled-components';

/**
 * Propriedades para o container do cartão.
 * @property isActive - Indica estado visual (reservado para futuras variações).
 */
interface IContainerProps {
  isActive: boolean;
}

/**
 * Propriedades da tarja lateral colorida.
 * @property color - Cor aplicada à tag, derivada da severidade do alerta.
 */
interface ITagProps {
  color: string;
}

/**
 * Contêiner principal do cartão de alerta.
 *
 * @remarks
 * - Usa `list-style-type: none` para eliminar o marcador padrão de `<li>`.
 * - `transform: translate(10px)` no hover dá efeito de movimento lateral.
 * - `position: relative` permite posicionar a tarja (`Tag`) via `absolute`.
 *
 * @note
 * O `transition: all 3` foi mantido conforme original, embora o ideal
 * seja especificar unidade de tempo (`3s`), se desejar transição suave.
 */
export const Container = styled.li<IContainerProps>`
  background-color: ${props => props.theme.card};
  list-style-type: none;
  border-radius: 5px;

  margin: 10px 0;
  padding: 12px 10px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 3;
  position: relative;

  &:hover {
    opacity: 0.7;
    transform: translate(10px);
  }

  > div {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-left: 10px;
  }

  div span {
    font-size: 22px;
    font-weight: 500;
  }
`;

/**
 * Tarja colorida lateral do cartão.
 *
 * @remarks
 * - Posicionada absolutamente à esquerda do container.
 * - A cor é definida dinamicamente pelo prop `color`.
 */
export const Tag = styled.div<ITagProps>`
  width: 10px;
  height: 30px;
  background-color: ${props => props.color};
  position: absolute;
  left: 0;
`;
