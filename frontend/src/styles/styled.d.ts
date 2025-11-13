/**
** =======================================================
@SECTION : Styled-Components — Theme Typings
@FILE : styled.d.ts
@PURPOSE : Declarar o shape do `DefaultTheme` para o TypeScript reconhecer as cores e tokens do tema.
@LAST_EDIT : 2025-11-10
** =======================================================
*/


import 'styled-components'


/**
* Tipagens do tema global consumido pelo `ThemeProvider` do styled-components.
*
* As chaves abaixo devem existir no objeto de tema atual (ex.: `dark.ts`).
* 
*/
declare module 'styled-components' {
export interface DefaultTheme {
/** Nome do tema (ex.: "dark"). */
title: string;
/** Cor de fundo principal do app. */
background: string;
/** Fundo de cartões/containers. */
card: string;
/** Cor base de texto para alto contraste. */
textPrimary: string;
/** Cor secundária de texto (descrições). */
textSecondary: string;
/** Cor de destaque principal (botões/links). */
accent: string;
/** Cor de destaque secundária. */
accent2: string;
/** Cor para estados de erro/alerta. */
danger: string;
/** Fundo/gradiente do cabeçalho principal. */
mainheader: string;
/** Fundo do widget/box de carteira. */
wallet: string;
/** Fundo da área de conteúdo. */
content: string;
/** Cor do polegar da barra de rolagem. */
scrollbarThumb: string;
/** Cor usada para badges de "alertas enviados". */
alertsSent: string;
};
}
