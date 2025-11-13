/**
** =======================================================
@SECTION : React — App Shell & Test
@FILE : App.tsx / App.test.tsx
@PURPOSE : Aplicar cabeçalho e JSDoc leves no App principal e seu teste, mantendo 100% da lógica original.
@LAST_EDIT : 2025-11-10
** =======================================================
*/


// =========================
// File: App.tsx
// =========================


/**
* Componente raiz da aplicação.
*
* Responsabilidades:
* - Prover tema (styled-components) via `ThemeProvider` usando o ThemeContext (`useTheme`).
* - Injetar estilos globais (`GlobalStyles`).
* - Renderizar o `Layout` e encaminhar children e opções do select.
*
* Tipagem:
* - Recebe a união de props de `SelectInput`, `ContentHeader` e do tema (`IThemeProps`).
* 
*/
import React from "react";
import GlobalStyles from "./styles/GlobalStyles";
import { ThemeProvider } from "styled-components";
import { ISelectInputProps } from "./components/Olds/SelectInput/index";
import { IContentHeaderProps } from "./components/ContentHeader/index";
import { IThemeProps } from "../../frontend/src/hooks/theme";
import List from "./pages/Listas/index";
import {useTheme} from '../../frontend/src/hooks/theme'


import Layout from "./components/layout";


const App: React.FC<ISelectInputProps & IContentHeaderProps & IThemeProps> = ({
options,
children,
}: ISelectInputProps & IContentHeaderProps & IThemeProps) => {
const {theme} = useTheme();
return (
<ThemeProvider theme={theme}>
<GlobalStyles />
<Layout options={options} onChange={function (event: React.ChangeEvent<HTMLSelectElement>): void | undefined {
throw new Error("Function not implemented.");
} } icon={""}>
{children}
</Layout>
</ThemeProvider>
);
};


export default App;

