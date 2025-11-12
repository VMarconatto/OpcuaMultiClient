/**
** =======================================================
@SECTION  : UI — Content Header (Styles)
@FILE     : src/components/ContentHeader/style.ts
@PURPOSE  : Estilização do cabeçalho de conteúdo (layout responsivo,
            gradiente “Itália”, vinheta e tipografia) — sem alterar lógica.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import styled from 'styled-components';
import { IContentHeaderProps } from '.';

/**
 * Paleta base — placeholders (ajuste para as cores reais da marca).
 *
 * @const italianGreen - Verde Itália (placeholder).
 * @const italianWhite - Branco Itália (placeholder).
 * @const italianRed   - Vermelho Itália (placeholder).
 *
 * @note
 * As três constantes estão iguais por decisão estética temporária.
 * Substitua pelos valores definitivos quando necessário.
 */
const italianGreen = "#444445ff";
const italianWhite = "#444445ff";
const italianRed = "#444445ff";

/** Propriedades estruturais do contêiner raiz do cabeçalho. */
interface IContainerProps {
  /** Estado visual reservado para variações futuras de layout. */
  isActive: boolean;
}

/**
 * Contêiner raiz do cabeçalho.
 *
 * @remarks
 * - Layout em `flex` para separar título e controles.
 * - Margens negativas/à esquerda preservadas conforme design atual.
 * - Fundo com vinheta + gradiente “Itália” usando `background-blend-mode`.
 */
export const Container = styled.div<IContainerProps>`
  width:100%;
  display:flex;
  justify-content:space-between;
  margin-top:-20px;
  margin-left:25px;

  background:
    /* vinheta/contraste — focalizada à direita (onde ficam os ícones) */
    radial-gradient(10% 220% at 78% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.32) 78%,
      rgba(0,0,0,0.48) 100%),
    /* degradê principal Itália */
    linear-gradient(135deg, ${italianGreen},${italianWhite},${italianRed});
  background-blend-mode: overlay, normal;

  @media(max-width: 320px){
    flex-direction: row;
  }
`;

/**
 * Área de controles (botões, selects, filtros).
 *
 * @note
 * - `flex-wrap` permite quebra para múltiplas linhas em telas pequenas.
 * - `align-items: flex-end` alinha os controles à base visual do cabeçalho.
 */
export const Controllers = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
  align-items: flex-end;
  padding: 10px;
`;

/**
 * Contêiner visual do título.
 *
 * @remarks
 * Recebe `lineColor` via `IContentHeaderProps` para futuras variações de
 * destaque (sub-linha, borda, etc.). O estilo atual mantém apenas a cor
 * do texto (derivada do tema).
 */
export const TitleContainer = styled.div<IContentHeaderProps>`
  > h1 {
    color: white;
    position: relative;
    margin-top:30px;
    color:${props => props.theme.textPrimary};

    /* Exemplo futuro: sub-linha temática
    &::after {
      content: '';
      position: absolute;
      bottom: 0px;
      left: 0;
      width: 55px;
      height: 10px;
      background-color: ${props => props.lineColor ?? 'green'};
      z-index: 1;
    } */
  }
`;
