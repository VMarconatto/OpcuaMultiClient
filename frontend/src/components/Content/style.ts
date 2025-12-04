
import styled from 'styled-components';

const italianGreen = "#444445ff";
const italianWhite = "#444445ff";
const italianRed = "#444445ff";

interface ContainerProps {

  isActive: boolean;
}

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
