
import React, { createContext, useState, useContext, useEffect } from "react";

interface IAuthContextProps {
  /** Flag indicando sessão autenticada. */
  logged: boolean;
  /**
   * Realiza login (implementação local/legado).
   * @param {string} email    E-mail do usuário.
   * @param {string} password Senha do usuário.
   * @returns {void}
   */
  signIn(email: string, password: string): void;
  /**
   * Realiza logout local e (opcionalmente) notifica o backend.
   * @returns {void}
   */
  signOut(): void;
}

/** Contexto de autenticação. */
const AuthContext = createContext<IAuthContextProps>({} as IAuthContextProps);

/** Base do backend. */
const AUTH_BASE = "http://localhost:3000";

/**
 * Provider de autenticação.
 *
 * - Sincroniza o estado `logged` com `/auth/me` ao montar.
 * - Expõe `signIn`/`signOut` e o estado `logged` aos filhos.
 *
 * @param {{ children: React.ReactNode }} props Elementos filhos a serem envolvidos.
 * @returns {JSX.Element} Provider React com o valor do contexto.
 */
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logged, setLogged] = useState<boolean>(false);

  /**
   * Sincroniza com /auth/me ao montar (útil para Header, etc.).
   * 
   */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${AUTH_BASE}/auth/me`, { credentials: "include" });
        const data = await res.json().catch(() => null);
        const ok = res.ok && !!data?.user;
        if (!alive) return;
        setLogged(ok);
        if (ok) localStorage.setItem("@minha-conta:logged", "true");
        else localStorage.removeItem("@minha-conta:logged");
      } catch {
        if (alive) setLogged(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  /**
   * Login local/legado (mantido).
   * @param {string} email    E-mail do usuário.
   * @param {string} password Senha do usuário.
   * @returns {void}
   */
  const signIn = (email: string, password: string): void => {
    if (email === "mycompany@hotmail.com" && password === "123") {
      localStorage.setItem("@minha-conta:logged", "true");
      setLogged(true);
    } else {
      alert("Senha ou usuário inválidos");
    }
  };

  /**
   * Logout local e limpeza do flag persistido.
   * (Opcional) Chama `/auth/logout` no backend.
   * @returns {void}
   */
  const signOut = (): void => {
    localStorage.removeItem("@minha-conta:logged");
    setLogged(false);
    // fetch(`${AUTH_BASE}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ logged, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook para consumir o contexto de autenticação.
 * @returns {IAuthContextProps} Objeto com `logged`, `signIn` e `signOut`.
 */
function useAuth(): IAuthContextProps {
  return useContext(AuthContext);
}

export { AuthProvider, useAuth };
