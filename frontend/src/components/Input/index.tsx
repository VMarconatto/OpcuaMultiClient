/**
** =======================================================
@SECTION  : UI — Input (Base)
@FILE     : src/components/Input/index.tsx
@PURPOSE  : Componente de campo de entrada base (wrapper de <input>)
            recebendo todos os atributos HTML nativos via props rest,
            estilizado via styled-components.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { InputHTMLAttributes } from "react";
import { Container } from "./styled";

/**
 * Props do componente Input — espelha atributos nativos de <input>.
 * @remarks Utilize para passar qualquer atributo válido do HTMLInputElement
 * (ex.: `type`, `placeholder`, `value`, `defaultValue`, `onChange`, `disabled`).
 */
type IInputProps = InputHTMLAttributes<HTMLInputElement>;

/**
 * Componente funcional que renderiza um `<input>` estilizado.
 * @param rest Atributos nativos do `<input>` repassados ao styled `Container`.
 * @returns Elemento JSX do campo de entrada.
 * @note O componente não mantém estado interno; use como controlado ou não-controlado
 * conforme a necessidade do chamador.
 */
const Input: React.FC<IInputProps> = ({ ...rest }) => {
  return (
    <Container {...rest}>
      {/* Intencionalmente vazio: o input é renderizado como elemento raiz estilizado */}
    </Container>
  );
};

export default Input;
