

import styled from 'styled-components';


const italianGreen = "#090808ff";
const italianWhite = "rgba(5, 0, 0, 0.35)";
const italianRed = "#454444ff";

const HEADER_PAD_X = 20;      // seu padding: 0 20px
const SEP_THICKNESS = 2;

interface ContainerProps {
  isActive: boolean;
}

export const Container = styled.div<ContainerProps>`
  position: relative;
  grid-area: MH;

  display: flex;
  justify-content: space-between;
  align-items: center;

  height: 70px;
  padding: 0 20px;
  
  background:
    /* vinheta/contraste — focalizada à direita (onde ficam os ícones) */
    radial-gradient(10% 220% at 78% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.32) 78%,
      rgba(0,0,0,0.48) 100%),
    /* degradê principal Itália */
    linear-gradient(135deg, ${italianGreen},${italianWhite},${italianRed});
  background-blend-mode: overlay, normal;

  box-shadow: 0 8px 25px rgba(0,0,0,0.45);
  overflow: hidden;
  min-height: 0;

>div{
  color:white;
  font-size:30px;
}

&::after {
  content: "";
  position: absolute;
  left: -${HEADER_PAD_X}px;   // sangra até a borda externa
  right: -${HEADER_PAD_X}px;  // idem do outro lado
  bottom: 0;
  height: ${SEP_THICKNESS}px;
  border-radius: 999px;
  background: linear-gradient(90deg, #a30606ff , #028625ff , #a30606ff);
  background-blend-mode: overlay, normal;
  opacity: 0.95;
  pointer-events: none;
}

`;


export const IconsGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

export const IconButton = styled.button`
  position: relative;
  background: none;
  border: none;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 26px;
  cursor: pointer;

  img {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: 2px solid ${({ theme }) => theme.accent2};
    object-fit: cover;
    display: block;
  }

  &:hover { opacity: 0.8; }
`;

export const Badge = styled.span`
  position: absolute;
  top: -5px;
  right: -8px;
  background-color: ${({ theme }) => theme.danger};
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: bold;
`;

export const AvatarWrapper = styled.div`
  position: relative;
`;

export const Avatar = styled.img`
  width: 36px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.accent2};
  object-fit: cover;
  cursor: pointer;

  &:hover { box-shadow: 0 0 0 3px ${({ theme }) => theme.accent2}; }
`;

export const UserMenu = styled.ul`
  position: absolute;
  top: 48px;
  right: 0;
  background-color: ${({ theme }) => theme.card || '#1f1f1f'};
  border: 1px solid ${({ theme }) => theme.accent2};
  border-radius: 8px;
  padding: 8px 0;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
  min-width: 160px;
  z-index: 10;
  overflow: hidden;
  list-style: none;
`;

export const UserMenuItem = styled.li`
  padding: 10px 20px;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover { background-color: ${({ theme }) => theme.accent}; }
`;

export const IconsBrand = styled.span``;

export const Title = styled.h3`
  color: ${props => props.theme.textPrimary};
  margin-left: -1920px;
  font-size:30px;
  margin-top:0px;

  @media(max-width: 600px){
    display: none;
  }
`;

export const LogImg = styled.img`
  height: 30px;
  width: 30px;

  margin-left:-2135px;
  margin-top:-10px;

  @media(max-width: 600px){        
    display: none;
  }
`;
