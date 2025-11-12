/**
** =======================================================
@SECTION : Alerts Storage
@FILE : alertsStorage.ts
@PURPOSE : Persistir/ler alertas por cliente em arquivos JSON com deduplicação por janela.
@LAST_EDIT : 2025-11-10
** =======================================================
 */

import fs from "fs";
import path from "path";

/**
 * Entrada de alerta persistida no arquivo `alerts/alerts-log-<clientId>.json`.
 *
 * @remarks
 * - `alertData` pode conter, por convenção, chaves como:
 *   - `<Tag>`: valor mais recente, p.ex. `"Pressure Input TRC001 - PT02": 7.1`
 *   - `AlertsCount`: número de ocorrências
 *   - `Desvio`: texto indicando a condição (ex.: "Acima do máximo", "Abaixo do mínimo")
 * - O tamanho do arquivo é limitado (mantemos os 100 mais recentes).
 */
export type AlertEntry = {
  timestamp: string;
  alertData: Record<string, any>; // inclui { [tag]: value, AlertsCount, Desvio }
  recipients: string[];
  clientId: string;
};

/**
 * Resolve o caminho do arquivo de alertas para um `clientId`.
 * @param clientId - Identificador lógico do cliente.
 */
function getAlertsFile(clientId: string): string {
  return path.join(process.cwd(), "alerts", `alerts-log-${clientId}.json`);
}

/**
 * Carrega a lista de alertas do cliente (ou lista vazia se o arquivo não existir).
 * @param clientId - Identificador lógico do cliente.
 * @returns Array de `AlertEntry` (ou `[]` em caso de erro).
 */
export function loadAlerts(clientId: string): AlertEntry[] {
  const filePath = getAlertsFile(clientId);
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content || "[]");
  } catch (error) {
    console.error(`Erro ao carregar alertas para ${clientId}:`, error);
    return [];
  }
}

/**
 * Salva um alerta aplicando **deduplicação temporal** pelo par (tag, desvio).
 *
 * @remarks
 * - Janela de dedupe controlada por `ALERT_DEDUP_MS` (default: 5 min).
 * - Mantém no máximo 100 registros por cliente (insere no início com `unshift`).
 *
 * @param alert - Objeto `AlertEntry` a persistir.
 * @returns `true` se salvou (novo registro) | `false` se ignorou (duplicado na janela).
 */
export function saveAlert(alert: AlertEntry): boolean {
  const filePath = getAlertsFile(alert.clientId);

  // Garante pasta ./alerts/
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("Diretório de alertas criado:", dir);
  }

  const alerts = loadAlerts(alert.clientId);

  // Par (tag, desvio) para dedupe
  const tag = Object.keys(alert.alertData)[0];
  const desvio = alert.alertData.Desvio;
  const now = new Date(alert.timestamp);

  const DEDUP_MS = Number(process.env.ALERT_DEDUP_MS ?? 5 * 60 * 1000);

  // Existe alerta do mesmo (tag, desvio) dentro da janela?
  const alreadyExists = alerts.some((a) => {
    const existingTag = Object.keys(a.alertData)[0];
    const existingDesvio = a.alertData.Desvio;
    const existingTime = new Date(a.timestamp);
    return (
      existingTag === tag &&
      existingDesvio === desvio &&
      now.getTime() - existingTime.getTime() < DEDUP_MS
    );
  });

  if (alreadyExists) {
    console.log(
      `Ignorado: (${tag}, ${desvio}) já registrado nos últimos ${Math.round(
        DEDUP_MS / 60000
      )} min.`
    );
    return false;
  }

  // Mantém os mais recentes na cabeça da lista e limita a 100
  alerts.unshift(alert);
  if (alerts.length > 100) alerts.pop();

  fs.writeFileSync(filePath, JSON.stringify(alerts, null, 2), "utf-8");
  console.log(`Alerta salvo para ${alert.clientId} em ${filePath}`);
  return true;
}
