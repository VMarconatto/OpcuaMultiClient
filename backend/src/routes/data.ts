// =======================================================
// 📡 @SECTION: Data Routes
// 📄 @FILE: data.ts
// 🔎 @PURPOSE: Rotas principais de leitura de dados agregados, status OPC UA,
//              e monitoramento MongoDB.
// 🗓️ @LAST_EDIT: 2025-11-10
// =======================================================

import { Router } from "express";
import { getMBData, getMBTotals } from "../aggregations/aggregations.js";
import { getSystemStatus, getNetworkLatency } from "../OpcuaControllers/systemStatus.js";
import { loadAlerts } from "../services/alertsStorage.js";
import { clientManager } from "../OpcuaControllers/ClientManager.js";
import { ClientConnection } from "../types/connections.ts/connections.js";
import { getInsertsPerMin, getInsertsSeries } from "../services/insertsCounter.js";
import { recordInserts } from "../services/insertsCounter.js";

console.log("🔧 Clients registrados:", Object.keys(clientManager.getAllClients()));

export const dataRoutes = Router();

/**
 * Verifica se o objeto é um `ClientConnection` válido.
 */
function isMongoReadyClient(client: any): client is ClientConnection {
  return (
    typeof client?.dbName === "string" &&
    typeof client?.mongoClient === "object" &&
    typeof client?.collections?.transmiters === "string"
  );
}

/**
 * Cálculo simples de taxa (Δvalor/Δtempo)
 */
const __last = new Map<string, { v: number; t: number }>();
function ratePerSec(key: string, current: number) {
  const now = Date.now();
  const prev = __last.get(key);
  __last.set(key, { v: current, t: now });
  if (!prev) return 0;
  const dt = (now - prev.t) / 1000;
  const dv = current - prev.v;
  return dt > 0 && dv >= 0 ? dv / dt : 0;
}

/**
 * =======================================================
 * @SECTION : /:deviceId/transmiters
 * =======================================================
 */
dataRoutes.get("/:deviceId/transmiters", async (req, res) => {
  const { deviceId } = req.params;

  const month = parseInt(req.query.month as string) || 7;
  const year = parseInt(req.query.year as string) || 2025;
  const firstDay = parseInt(req.query.firstDay as string) || 1;
  const endDay = parseInt(req.query.endDay as string) || 31;

  const fhRaw = parseInt(req.query.firstHour as string);
  const ehRaw = parseInt(req.query.endHour as string);
  const firstHour = Number.isFinite(fhRaw) ? Math.max(0, Math.min(23, fhRaw)) : 0;
  const endHour = Number.isFinite(ehRaw) ? Math.max(firstHour, Math.min(23, ehRaw)) : 23;

  console.log("🐞 DEBUG - getAggregatedData()");
  const client = clientManager.getClient(deviceId);

  if (!isMongoReadyClient(client)) {
    return res.status(500).json({ error: "Cliente inválido ou Mongo não inicializado." });
  }

  try {
    const results = await getMBData(
      client.mongoClient,
      client.dbName,
      client.collections.transmiters,
      month,
      year,
      firstDay,
      endDay,
      firstHour,
      endHour
    );

    if (!results || results.length === 0) {
      return res.status(200).json({
        status: "vazio",
        detalhes: "Nenhum documento encontrado no intervalo.",
      });
    }

    return res.status(200).json({
      status: "ok",
      total: results.length,
      exemplo: results.slice(0, 10),
    });
  } catch (e) {
    console.error(`❌ Erro em getMBData para ${deviceId}:`, e);
    return res.status(500).json({ error: "Erro interno ao executar agregação." });
  }
});

/**
 * =======================================================
 * @SECTION : /:deviceId/available-years
 * =======================================================
 */
dataRoutes.get("/:deviceId/available-years", async (req, res) => {
  const { deviceId } = req.params;
  try {
    const client = clientManager.getClient(deviceId);

    if (!client || !client.dbName || !client.collections || !client.mongoClient) {
      return res.status(404).json({ error: `Dispositivo '${deviceId}' não está configurado corretamente.` });
    }

    const db = client.mongoClient.db(client.dbName);
    const collection = db.collection(client.collections.transmiters);

    const years = await collection
      .aggregate([
        { $project: { year: { $year: "$timestamp" } } },
        { $group: { _id: "$year" } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    if (!years || years.length === 0) return res.json([]);
    const result = years.map((y: { _id: number }) => y._id);
    res.json(result);
  } catch (err) {
    console.error("Erro ao buscar anos disponíveis:", err);
    res.status(500).json({ error: "Erro ao buscar anos disponíveis" });
  }
});

/**
 * =======================================================
 * @SECTION : /:deviceId/transmiters/total
 * =======================================================
 */
dataRoutes.get("/:deviceId/transmiters/total", async (req, res) => {
  const { deviceId } = req.params;
  const client = clientManager.getClient(deviceId);

  if (!client || !client.dbName || !client.collections) {
    return res.status(404).json({ error: `Dispositivo '${deviceId}' não configurado.` });
  }

  const { month, year, firstDay, endDay } = req.query;

  if (!month || !year || !firstDay || !endDay) {
    return res.status(400).json({ error: "Parâmetros obrigatórios ausentes." });
  }

  const fhRaw = parseInt(req.query.firstHour as string);
  const ehRaw = parseInt(req.query.endHour as string);
  const firstHour = Number.isFinite(fhRaw) ? Math.max(0, Math.min(23, fhRaw)) : 0;
  const endHour = Number.isFinite(ehRaw) ? Math.max(firstHour, Math.min(23, ehRaw)) : 23;

  try {
    const result = await getMBTotals(
      client.dbName,
      client.collections.transmiters,
      Number(month),
      Number(year),
      Number(firstDay),
      Number(endDay),
      firstHour,
      endHour
    );
    res.json(result || []);
  } catch (e) {
    console.error(`Erro no getMBTotals para ${deviceId}:`, e);
    res.status(500).json({ error: "Erro ao obter totais" });
  }
});

/**
 * =======================================================
 * @SECTION : /:deviceId/opcua-status
 * =======================================================
 */
dataRoutes.get("/:deviceId/opcua-status", (req, res) => {
  const { deviceId } = req.params;
  const client = clientManager.getClient(deviceId);
  if (!client) {
    return res.status(404).json({ error: `Cliente OPC UA '${deviceId}' não encontrado.` });
  }
  res.json(client.getStatus());
});

/**
 * =======================================================
 * @SECTION : /:deviceId/mongodb/status
 * =======================================================
 */
dataRoutes.get("/:deviceId/mongodb/status", async (req, res) => {
  const { deviceId } = req.params;

  try {
    const client = clientManager.getClient(deviceId);
    if (!client || typeof client?.dbName !== "string" || typeof client?.mongoClient !== "object") {
      return res.status(404).json({ error: `Cliente '${deviceId}' não configurado.` });
    }

    const db = client.mongoClient.db(client.dbName);
    const admin = db.admin();
    const t0 = Date.now();
    const pingR = await admin.ping();
    const latencyMs = Date.now() - t0;
    const connected = pingR?.ok === 1;

    let server: any = null;
    try {
      server = await admin.serverStatus();
    } catch {
      server = null;
    }

    const insertsPerMin = getInsertsPerMin(deviceId);
    const insertsSeries = getInsertsSeries(deviceId);

    return res.json({
      connected,
      latencyMs,
      host: server?.host ?? null,
      version: server?.version ?? null,
      opcional: { insertsPerMin, insertsSeries },
    });
  } catch (err) {
    console.error(`Erro em GET /${req.params.deviceId}/mongodb/status:`, err);
    return res.status(500).json({ error: "Erro ao obter status do MongoDB" });
  }
});

/**
 * =======================================================
 * @SECTION : /host01/system-status & /host01/network-latency
 * =======================================================
 */
dataRoutes.get("/host01/system-status", async (_, res) => {
  try {
    const status = await getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter status do sistema" });
  }
});

dataRoutes.get("/host01/network-latency", async (_, res) => {
  try {
    const result = await getNetworkLatency();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erro ao obter latência de rede" });
  }
});

/**
 * =======================================================
 * @SECTION : /:deviceId/alerts-sent
 * =======================================================
 */
dataRoutes.get("/:deviceId/alerts-sent", (req, res) => {
  const { deviceId } = req.params;
  try {
    const alerts = loadAlerts(deviceId);
    res.json(alerts);
  } catch (err) {
    console.error(`Erro ao carregar alertas para ${deviceId}:`, err);
    res.status(500).json({ error: "Erro ao carregar alertas" });
  }
});

/**
 * =======================================================
 * @SECTION : /teste
 * =======================================================
 */
dataRoutes.get("/teste", (_req, res) => {
  console.log("🎯 Rota /teste ativa!");
  res.json({ status: "ok" });
});
