/**
** =======================================================
@SECTION  : Auth — Signin Page
@FILE     : src/pages/Signin/index.tsx
@PURPOSE  : Tela de autenticação (login) com POST para backend, verificação
            de sessão e redirecionamento seguro para o dashboard — sem
            alterar nenhuma lógica existente.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

// src/pages/Signin/index.tsx
import React, { useRef, useState } from "react";
import { Container, Logo, Form, FormTitle } from "./styled";
import logoImg from "../../assets/Sorgente_Rev1-removebg-preview.png";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { useNavigate } from "react-router-dom";

import loginBg from "../../assets/Iot.jpg";

/** Base de autenticação do backend. */
const AUTH_BASE = "http://localhost:3000";
/** Rota inicial após autenticar com sucesso. */
const HOME_ROUTE = "/dashboard";

/**
 * Modelo da resposta do endpoint `/auth/me`.
 * - `user` pode conter subcampos opcionais conforme retorno do backend.
 */
type MeResponse = {
  user?: { _id?: string; fullName?: string; companyEmail?: string };
};

/**
 * Envolve uma Promise com timeout (utilitário leve).
 * @param p  Promise original a ser controlada.
 * @param ms Tempo em milissegundos para estourar o timeout (default: 7000ms).
 * @returns A mesma Promise, porém rejeitando em caso de estouro de tempo.
 */
function withTimeout<T>(p: Promise<T>, ms = 7000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms);
    p.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

/**
 * Componente de Login.
 *
 * ### Responsabilidades
 * - Controla campos `email` e `password`.
 * - Realiza POST para `/auth/login` (com cookie de sessão).
 * - Confirma sessão via `/auth/me` e, se OK, redireciona para `HOME_ROUTE`.
 * - Trata estados de `loading` e mensagens de erro amigáveis.
 *
 * ### Acessibilidade
 * - Usa `role="alert"` para mensagens de erro.
 * - Usa `aria-busy` no botão durante o envio.
 */
const Signin: React.FC = () => {
  /** Campo de e-mail (controlado). */
  const [email, setEmail] = useState("");
  /** Campo de senha (controlado). */
  const [password, setPassword] = useState("");

  /** Flag de carregamento para bloquear UI durante a chamada. */
  const [loading, setLoading] = useState(false);
  /** Mensagem de erro geral (exibida abaixo dos inputs). */
  const [error, setError] = useState<string | null>(null);

  /** Hook de navegação do React Router. */
  const navigate = useNavigate();
  /**
   * Flag contra múltiplos redirecionamentos:
   * evita duplo `navigate` caso a Promise resolva mais de uma vez.
   */
  const navigatingRef = useRef(false);

  /**
   * Consulta o endpoint `/auth/me` para validar a sessão ativa via cookie.
   * @returns `true` se a sessão é reconhecida; `false` caso contrário.
   */
  async function fetchMe(): Promise<boolean> {
    try {
      const res = await withTimeout(fetch(`${AUTH_BASE}/auth/me`, { credentials: "include" }), 7000);
      if (!res.ok) return false;
      const data: MeResponse = await res.json().catch(() => ({} as MeResponse));
      return !!data?.user;
    } catch {
      return false;
    }
  }

  /**
   * Realiza o POST de login com corpo JSON.
   * @param body Objeto com credenciais (email/companyEmail + password).
   * @returns Objeto contendo `res` (Response) e `data` (JSON, se houver).
   */
  async function tryLogin(body: any) {
    const res = await withTimeout(fetch(`${AUTH_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    }), 10000);

    let data: any = null;
    try { data = await res.json(); } catch { /* ignore */ }
    return { res, data };
  }

  /**
   * Handler do submit do formulário:
   * - Normaliza e valida campos localmente.
   * - Tenta autenticar e, se bem-sucedido, confirma sessão com `/auth/me`.
   * - Redireciona para `HOME_ROUTE`.
   */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const emailNorm = email.trim().toLowerCase();
    if (!emailNorm || !password.trim()) {
      setError("Informe e-mail e senha.");
      return;
    }

    setLoading(true);
    try {
      const { res, data } = await tryLogin({ companyEmail: emailNorm, email: emailNorm, password });

      if (res.status === 401) { setError(data?.error || "E-mail ou senha inválidos."); return; }
      if (!res.ok) { setError(data?.error || `Falha no login (${res.status}).`); return; }

      const ok = await fetchMe();
      if (!ok) { setError("Login efetuado, mas a sessão não foi reconhecida. Tente novamente."); return; }

      if (!navigatingRef.current) {
        navigatingRef.current = true;
        navigate(HOME_ROUTE, { replace: true });
      }
    } catch {
      setError("Falha de rede. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    /**
     * Container com imagem de fundo e overlay (ver styled-components).
     * - `bgUrl` injeta a imagem do login (assets/Iot.jpg).
     */
    <Container bgUrl={loginBg}>

      {/* Seção do logotipo (mantida) */}
      <Logo>
        <img src={logoImg} alt={""}/>
      </Logo>

      {/* Card do formulário com efeito glass e borda degradê */}
      <Form onSubmit={handleSubmit} noValidate>
        <FormTitle>Entrar</FormTitle>

        <Input
          required
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Input
          required
          type="password"
          placeholder="senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div role="alert" style={{ marginTop: 8, color: "#ff6b6b" }}>
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} aria-busy={loading}>
          {loading ? "Entrando..." : "Acessar"}
        </Button>
      </Form>
    </Container>
  );
};

export default Signin;
