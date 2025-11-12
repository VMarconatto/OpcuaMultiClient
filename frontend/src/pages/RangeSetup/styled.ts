/**
** =======================================================
@SECTION  : Analog Setup — Alarm Ranges & Setpoints (UI)
@FILE     : src/pages/RangeSetup/styled.ts
@PURPOSE  : Estilização (styled-components) do formulário de ranges/alarms:
            layout full-bleed dentro do Content, cartões e grade dos inputs.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import styled from "styled-components";

/** Tokens de cor/PBR usados nos gradientes e detalhes. */
const italianGreen = "#21bd3a";
const italianDark = "#121212";
const italianRed = "#ff2d2d";
const italianDarker = "#0d0d0d";
const neon = "rgba(46, 203, 18, 0.9)";

/**
 * Container geral da página de configuração (scroll interno e full-bleed).
 * - Observação: margens/paddings calibrados para “morder” o gutter do Content.  :contentReference[oaicite:11]{index=11}
 */
export const Container = styled.div`
  width: 100%;
  max-width: 100%;

  /* “morde” o gutter do Content.
     Se o Content tiver 24px (ou outro) de padding lateral, ajuste estes 32px. */
  margin-left: 8px;
  margin-right: -32px;
  padding-left: calc(2rem + 32px);
  padding-right: calc(2rem + 32px);

  /* reduzimos o respiro para “subir” o topo */
  margin-top: 8px;
  margin-bottom: 32px;
  padding-top: 0.75rem;
  padding-bottom: 2rem;

  color: ${({ theme }) => theme.textPrimary};
  border-radius: 14px;

  background:
    radial-gradient(18% 160% at 78% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.28) 78%,
      rgba(0,0,0,0.44) 100%),
    linear-gradient(135deg, ${italianDark}, ${italianDarker});
  background-blend-mode: overlay, normal;

  /* box-shadow:
    0 0 0 1px rgba(255,255,255,0.02) inset,
    0 8px 24px rgba(0,0,0,0.55),
    0 0 36px -6px ${neon}; */

  max-height: calc(100vh - 160px);
  overflow-y: auto;

  > h1 {
    margin: 0 0 1.1rem;
    font-size: 1.55rem;
    font-weight: 700;
    letter-spacing: .3px;
  }

  &::-webkit-scrollbar { width: 10px; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }

  @media (max-width: 900px) {
    margin-left: 0;
    margin-right: 0;
    padding-left: 1.25rem;
    padding-right: 1.25rem;
  }
`;

/**
 * Barra superior para ClientPicker/filtros (opcional, pode ser sticky).
 */
export const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: -6px;    /* puxa um pouco mais pro alto */
  margin-bottom: 14px; /* separa do título */
  margin-left:-60px;

  /* Se quiser “grudar” ao rolar, descomente:
  position: sticky;
  top: 8px;
  z-index: 1;
  */
`;

/** Título local reutilizável quando necessário. */
export const FormTitle = styled.h1`
  margin: 0 0 1.1rem;
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: .3px;
  color: ${({ theme }) => theme.textPrimary};
`;

/**
 * Cartão de edição por tag (duas linhas x 4 colunas de inputs).
 * - Em telas menores, a grade degrada progressivamente para 3/2/1 colunas.  :contentReference[oaicite:12]{index=12} :contentReference[oaicite:13]{index=13}
 */
export const RangeItem = styled.div`
  border-radius: 14px;
  padding: 22px 20px;
  margin: 0 0 20px 0;

  background:
    radial-gradient(20% 140% at 82% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.28) 78%,
      rgba(0,0,0,0.44) 100%),
    linear-gradient(135deg, #1c1c1c, #0f0f0f);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.03) inset,
    0 12px 32px rgba(0,0,0,0.65),
    0 0 28px -8px ${neon};

  h2 {
    margin: 0 0 14px;
    font-size: 1.12rem;
    font-weight: 800;
    letter-spacing: .2px;
    color: ${({ theme }) => theme.textPrimary};
  }

  /* === AQUI: 4 colunas fixas -> com 8 campos => 2 linhas certinhas === */
  .inputs {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
    align-items: start;

    /* degrade em telas menores */
    @media (max-width: 1400px) { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 1100px) { grid-template-columns: repeat(2, 1fr); }
    @media (max-width: 680px)  { grid-template-columns: 1fr; }

    /* célula (label + input/select/checkbox) */
    label {
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }

    /* header da célula: texto + checkbox (quando houver) */
    label > div {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 1.06rem;
      color: ${({ theme }) => theme.textPrimary};
      opacity: .95;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      min-width: 0;
    }

    /* campos (text/number/select) com foco acessível e feedback visual */
    input[type="text"],
    input[type="number"],
    select {
      width: 100%;
      height: 50px;
      padding: 0 14px;
      border-radius: 12px;
      border: 1px solid rgba(255,255,255,0.06);
      background: linear-gradient(135deg, #1b1b1b 0%, #141414 100%);
      color: ${({ theme }) => theme.textPrimary};
      font-size: 1.06rem;
      transition: border-color .2s ease, box-shadow .2s ease, transform .06s ease;

      &::placeholder { color: rgba(255,255,255,0.45); }
      &:hover { border-color: rgba(255,255,255,0.10); }
      &:focus {
        outline: none;
        border-color: ${italianGreen};
        box-shadow: 0 0 0 2px rgba(46,203,18,.18);
        transform: translateY(-1px);
      }
      &:disabled {
        opacity: .6;
        cursor: not-allowed;
        background: linear-gradient(135deg, #161616, #141414);
        border-style: dashed;
      }
    }

    /* checkbox acompanha a escala visual */
    input[type="checkbox"] {
      width: 20px;
      height: 20px;
      accent-color: ${italianRed};
      cursor: pointer;
    }
  }
`;

/** Botão principal de submissão (salvar alterações). */
export const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 12px 16px;
  background: ${italianGreen};
  color: #0b0b0b;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: transform .06s ease, filter .2s ease;
  box-shadow: 0 8px 24px rgba(34, 214, 2, 0.63);

  &:hover { filter: brightness(1.03); }
  &:active { transform: translateY(1px); }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;
