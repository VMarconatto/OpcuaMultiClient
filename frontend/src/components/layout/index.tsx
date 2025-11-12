/**
** =======================================================
@SECTION  : UI — Application Layout
@FILE     : src/components/Layout/index.tsx
@PURPOSE  : Estrutura base da aplicação — organiza cabeçalho principal (MainHeader),
            barra lateral (Aside) e área de conteúdo (Content) em layout de grid,
            com suporte a roteamento interno via React Router.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React from "react";
import { Container } from "./style";
import MainHeader from "../MainHeader";
import Aside from "../Aside";
import Content from "../Content";
import { ISelectInputProps } from "../Olds/SelectInput";
import { IContentHeaderProps } from "../ContentHeader";
import opcuaconnectorIcon from '../../assets/Opcua_Connector.png';
import { IMainHeaderProps } from "../MainHeader";
import avatar from '../../assets/Avatar.jpg';
import { Outlet } from "react-router-dom"; 

/**
 * Componente principal de layout da aplicação.
 * @param options Lista de opções a serem passadas para o componente Content (via SelectInput).
 * @param controllers Controladores ou callbacks associados ao Content.
 * @returns Estrutura JSX com as três áreas principais do layout.
 * @remarks Este componente define a estrutura de grid global e
 * utiliza o `<Outlet />` do React Router para renderizar rotas-filhas dinamicamente.
 * @note O `Container` define as áreas 'MH' (Main Header), 'AS' (Aside) e 'CT' (Content).
 */
const Layout: React.FC<ISelectInputProps & IContentHeaderProps & IMainHeaderProps> = ({
  options,
  controllers,
}) => {
  return (
    <Container isActive={true}>
      <MainHeader icon={avatar} />
      <Aside />
      <Content
        options={options}
        controllers={controllers}
        onChange={function (
          event: React.ChangeEvent<HTMLSelectElement>
        ): void | undefined {
          throw new Error("Function not implemented.");
        }}
      >
        <Outlet /> {/* Substitui o antigo {children} */}
      </Content>
    </Container>
  );
};

export default Layout;
