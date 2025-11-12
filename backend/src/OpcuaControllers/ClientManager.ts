/**
** =======================================================
@SECTION : OPC UA Client Manager — Orquestração Multi‑Client
@FILE : ClientManager.ts
@PURPOSE : Gerenciar múltiplos clientes OPC UA, preparar MongoDB, mapear Tag↔NodeId e acionar alertas (sem alterar lógica).
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import { OpcuaClient } from "./Client.js";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { OPCUAClientOptions } from "node-opcua";
import { resolveSetupFilePath } from "../utils/SetupInitializer.js";

import fs from "fs";
import path from "path";

import { saveAlert } from "../services/alertsStorage.js";
import { sendEmailAlert } from "../services/emailService.js";

dotenv.config();
process.env.DEBUG = "mongodb";

/** Tipo de desvio usado na avaliação de limites. */
type Desvio = "LL" | "L" | "H" | "HH";

/** Estatísticas in‑memory por Tag (para deduplicação/envio). */
type TagStats = {
  count: number;
  lastValue: number;
  lastSentByDesvio: Partial<Record<Desvio, number>>;
};

/**
 * Orquestrador de {@link OpcuaClient} — mantém o registro de clientes, provê serviços
 * cruzados (Mongo, alertas, resolução de Tag por NodeId) e utilitários de navegação.
 */
export class ClientManager {
  /** Mapa de clientes registrados (id → OpcuaClient). */
  private clients: Map<string, OpcuaClient> = new Map();
  /** Resolve a promise quando qualquer Mongo conectar. */
  private mongoReadyResolve!: () => void;
  /** Promise aguardada por clientes que precisam de Mongo pronto. */
  private mongoReadyPromise: Promise<void>;

  constructor() {
    this.mongoReadyPromise = new Promise<void>((resolve) => {
      this.mongoReadyResolve = resolve;
    });
  }

  /**
   * Registra um novo cliente OPC UA.
   * @param id Identificador lógico (ex.: "Client01")
   * @param endpoint URL opc.tcp do servidor
   * @param mapMemory Lista crua de NodeIds
   * @param options Opções do SDK OPC UA
   * @param namespace Namespace padrão (default 3)
   */
  addClient(
    id: string,
    endpoint: string,
    mapMemory: string[] = [],
    options: OPCUAClientOptions = {},
    namespace: number = 3
  ) {
    if (this.clients.has(id)) {
      console.warn(`Cliente '${id}' já existe.`);
      return;
    }

    const client = new OpcuaClient(id, endpoint, options, mapMemory, namespace);
    this.clients.set(id, client);
  }

  /** Obtém um cliente pelo id (ou `undefined` se não existir). */
  getClient(id: string): OpcuaClient | undefined {
    return this.clients.get(id);
  }

  /**
   * Snapshot de status de todos os clientes (`getStatus`).
   * @returns Mapa id → status
   */
  getAllClients(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [id, client] of this.clients.entries()) {
      result[id] = client.getStatus();
    }
    return result;
  }

  /** Remove e desconecta um cliente. */
  removeClient(id: string) {
    const client = this.clients.get(id);
    if (client) {
      client.disconnect().then(() => {
        this.clients.delete(id);
        console.log(`Cliente ${id} removido.`);
      });
    }
  }

  /**
   * Retorna estatísticas de alertas de todos os clientes.
   * @returns Mapa id → stats
   */
  getAllAlertStats(): Record<string, any> {
    const allStats: Record<string, any> = {};
    for (const [id, client] of this.clients.entries()) {
      allStats[id] = client.getAlertStats();
    }
    return allStats;
  }

  /** Retorna estatísticas de alertas de um cliente específico. */
  getAlertStats(clientId: string): Record<string, any> {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Client ${clientId} não encontrado.`);
    return client.getAlertStats();
  }

  /**
   * Retorna o "nome da tag" (a chave do setup JSON) associada a um nodeId, para um client.
   * Estratégia atual: match por ÍNDICE (ordem do mapMemory) — normalizando NodeIds.
   * @param nodeId NodeId alvo (diversos formatos aceitos)
   * @param clientId Id lógico do cliente
   * @returns Nome canônico (ex.: "Tag_07") ou `undefined` se não encontrado
   */
  getTagNameByNodeId(nodeId: string, clientId: string): string | undefined {
    const client = this.clients.get(clientId);
    if (!client) return undefined;

    // normaliza nodeId (ignora ns=)
    const normalize = (id: string) => {
      const s = String(id).trim();
      const after = s.includes(";") ? s.slice(s.indexOf(";") + 1) : s;
      if (/^\d+$/.test(after)) return `i=${after}`;
      if (/^(i|s|b|g|o)=/i.test(after)) return after;
      return after;
    };

    const target = normalize(nodeId);
    const ns = Number.isFinite(Number((client as any).namespace)) ? Number((client as any).namespace) : 3;

    // índice no mapMemory
    const index = (client as any).mapMemory.findIndex((raw: string) => {
      const r = String(raw).trim();
      const variants = [r, `ns=${ns};${r}`, normalize(r), normalize(`ns=${ns};${r}`)];
      return variants.some(v => normalize(v) === target);
    });

    const setupPath = resolveSetupFilePath(clientId);

    try {
      const setupData = JSON.parse(fs.readFileSync(setupPath, "utf-8"));
      const tagNames = Array.isArray(setupData)
        ? setupData.map((_: any, i: number) => `Tag_${String(i + 1).padStart(2, "0")}`)
        : Object.keys(setupData);

      console.info(`[TagNameLookup] client=${clientId} nodeId=${target} idx=${index} mapMemoryLen=${(client as any).mapMemory?.length || 0} setupLen=${tagNames.length} path=${setupPath}`);

      if (index < 0) {
        console.warn(`[TagNameLookup] NOT FOUND in mapMemory -> '${nodeId}'`);
        return undefined;
      }
      const name = tagNames[index];
      if (!name) {
        console.warn(`[TagNameLookup] setup too short. need>=${index + 1} has=${tagNames.length}`);
      }
      return name;
    } catch (err) {
      console.error(`Erro ao ler setup '${setupPath}':`, err);
      return undefined;
    }
  }

  /**
   * Verifica limites para cada tag e:
   * - atualiza estatísticas (count/lastValue/lastSentByDesvio)
   * - grava alerta em JSON (saveAlert, com dedup)
   * - envia e-mail apenas quando houve novo registro
   * @param clientId Id do cliente
   * @param values Mapa TagName→valor (ou nodeId→valor)
   * @param setupData Conteúdo do setup JSON
   */
  checkAndSendAlerts(
    clientId: string,
    values: Record<string, number>,
    setupData: Record<string, any>
  ) {
    console.log("checkAndSendAlerts foi chamada");
    const now = Date.now();
    const DEDUP_MS = Number(process.env.ALERT_DEDUP_MS ?? 5 * 60 * 1000);

    const client = this.clients.get(clientId);
    if (!client) return;

    const stats: Record<string, TagStats> = client.getAlertStats();

    // helper: extrai nodeId de chaves como "Tag-ns=3;i=1057" ou usa a própria chave quando já for nodeId
    const extractNodeId = (raw: string): string | null => {
      if (typeof raw !== "string" || !raw) return null;
      if (raw.startsWith("Tag-")) return raw.slice(4); // "Tag-ns=3;i=1057" -> "ns=3;i=1057"
      if (/^ns=\d+;/.test(raw)) return raw;            // "ns=3;i=1057"
      if (/^\d+$/.test(raw)) return raw;               // "1057"
      if (/^(i|s|b|g|o)=/i.test(raw)) return raw;      // "i=1057", "s=MyVar", etc.
      return null;
    };

    for (const incomingKey in values) {
      const value = values[incomingKey];

      // 1) tenta direto (ex.: Tag_07 já bate com o setup)
      let canonicalKey = incomingKey;
      let config = setupData?.[canonicalKey];

      // 2) se não achou no setup, tenta resolver pelo nodeId → Tag_XX
      if (!config) {
        const maybeNodeId = extractNodeId(incomingKey);
        if (maybeNodeId) {
          try {
            const mapped = this.getTagNameByNodeId(maybeNodeId, clientId); // retorna "Tag_XX" se achar o índice
            if (mapped && setupData?.[mapped]) {
              canonicalKey = mapped;
              config = setupData[mapped];
            }
          } catch (e) {
            console.warn(`[${clientId}] Falha ao mapear '${incomingKey}' via getTagNameByNodeId:`, (e as any)?.message || e);
          }
        }
      }

      // 3) se ainda não achou, registra aviso e segue para a próxima
      if (!config) {
        console.warn(`[${clientId}] Tag '${incomingKey}' não encontrada no setupData`);
        continue;
      }

      // tenta várias chaves comuns para unidade
      const unidade: string =
        config?.unit ??
        config?.Unit ??
        config?.unidade ??
        config?.engineeringUnit ??
        config?.engUnit ??
        "";

      const { SPAlarmH, SPAlarmHH, SPAlarmL, SPAlarmLL } = config;

      let desvio: Desvio | null = null;
      if (SPAlarmHH !== undefined && value >= SPAlarmHH) desvio = "HH";
      else if (SPAlarmH !== undefined && value >= SPAlarmH) desvio = "H";
      else if (SPAlarmLL !== undefined && value <= SPAlarmLL) desvio = "LL";
      else if (SPAlarmL !== undefined && value <= SPAlarmL) desvio = "L";

      if (!desvio) continue;

      // estatísticas por chave CANÔNICA (Tag_XX), não pela chave de entrada
      const stat = stats[canonicalKey] || { count: 0, lastValue: 0, lastSentByDesvio: {} };
      stat.count++;
      stat.lastValue = value;

      const lastSent = stat.lastSentByDesvio[desvio] || 0;
      const elapsed = now - lastSent;

      if (lastSent === 0 || elapsed >= DEDUP_MS) {
        console.log(`Novo alerta para ${canonicalKey} — desvio: ${desvio}`);
        const saved = saveAlert({
          timestamp: new Date().toISOString(),
          alertData: {
            [canonicalKey]: value,
            AlertsCount: stat.count,
            Desvio: desvio,
            Unidade: unidade,
          },
          recipients: [process.env.ALERT_EMAIL_DESTINATION || "destinatario@exemplo.com"],
          clientId,
        });

        if (saved) {
          const valorFmt = `${value}${unidade ? ` ${unidade}` : ""}`;
          sendEmailAlert(
            `Alerta ${desvio}: ${canonicalKey} (${clientId})`,
            `O instrumento "${canonicalKey}" do dispositivo "${clientId}" saiu dos limites (${desvio}).\n` +
              `Ocorrências registradas: ${stat.count}\n` +
              `Último valor: ${valorFmt}\n` +
              `Timestamp: ${new Date().toLocaleString("pt-BR")}`
          );
          stat.lastSentByDesvio[desvio] = now;
        } else {
          console.log(`Ignorado no storage (janela ativa) para ${canonicalKey}/${desvio}`);
        }
      } else {
        console.log(`Ignorado por janela in-memory (${Math.round((DEDUP_MS - elapsed) / 1000)}s) para ${canonicalKey}/${desvio}`);
      }

      stats[canonicalKey] = stat;
    }
  }

  /** Aguarda até que algum cliente Mongo esteja conectado. */
  async waitForAnyMongoConnected() {
    await this.mongoReadyPromise;
  }

  /**
   * Prepara MongoDB (DB/coleções), cria cliente `MongoClient` e tenta conectar com retry/ping.
   * Define `dbName`/`collections` no {@link OpcuaClient} correspondente.
   * @param id Id lógico do cliente
   */
  async prepareMongoForClient(id: string) {
    const client = this.clients.get(id);
    if (!client) return;

    const clientIndex = [...this.clients.keys()].indexOf(id) + 1;
    client.dbName = `Client${String(clientIndex).padStart(2, "0")}`;
    client.collections = {
      transmiters: `${client.dbName}_Transmiters`,
      valves: `${client.dbName}_Valves`,
      motors: `${client.dbName}_Motors`,
    };

    const uri = process.env.connectionstring3;
    if (!uri) throw new Error("connectionstring3 não definida");

    client.mongoClient = new MongoClient(uri, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      socketTimeoutMS: 0,
      serverSelectionTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 0,
    });

    const attemptConnect = async () => {
      try {
        await Promise.race([
          client.mongoClient.connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout conexão MongoDB")), 30000)
          ),
        ]);

        await client.mongoClient.db("admin").command({ ping: 1 });

        const db = client.mongoClient.db(client.dbName);
        if (client.collections) {
          for (const collection of Object.values(client.collections)) {
            const exists = await db.listCollections({ name: collection }).hasNext();
            if (!exists) await db.createCollection(collection);
          }
        }

        client.mongoConnected = true;
        client.startMongoPing(60000);

        if (this.mongoReadyResolve) {
          this.mongoReadyResolve();
          this.mongoReadyResolve = null!;
        }
      } catch (err) {
        console.error(`[${client.dbName}] Erro ao conectar MongoDB:`, err);
        client.mongoConnected = false;
        setTimeout(attemptConnect, 5000);
      }
    };

    await attemptConnect();
  }

  /** Encaminha *browse* para o cliente. */
  async browse(clientId: string, nodeId?: string) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Client ${clientId} não encontrado.`);
    return await client.browse(nodeId || "RootFolder");
  }

  /** Encaminha *translatePaths* para o cliente. */
  async translatePaths(clientId: string, paths: string[]) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Client ${clientId} não encontrado.`);
    return await client.translatePaths(paths);
  }

  /** Atualiza NodeIds de polling de um cliente. */
  setPollingNodeIds(clientId: string, nodeIds: string[], intervalMs = 2000) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Client ${clientId} não encontrado.`);
    client.setPollingNodeIds(nodeIds, intervalMs);
  }

  /** Aplica novo `mapMemory` bruto a um cliente (recompõe NodeIds). */
  updateMapMemory(clientId: string, newMapMemory: string[], intervalMs = 2000) {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Client ${clientId} não encontrado.`);
    client.applyMapMemory(newMapMemory, intervalMs);
  }
}

/** Instância exportada (singleton) do orquestrador. */
export const clientManager = new ClientManager();
