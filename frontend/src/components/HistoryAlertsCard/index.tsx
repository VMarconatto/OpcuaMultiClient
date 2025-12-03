
import React from "react";
import { Container, Tag } from "./style";

/**
 * Propriedades do componente HistoryAlertsCard.
 *
 * @property cardColor - Cor de fundo opcional do cartão.
 * @property tagColor - Cor da tarja lateral de identificação.
 * @property title - Título principal do alerta (ex.: “Limite Excedido”).
 * @property subtitle - Subtítulo descritivo (ex.: “Sensor FT01”).
 * @property amount - Quantidade ou valor numérico exibido à direita.
 * @property children - Elementos filhos opcionais.
 *
 * @remarks
 * Este componente é utilizado no painel histórico de alertas,
 * agrupando informações de forma resumida e visualmente codificada por cor.
 */
export interface IHistoryAlertsCard {
  cardColor?: string;
  tagColor: string;
  title?: string;
  subtitle?: string;
  amount?: string;
  children?: React.ReactNode;
}

/**
 * Cartão informativo para exibição de alertas históricos.
 *
 * @param props - Ver {@link IHistoryAlertsCard}.
 * @returns JSX.Element com layout de alerta (tag colorida + título + valor).
 *
 * @note
 * O `isActive` é fixado em `true` no container apenas para manter a
 * compatibilidade com componentes que dependem dessa flag.
 */
const HistoryAlertsCard: React.FC<IHistoryAlertsCard> = ({
  tagColor,
  title,
  subtitle,
  amount,
  cardColor,
}) => {
  return (
    <Container isActive={true}>
      <Tag color={tagColor} />
      <div>
        <span>{title}</span>
        <small>{subtitle}</small>
      </div>
      <h3>{amount}</h3>
    </Container>
  );
};

export default HistoryAlertsCard;
