import styled from 'styled-components';

export const Form = styled.form`
  background:
    linear-gradient(145deg, #2f2f3bff, #2f2f3bff),
    linear-gradient(to bottom, rgba(37, 2, 102, 0.15), rgba(37, 2, 102, 0.15));
  border: 1px solid ${({ theme }) => theme.textSecondary};
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0px 8px 24px rgba(0,0,0,0.35);
  color: ${({ theme }) => theme.textPrimary};
`;

export const Header = styled.div`
  margin-bottom: 18px;
`;

export const Title = styled.h2`
  margin: 0 0 6px 0;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.2px;

  /* leve aceno à paleta italiana */
  background-image:
    linear-gradient(90deg, #0b4d2b 0%, #2fa35b 48%),
    linear-gradient(90deg, #ffb3b3 0%, #a30000 100%);
  background-size: 50% 100%, 50% 100%;
  background-position: left, right;
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const Subtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: ${({ theme }) => theme.textSecondary};
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;

  @media (min-width: 720px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-size: 12px;
  color: ${({ theme }) => theme.textSecondary};
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.textSecondary};
  background: ${({ theme }) => theme.card || "#1c1c1f"};
  color: ${({ theme }) => theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.accent2};
    box-shadow: 0 0 0 3px rgba(79, 136, 249, 0.25);
  }

  &::placeholder {
    color: ${({ theme }) => theme.textSecondary};
    opacity: 0.8;
  }

  /* estado de erro via aria-invalid */
  &[aria-invalid="true"] {
    border-color: ${({ theme }) => theme.danger};
    box-shadow: 0 0 0 3px rgba(217, 83, 79, 0.25);
  }
`;

export const FieldError = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.danger};
`;


export const Actions = styled.div`
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
`;

export const Button = styled.button`
  padding: 10px 16px;
  min-width: 140px;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.accent2};
  background: ${({ theme }) => theme.accent};
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;