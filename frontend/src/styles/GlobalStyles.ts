/**
** =======================================================
@SECTION : Styled-Components — Global Styles
@FILE : GlobalStyles.ts
@PURPOSE : Definir estilos globais da aplicação (reset básico, fonte, cursor e overflow) sem alterar a lógica.
@LAST_EDIT : 2025-11-10
** =======================================================
*/


import { createGlobalStyle } from 'styled-components'


/**
* Estilos globais — aplicados uma vez no topo da árvore (em `index.tsx`/`App.tsx`).
* Mantém o reset e a tipografia conforme sua implementação original.
*/
export default createGlobalStyle`
*{
margin:0;
padding:0;
box-sizing:border-box
}
html, body {
height: 100%;
overflow: hidden;
}


*,button,input{
border:0;
outline:0;
font-family:"Roboto", sans-serif;


}


button {
cursor:pointer;
}
`