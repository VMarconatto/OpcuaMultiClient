
import styled from 'styled-components';

/**
 * Tipagem das props do Container principal.
 * @property isActive Define se o layout está ativo (reserva para controle de estados visuais futuros).
 */
interface ContainerProps {
  isActive: boolean;
}

/**
 * `Container` — define o grid principal do layout.
 * @remarks
 * - MH → Main Header
 * - AS → Aside
 * - CT → Content
 * @note O layout é totalmente responsivo: abaixo de 600px,
 *       a barra lateral é suprimida e as áreas são reorganizadas verticalmente.
 */
export const Container = styled.div<ContainerProps>`
  display: grid;
  grid-template-areas:
    'AS MH'
    'AS CT';
  grid-template-columns: 250px auto;
  grid-template-rows: 70px auto;
  height: 100vh;
  width: 100%;
  overflow: hidden;

  @media (max-width: 600px) {
    grid-template-columns: 100%;
    grid-template-rows: 70px auto;

    grid-template-areas:
      'MH'
      'CT';
  }
`;
