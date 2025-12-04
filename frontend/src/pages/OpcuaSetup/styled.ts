
import styled from "styled-components";

const italianGreen = "#21bd3a";
const italianDark = "#121212";
const italianRed = "#ff2d2d";
const italianDarker = "#0d0d0d";
const neon = "rgba(46, 203, 18, 0.9)";

const glowGreen = "rgba(46,203,18,.28)";
const glowRed = "rgba(255,45,45,.28)";

export const Container = styled.div`
  margin: 32px auto;
  padding: 1.5rem;
  color: ${({ theme }) => theme.textPrimary};
  border-radius: 14px;
  width: 100%;
  max-width: 1100px;

  background:
    radial-gradient(18% 160% at 78% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.28) 78%,
      rgba(0,0,0,0.44) 100%),
    linear-gradient(135deg, ${italianDark}, ${italianDarker});
  background-blend-mode: overlay, normal;

  box-shadow:
    0 0 0 1px rgba(255,255,255,0.02) inset,
    0 8px 24px rgba(0,0,0,0.55),
    0 0 36px -6px ${neon};

  h1 {
    margin: 0 0 1rem;
    font-size: 1.4rem;
    font-weight: 700;
    letter-spacing: .3px;
  }
`;


export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 16px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;


export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;


export const Label = styled.label`
  font-weight: 600;
  color: ${({ theme }) => theme.textPrimary};
  opacity: .95;
`;


export const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.06);
  background: linear-gradient(135deg, #1b1b1b 0%, #141414 100%);
  color: ${({ theme }) => theme.textPrimary};
  font-size: 0.98rem;
  transition: border-color .2s ease, box-shadow .2s ease, transform .06s ease;

  &::placeholder { color: rgba(255,255,255,0.45); }
  &:hover { border-color: rgba(255,255,255,0.10); }
  &:focus {
    outline: none;
    border-color: ${italianGreen};
    box-shadow: 0 0 0 2px rgba(46,203,18,.18);
    transform: translateY(-1px);
  }
`;


export const AddButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: ${italianGreen};
  color: #0b0b0b;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: transform .06s ease, filter .2s ease;
  box-shadow: 0 8px 24px rgba(34, 214, 2, 0.63);

  &:hover { filter: brightness(1.02); }
  &:active { transform: translateY(1px); }
`;


export const ChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;


export const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #232323, #171717);
  color: ${({ theme }) => theme.textPrimary};
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 0 12px -4px ${neon};
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
`;


export const ChipRemove = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  background: rgba(255,255,255,0.06);
  color: ${({ theme }) => theme.textPrimary};
  transition: background-color .2s ease, transform .06s ease;

  &:hover { background: rgba(255,255,255,0.12); }
  &:active { transform: translateY(1px); }
`;


export const ActionsRow = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 18px;
`;


export const SubmitButton = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  background: ${italianGreen};
  color: #0b0b0b;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .06s ease, filter .2s ease;
  box-shadow: 0 8px 24px rgba(34, 214, 2, 0.63);

  &:hover { filter: brightness(1.03); }
  &:active { transform: translateY(1px); }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;


export const StatusDot = styled.span<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 8px;
  background: ${({ active }) => (active ? italianGreen : italianRed)};
  box-shadow: 0 0 12px ${({ active }) => (active ? glowGreen : glowRed)};
`;

/** Botão de alternância (Ativar/Desativar coleta). */
export const ToggleButton = styled.button<{ active: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: 10px 14px;
  border: none;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform .06s ease, filter .2s ease, box-shadow .2s ease;

  color: #0b0b0b;
  background: ${({ active }) => (active ? italianRed : italianGreen)};
  box-shadow: 0 8px 24px ${({ active }) => (active ? glowRed : glowGreen)};

  &:hover { filter: brightness(1.03); }
  &:active { transform: translateY(1px); }
  &:disabled { opacity: .6; cursor: not-allowed; }
`;




export const MsgboxOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

/** Card do modal (corpo). */
export const MsgboxCard = styled.div`
  width: min(520px, 92vw);
  padding: 18px 18px 14px;
  border-radius: 14px;
  background:
    radial-gradient(20% 140% at 82% 50%,
      rgba(0,0,0,0) 40%,
      rgba(0,0,0,0.28) 78%,
      rgba(0,0,0,0.44) 100%),
    linear-gradient(135deg, #1c1c1c, #0f0f0f);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.03) inset,
    0 18px 48px rgba(0,0,0,0.65),
    0 0 40px -8px ${neon};
  color: ${({ theme }) => theme.textPrimary};
`;


export const MsgboxTitle = styled.h3`
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: .2px;
`;


export const MsgboxText = styled.p`
  margin: 0 0 14px;
  font-size: .98rem;
  opacity: .94;
`;


export const MsgboxActions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;


export const MsgboxButton = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
  border: none;
  cursor: pointer;
  transition: transform .06s ease, filter .2s ease, box-shadow .2s ease;

  color: #0b0b0b;
  background: ${italianGreen};
  box-shadow: 0 8px 24px ${glowGreen};

  &[data-variant="danger"] {
    background: ${italianRed};
    box-shadow: 0 8px 24px ${glowRed};
  }

  &:hover { filter: brightness(1.03); }
  &:active { transform: translateY(1px); }
`;


export const MsgboxCancelButton = styled.button`
  padding: 10px 14px;
  border-radius: 12px;
  font-weight: 800;
  border: 1px solid rgba(255,255,255,0.08);
  color: ${({ theme }) => theme.textPrimary};
  background: linear-gradient(135deg, #232323, #171717);
  cursor: pointer;
  transition: transform .06s ease, filter .2s ease;

  &:hover { filter: brightness(1.02); }
  &:active { transform: translateY(1px); }
`;
