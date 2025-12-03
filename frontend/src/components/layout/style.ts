
import styled from 'styled-components';

interface ContainerProps {
  isActive: boolean;
}

export const Container = styled.div<ContainerProps>`
  display: grid;
  grid-template-areas:
    'AS MH'
    'AS CT';
  grid-template-columns: 250px auto;
  grid-template-rows: 70px auto;
  height: 100vh;
  width: 100%;
  overflow: hidden;

  @media (max-width: 600px) {
    grid-template-columns: 100%;
    grid-template-rows: 70px auto;

    grid-template-areas:
      'MH'
      'CT';
  }
`;
