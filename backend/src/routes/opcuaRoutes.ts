/**
** =======================================================
@SECTION : OPC UA Routes (Core)
@FILE : opcuaRoutes.ts
@PURPOSE : Criar/remover clientes, consultar status/telemetria e reiniciar conexões.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import { Router } from "express";
import { clientManager } from "../OpcuaControllers/ClientManager.js";

export const opcuaRoutes = Router();

/**
 * POST /opcua/connect
 * Cria um novo cliente OPC UA a partir de { id, endpoint, config }.
 */
opcuaRoutes.post("/opcua/connect", (req, res) => {
  const { id, endpoint, config } = req.body;

  if (!id || !endpoint) {
    return res.status(400).json({ error: "ID e endpoint são obrigatórios" });
  }

  try {
    clientManager.addClient(
      id,
      endpoint,
      config?.mapMemory || [],
      config?.opcuaOptions || {},
      config?.namespace
    );
    res.json({ success: true, message: `Cliente ${id} criado com sucesso.` });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMessage });
  }
});

/**
 * GET /opcua/clients
 * Lista todos os clientes em memória.
 */
opcuaRoutes.get("/opcua/clients", (_req, res) => {
  const clients = clientManager.getAllClients();
  res.json(clients);
});

/**
 * GET /opcua/status
 * Retorna o status de todos os clientes (forma compacta).
 */
opcuaRoutes.get("/opcua/status", (_req, res) => {
  const clients = clientManager.getAllClients();
  const statuses = Object.entries(clients).map(([id, client]) => ({
    id,
    status: client.getStatus()
  }));
  res.json(statuses);
});

/**
 * GET /opcua/status/:id
 * Retorna o status de um cliente específico.
 */
opcuaRoutes.get("/opcua/status/:id", (req, res) => {
  const client = clientManager.getClient(req.params.id);

  if (!client) {
    return res.status(404).json({ error: `Cliente ${req.params.id} não encontrado` });
  }

  res.json(client.getStatus());
});

/**
 * POST /opcua/reconnect/:id
 * Solicita reconexão do cliente (se método estiver disponível).
 */
opcuaRoutes.post("/opcua/reconnect/:id", (req, res) => {
  const client = clientManager.getClient(req.params.id);

  if (!client) {
    return res.status(404).json({ error: `Cliente ${req.params.id} não encontrado` });
  }

  if (typeof client.connect === "function") {
    client.connect();
    res.json({ success: true, message: `Cliente ${req.params.id} reiniciado com sucesso.` });
  } else {
    res.status(500).json({ error: "Método reconnect não implementado neste cliente." });
  }
});

/**
 * DELETE /opcua/:id
 * Remove e desconecta um cliente específico.
 */
opcuaRoutes.delete("/opcua/:id", (req, res) => {
  try {
    clientManager.removeClient(req.params.id);
    res.json({ success: true, message: `Cliente ${req.params.id} removido com sucesso.` });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: errorMessage });
  }
});

// -------------------------------------------------------
// Compatibilidade com deviceId do frontend
// device01 -> Client01, device02 -> Client02 ...
// -------------------------------------------------------

/** Converte "deviceNN" para "ClientNN" (ou retorna o original se já estiver no formato esperado). */
function toClientId(deviceId: string) {
  const m = deviceId.match(/device(\d+)/i);
  if (!m) return deviceId; // fallback: usa como veio
  const n = Number(m[1]);
  return `Client${String(n).padStart(2, "0")}`;
}

// -------------------------------------------------------
// ALIASES LEGADOS — mantêm compatibilidade com frontend antigo
// -------------------------------------------------------

/**
 * GET /opcua/telemetry/:id
 * Espelha `/:deviceId/opcua/telemetry` utilizando id já no formato do ClientManager.
 */
opcuaRoutes.get("/opcua/telemetry/:id", (req, res) => {
  const id = req.params.id;
  const windowSec = Math.max(30, Math.min(3600, Number(req.query.windowSec) || 300));
  const client = clientManager.getClient(id);
  if (!client) return res.status(404).json({ error: `Client ${id} não encontrado.` });
  if (typeof (client as any).getOpcuaTelemetry !== "function") {
    return res.status(500).json({ error: "Telemetry OPCUA não habilitada neste cliente." });
  }
  return res.json((client as any).getOpcuaTelemetry(windowSec));
});

/**
 * GET /opcua/metrics/:id
 * Espelha `getOpcuaMetricsStatus()` do cliente para compatibilidade.
 */
opcuaRoutes.get("/opcua/metrics/:id", (req, res) => {
  const id = req.params.id;
  const client = clientManager.getClient(id);
  if (!client) return res.status(404).json({ error: `Client ${id} não encontrado.` });
  if (typeof (client as any).getOpcuaMetricsStatus !== "function") {
    return res.status(500).json({ error: "Métricas OPCUA não habilitadas neste cliente." });
  }
  return res.json((client as any).getOpcuaMetricsStatus());
});

// -------------------------------------------------------
// Rotas novas compatíveis com /:deviceId (...)
// -------------------------------------------------------

/**
 * GET /:deviceId/opcua/status
 * Snapshot (KPI instantâneo + séries curtas ~60s) do cliente correspondente.
 */
opcuaRoutes.get("/:deviceId/opcua/status", (req, res) => {
  const clientId = toClientId(req.params.deviceId);
  const client = clientManager.getClient(clientId);
  if (!client) {
    return res.status(404).json({ error: `Client ${clientId} não encontrado.` });
  }
  if (typeof (client as any).getOpcuaMetricsStatus !== "function") {
    return res.status(500).json({ error: "Métricas OPCUA não habilitadas neste cliente." });
  }
  const snapshot = (client as any).getOpcuaMetricsStatus();
  return res.json(snapshot);
});

/**
 * GET /:deviceId/opcua/telemetry
 * Séries de telemetria com janela configurável (30s–3600s).
 */
opcuaRoutes.get("/:deviceId/opcua/telemetry", (req, res) => {
  const clientId = toClientId(req.params.deviceId);
  const windowSec = Math.max(30, Math.min(3600, Number(req.query.windowSec) || 300));
  const client = clientManager.getClient(clientId);
  if (!client) {
    return res.status(404).json({ error: `Client ${clientId} não encontrado.` });
  }
  if (typeof (client as any).getOpcuaTelemetry !== "function") {
    return res.status(500).json({ error: "Telemetry OPCUA não habilitada neste cliente." });
  }
  const telem = (client as any).getOpcuaTelemetry(windowSec);
  return res.json(telem);
});

export { };
