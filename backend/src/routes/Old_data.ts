import { Router } from "express";
import { getMBData, getMBTotals } from "../aggregations/aggregations.js";
import { getSystemStatus, getNetworkLatency } from "../OpcuaControllers/systemStatus.js";
import { loadAlerts } from "../services/alertsStorage.js";
import { clientManager } from "../OpcuaControllers/ClientManager.js";
import { ClientConnection } from "../types/connections.ts/connections.js";
import { getInsertsPerMin, getInsertsSeries } from "../services/insertsCounter.js";
// import { ratePerSec } from "../services/rate.js";

// no writer (onde você faz insertOne/insertMany)
import { recordInserts } from "../services/insertsCounter.js";

console.log("🔧 Clients registrados:", Object.keys(clientManager.getAllClients()));

export const dataRoutes = Router();

// Função auxiliar de verificação de tipo
function isMongoReadyClient(client: any): client is ClientConnection {
  return (
    typeof client?.dbName === "string" &&
    typeof client?.mongoClient === "object" &&
    typeof client?.collections?.transmiters === "string"
  );
}
// --- auxiliar: derivar taxa/s a partir de contadores cumulativos ---
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

dataRoutes.get("/:deviceId/transmiters", async (req, res) => {
  const { deviceId } = req.params;

  const month = parseInt(req.query.month as string) || 7;
  const year = parseInt(req.query.year as string) || 2025;
  const firstDay = parseInt(req.query.firstDay as string) || 1;
  const endDay = parseInt(req.query.endDay as string) || 31;

  // >>> NOVO: horas (normaliza 0..23 e garante end >= start)
  const fhRaw = parseInt(req.query.firstHour as string);
  const ehRaw = parseInt(req.query.endHour as string);
  const firstHour = Number.isFinite(fhRaw) ? Math.max(0, Math.min(23, fhRaw)) : 0;
  const endHour = Number.isFinite(ehRaw) ? Math.max(firstHour, Math.min(23, ehRaw)) : 23;

  console.log("🐞 DEBUG - getAggregatedData()");
  // ... mantém leitura de month, year, firstDay, endDay, firstHour, endHour como você já fez

  const client = clientManager.getClient(deviceId);

  // GARANTIA: checar se o client tem mongo pronto
  if (
    !client ||
    typeof client.dbName !== "string" ||
    typeof client.mongoClient !== "object" ||
    !client.collections?.transmiters
  ) {
    return res.status(500).json({ error: "Cliente inválido ou Mongo não inicializado." });
  }

  try {
    // ✅ Chamada direta ao getMBData com horas
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
      return res.status(200).json({ status: "vazio", detalhes: "Nenhum documento encontrado no intervalo." });
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

dataRoutes.get("/:deviceId/available-years", async (req, res) => {
  const { deviceId } = req.params;
  try {
    const client = clientManager.getClient(deviceId);

    if (!client || !client.dbName || !client.collections || !client.mongoClient) {
      return res.status(404).json({ error: `Dispositivo '${deviceId}' não está configurado corretamente.` });
    }

    const db = client.mongoClient.db(client.dbName);
    const collection = db.collection(client.collections.transmiters);

    const years = await collection.aggregate([
      { $project: { year: { $year: "$timestamp" } } },
      { $group: { _id: "$year" } },
      { $sort: { _id: 1 } }
    ]).toArray();

    if (!years || years.length === 0) {
      return res.json([]);
    }

    const result = years.map((item: { _id: number }) => item._id);
    console.log("Anos encontrados no MongoDB:", result);
    res.json(result);
  } catch (err) {
    console.error("Erro ao buscar anos disponíveis:", err);
    res.status(500).json({ error: "Erro ao buscar anos disponíveis" });
  }
});

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

  // >>> NOVO: horas
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
      // >>> NOVO
      firstHour,
      endHour
    );
    res.json(result || []);
  } catch (e) {
    console.error(`Erro no getMBTotals para ${deviceId}:`, e);
    res.status(500).json({ error: "Erro ao obter totais" });
  }
});

// (demais rotas inalteradas…)

dataRoutes.get("/:deviceId/opcua-status", (req, res) => {
  const { deviceId } = req.params;
  const client = clientManager.getClient(deviceId);

  if (!client) {
    return res.status(404).json({ error: `Cliente OPC UA '${deviceId}' não encontrado.` });
  }

  res.json(client.getStatus());
});

dataRoutes.get("/:deviceId/mongodb/status", async (req, res) => {
  const { deviceId } = req.params;

  try {
    const client = clientManager.getClient(deviceId);
    if (!client || typeof client?.dbName !== "string" || typeof client?.mongoClient !== "object") {
      return res.status(404).json({ error: `Cliente '${deviceId}' não configurado.` });
    }

    const db = client.mongoClient.db(client.dbName);
    const admin = db.admin();

    // 1) Latência via ping
    const t0 = Date.now();
    const pingR = await admin.ping();
    const latencyMs = Date.now() - t0;
    const connected = pingR?.ok === 1;

    // 2) serverStatus deve ser no admin DB
    let server: any = null;
    try {
      // ✅ chave da correção
      server = await admin.serverStatus();
    } catch (e) {
      // sem permissões ou não suportado — seguimos com fallback
      server = null;
    }
    let clientConnections = 0;
    try {
      // APIs internas do driver; proteger com try/catch
      // @ts-ignore
      const topology = (client.mongoClient as any).topology ?? (client.mongoClient as any).s?.topology;
      // @ts-ignore
      const servers = topology?.s?.servers;
      if (servers && typeof servers.values === "function") {
        // @ts-ignore
        for (const srv of servers.values()) {
          // @ts-ignore
          const pool = srv?.s?.pool;
          // preferimos conexões em uso (checkedOut) quando disponível
          // @ts-ignore
          if (typeof pool?.checkedOut === "number") clientConnections += pool.checkedOut;
          // fallback para total do pool
          // @ts-ignore
          else if (typeof pool?.totalConnectionCount === "number") clientConnections += pool.totalConnectionCount;
        }
      }
    } catch (_) { /* silencioso */ }

    // se não conseguimos medir, mas o ping está ok, reportar 1 p/ não confundir
    if (!clientConnections && connected) clientConnections = 1;
    // 3) Extrair métricas (com fallbacks)
    const uptimeSeconds =
      (typeof server?.uptime === "number" && server.uptime) ??
      (typeof server?.uptimeMillis === "number" ? Math.round(server.uptimeMillis / 1000) : null);

    const opcounters = {
      insert: server?.opcounters?.insert ?? 0,
      query: server?.opcounters?.query ?? 0,
      update: server?.opcounters?.update ?? 0,
      delete: server?.opcounters?.delete ?? 0,
    };

    // Se serverStatus não veio, usamos 1 quando connected=true só para não exibir 0 enganoso
    const connectionsCurrentRaw = server?.connections?.current;
    const connectionsAvailableRaw = server?.connections?.available;
    const connections = {
      current: typeof connectionsCurrentRaw === "number" ? connectionsCurrentRaw : (connected ? 1 : 0),
      available: typeof connectionsAvailableRaw === "number" ? connectionsAvailableRaw : 0,
    };

    const insertsPerMin = getInsertsPerMin(deviceId);
    const insertsSeries = getInsertsSeries(deviceId); // 12 pontos (5s) -> 60s

    return res.json({
      connected,
      latencyMs,
      uptime: uptimeSeconds,
      host: server?.host ?? null,
      version: server?.version ?? null,
      opcional: {
        clientConnections,
        connections,
        opcounters,
        mem: {
          resident: server?.mem?.resident ?? null,
          virtual: server?.mem?.virtual ?? null,
        },
        // 👇 NOVO
        insertsPerMin,
        insertsSeries,
      },
    });


  } catch (err) {
    console.error(`Erro em GET /${req.params.deviceId}/mongodb/status:`, err);
    return res.status(500).json({ error: "Erro ao obter status do MongoDB" });
  }
});




dataRoutes.get("/host01/system-status", async (_, res) => {
  try {
    const status = await getSystemStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: "Erro ao obter status do sistema" });
  }
});

dataRoutes.get("/host01/network-latency", async (req, res) => {
  try {
    const result = await getNetworkLatency();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Erro ao obter latência de rede" });
  }
});

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

dataRoutes.get("/:deviceId/mongodb/cluster-panel", async (req, res) => {
  const { deviceId } = req.params;
  try {
    const client = clientManager.getClient(deviceId);
    if (!client || typeof client?.dbName !== "string" || typeof client?.mongoClient !== "object") {
      return res.status(404).json({ error: `Cliente '${deviceId}' não configurado.` });
    }

    const db = client.mongoClient.db(client.dbName);
    const admin = db.admin();

    // serverStatus pode exigir permissão → proteger
    let ss: any = null;
    try { ss = await admin.serverStatus(); } catch { }

    // Connections (fallback: ping ok → 1)
    let connections = 0;
    if (typeof ss?.connections?.current === "number") connections = ss.connections.current;
    else {
      try { const ok = await admin.ping(); if (ok?.ok === 1) connections = 1; } catch { }
    }

    // R/s e W/s (derivados de contadores cumulativos)
    const readsTotal = (ss?.opcounters?.query ?? 0) + (ss?.opcounters?.getmore ?? 0);
    const writesTotal = (ss?.opcounters?.insert ?? 0) + (ss?.opcounters?.update ?? 0) + (ss?.opcounters?.delete ?? 0);
    const readsPerSec = ratePerSec(`rps:${deviceId}`, readsTotal);
    const writesPerSec = ratePerSec(`wps:${deviceId}`, writesTotal);

    // Rede (bytes/s)
    const inB = ss?.network?.bytesIn ?? 0;
    const outB = ss?.network?.bytesOut ?? 0;
    const netInBps = ratePerSec(`netIn:${deviceId}`, inB);
    const netOutBps = ratePerSec(`netOut:${deviceId}`, outB);

    // Tamanhos (db atual — simples e suficiente)
    let dataSizeBytes = 0, indexSizeBytes = 0, storageSizeBytes = 0;
    try {
      const st = await db.stats({ scale: 1 });
      dataSizeBytes = st?.dataSize ?? 0;
      indexSizeBytes = st?.indexSize ?? 0;
      storageSizeBytes = st?.storageSize ?? 0;
    } catch { }

    // Limite do plano (opcional via env)
    // helpers de parse seguros
    const toNum = (v: unknown): number | null => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // aceita override por query (?planMaxMB=512 ou ?planMaxBytes=536870912)
    // e cai para a env ATLAS_PLAN_MAX_BYTES se nada vier na query
    const qMB = toNum((req.query as any)?.planMaxMB);     // em MB
    const qB = toNum((req.query as any)?.planMaxBytes);  // em bytes
    const envB = toNum(process.env.ATLAS_PLAN_MAX_BYTES);  // em bytes

    let planMaxBytes: number | null =
      qB ?? (qMB != null ? Math.round(qMB * 1024 * 1024) : envB);

    // saneamento: valores não positivos viram null
    if (planMaxBytes != null && planMaxBytes <= 0) {
      planMaxBytes = null;
    }

    // percentUsed só quando tivermos um limite válido
    const percentUsed: number | null =
      planMaxBytes != null
        ? +((dataSizeBytes / planMaxBytes) * 100).toFixed(1)
        : null;


    return res.json({
      connections,
      readsPerSec,
      writesPerSec,
      netInBps,
      netOutBps,
      dataSizeBytes,
      indexSizeBytes,
      storageSizeBytes,
      planMaxBytes,
      percentUsed,
    });
  } catch (err) {
    console.error(`Erro em GET /${deviceId}/mongodb/cluster-panel:`, err);
    return res.status(500).json({ error: "Erro ao obter cluster-panel" });
  }
});


dataRoutes.get("/teste", (req, res) => {
  console.log("🎯 Rota /teste ativa!");
  res.json({ status: "ok" });
});
