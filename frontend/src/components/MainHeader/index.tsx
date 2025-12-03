
import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { useAuth } from "../../hooks/auth";
import { Link, useNavigate } from "react-router-dom";
import IconSorgente from "../../assets/ssss-removebg-preview.png";
import {
  Container,
  IconsGroup,
  IconButton,
  Title,
  LogImg,
  Badge,
  Avatar,
  UserMenu,
  UserMenuItem,
  AvatarWrapper,
} from "./styled";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Propriedades do MainHeader.
 * @property icon Caminho/URL da imagem do avatar do usuário.
 */
export interface IMainHeaderProps {
  icon: string;
}

/**
 * Base do serviço de autenticação para o endpoint de logout.
 * @note Ajuste via variável de ambiente quando mover para produção.
 */
const AUTH_BASE = "http://localhost:3000";

/**
 * Componente de cabeçalho principal da aplicação.
 * @param icon Caminho/URL do avatar a ser exibido no topo (lado direito).
 * @returns Elemento JSX com marca, botões e menu de usuário.
 * @remarks
 * - Usa `useAuth()` para efetuar o logout local (contexto/localStorage).
 * - Usa `useNavigate()` para redirecionar após logout.
 * - Fecha o menu ao clicar fora usando um event listener global.
 * - Animações de abertura/fechamento com `framer-motion`.
 * @note O botão “tema” apenas registra no console (ponto de extensão para ThemeSwitcher).
 */
const MainHeader: React.FC<IMainHeaderProps> = ({ icon }) => {
  const theme = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { signOut } = useAuth();

  /** Alterna tema — placeholder atual para integração futura. */
  const toggleTheme = () => {
    console.log("Alternar tema");
  };

  /** Abre/fecha o menu do usuário. */
  const handleMenuClick = () => setIsMenuOpen((prev) => !prev);

  /** Fecha o menu ao clicar fora do AvatarWrapper. */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Executa logout remoto (melhor esforço) e sempre finaliza com
   * limpeza de sessão local + navegação para /signin.
   * @returns Promise<void>
   */
  const handleLogout = async () => {
    try {
      await fetch(`${AUTH_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // mesmo que falhe, seguimos com o logout local
    } finally {
      signOut(); // atualiza contexto/localStorage
      setIsMenuOpen(false); // fecha menu
      navigate("/signin", { replace: true }); // vai para login
    }
  };

  return (
    <Container isActive={true}>
      <div className="brand"></div>
      <Title>Multi-Client</Title>
      <LogImg src={IconSorgente} alt={""}></LogImg>  

      <IconsGroup>
        <IconButton
          as={Link}
          to="/alertssent"
          aria-label="Abrir alertas enviados"
        >
          <span role="img" aria-label="notifications">
            🔔
          </span>
          <Badge>5</Badge>
        </IconButton>

        <IconButton onClick={toggleTheme}>
          <span role="img" aria-label="dark mode">
            🌙
          </span>
        </IconButton>

        <AvatarWrapper ref={menuRef}>
          <Avatar src={icon} alt="User avatar" onClick={handleMenuClick} />
          <AnimatePresence>
            {isMenuOpen && (
              <UserMenu
                as={motion.ul}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <UserMenuItem
                  as={Link}
                  to="/profile/edit"
                  onClick={() => setIsMenuOpen(false)}
                >
                  ✏️ Editar Perfil
                </UserMenuItem>
                <UserMenuItem onClick={handleLogout}>🚪 Sair</UserMenuItem>
              </UserMenu>
            )}
          </AnimatePresence>
        </AvatarWrapper>
      </IconsGroup>
    </Container>
  );
};

export default MainHeader;
