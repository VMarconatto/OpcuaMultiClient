/**
** =======================================================
@SECTION : Alerts Log Cleaner
@FILE : clean-alerts-log.ts
@PURPOSE : Limpar periodicamente os arquivos de alertas por cliente (reset → [])
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import fs from "fs";
import path from "path";
console.log("achou clean-alerts-log.ts");

// Diretório com os arquivos alerts-log-<clientId>.json
const ALERTS_DIR = path.resolve("alerts");

// Intervalo de limpeza (default: 1h). Ajuste se necessário via código/ENV.
const CLEAN_INTERVAL_MS = 1 * 60 * 60 * 1000; // 1 hora (ajustável)

/**
 * Inicia um intervalo que varre `./alerts/` e sobrescreve todos os
 * arquivos `alerts-log-*.json` com `[]`, efetivamente limpando o histórico.
 *
 * @remarks
 * - Ideal para ambientes de *lab/dev* quando os arquivos crescem demais.
 * - Em produção, considere retenção/arquivamento em vez de apagar.
 *
 * @example
 * ```ts
 * startAlertsLogCleaner(); // limpa a cada 1h
 * ```
 */
export function startAlertsLogCleaner(): void {
  setInterval(() => {
    try {
      console.log("Iniciando limpeza dos arquivos de alertas por client");

      if (!fs.existsSync(ALERTS_DIR)) {
        console.warn(
          `[${new Date().toISOString()}] Pasta de alertas '${ALERTS_DIR}' não encontrada.`
        );
        return;
      }

      const files = fs
        .readdirSync(ALERTS_DIR)
        .filter(
          (file) => file.startsWith("alerts-log-") && file.endsWith(".json")
        );

      for (const file of files) {
        const filePath = path.join(ALERTS_DIR, file);
        fs.writeFileSync(filePath, "[]", "utf-8");
        console.log(
          `[${new Date().toISOString()}] ${file} limpo com sucesso.`
        );
      }
    } catch (err) {
      console.error(
        `[${new Date().toISOString()}] Erro ao limpar arquivos de alertas:`,
        err
      );
    }
  }, CLEAN_INTERVAL_MS);
}
