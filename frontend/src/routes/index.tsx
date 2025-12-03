
// RouterConfig — index.tsx (ajustado)
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import styled from "styled-components";
import App from "./app.routes";

// Páginas
import Dashboard from "../pages/Dashboards";
import AlarmsList from "../pages/AlarmsList";
import AlertsSent from "../pages/AlertsSent";
import RangeSetupForm from "../pages/RangeSetup";
import OpcuaClientForm from "../pages/OpcuaSetup";
import OpcuaClientList from "../pages/OpcuaClientList";
import UserRegisterForm from "../pages/UserRegister/UserRegisterForm";
import Signin from "../pages/Signin";
import AppMetrics from "../pages/AppMetrics/AppMetrics";

// Contexto/Componentes usados no header da página Analog Setup
import { useDevice } from "../components/DeviceContext/DeviceContext";
import ClientPicker from "../components/ClientPicker";

/** Base do serviço de autenticação para consultas como `/auth/me` */
const AUTH_BASE = "http://localhost:3000";

/**
 * Barra de cabeçalho fixa (fora do scroll interno de alguns formulários).
 * - Mantém o `ClientPicker` visível durante a rolagem.
 */
const PageHeaderBar = styled.div`
  position: sticky; /* mantém visível ao rolar o conteúdo da página */
  top: 0;
  z-index: 3;
  

  display: flex;
  align-items: center;
  gap: 12px;

  /* Ajuste visual leve; use o background do seu layout/página, não do form */
  /* background: rgba(10, 10, 10, 0.55); */
  backdrop-filter: blur(6px);
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

/**
 * Rota protegida simples que verifica a sessão do usuário em `/auth/me`.
 * - Enquanto carrega (`allowed === null`), não renderiza nada (pode trocar por spinner)
 * - Se não autorizado, redireciona para `/signin`
 */
const ProtectedRoute: React.FC = () => {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${AUTH_BASE}/auth/me`, { credentials: "include" });
        const data = await res.json().catch(() => null);
        if (!alive) return;
        setAllowed(res.ok && !!data?.user);
      } catch {
        if (alive) setAllowed(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (allowed === null) return null; // pode trocar por um spinner leve
  return allowed ? <Outlet /> : <Navigate to="/signin" replace />;
};

/**
 * Wrapper da página "Analog Setup"
 * - Posiciona o `ClientPicker` no cabeçalho fixo
 * - Renderiza o `RangeSetupForm` abaixo (área com scroll próprio)
 */
const AnalogSetupPage: React.FC = () => {
  const { deviceId, setDeviceId } = useDevice();
  return (
    <>
      <PageHeaderBar>
        <ClientPicker selectedClientId={deviceId} onChange={setDeviceId} />
      </PageHeaderBar>
      <RangeSetupForm />
    </>
  );
};

/**
 * Página de "Alerts Sent" com `ClientPicker` no cabeçalho fixo.
 */
const AlertsSentPage: React.FC = () => {
  const { deviceId, setDeviceId } = useDevice();
  return (
    <>
      <PageHeaderBar>
        <ClientPicker selectedClientId={deviceId} onChange={setDeviceId} />
      </PageHeaderBar>
      <AlertsSent/>
    </>
  );
};

/**
 * Configuração principal de rotas da aplicação.
 * - Define rotas públicas (`/signin`) e zona protegida (filha de `ProtectedRoute`)
 * - Mantém os `Navigate` de fallback para garantir fluxo previsível
 */
const RouterConfig: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* sempre começar no /signin */}
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route path="/signin" element={<Signin />} />

        {/* tudo abaixo é protegido */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/"
            element={
              <App options={[]} onChange={() => {}} icon="" title={""} deviceId={""} />
            }
          >
            <Route path="dashboard" element={<Dashboard options={[]} onChange={() => {}} data={[]} title={""} />} />
            <Route path="alarms" element={<AlarmsList />} />
            <Route path="metrics" element={<AppMetrics />} />
            <Route path="alertssent" element={<AlertsSentPage />} />
            {/* Aqui usamos o wrapper para posicionar o ClientPicker fora do Container do form */}
            <Route path="analogsetup" element={<AnalogSetupPage />} />
            <Route path="opcuasetup" element={<OpcuaClientForm />} />
            <Route path="opcuaclients" element={<OpcuaClientList />} />
            <Route path="profile/edit" element={<UserRegisterForm />} />
          </Route>
        </Route>

        {/* fallbacks */}
        <Route path="/dashboard" element={<Navigate to="/signin" replace />} /> {/* caso alguém tente direto */}
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default RouterConfig;
