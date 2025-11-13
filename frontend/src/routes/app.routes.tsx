/**
** =======================================================
@SECTION : React Router — App Routes (Shell com Providers)
@FILE : app.routes.tsx
@PURPOSE : Declarar o shell de rotas autenticadas (Layout + Outlet), preservando a lógica e tipagem original.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import React from "react";
import { useParams, Outlet } from "react-router-dom";
import List from "../pages/Listas";
import { IContentHeaderProps } from "../components/ContentHeader";
import { ISelectInputProps } from "../components/Olds/SelectInput";
import OPCUABox from "../components/OpcuaBox/index";
import { IOPCUABoxProps } from "../components/OpcuaBox/index";
import Layout from "../components/layout";
import { DeviceProvider } from "../components/DeviceContext/DeviceContext";


/**
* Wrapper de `List` que reage ao parâmetro de rota `:type`.
*
* Mantém a chave `key={type}` para re-render forçado quando o parâmetro muda,
* e repassa as props de cabeçalho/seleção sem alterações.
*/
const ListWithParams = (props: ISelectInputProps & IContentHeaderProps) => {
const { type } = useParams();
return <List tagColor={""} key={type} {...props} />;
};


/**
* Shell principal para rotas da área autenticada.
*
* Responsabilidades:
* - Injetar `DeviceProvider` (contexto de dispositivos)
* - Renderizar `Layout` com controles da UI (options/controllers)
* - Expor `Outlet` para as rotas filhas
*
*
*/
const App: React.FC<
IContentHeaderProps & ISelectInputProps & IOPCUABoxProps
> = ({
options,
children,
controllers,
title,
deviceId,
icon,
basePath,
}: IContentHeaderProps & ISelectInputProps & IOPCUABoxProps) => {
return (
<DeviceProvider>
<Layout
options={options}
controllers={controllers}
onChange={(_: React.ChangeEvent<HTMLSelectElement>) => {}}
icon={""}
>
<Outlet />
</Layout>
</DeviceProvider>
);
};


export default App;
