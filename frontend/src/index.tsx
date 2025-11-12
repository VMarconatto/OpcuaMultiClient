/**
** =======================================================
@SECTION : React App Bootstrap — Theme & Auth Providers
@FILE : index.tsx
@PURPOSE : Inicializar a aplicação React com provedores de Tema e Autenticação, estilos globais e rotas — sem alterar lógica.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import React from "react";
import ReactDOM from "react-dom/client";

import { AuthProvider } from "../../frontend/src/hooks/auth"; // nome correto
import GlobalStyles from "./styles/GlobalStyles";
import DarkTheme from "./styles/themes/dark";
import RouterConfig from "./routes";
import { ThemeProvider as StyledThemeProvider } from "styled-components";
import { ThemeProvider, useTheme } from "./hooks/theme"; // <- seu ThemeContext

/**
 * Ponto de montagem da aplicação (div#root — index.html).
 */
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

/**
 @NOTE :
 * Componente raiz para consumir o ThemeContext e injetar providers.
 * 1. Lê o tema atual via `useTheme()`.
 * 2. Injeta `StyledThemeProvider` (styled-components) com o tema ativo.
 * 3. Encapsula `AuthProvider` para contexto de autenticação.
 * 4. Renderiza `GlobalStyles` e o `RouterConfig` (rotas da aplicação).
 */
const App: React.FC = () => {
  const { theme } = useTheme();
  return (
    <StyledThemeProvider theme={theme}>
      <AuthProvider>
        <GlobalStyles />
        <RouterConfig />
      </AuthProvider>
    </StyledThemeProvider>
  );
};

/**
@NOTE : Renderização em modo estrito (React.StrictMode) + ThemeProvider (contexto do tema).
 * A ordem garante que `App` já encontre o contexto pronto.
 */
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
