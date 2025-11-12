/**
// =======================================================
  @FILE : limits.ts
  @PURPOSE : Carregar limites/alarms do setup JSON e expor como objeto tipado
  @CONTEXT : Chaves originais em PT-BR (mínimo/máximo) → normalizadas p/ min/max
  @LAST_EDIT : 2025-11-10
// =======================================================
 */

import fs from "fs";
import path from "path";

const rangeSetupFilePath = path.join(process.cwd(), "setuptsconfig.json");

// -------------------------------------------------------
//  Tipos do arquivo de setup (Segue Configuração do Arquivo JSON)
// -------------------------------------------------------
type RawLimit = {
  mínimo: number;
  máximo: number;
  unidade: string;
  SPAlarmL?: number;
  SPAlarmLL?: number;
  SPAlarmH?: number;
  SPAlarmHH?: number;
};

// Mapa: nomeDaTag → limites crus (PT-BR)
let limitsData: Record<string, RawLimit> = {};

/**
 * Estrutura de limites/alarms carregada do arquivo de setup em runtime.
 *
 * @remarks
 * - O arquivo de origem usa campos em PT-BR: `mínimo` / `máximo` / `unidade`.
 * - Exportamos no formato normalizado: `min` / `max` / `unidade` + setpoints.
 * - Caso o arquivo não exista, valores defaults (0/“”) são usados — não falha o boot.
 *
 * @example
 * ```ts
 * import { limits } from "./limits";
 * const faixas = limits["Pressure Input TRC001 - PT02"];
 * if (faixas && valor > faixas.max) { /* dispara alerta *\/ }
 * ```
 */
try {
  const fileContent = fs.readFileSync(rangeSetupFilePath, "utf-8");
  limitsData = JSON.parse(fileContent) as Record<string, RawLimit>;
  console.log("setuptsconfig.json carregado com sucesso.");
} catch (err) {
  console.warn("Não foi possível carregar setuptsconfig.json. Usando valores padrão.", err);
}

// -------------------------------------------------------
//  Tipo normalizado que o resto do app consome
// -------------------------------------------------------
export type Limit = {
  min: number;
  max: number;
  unidade: string;
  SPAlarmL: number;
  SPAlarmLL: number;
  SPAlarmH: number;
  SPAlarmHH: number;
};

// Mapa: nomeDaTag → limites normalizados
export const limits: Record<string, Limit> = Object.fromEntries(
  Object.entries(limitsData).map(([key, value]) => [
    key,
    {
      min: value?.mínimo ?? 0,
      max: value?.máximo ?? 0,
      unidade: value?.unidade ?? "",
      SPAlarmL: value?.SPAlarmL ?? 0,
      SPAlarmLL: value?.SPAlarmLL ?? 0,
      SPAlarmH: value?.SPAlarmH ?? 0,
      SPAlarmHH: value?.SPAlarmHH ?? 0,
    },
  ])
);
