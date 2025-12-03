
import React from "react";

import { Container } from "./style";
import { ISelectInputProps } from "../Olds/SelectInput";
import { IContentHeaderProps } from "../ContentHeader";

/**
 * Componente de alto nível para empacotar o conteúdo principal da página.
 *
 * @remarks
 * O tipo de `props` combina `ISelectInputProps` e `IContentHeaderProps` para
 * manter a compatibilidade estrutural com os componentes irmãos/parentes,
 * porém, no momento, apenas `children` é utilizado.
 *
 * @param props - Conjunto de propriedades herdadas dos cabeçalhos e selects.
 * @param props.children - Nó(s) React a serem renderizados dentro do contêiner.
 * @returns JSX.Element com o conteúdo envolto por `Container`.
 *
 * @note
 * `isActive` é fixado como `true` no `Container` para garantir o layout atual.
 * Caso haja futura necessidade de alternância visual, essa flag pode ser
 * parametrizada sem quebrar a API.
 */
const Content: React.FC<ISelectInputProps & IContentHeaderProps> = ({ children }) => {
  return (
    <Container isActive={true}>
      {children}
    </Container>
  );
};

export default Content;
