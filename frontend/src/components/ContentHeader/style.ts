

import styled from 'styled-components';
import { IContentHeaderProps } from '.';


const italianGreen = "#444445ff";
const italianWhite = "#444445ff";
const italianRed = "#444445ff";

/** Propriedades estruturais do contêiner raiz do cabeçalho. */
interface IContainerProps {
  /** Estado visual reservado para variações futuras de layout. */
  isActive: boolean;
}

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


export const Controllers = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
  align-items: flex-end;
  padding: 10px;
`;


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
