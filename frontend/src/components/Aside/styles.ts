
import styled from "styled-components";

const italianGreen = "#090808ff";
const italianRed   = "#444445ff";
const italianWhite = "rgba(255, 254, 254, 1)";
const white2       = "#444445ff";


const HEADER_HEIGHT = 70;  
const SEP_THICKNESS = 2;  

interface ContainerProps {
  /** Atividade/visibilidade do Aside (reserva para lógica futura). */
  isActive: boolean;
}


export const Container = styled.div<ContainerProps>`
  grid-area: AS;
  background:
    /* vinheta/contraste — focalizada à direita (onde ficam os ícones) */
    radial-gradient(0% 220% at 78% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.32) 78%,
      rgba(71, 68, 68, 0.48) 100%),
    /* degradê principal Itália */
    linear-gradient(${italianGreen},${italianRed},${white2});
  background-blend-mode: overlay, normal;

  padding-left: 20px;
  position: relative;
  box-shadow: 0 8px 25px rgba(0,0,0,0.45);


  &::after {
    content: "";
    position: absolute;
    left: 0;
    right: 0;
    top: ${HEADER_HEIGHT - SEP_THICKNESS}px;
    height: ${SEP_THICKNESS}px;
    border-radius: 999px;
    background: linear-gradient(90deg, #a30606ff , #028625ff , #a30606ff);
    pointer-events: none;
    z-index: 2;
  }


  &::before {
    content: "";
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    width: ${SEP_THICKNESS}px;
    border-radius: 999px;
    background: linear-gradient(135deg, #a30606ff , #028625ff , #a30606ff);
    pointer-events: none;
    z-index: 2;
  }
`;


export const Header = styled.header`
  height: 70px;
  display: flex;
  align-items: center;
`;


export const Title = styled.h3`
  color: ${props => props.theme.textPrimary};
  margin-left: -60px;
  font-size: 20px;
  margin-top: 10px;

  @media (max-width: 600px) {
    display: none;
  }
`;


export const LogImg = styled.img`
  height: 200px;
  width: 300px;
  padding: 0 auto;
  margin-left: -30px;
  margin-top: 0px;

  @media (max-width: 600px) {        
    display: none;
  }
`;


export const MenuContainer = styled.nav`
  display: flex;
  flex-direction: column;
  margin-top: 50px;
`;


export const MenuItemLink = styled.a`
  color: ${props => props.theme.textPrimary};
  text-decoration: none;
  margin: 10px 0;
  display: flex;
  align-items: center;
  margin-left: 0px;

  transition: opacity .3s;

  &:hover { opacity: .7; }

  > svg {
    font-size: 40px;
    margin-right: 5px;
  }
`;


export const MenuItemButton = styled.button`
  font-size: 25px;
  color: ${props => props.theme.textPrimary};
  border: none;
  background: none;

  margin: 10px 0;
  display: flex;
  align-items: center;
  margin-left: 0px;

  transition: opacity .3s;

  &:hover { opacity: .7; }

  > svg {
    font-size: 40px;
    margin-right: 5px;
  }
`;


export const DashboardGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 4px 0 10px 0;
`;

export const DashboardToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  width: calc(100% - 20px);
  padding: 10px 12px;
  margin-right: 20px;

  border: 0;
  border-radius: 12px;


  background: linear-gradient(135deg, rgba(120,2,8,0.96), rgba(120,2,8,0.75));
  color: ${italianWhite};
  cursor: pointer;

  > span {
    flex: 1;
    text-align: left;
    font-weight: 600;
    letter-spacing: 0.2px;
  }

  > svg {
    font-size: 22px; /* ícone do dashboard */
    opacity: 0.95;
  }
`;


export const Caret = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  transition: transform .2s ease;
  transform: rotate(${props => (props.$open ? "180deg" : "0deg")});

  > svg { font-size: 22px; }
`;


export const SubMenu = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 16px;
  margin-left: 12px;


  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 4px;
    bottom: 4px;
    width: 2px;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(120,2,8,0.85), rgba(120,2,8,0.55));
  }
`;


export const SubMenuItem = styled.a<{ $active?: boolean }>`
  position: relative;
  text-decoration: none;
  color: ${({ theme }) => theme.textSecondary ?? theme.textPrimary};
  padding: 8px 8px 8px 12px;
  margin-left: 6px; /* afastar da linha vertical */
  border-radius: 8px;
  transition: background .15s ease, color .15s ease, opacity .15s ease;

  &:hover {
    opacity: .9;
  }

  /* barra vermelha do item ativo */
  &::before {
    content: "";
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    height: 18px;
    width: 3px;
    border-radius: 999px;
    background: linear-gradient(180deg, #02763cff, #780208ff);
    opacity: ${props => (props.$active ? 1 : 0)};
    transition: opacity .15s ease;
  }

  ${props => props.$active && `
    color: ${italianWhite};
    background: rgba(120,2,8,0.18);
    font-weight: 1000;
    font-size: 18px;
  `}
`;

export const CreateGroup = styled(DashboardGroup)``;
export const CreateToggle = styled(DashboardToggle)``;

export const SubMenuLink = styled(MenuItemLink)`
  margin-left: 6px;      /* mesmo afastamento usado em SubMenuItem */
  padding: 8px 8px 8px 12px;
  border-radius: 8px;

  > svg {
    font-size: 24px;     /* menor para equilibrar no submenu */
    margin-right: 8px;
  }

  &:hover { opacity: .9; }
`;
