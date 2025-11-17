/**
** =======================================================
@SECTION  : Layout — Aside Navigation (UI)
@FILE     : src/components/Aside/styles.ts
@PURPOSE  : Estilos do componente de navegação lateral: container com
            vinheta/gradiente, grupos expansíveis, caret animado e submenu.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import styled from "styled-components";

/** Cores base (paleta Itália). */
const italianGreen = "#090808ff";
const italianRed   = "#444445ff";
const italianWhite = "rgba(255, 254, 254, 1)";
const white2       = "#444445ff";

/** Dimensões alinhadas ao MainHeader. */
const HEADER_HEIGHT = 70;  // mesma altura do MainHeader
const SEP_THICKNESS = 2;   // mesma espessura do MainHeader (px)

/**
 * Propriedades do container principal do Aside.
 */
interface ContainerProps {
  /** Atividade/visibilidade do Aside (reserva para lógica futura). */
  isActive: boolean;
}

/**
 * Container principal do Aside.
 */
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

  /* HORIZONTAL — alinhada com MainHeader */
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

  /* VERTICAL — mesma espessura */
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

/** Cabeçalho do Aside (logo e título). */
export const Header = styled.header`
  height: 70px;
  display: flex;
  align-items: center;
`;

/** Título textual ao lado do logo (opcional em telas maiores). */
export const Title = styled.h3`
  color: ${props => props.theme.textPrimary};
  margin-left: -60px;
  font-size: 20px;
  margin-top: 10px;

  @media (max-width: 600px) {
    display: none;
  }
`;

/** Logo Sorgente. */
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

/** Contêiner da lista de menus/grupos. */
export const MenuContainer = styled.nav`
  display: flex;
  flex-direction: column;
  margin-top: 50px;
`;

/** Link de menu simples (fora dos submenus). */
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

/** Botão de menu (para ações/saídas, se necessário). */
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

/* ====== ESTILOS PARA O DROPDOWN DO DASHBOARD ====== */

/** Grupo "Dashboard" (wrapper do toggle e submenu). */
export const DashboardGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 4px 0 10px 0;
`;

/** Botão que abre/fecha o submenu "Dashboard". */
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

  /* “pílula” em vermelho Itália */
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

/**
 * Ícone de seta (caret) para indicar expansão.
 * @param $open Indica se o grupo está expandido (rotação 180°).
 */
export const Caret = styled.span<{ $open: boolean }>`
  display: inline-flex;
  align-items: center;
  transition: transform .2s ease;
  transform: rotate(${props => (props.$open ? "180deg" : "0deg")});

  > svg { font-size: 22px; }
`;

/** Submenu (lista vertical de links com guia lateral). */
export const SubMenu = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 16px;
  margin-left: 12px;

  /* linha vertical de referência (vermelho Itália) */
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

/**
 * Item do submenu (link). Usa prop `$active` no CSS.
 * @param $active Destaca visualmente o item ativo.
 */
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

/* ====== ESTILOS PARA O GRUPO "CREATE APPLICATION" ====== */
/** Wrapper do grupo "Create Application" (herda de DashboardGroup). */
export const CreateGroup = styled(DashboardGroup)``;
/** Botão do grupo "Create" (herda de DashboardToggle). */
export const CreateToggle = styled(DashboardToggle)``;

/**
 * Link “filho” dentro do SubMenu (variação de MenuItemLink).
 * Mantém recuo/padding alinhados com a guia vertical do submenu.
 */
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
