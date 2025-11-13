/**
** =======================================================
@SECTION  : UI — Content Wrapper (Styles)
@FILE     : src/components/Content/style.ts
@PURPOSE  : Estilos do contêiner principal (gradiente, vinheta, scroll
            customizado e dimensões).
@LAST_EDIT: 2025-11-11
** =======================================================
*/

import styled from 'styled-components';

/**
 * Paleta base (placeholders de branding).
 *
 * @const {string} italianGreen - Cor base (verde Itália).
 * @const {string} italianWhite - Cor base (branco Itália).
 * @const {string} italianRed   - Cor base (vermelho Itália).
 *
 * @note
 * Atualmente as três constantes usam o mesmo valor `#444445ff` por decisão
 * estética temporária. Substitua pelas cores de marca quando necessário.
 */
const italianGreen = "#444445ff";
const italianWhite = "#444445ff";
const italianRed = "#444445ff";

/**
 * Propriedades tipadas do contêiner estilizado.
 *
 * @remarks
 * `isActive` está disponível para estados visuais condicionais (ex.: bordas,
 * sombras, opacidade). No estilo atual não há ramificações sobre esse valor,
 * mantendo a interface pronta para evoluções sem quebra.
 */
interface ContainerProps {
  /** Estado visual do contêiner (reservado para variações futuras). */
  isActive: boolean;
}

/**
 * Contêiner de layout com:
 *  - vinheta radial à direita (foco em ícones),
 *  - gradiente “Itália”,
 *  - rolagem vertical com trilha transparente,
 *  - preenchimento e dimensionamento em 100% (altura e largura).
 *
 * @returns Styled-component `div` com `ContainerProps`.
 *
 * @info
 * O `background-blend-mode: overlay` garante contraste suave entre a vinheta
 * e o gradiente principal.
 *
 * @note
 * O `display: block` foi definido para que filhos (ex.: `AlertsSent`) se
 * comportem como blocos independentes. Ajuste para `flex` quando for (outra
 * vez) necessário um layout baseado em linhas/colunas.
 */
export const Container = styled.div<ContainerProps>`
  background:
    /* vinheta/contraste — focalizada à direita (onde ficam os ícones) */
    radial-gradient(10% 220% at 78% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.32) 78%,
      rgba(0,0,0,0.48) 100%),
    /* degradê principal Itália */
    linear-gradient(135deg, ${italianGreen}, ${italianWhite}, ${italianRed});
  background-blend-mode: overlay, normal;

  padding: 20px;
  box-sizing: border-box;
  height: 100%;
  width: 100%;

  overflow-y: auto;

  /* Substituir isso: */
  /* display: flex;
  flex-wrap: wrap;
  gap: 10px; */

  display: block; /* ✅ Faz com que os filhos (como AlertsSent) se comportem como blocos */

  /* Scroll personalizado */
  scrollbar-width: thin;
  scrollbar-color: ${props => props.theme.scrollbarThumb || '#888'} transparent;

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.scrollbarThumb || '#888'};
    border-radius: 4px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }
`;
