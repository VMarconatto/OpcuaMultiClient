
import styled from 'styled-components';

/**
 * Props do container principal.
 * @property color Cor principal do gradiente.
 * @property unit  Unidade opcional (não utilizada diretamente nos estilos).
 */
export interface IContainerProps {
  color: string;
  unit?: string;
}

/**
 * Container principal do WalletBox.
 * @remarks
 * - Usa gradiente definido pela prop `color` para o início do fundo.
 * - Aplica efeito de hover suave (elevação e sombra).
 * - Responsivo para telas menores que 750px e 414px.
 */
export const Container = styled.div<IContainerProps>`
  width: 33.2%;
  height: 140px;
  margin: 20px 0;
  margin-top: -10px;
  padding: 16px 20px;

  border-radius: 40px;
  position: relative;
  overflow: hidden;
  z-index: 1;

  color: ${(props) => props.theme.textPrimary};

  background: linear-gradient(
    135deg,
    ${(props) => props.color || '#ff416c'} 0%,
    #1f1f1f 100%
  );

  transition: transform 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0px 8px 25px rgba(0, 0, 0, 0.6);
  }

  > header > span {
    font-size: 18px;
    font-weight: 600;
  }

  > main > h1 {
    display: flex;
    align-items: center;
    font-size: 24px;
    margin-top: 10px;
    font-weight: 700;
  }

  > img {
    height: 65%;
    width: 20%;
    position: absolute;
    top: 30px;
    right: 0px;
    opacity: 0.3;
  }

  @media (max-width: 750px) {
    > header > span {
      font-size: 14px;
    }

    > main > h1 {
      font-size: 18px;
    }
  }

  @media (max-width: 414px) {
    width: 100%;
    min-width: 100%;
  }

  /* Ícone decorativo translúcido (background mark) */
  .floating-icon {
    position: absolute;
    bottom: -10px;
    right: -10px;
    opacity: 0.05;
    z-index: 0;
    pointer-events: none;
  }
`;

/**
 * Rodapé do card — exibe informações complementares.
 * @remarks Inclui cor verde (#1dd75b) para valores positivos.
 */
export const FooterInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  > strong {
    font-size: 18px;
    color: #1dd75b; /* verde positivo */
  }

  > small {
    font-size: 12px;
    color: #aaa;
  }
`;
