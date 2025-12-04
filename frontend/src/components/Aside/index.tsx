/**
** =======================================================
@SECTION  : Layout — Aside Navigation
@FILE     : src/components/Aside/index.tsx
@PURPOSE  : Renderizar a navegação lateral (logo + grupos de links com
            dropdowns) para acessar Dashboard, Métricas e telas de Setup.
            Mantém estado de expansão e item ativo.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { useState } from "react";
import { MdDashboard, MdSettingsApplications, MdExpandMore } from "react-icons/md";
import { Link } from "react-router-dom";

import {
  Container,
  Header,
  LogImg,
  MenuContainer,
  DashboardGroup,
  DashboardToggle,
  Caret,
  SubMenu,
  SubMenuItem,
  CreateGroup,
  CreateToggle,
} from "./styles";

import Sorgente from "../../assets/Sorgente_Rev1-removebg-preview.png";
import { useAuth } from "../../hooks/auth";

/**
 * Lista de abas do grupo "Dashboard".
 * @type {{ label: string; to: string }[]}
 */
const dashboardTabs = [
  { label: "Analytics",  to: "/dashboard" },
  { label: "AppMetrics", to: "/metrics"   },
];

/**
 * Lista de abas do grupo "Create Application".
 * @type {{ label: string; to: string }[]}
 */
const createTabs = [
  { label: "AlarmsList",   to: "/alarms"      },
  { label: "AlertsSent",   to: "/alertssent"  },
  { label: "AnalogsSetup", to: "/analogsetup" },
  { label: "OpcuaClients", to: "/opcuaclients"},
];

/**
 * Componente de navegação lateral.
 *
 * ### Responsabilidades
 * - Exibir logo e dois grupos de navegação expansíveis (Dashboard e Create).
 * - Manter estado de expansão e de seleção de item.
 * - Linkar rotas via `react-router-dom`.
 *
 * @returns {JSX.Element} Barra lateral (aside) com navegação agrupada.
 */
const Aside: React.FC = () => {
  const { signOut } = useAuth();

  // estados de UI
  /** Estado de expansão do grupo "Dashboard". */
  const [isOpen, setIsOpen] = useState(true);
  /** Índice ativo dentro do grupo Dashboard (visual). */
  const [dashboardIndex, setDashboardIndex] = useState(0);

  /** Estado de expansão do grupo "Create Application". */
  const [isCreateOpen, setIsCreateOpen] = useState(true);
  /** Índice ativo dentro do grupo Create (visual). */
  const [createIndex, setCreateIndex] = useState<number | null>(null);

  return (
    <Container isActive={true}>
      <Header>
        <LogImg src={Sorgente} />
        {/* <Title>Sorgente</Title> */}
      </Header>

      <MenuContainer>
        {/* Grupo Dashboard */}
        <DashboardGroup>
          {/**
           * Botão que abre/fecha o submenu "Dashboard".
           * @returns {void}
           */}
          <DashboardToggle
            type="button"
            onClick={() => setIsOpen((p) => !p)}
            aria-expanded={isOpen}
            aria-controls="dash-submenu"
          >
            <MdDashboard />
            <span>Dashboard</span>
            <Caret $open={isOpen}>
              <MdExpandMore />
            </Caret>
          </DashboardToggle>

          {isOpen && (
            <SubMenu id="dash-submenu">
              {dashboardTabs.map((item, idx) => (
                <SubMenuItem
                  key={item.to}
                  as={Link}
                  to={item.to}
                  $active={createIndex === idx}
                  aria-current={createIndex === idx ? "page" : undefined}
                  /**
                   * Define o índice ativo visualmente (grupo Dashboard).
                   * @returns {void}
                   */
                  onClick={() => setCreateIndex(idx)}
                >
                  {item.label}
                </SubMenuItem>
              ))}
            </SubMenu>
          )}
        </DashboardGroup>

        {/* Grupo Create Application – mesmo comportamento/visual do Dashboard */}
        <CreateGroup>
          {/**
           * Botão que abre/fecha o submenu "Create Application".
           * @returns {void}
           */}
          <CreateToggle
            type="button"
            onClick={() => setIsCreateOpen((p) => !p)}
            aria-expanded={isCreateOpen}
            aria-controls="create-submenu"
          >
            <MdSettingsApplications />
            <span>Create Application</span>
            <Caret $open={isCreateOpen}>
              <MdExpandMore />
            </Caret>
          </CreateToggle>

          {isCreateOpen && (
            <SubMenu id="create-submenu">
              {createTabs.map((item, idx) => (
                <SubMenuItem
                  key={item.to}
                  as={Link}
                  to={item.to}
                  $active={createIndex === idx}
                  aria-current={createIndex === idx ? "page" : undefined}
                  /**
                   * Define o índice ativo visualmente (grupo Create).
                   * @returns {void}
                   */
                  onClick={() => setCreateIndex(idx)}
                >
                  {item.label}
                </SubMenuItem>
              ))}
            </SubMenu>
          )}
        </CreateGroup>
      </MenuContainer>
    </Container>
  );
};

export default Aside;
