
import styled from 'styled-components';

export interface ILegendProps {
  color: string;
}

export const Container = styled.div`
  width: 49.8%;
  height: 420px;
  margin: -10px 0;
  margin-right:10px;
  padding: 20px;
  bottom:-0px;

  background: 
        linear-gradient(135deg, #373737ff 0%, #121212 100%),
        rgba(0, 0, 0, 0.3);
        
  color: ${(props) => props.theme.textPrimary};
  border-radius: 40px;

  display: flex;
  flex-direction: row;
  gap: 16px;

  @media (max-width: 770px) {
    width: 100%;
    flex-direction: column;
    height: auto;
  }
`;

export const SideLeft = styled.aside`
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 10px;

  > h2 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 20px;
    color: #ffffff;
  }

  @media (max-width: 1345px) {
    padding: 15px;

    > h2 {
      margin-top: 15px;
      margin-bottom: 12px;
    }
  }

  @media (max-width: 420px) {
    padding: 15px;
    margin-bottom: 7px;
  }
`;

export const LegendContainer = styled.ul`
  list-style: none;  
  max-height: 300px;
  padding-right: 8px;
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #333;
    border-radius: 6px;
  }
`;

export const Legend = styled.li<ILegendProps>`
  display: flex;
  align-items: center;
  margin-bottom: 10px;

  > div {
    background-color: ${(props) => props.color};
    width: 40px;
    height: 40px;
    border-radius: 8px;
    font-size: 18px;
    font-weight: bold;
    line-height: 40px;
    text-align: center;
    box-shadow: 0px 2px 8px rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }

  > span {
    margin-left: 8px;
    font-size: 18px;
    font-weight: 500;
    color: #e5e7eb;
    font-style: bold;
  }
`;

export const SideRight = styled.main`
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
`;
