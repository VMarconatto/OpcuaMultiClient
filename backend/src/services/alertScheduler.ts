/**
// =======================================================
@SECTION : Alert Scheduler
@FILE : alertScheduler.ts
@PURPOSE : Agendar varreduras periódicas dos logs de alertas, aplicar dedupe
por janela de tempo e (opcionalmente) enviar e-mail.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import { loadAlerts } from "../services/alertsStorage.js";
import { sendEmailAlert } from "../services/emailService.js";
import fs from "fs";
import path from "path";

/**
**-------------------------------------------------------
// Configuração por ambiente
**-------------------------------------------------------
 */


const ALERT_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
const SCHED_ENABLED =
  String(process.env.ALERT_SCHEDULER_ENABLED || "off").toLowerCase() === "on";
const SCHED_EMAILS =
  String(process.env.ALERT_SCHEDULER_EMAILS || "off").toLowerCase() === "on";

// clientId -> Map<dedupKey, lastSentTimestamp>
const sentControlMap: Record<string, Map<string, number>> = {};

/**
 * Lista os clientId que possuem arquivos de log de alertas.
 * @returns Lista de ids (derivados do prefixo do nome do arquivo).
 */
function getClientsWithLogs(): string[] {
  const alertsDir = path.join(process.cwd(), "alerts");
  if (!fs.existsSync(alertsDir)) return [];
  return fs
    .readdirSync(alertsDir)
    .filter((f) => f.startsWith("alerts-log-") && f.endsWith(".json"))
    .map((f) => f.replace("alerts-log-", "").replace(".json", ""));
}

/**
 * Extrai o nome da tag do objeto alertData, ignorando chaves conhecidas.
 * @param alertData Objeto de dados de alerta.
 * @returns Nome da primeira chave que não é meta (Desvio, AlertsCount) ou marcador.
 */
function extractTagName(alertData: Record<string, any>): string {
  const KNOWN = new Set(["Desvio", "AlertsCount"]);
  const keys = Object.keys(alertData).filter((k) => !KNOWN.has(k));
  return keys[0] ?? "(sem tag)";
}

/**
 * Varre os logs de alertas por cliente, aplica deduplicação por janela
 * (`ALERT_INTERVAL_MS`) e, se habilitado, envia e-mails de notificação.
 *
 * @remarks
 * - A deduplicação é feita por clientId + dedupKey (<tag>-<desvio>).
 * - Quando ALERT_SCHEDULER_EMAILS=on, envia e-mail via sendEmailAlert.
 * - Caso contrário, apenas registra o evento (modo observação).
 *
 * @example
 * ```ts
 * await processAlerts();
 * ```
 */
export async function processAlerts() {
  const clients = getClientsWithLogs();
  const now = Date.now();

  for (const clientId of clients) {
    const alerts = loadAlerts(clientId);
    if (!alerts.length) continue;

    if (!sentControlMap[clientId]) {
      sentControlMap[clientId] = new Map();
    }

    for (const alert of alerts) {
      const tag = extractTagName(alert.alertData);
      const desvio = alert.alertData?.Desvio ?? "";
      const count = alert.alertData?.AlertsCount ?? "";
      const lastValue = alert.alertData?.[tag];

      const dedupKey = `${tag}-${desvio}`;
      const lastSent = sentControlMap[clientId].get(dedupKey) || 0;

      if (lastSent === 0 || now - lastSent >= ALERT_INTERVAL_MS) {
        // ---------------------------------------------------
        // Formatação do timestamp (robusta a valores inválidos)
        // ---------------------------------------------------
        const when = new Date(alert.timestamp);
        const whenStr = isNaN(when.getTime())
          ? String(alert.timestamp)
          : when.toLocaleString("pt-BR");

        // ---------------------------------------------------
        // Montagem do assunto/corpo do e-mail
        // ---------------------------------------------------
        const subject = `Alerta: ${tag} (${clientId})`;
        const unit = alert.alertData?.Unidade;

        const body =
          `O instrumento "${tag}" do dispositivo "${clientId}" saiu dos limites (${desvio}).\n` +
          (count ? `Ocorrências registradas: ${count}\n` : "") +
          (lastValue != null
            ? `Último valor: ${lastValue}${unit ? ` ${unit}` : ""}\n`
            : "") +
          `Timestamp: ${whenStr}`;

        // ---------------------------------------------------
        // Ação (enviar e-mail ou apenas logar)
        // ---------------------------------------------------
        if (SCHED_EMAILS) {
          await sendEmailAlert(subject, body);
          console.log(
            `(scheduler) Email enviado para ${clientId} em ${alert.timestamp} (${dedupKey})`
          );
        } else {
          /**
          @NOTE : modo observação — e-mails ficam a cargo do fluxo inline (ex.: ClientManager)
           */
          console.log(
            `(scheduler) Viu ${dedupKey} @ ${whenStr} — e-mails via inline`
          );
        }

        sentControlMap[clientId].set(dedupKey, now);
      } else {
        console.log(
          `(scheduler) Ignorando repetido ${tag}/${desvio} — janela.`
        );
      }
    }
  }
}

/**
 * Inicia o agendador de processamento de alertas.
 *
 * @remarks
 * - Ativado apenas quando `ALERT_SCHEDULER_ENABLED=on`.
 * - O intervalo é definido por `ALERT_INTERVAL_MS` (default: 5 minutos).
 *
 * @example
 * ```ts
 * startAlertScheduler();
 * ```
 */
export function startAlertScheduler() {
  if (!SCHED_ENABLED) {
    console.log("Alert Scheduler desativado (ALERT_SCHEDULER_ENABLED=off).");
    return;
  }
  setInterval(() => {
    processAlerts().catch((e) => console.error("Erro no processAlerts:", e));
  }, ALERT_INTERVAL_MS);
  console.log(
    "Alert Scheduler iniciado (modo:",
    SCHED_EMAILS ? "email on" : "email off",
    ")"
  );
}
