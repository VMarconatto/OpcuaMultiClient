/**
** =======================================================
@SECTION : React Router — Auth Routes (Públicas)
@FILE : auth.routes.tsx
@PURPOSE : Declarar as rotas públicas de autenticação (ex.: Signin) usando React Router v6.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import React from "react";
import { Routes, Route } from "react-router-dom";

import Signin from "../pages/Signin";

/**
* Rotas públicas de autenticação.
*
* Mantém a estrutura mínima: uma única rota `"/"` apontando para `<Signin />`.
* Pode ser expandida no futuro para incluir `/signup`, `/forgot-password`, etc.
*/
const AuthRoutes: React.FC = () => {
return (
<Routes>
<Route path="/" element={<Signin />} />
</Routes>
);
};


export default AuthRoutes;