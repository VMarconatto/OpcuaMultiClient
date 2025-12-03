
import React, { ButtonHTMLAttributes } from "react";
import { Container } from "./styled";

/**
 * Propriedades aceitas pelo componente Button.
 * Herda todos os atributos padrões de `<button>`.
 */
type IButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Botão estilizado reutilizável.
 *
 * @param {IButtonProps} props  Atributos nativos de `<button>` e children.
 * @param {React.ReactNode} props.children Conteúdo interno do botão.
 * @returns {JSX.Element} Elemento `<button>` estilizado.
 */
const Button: React.FC<IButtonProps> = ({ children, ...rest }) => {
  return (
    <Container {...rest}>
      {children}
    </Container>
  );
};

export default Button;
