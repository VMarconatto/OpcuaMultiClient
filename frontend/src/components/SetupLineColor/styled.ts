
import styled from 'styled-components';

/**
 * Container geral do card de configuração de cores.
 * @remarks Layout flex em coluna, com área interna rolável para a lista de variáveis.
 */
export const Container = styled.div`
  width: 49.8%;
  height: 420px;
  padding: 20px;
  margin: -10px 0;
  margin-left:10px;

  background: 
        linear-gradient(135deg, #373737ff 0%, #121212 100%),
        rgba(0, 0, 0, 0.3);
  background-blend-mode: overlay;

  color: ${(props) => props.theme.textPrimary};

  border-radius: 40px;
  /* box-shadow: 0px 2px 15px rgba(245, 2, 2, 0.6); */
  /* box-shadow: 0px 2px 15px rgba(3, 237, 58, 0.6); */

  display: flex;
  flex-direction: column;
  justify-content: flex-start; // ✅ alinhamento superior
  gap: 30px; // ✅ espaçamento entre título e lista
  flex: 1;

  overflow: hidden;

  @media (max-width: 770px) {
    width: 100%;
    height: auto;
  }

  h2 {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 0; // ✅ zera espaçamento redundante
    color: #ffffff;
  }

  /* Área rolável que contém os itens (tag → select de cor) */
  .color-items-scroll {
    max-height: 300px;
    overflow-y: auto;
    padding-right: 8px;

    scrollbar-width: thin;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background-color: #333;
      border-radius: 6px;
    }
  }

  /* Linha de item (nome + unidade + select de cor) */
  .color-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: transparent;
    padding: 6px 10px;
    border-radius: 6px;
    margin-bottom: 8px;
  }

  .color-item span {
    flex: 1;
    color: #e5e7eb;
    font-size: 18px;   // ⬅️ aumentado
    font-style: bold;
    font-weight: 600;  // ⬅️ negrito
  }

  .color-item select {
    border-radius: 4px;
    padding: 4px 6px;
    background-color: #ffffff;
    color: #000;
    min-width: 100px;
    font-weight: 600;  // ⬅️ negrito
    font-size: 18px;   // ⬅️ aumentado
  }

  .color-item select option {
    background-color: #f5f5f5;
    color: #000;
    font-size: 18px;   // ⬅️ aumentado
    font-style: bold;
    font-weight: 600;  // ⬅️ negrito
  }

  .unit, .unit-span {
    font-size: 14px;
    font-weight: 600;
    color: #e5e7eb;
  }
`;
