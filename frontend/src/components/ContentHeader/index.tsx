/**
** =======================================================
@SECTION  : UI — Content Header
@FILE     : src/components/ContentHeader/index.tsx
@PURPOSE  : Renderizar o cabeçalho de conteúdo com título, linha temática
            (lineColor) e área de controles/ações — sem alterar a lógica.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React from "react";

import { Container, Controllers, TitleContainer } from "./style";

/**
 * Propriedades do cabeçalho de conteúdo.
 *
 * @remarks
 * - `lineColor` pode ser usada para tematizar o título (sub-linha, borda, etc.).
 * - `controllers` é uma área dedicada para botões/filtros.
 * - `children` complementa `controllers` quando há conteúdo extra.
 */
export interface IContentHeaderProps {
  /** Título a ser exibido no cabeçalho. */
  title?: string;
  /** Cor temática associada ao título/linha de destaque. */
  lineColor?: string;
  /** Área de controles (botões, selects, filtros). */
  controllers?: React.ReactNode;
  /** Conteúdo adicional a ser exibido junto aos `controllers`. */
  children?: React.ReactNode;
}

/**
 * Componente de cabeçalho do conteúdo principal (título + controles).
 *
 * @param props - Propriedades do cabeçalho.
 * @param props.title - Título do cabeçalho (opcional).
 * @param props.lineColor - Cor temática opcional para destaque visual.
 * @param props.controllers - Nós React para ações/controles.
 * @param props.children - Nós adicionais exibidos na área de controles.
 * @returns JSX.Element encapsulando título e área de controles.
 *
 * @note
 * O `Container` recebe `isActive={true}` para manter o layout atual; caso
 * haja necessidade de alternância visual futura, a flag pode ser tornada
 * dinâmica sem quebra de API.
 */
const ContentHeader: React.FC<IContentHeaderProps> = ({
  title,
  lineColor,
  controllers,
  children,
}) => {
  return (
    <Container isActive={true}>
      <TitleContainer lineColor={lineColor}>
        <h1>{title}</h1>
      </TitleContainer>

      <Controllers>
        {controllers}
        {children}
      </Controllers>
    </Container>
  );
};

export default ContentHeader;
