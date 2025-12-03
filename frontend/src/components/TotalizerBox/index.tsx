
import React from "react";
import CountUp from "react-countup";
import { ISelectInputProps } from "../Olds/SelectInput";
import { IContainerProps } from "./styled";
import totalProduction from "../../assets/productivity(2).png";
import chemicalDosage from "../../assets/medicine-dropper.png";
import { Container, FooterInfo } from "./styled";
import { Factory } from "lucide-react";

/**
 * Propriedades do componente WalletBox.
 * @property title        Título do box (ex.: “Produção Total”).
 * @property amount       Valor numérico a ser exibido com animação.
 * @property footerlabel  Texto opcional no rodapé.
 * @property icon         Caminho do ícone opcional (não obrigatório, fallback para <Factory />).
 * @property color        Cor principal do gradiente de fundo.
 * @property unit         Unidade de medida opcional (ex.: “L”, “kg”, “m³”).
 */
export interface ITotalizerBoxProps {
  title: string;
  amount: number;
  footerlabel?: string;
  icon?: string;
  color: string;
  unit?: string;
}

/**
 * Componente WalletBox — card numérico animado.
 * @param title        Título do indicador.
 * @param amount       Valor exibido com animação progressiva (CountUp).
 * @param footerlabel  Texto de rodapé opcional.
 * @param icon         Ícone exibido (caso fornecido).
 * @param color        Cor principal do gradiente do card.
 * @param unit         Unidade de medida (anexada ao valor).
 * @returns JSX com título, valor animado e rodapé.
 * @remarks
 * - Usa a biblioteca `react-countup` para animar os valores.
 * - Pode ser utilizado em dashboards de métricas gerais (produção, consumo, etc.).
 * - O ícone padrão é o `<Factory />` do `lucide-react`.
 */
const TotalizerBox: React.FC<ITotalizerBoxProps> = ({
  title,
  amount,
  footerlabel,
  icon,
  color,
  unit,
}) => {
  return (
    <Container color={color}>
      <header>
        <span>{title}</span>
      </header>

      <main>
        <h1>
          {/* Ícone principal */}
          <Factory size={22} style={{ marginRight: 8 }} />

          {/* Valor animado */}
          <CountUp
            end={amount}
            duration={1.5}
            separator="."
            decimals={2}
            decimal=","
            suffix={unit ? ` ${unit}` : ""}
          />
        </h1>
      </main>

      <FooterInfo>
        <strong></strong>
        <small>{footerlabel || "this month"}</small>
      </FooterInfo>
    </Container>
  );
};

export default TotalizerBox;
