
import styled from "styled-components";

const italianGreen = "#21bd3a";
const italianRed = "#ff2d2d";
const italianDark = "#121212";
const italianDarker = "#0d0d0d";
const neon = "rgba(46,203,18,0.85)";
const glowGreen = "rgba(46,203,18,.28)";
const glowRed = "rgba(255,45,45,.28)";
const glowYellow = "rgba(255,226,111,.28)";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

export const Card = styled.div`
  position: relative;
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

  &[data-variant="danger"] {
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.03) inset,
      0 18px 48px rgba(0,0,0,0.65),
      0 0 40px -8px ${glowRed};
  }

  &[data-variant="success"] {
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.03) inset,
      0 18px 48px rgba(0,0,0,0.65),
      0 0 40px -8px ${glowGreen};
  }

  &[data-variant="warning"] {
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.03) inset,
      0 18px 48px rgba(0,0,0,0.65),
      0 0 40px -8px ${glowYellow};
  }
`;

export const CloseX = styled.button`
  position: absolute;
  top: 8px;
  right: 10px;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.06);
  color: ${({ theme }) => theme.textPrimary};
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  transition: filter .2s ease, transform .06s ease;
  &:hover { filter: brightness(1.1); }
  &:active { transform: translateY(1px); }
`;


export const Title = styled.h3`
  margin: 0 0 8px;
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: .2px;
`;


export const Text = styled.div`
  margin: 0 0 14px;
  font-size: .98rem;
  opacity: .94;
`;


export const Actions = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`;

export const ConfirmBtn = styled.button`
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

export const CancelBtn = styled.button`
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
