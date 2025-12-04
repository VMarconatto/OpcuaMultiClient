/**
** =======================================================
@SECTION  : UI — Set Line Color Box
@FILE     : src/components/SetLineColor/index.tsx
@PURPOSE  : Permitir ao usuário definir/alterar a cor de cada variável exibida
            em gráficos de linha, lendo a lista de variáveis do backend e
            propagando um mapa (tag → cor) ao componente pai.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Container } from "./styled";

/**
 * Estrutura de configuração por variável vinda do backend.
 * @property mínimo  Valor mínimo recomendado para a variável.
 * @property máximo  Valor máximo recomendado para a variável.
 * @property unidade Unidade de medida (ex.: "°C", "bar", "L/min").
 * @remarks Os campos são utilizados apenas para exibição contextual.
 */
export interface ISetupConfigItem {
  mínimo: number;
  máximo: number;
  unidade: string;
}

/**
 * Propriedades do componente SetLineColor.
 * @property resolvedDeviceId  Identificador resolvido do device/cliente (ex.: "Client01").
 * @property onColorsMapChange Callback opcional acionado ao atualizar o mapa de cores (tag → cor).
 */
interface SetLineColorProps {
  resolvedDeviceId: string;
  onColorsMapChange?: (colorsMap: Record<string, string>) => void;
}

/**
 * Paleta de cores sugeridas para seleção de linhas.
 * @note A lista é cíclica: ao acabar, reinicia pelo primeiro índice.
 */
const availableColors = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#a83279",
  "#32a852",
  "#3279a8",
  "#a83232",
  "#d46b08",
  "#006d75",
  "#9254de",
  "#f759ab",
  "#fa8c16",
  "#08979c",
  "#f5222d",
  "#2f54eb",
  "#13c2c2",
  "#52c41a",
];

/**
 * Componente de configuração de cores por variável.
 * @param resolvedDeviceId Identificador do device/cliente usado para buscar as variáveis.
 * @param onColorsMapChange Callback que recebe o mapa de cores atualizado (tag → cor).
 * @returns JSX com lista rolável de variáveis e `select` de cores por item.
 * @remarks
 * - Faz leitura de `GET /{resolvedDeviceId}/setupalarms` e infere as chaves a partir do JSON.
 * - Gera um `colorsMap` determinístico pela ordem das chaves (cíclico na paleta).
 * - Propaga o `colorsMap` ao pai sempre que é criado/alterado.
 * @note O componente não persiste no backend; apenas emite alterações via callback.
 */
const SetLineColor: React.FC<SetLineColorProps> = ({
  resolvedDeviceId,
  onColorsMapChange,
}) => {
  const [setupConfig, setSetupConfig] = useState<
    Record<string, ISetupConfigItem>
  >({});
  const [colorsMap, setColorsMap] = useState<Record<string, string>>({});

  // Busca a configuração do backend e gera o mapa inicial de cores
  useEffect(() => {
    if (!resolvedDeviceId) return;
    axios
      .get(`http://localhost:3000/${resolvedDeviceId}/setupalarms`)
      .then((res) => {
        setSetupConfig(res.data);

        // Geração determinística das cores com base na ordem das chaves
        const generatedColors = Object.keys(res.data).reduce(
          (acc, key, index) => {
            acc[key] = availableColors[index % availableColors.length];
            return acc;
          },
          {} as Record<string, string>
        );
        setColorsMap(generatedColors);
        onColorsMapChange?.(generatedColors);
      })
      .catch((err) => {
        console.error("Erro ao carregar setupConfig:", err);
      });
  }, [resolvedDeviceId]);

  /**
   * Atualiza a cor associada a uma chave (tag).
   * @param key      Nome da variável/tag.
   * @param newColor Hex da nova cor selecionada pelo usuário.
   * @returns void
   */
  const handleColorChange = (key: string, newColor: string) => {
    setColorsMap((prev) => {
      const updated = { ...prev, [key]: newColor };
      onColorsMapChange?.(updated);
      return updated;
    });
  };

  return (
    <Container>
      <h2>Colors Setup</h2>

      <div className="color-items-scroll">
        {Object.entries(setupConfig).map(([key, item]) => (
          <div key={key} className="color-item">
            <span>{key}</span>
            <span style={{ fontSize: 12, marginRight: 10, opacity: 0.8 }}>
              {item.unidade}
            </span>
            <select
              value={colorsMap[key] || availableColors[0]}
              onChange={(e) => handleColorChange(key, e.target.value)}
              style={{
                backgroundColor: colorsMap[key] || availableColors[0],
                color: "#000", 
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              {availableColors.map((color) => (
                <option
                  key={color}
                  value={color}
                  style={{
                    backgroundColor: color,
                    color: "#000", 
                  }}
                >
                  {color}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default SetLineColor;
