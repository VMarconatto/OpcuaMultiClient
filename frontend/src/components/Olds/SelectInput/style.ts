import styled from 'styled-components';

interface ISelectProps {
  isActive: boolean;
}

export const Container = styled.div<ISelectProps>`
  flex: 1;
  max-width: 200px;
  margin-left:10px;
 
   /* margem horizontal controlada */

  select {
    width: 100%;
    padding: 16px;
    border-radius: 20px;
    margin: 0; /* remove deslocamento */
    background-color: ${({ theme }) =>
      theme.title === 'light' ? '#A9A9A9' : theme.wallet};
    color: ${({ theme }) => theme.textPrimary};
    box-shadow: 0px 8px 25px rgba(79, 136, 249, 0.6);
    border: none;
    outline: none;
  }
`;

export const SelectWrapper = styled.div`
  display: flex;
  margin-left:1340px;
  margin-top:10px;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 16px;
  padding: 8px 0;
  padding-right:0px;
  width: 100%;
`;
