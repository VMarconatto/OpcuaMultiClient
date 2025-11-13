/**
** =======================================================
@SECTION  : UI — Pie Chart Balance
@FILE     : src/components/PieChartBalance/index.tsx
@PURPOSE  : Exibir distribuição percentual de falhas em formato donut,
            com legenda à esquerda e total central (desvios).
@LAST_EDIT : 2025-11-11
** =======================================================
*/

//** NPM Packages */
import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";

//** Styled */
import {
  Container,
  SideLeft,
  SideRight,
  LegendContainer,
  Legend,
} from "./styled";

//**Interfaces */
import { ILegendProps } from "./styled";
import { ISelectInputProps } from "../Olds/SelectInput";
import { IContentHeaderProps } from "../ContentHeader";

/**
 * Props do gráfico de pizza (donut) que representa a relação de falhas.
 * @property data Conjunto de indicadores com `name`, valor absoluto (`value`),
 *                percentual (`percent`) e cor (`color`).
 * @remarks
 * - O donut usa `percent` como `dataKey`, preservando valores absolutos apenas
 *   para cálculo do total exibido no centro.
 * - O array `data` deve estar normalizado (soma de `percent` ~ 100).
 */
export interface IPieChartProps {
  data: {
    name: string;
    value: number;
    percent: number;
    color: string;
  }[];
}

/**
 * Componente PieChartBalance — relatório visual de proporção de falhas.
 * @param data Lista de indicadores já agregados (nome, valor, % e cor).
 * @returns JSX com legenda e donut animado (framer-motion).
 * @note O texto central mostra o total de desvios (soma de `value`).
 * @remarks O componente é puramente visual (sem estado interno).
 */
const PieChartBalance: React.FC<
  ISelectInputProps & IContentHeaderProps & IPieChartProps
> = ({ data }) => {
  // Soma total dos valores absolutos para exibir no centro do donut
  const totalValue = data.reduce((sum, item) => sum + item.value, 0);

  const formattedTotal = `${totalValue.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} desvios`;

  return (
    <Container>
      <SideLeft>
        <h2>Failure Distribution</h2>
        <LegendContainer>
          {data.map((indicator) => (
            <Legend key={indicator.name} color={indicator.color}>
              <div>{indicator.percent.toFixed(1)}</div>
              %
              <span>{indicator.name}</span>
            </Legend>
          ))}
        </LegendContainer>
      </SideLeft>

      <SideRight>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ width: "100%", height: "100%" }}
        >
          <ResponsiveContainer>
            <PieChart
              style={{
                filter: "drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.6))",
              }}
            >
              {/* Gradientes por setor (cada fatia tem seu próprio grad) */}
              <defs>
                {data.map((indicator, index) => (
                  <linearGradient
                    key={`grad-${index}`}
                    id={`grad-${index}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop
                      offset="0%"
                      stopColor={indicator.color}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="100%"
                      stopColor={indicator.color}
                      stopOpacity={1}
                    />
                  </linearGradient>
                ))}
              </defs>

              {/* Título centralizado dentro do donut */}
              <text
                x="50%"
                y="50%"
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fontWeight="bold"
                fill="#ffffff"
              >
                {formattedTotal}
              </text>

              <Pie
                data={data}
                dataKey="percent"
                stroke="#1f1f1f"
                strokeWidth={2}
                innerRadius={70}
                outerRadius={110}
                labelLine={false}
              >
                {data.map((indicator, index) => (
                  <Cell key={indicator.name} fill={`url(#grad-${index})`} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </SideRight>
    </Container>
  );
};

export default PieChartBalance;
