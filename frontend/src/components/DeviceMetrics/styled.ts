/**
** =======================================================
@SECTION  : UI — Device Metrics Panel (Styles)
@FILE     : src/components/DeviceMetrics/styled.ts
@PURPOSE  : Estilização do painel de métricas do dispositivo, abrangendo layout,
            responsividade e aparência de ícones e textos.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import styled from 'styled-components';

/**
 * Wrapper genérico para alinhamento horizontal de múltiplos painéis.
 * @info Usado quando o dashboard exibe vários DeviceMetrics lado a lado.
 */
export const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

Content.displayName = "Content"; // útil para debug e React DevTools

/**
 * Contêiner principal do painel de métricas.
 *
 * @remarks
 * - Exibe o título e as métricas principais do dispositivo.
 * - Responsivo para telas de 770px e 420px.
 * - Cores derivadas do tema ativo (`theme.wallet` e `theme.textPrimary`).
 *
 * @note
 * Os ícones SVG dentro de `<main>` herdam a cor do texto, mantendo contraste
 * em temas claros e escuros.
 */
export const Container = styled.div`
  width: 49.5%;
  height: 315px;

  background-color: ${props => props.theme.wallet};
  color: ${props => props.theme.textPrimary};

  border-radius: 7px;

  margin: -10px 0;
  padding: 15px 20px;

  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  > header {
    display: flex;
    align-items: center;
    gap: 10px;

    h1 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;
      font-weight: bold;
      color: ${props => props.theme.textPrimary};

      img {
        width: 50px;
        height: auto;
      }
    }
  }

  @media (width: 770px) {
    width: 100%;
    height: auto;

    > header h1 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 24px;
       
      img {
        margin-top: -100px;
        width: 60px;
        height: 30px;
        margin-left: 0;
      }
    }

    > header p,
    > footer span {
      font-size: 20px;
    }
  }

  @media (width: 420px) {
    width: 100%;
    height: auto;

    > header p {
      margin-bottom: 20px;
    }
  }

  > main {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 20px;

    p {
      display: flex;
      align-items: center;
      font-size: 18px;
      font-weight: 500;
      color: ${props => props.theme.textPrimary};
      margin-left:10px;

      svg {
        margin-right: 8px;
        color: ${props => props.theme.textPrimary};
      }
    }

    strong {
      margin-right: 4px;
    }
  }
`;
