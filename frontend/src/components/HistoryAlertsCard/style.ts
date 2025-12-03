
import styled from 'styled-components';


interface IContainerProps {
  isActive: boolean;
}


interface ITagProps {
  color: string;
}

export const Container = styled.li<IContainerProps>`
  background-color: ${props => props.theme.card};
  list-style-type: none;
  border-radius: 5px;

  margin: 10px 0;
  padding: 12px 10px;

  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 3;
  position: relative;

  &:hover {
    opacity: 0.7;
    transform: translate(10px);
  }

  > div {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-left: 10px;
  }

  div span {
    font-size: 22px;
    font-weight: 500;
  }
`;

export const Tag = styled.div<ITagProps>`
  width: 10px;
  height: 30px;
  background-color: ${props => props.color};
  position: absolute;
  left: 0;
`;
