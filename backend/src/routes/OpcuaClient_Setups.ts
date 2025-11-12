/**
** =======================================================
@SECTION : OPC UA Client Setups Routes
@FILE : OpcuaClient_Setups.ts
@PURPOSE : Rotas para consultar/alterar configurações de clientes OPC UA,
navegar (browse), traduzir caminhos (translate) e gerir polling.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import { Router } from "express";
import fs from "fs";
import path from "path";
import { createSetupFileIfMissing, ensureSetupCount, resolveSetupFilePath } from "../utils/SetupInitializer.js";

import { clientManager } from "../OpcuaControllers/ClientManager.js";
const fsp = fs.promises;

const OpcuaSetupRouter = Router();
const opcuaConfigFilePath = path.join(process.cwd(), "opcuaClientConfig.json");
console.log(`[OPCUA SETUP ROUTES] usando opcuaConfigFilePath = ${path.resolve(opcuaConfigFilePath)}`);

/**
 * GET /opcuaclientsetup/:deviceId
 * Retorna a configuração do cliente (conforme arquivo JSON).
 */
OpcuaSetupRouter.get("/opcuaclientsetup/:deviceId", (req, res) => {
  const { deviceId } = req.params;
  if (!deviceId) {
    return res.status(400).json({ error: "Parâmetro deviceId é obrigatório." });
  }
  try {
    const rawConfig = fs.readFileSync(opcuaConfigFilePath, "utf-8");
    const fullConfig = JSON.parse(rawConfig);
    const clientConfig = fullConfig.clients?.[deviceId];
    if (!clientConfig) {
      return res.status(404).json({ error: `Client '${deviceId}' não encontrado.` });
    }
    // retorna namespace (se ausente, cliente usa fallback 3)
    res.json(clientConfig);
  } catch (err) {
    console.error("Erro ao buscar client individual:", err);
    res.status(500).json({ error: "Erro ao ler configurações." });
  }
});

/**
 * GET /opcuaclientsetup
 * Retorna o mapa { clients } completo do JSON.
 */
OpcuaSetupRouter.get("/opcuaclientsetup", (_req, res) => {
  try {
    const rawConfig = fs.readFileSync(opcuaConfigFilePath, "utf-8");
    const fullConfig = JSON.parse(rawConfig);
    res.json({ clients: fullConfig.clients || {} });
  } catch (err) {
    console.error("Erro ao ler configurações OPC UA:", err);
    res.status(500).json({ error: "Erro ao ler arquivo de configuração" });
  }
});

/**
 * GET /opcuaclient/status/:deviceId
 * Snapshot do estado de conexão do cliente (connected: boolean).
 */
OpcuaSetupRouter.get("/opcuaclient/status/:deviceId", (req, res) => {
  const { deviceId } = req.params;
  const client: any = clientManager.getClient(deviceId);
  if (!client) {
    return res.status(404).json({ error: `Client '${deviceId}' não encontrado.` });
  }
  const connected = client?.opcuaStatus?.connected ?? client?.connected ?? false;
  res.json({ connected });
});

/**
 * POST /opcuaclient/:deviceId/start
 * Solicita conexão do cliente (se ainda não conectado).
 */
OpcuaSetupRouter.post("/opcuaclient/:deviceId/start", async (req, res) => {
  const { deviceId } = req.params;
  const client: any = clientManager.getClient(deviceId);
  if (!client) {
    return res.status(404).json({ error: `Client '${deviceId}' não encontrado.` });
  }
  try {
    const already = client?.opcuaStatus?.connected ?? client?.connected;
    if (already) return res.json({ ok: true, connected: true });
    await client.connect();
    return res.json({ ok: true, connected: true });
  } catch (err) {
    console.error(`[start] Erro ao conectar '${deviceId}':`, err);
    return res.status(500).json({ error: "Falha ao iniciar comunicação." });
  }
});

/**
 * POST /opcuaclient/:deviceId/stop
 * Solicita desconexão do cliente (se estiver conectado).
 */
OpcuaSetupRouter.post("/opcuaclient/:deviceId/stop", async (req, res) => {
  const { deviceId } = req.params;
  const client: any = clientManager.getClient(deviceId);
  if (!client) {
    return res.status(404).json({ error: `Client '${deviceId}' não encontrado.` });
  }
  try {
    const already = client?.opcuaStatus?.connected ?? client?.connected;
    if (!already) return res.json({ ok: true, connected: false });
    await client.disconnect();
    return res.json({ ok: true, connected: false });
  } catch (err) {
    console.error(`[stop] Erro ao desconectar '${deviceId}':`, err);
    return res.status(500).json({ error: "Falha ao parar comunicação." });
  }
});

/**
 * GET /opcuaclient/browse/:deviceId?nodeId=RootFolder
 * Navegação do address space do servidor OPC UA.
 */
OpcuaSetupRouter.get("/opcuaclient/browse/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const nodeId =
    typeof req.query.nodeId === "string" && req.query.nodeId.trim().length > 0
      ? req.query.nodeId
      : "RootFolder";

  try {
    const client: any = clientManager.getClient(deviceId);
    if (!client) {
      return res
        .status(404)
        .json({ error: `Client '${deviceId}' não encontrado.` });
    }

    const items =
      typeof (clientManager as any).browse === "function"
        ? await (clientManager as any).browse(deviceId, nodeId)
        : await client.browse(nodeId);

    // items no formato: [{ nodeId, browseName, displayName, nodeClass }, ...]
    return res.json(items);
  } catch (err) {
    console.error(
      `[browse] Erro ao navegar '${deviceId}' em '${nodeId}':`,
      err
    );
    return res.status(500).json({ error: "Falha no browse OPC UA." });
  }
});

/**
 * POST /opcuaclient/translate/:deviceId
 * body: { paths: string[] }
 * Traduz caminhos textuais para NodeIds.
 */
OpcuaSetupRouter.post("/opcuaclient/translate/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const { paths } = req.body || {};
  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: "Body deve conter { paths: string[] }." });
  }
  try {
    const client: any = clientManager.getClient(deviceId);
    if (!client) return res.status(404).json({ error: `Client '${deviceId}' não encontrado.` });

    const nodeIds =
      typeof (clientManager as any).translatePaths === "function"
        ? await (clientManager as any).translatePaths(deviceId, paths)
        : await client.translatePaths(paths);

    return res.json({ nodeIds });
  } catch (err) {
    console.error(`[translate] Erro ao traduzir paths para '${deviceId}':`, err);
    return res.status(500).json({ error: "Falha ao traduzir paths." });
  }
});

/**
 * POST /opcuaclient/polling/:deviceId
 * body: { nodeIds: string[], intervalMs?: number }
 * Define/atualiza NodeIds sob polling periódico.
 */
OpcuaSetupRouter.post("/opcuaclient/polling/:deviceId", async (req, res) => {
  const { deviceId } = req.params;
  const { nodeIds, intervalMs } = req.body || {};
  if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
    return res.status(400).json({ error: "Body deve conter { nodeIds: string[] }." });
  }
  try {
    const client: any = clientManager.getClient(deviceId);
    if (!client) return res.status(404).json({ error: `Client '${deviceId}' não encontrado.` });

    if (typeof (clientManager as any).setPollingNodeIds === "function") {
      (clientManager as any).setPollingNodeIds(deviceId, nodeIds, Number(intervalMs) || 2000);
    } else {
      client.setPollingNodeIds(nodeIds, Number(intervalMs) || 2000);
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error(`[polling] Erro ao aplicar polling em '${deviceId}':`, err);
    return res.status(500).json({ error: "Falha ao iniciar/reiniciar polling." });
  }
});

/**
 * POST /opcuaclientsetup
 * Salva/atualiza a configuração de um client no JSON e sincroniza o setup analógico.
 */
OpcuaSetupRouter.post("/opcuaclientsetup", (req, res) => {
  const incomingData = req.body;
  const { deviceId, ...clientConfig } = incomingData || {};

  if (!deviceId || !Array.isArray(clientConfig?.mapMemory)) {
    return res.status(400).json({ error: "deviceId e mapMemory (string[]) são obrigatórios." });
  }

  // normaliza namespace (default 3)
  if (clientConfig.namespace === undefined || clientConfig.namespace === null) {
    clientConfig.namespace = 3;
  } else {
    clientConfig.namespace = Number(clientConfig.namespace) || 0;
  }

  // carrega config atual do mesmo caminho que os GETs usam
  let fullConfig: any = { clients: {} };
  if (fs.existsSync(opcuaConfigFilePath)) {
    try {
      const raw = fs.readFileSync(opcuaConfigFilePath, "utf-8");
      fullConfig = JSON.parse(raw);
      if (!fullConfig || typeof fullConfig !== "object") fullConfig = { clients: {} };
      if (!fullConfig.clients) fullConfig.clients = {};
    } catch {
      fullConfig = { clients: {} };
    }
  }

  // merge preservando chaves antigas do client
  const prev = fullConfig.clients[deviceId] || {};
  const nextClient = {
    ...prev,
    ...clientConfig,
    mapMemory: Array.isArray(clientConfig.mapMemory) ? clientConfig.mapMemory : (prev.mapMemory || []),
  };
  if (prev.tagPaths && !("tagPaths" in clientConfig)) {
    (nextClient as any).tagPaths = prev.tagPaths;
  }

  fullConfig.clients[deviceId] = nextClient;

  // persiste config
  fs.writeFile(opcuaConfigFilePath, JSON.stringify(fullConfig, null, 2), (err) => {
    if (err) {
      console.error(`Erro ao salvar ${opcuaConfigFilePath}:`, err);
      return res.status(500).json({ error: "Erro ao salvar configuração OPC UA" });
    }

    console.log(`Conexão salva para ${deviceId} em opcuaClientConfig.json`);

    // cria o setup se não existir (util unificado)
    createSetupFileIfMissing(deviceId, nextClient.mapMemory);

    // Logs BEFORE/AFTER + garantir que o setup tenha a mesma quantidade do mapMemory
    try {
      const setupPath = resolveSetupFilePath(deviceId);
      let beforeLen = 0;
      try {
        const beforeObj = JSON.parse(fs.readFileSync(setupPath, "utf-8"));
        beforeLen = Object.keys(beforeObj || {}).length;
      } catch {}
      console.info(`[POST/setup] BEFORE items=${beforeLen} mapMemory=${nextClient.mapMemory.length} path=${setupPath}`);

      ensureSetupCount(deviceId, nextClient.mapMemory.length);

      const afterObj = JSON.parse(fs.readFileSync(setupPath, "utf-8"));
      const afterLen = Object.keys(afterObj || {}).length;
      console.info(`[POST/setup] AFTER  items=${afterLen} path=${setupPath}`);
    } catch (e) {
      console.warn(`[${deviceId}] Falha ao ajustar/inspecionar quantidade no setup:`, (e as any)?.message || e);
    }

    // atualiza o mapMemory do cliente em memória (e reinicia polling)
    try {
      const client: any = clientManager.getClient(deviceId);
      if (client) {
        if (typeof (clientManager as any).updateMapMemory === "function") {
          (clientManager as any).updateMapMemory(deviceId, nextClient.mapMemory, 2000);
        } else {
          (client as any).mapMemory = nextClient.mapMemory;
          const ns = Number.isFinite(Number(client?.namespace))
            ? Number(client.namespace)
            : Number(clientConfig.namespace) || 3;
          const composeForNs = (raw: string) => {
            const s = String(raw).trim();
            if (/^ns=\d+;/.test(s)) return s.replace(/^ns=\d+;/, `ns=${ns};`);
            if (/^(i|s|b|g|o)=/i.test(s)) return `ns=${ns};${s}`;
            if (/^\d+$/.test(s)) return `ns=${ns};i=${s}`;
            return `ns=${ns};${s}`;
          };
          const nodeIds = nextClient.mapMemory.map(composeForNs);
          client.setPollingNodeIds(nodeIds, 2000);
        }
      }
    } catch (e) {
      console.warn(`[${deviceId}] Aviso ao aplicar updateMapMemory:`, (e as any)?.message || e);
    }

    return res.json({ message: `Configuração OPC UA e setup analógico salvos para ${deviceId}`, client: nextClient });
  });
});

export default OpcuaSetupRouter;
