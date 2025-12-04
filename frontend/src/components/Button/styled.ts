
import styled from "styled-components";


export const Container = styled.button`
  width: 100px;

  margin: 7px 0;
  padding: 10px;

  border-radius: 5px;

  font-weight: bold;
  color: ${props => props.theme.textPrimary};
  background-color: ${props => props.theme.danger};

  transition: opacity .3s;

  &:hover {
    opacity: .7;
  }
`;
