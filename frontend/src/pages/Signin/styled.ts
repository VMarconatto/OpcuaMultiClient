/**
** =======================================================
@SECTION  : Auth — Signin Styled Components
@FILE     : src/pages/Signin/styled.ts
@PURPOSE  : Estilos temáticos (styled-components) para a tela de login,
            com fundo em tela cheia, card “glass” e detalhes da identidade
            visual — sem alterar nenhuma regra original.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

// src/pages/Signin/styled.ts
import styled from "styled-components";

/** Cores temáticas (paleta Itália) usadas nos gradientes/bordas. */
const italianGreen = "#008C45";
const italianWhite = "rgba(244,245,240,0.35)";
const italianRed = "#CD212A";

/**
 * Container em tela cheia com:
 * - Imagem de fundo (via `bgUrl`) + overlay temático (bandeira da Itália).
 * - Vinheta para dar contraste ao card do formulário.
 */
export const Container = styled.div<{ bgUrl?: string }>`
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: grid;
  place-items: center;
  padding: 2rem;

  /* imagem de fundo + overlay temático */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(
        120deg,
        ${italianGreen}26 0%,
        ${italianWhite} 35%,
        ${italianRed}26 100%
      ),
      url(${p => p.bgUrl || "Login_Ref.png"}) center / cover no-repeat;
    filter: saturate(1.05) contrast(1.02) brightness(.95);
    z-index: -2;
  }

  /* leve vinheta para dar leitura ao card */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      radial-gradient(1200px 800px at 50% 20%, transparent 0%, rgba(0,0,0,.35) 60%),
      linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.55));
    z-index: -1;
  }
`;

/**
 * Área do logotipo no topo da página de login.
 * - Mantém a marca centralizada/visível.
 */
export const Logo = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;

  > h2 {
    color: ${props => props.theme.textPrimary};
    margin-left: 7px;
  }

  > img {
    width: 650px;
    height: 400px;
    margin-top:-200px;
  }
`;

/**
 * Card do formulário com efeito “glass” e borda degradê.
 * - Usa dois backgrounds: um para o conteúdo (glass) e outro na border-box
 *   para produzir o contorno degradê.
 * - Define estilos básicos para inputs/selects e para o botão principal.
 */
export const Form = styled.form`
  width: min(700px, 92vw);
  padding: 28px;
  border-radius: 16px;
  margin-top:-900px;
  margin-left:60px;

  /* “truque” para borda degradê com fundo semitransparente */
  background:
    linear-gradient( to bottom, rgba(18,20,24,.78), rgba(15,17,20,.78) ) padding-box,
    linear-gradient(135deg, ${italianGreen}, ${italianWhite}, ${italianRed}) border-box;
  border: 1.5px solid transparent;

  box-shadow:
    0 20px 60px rgba(0,0,0,.45),
    inset 0 1px 0 rgba(255,255,255,.04);
  backdrop-filter: blur(10px);

  display: grid;
  gap: 16px;

  /* inputs internos (se estiver usando inputs nativos) */
  input, select {
    width: 100%;
    border-radius: 12px;
    padding: 12px 14px;
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(10,12,16,.75);
    color: ${p => p.theme.textPrimary};
    outline: none;
    transition: box-shadow .15s ease, border-color .15s ease, background .15s ease;

    &::placeholder { color: ${p => p.theme.textSecondary}; }

    &:focus {
      border-color: ${italianGreen};
      box-shadow:
        0 0 0 3px ${italianGreen}33,
        0 0 0 1.5px ${italianGreen};
      background: rgba(12,14,18,.9);
    }
  }

  /* link “esqueci minha senha” etc. */
  a {
    color: ${p => p.theme.textPrimary};
    opacity: .9;
    text-underline-offset: 3px;
    transition: opacity .15s ease, color .15s ease;
  }
  a:hover { opacity: 1; color: #fff; }

  /* botão principal */
  button[type="submit"] {
    margin-top: 6px;
    height: 46px;
    width: 100%;
    border: 0;
    border-radius: 12px;
    font-weight: 700;
    letter-spacing: .2px;
    color: #0b0f16;
    background: linear-gradient(135deg, ${italianGreen}, ${italianWhite}, ${italianRed});
    cursor: pointer;
    transition: transform .06s ease, filter .15s ease, opacity .15s ease;
  }
  button[type="submit"]:hover { filter: brightness(1.06); }
  button[type="submit"]:active { transform: translateY(1px); }
  button[type="submit"]:disabled { opacity: .7; cursor: not-allowed; }
`;

/**
 * Título do formulário com sublinhado degradê para reforçar a identidade.
 */
export const FormTitle = styled.h1`
  margin: 0 0 18px;
  color: ${props => props.theme.textPrimary};
  line-height: 1.2;
  font-size: 1.75rem;

  &::after{
    content:'';
    display:block;
    margin-top: 10px;
    width: 70px;
    border-bottom: 6px solid transparent;
    border-image: linear-gradient(90deg, ${italianGreen}, ${italianWhite}, ${italianRed}) 1;
  }
`;
