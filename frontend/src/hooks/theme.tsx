/**
** =======================================================
@SECTION  : Theme — Context & Provider
@FILE     : src/hooks/theme.tsx
@PURPOSE  : Disponibilizar tema atual (dark/light) e ação `toggleTheme`
            para a aplicação via Context API — sem alterar lógica.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { createContext, useState, useContext, use } from "react";

import DarkTheme from "../styles/themes/dark";
import LightTheme from "../styles/themes/light";
import { FunnelChart } from "recharts";

/**
 * Estrutura mínima de um tema de UI usado na aplicação.
 */
export interface IThemeProps {
  title: string;
  background: string,
  card: string,
  textPrimary: string,
  textSecondary: string,
  accent: string, // verde neon
  accent2: string, // azul claro
  danger: string,
  mainheader:string;
  wallet:string;
  content:string;
  scrollbarThumb: string;
  alertsSent:string;
}

/**
 * Propriedades expostas pelo contexto de tema.
 */
interface IThemeContextProps {
  /**
   * Alterna o tema entre Light/Dark.
   * @returns {void}
   */
  toggleTheme(): void;
  /** Tema atual. */
  theme: IThemeProps;
  /** Filhos React (opcional para tipagem do Provider). */
  children?: React.ReactNode;
}

/** Contexto do tema. */
const ThemeContext = createContext<IThemeContextProps>(
  {} as IThemeContextProps
);

/**
 * Provider de tema.
 *
 * - Mantém estado interno `theme` (default: `DarkTheme`).
 * - Exibe `toggleTheme` e `theme` no valor do contexto.
 *
 * @param {React.PropsWithChildren} props Elementos filhos.
 * @returns {JSX.Element} Provider React com o contexto de tema.
 */
const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = useState<IThemeProps>(DarkTheme);

  /**
   * Alterna o tema (dark ↔ light).
   * @returns {void}
   */
  const toggleTheme = (): void => {
    setTheme((prevTheme) =>
      prevTheme.title === "dark" ? LightTheme : DarkTheme
    );
  };

  return (
    <ThemeContext.Provider value={{ toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook para consumir o contexto de tema.
 * @returns {IThemeContextProps} Objeto com `theme` e `toggleTheme`.
 */
function useTheme(): IThemeContextProps {
  const context = useContext(ThemeContext);
  return context;
}

export { ThemeProvider, useTheme }
