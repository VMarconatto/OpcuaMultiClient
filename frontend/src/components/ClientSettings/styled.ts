
import styled from 'styled-components';

export const Container = styled.div`
  width: 49.5%;
  height: 260px;

  background-color: ${props => props.theme.card};
  color: ${props => props.theme.textPrimary};

  border-radius: 7px;

  margin: 10px 0;
  padding: 30px 20px;

  display: flex;
  flex-direction: column;
  justify-content: space-between;

  /* Imagem do header (ícone ao lado do título) */
  > header img {
    margin-top: -30px;
    width: 300px;
    height: 60px; /* opcional, se a imagem não for quadrada */
    margin-left: 390px;
  }

  /* Descrição sob o título */
  > header p {
    font-size: 30px;
  }

  /* Breakpoint: largura exatamente 770px */
  @media (width: 770px) {
    width: 100%;
    height: auto;

    > header h1 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;

      img {
        width: 60px;
        height: 10px;
        margin-left: 0; /* removido */
      }
    }

    > header p,
    > footer span {
      font-size: 20px;
    }
  }

  /* Breakpoint: largura exatamente 420px */
  @media (width: 420px) {
    width: 100%;
    height: auto;

    > header p {
      margin-bottom: 20px;
    }
  }
`;
