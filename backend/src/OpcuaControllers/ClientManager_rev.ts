import { OpcuaClient } from "./Client.js";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import { OPCUAClientOptions } from "node-opcua";
import fs from "fs";
import path from "path";
import { saveAlert } from "../services/alertsStorage.js";
import { sendEmailAlert } from "../services/emailService.js";

dotenv.config();
process.env.DEBUG = "mongodb";

export class ClientManager {
  private clients: Map<string, OpcuaClient> = new Map();
  private mongoReadyResolve!: () => void;
  private mongoReadyPromise: Promise<void>;

  constructor() {
    this.mongoReadyPromise = new Promise<void>((resolve) => {
      this.mongoReadyResolve = resolve;
    });
  }

  addClient(id: string, endpoint: string, mapMemory: string[] = [], options: OPCUAClientOptions = {}) {
    if (this.clients.has(id)) {
      console.warn(`⚠️ Cliente '${id}' já existe.`);
      return;
    }

    const client = new OpcuaClient(id, endpoint, options, mapMemory)
    this.clients.set(id, client);
  }

  getClient(id: string): OpcuaClient | undefined {
    return this.clients.get(id);
  }

  getAllClients(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [id, client] of this.clients.entries()) {
      result[id] = client.getStatus();
    }
    return result;
  }

  removeClient(id: string) {
    const client = this.clients.get(id);
    if (client) {
      client.disconnect().then(() => {
        this.clients.delete(id);
        console.log(`🗑️ Cliente ${id} removido.`);
      });
    }
  }

  getAllAlertStats(): Record<string, any> {
    const allStats: Record<string, any> = {};
    for (const [id, client] of this.clients.entries()) {
      allStats[id] = client.getAlertStats();
    }
    return allStats;
  }

  getAlertStats(clientId: string): Record<string, any> {
    const client = this.clients.get(clientId);
    if (!client) throw new Error(`Client ${clientId} não encontrado.`);
    return client.getAlertStats();
  }

  getTagNameByNodeId(nodeId: string, clientId: string): string | undefined {
    const client = this.clients.get(clientId);
    const mapMemory = client?.getMapMemory?.();
    if (!mapMemory) {
      console.warn(`⚠️ Cliente '${clientId}' sem mapMemory.`);
      return undefined;
    }

    const index = mapMemory.indexOf(nodeId);
    if (index === -1) return undefined;

    const setupFileName = clientId === "Client01"
      ? "setuptsconfig.json"
      : `${clientId}_setuptsconfig.json`;
    const setupPath = path.resolve("./setups", setupFileName);

    if (!fs.existsSync(setupPath)) return undefined;

    try {
      const setupData = JSON.parse(fs.readFileSync(setupPath, "utf-8"));
      const tagNames = Object.keys(setupData);
      return tagNames[index];
    } catch (err) {
      console.error(`Erro ao ler setup '${setupFileName}':`, err);
      return undefined;
    }
  }

  async checkAndSendAlerts(clientId: string, values: Record<string, number>) {
    const now = Date.now();
    const client = this.clients.get(clientId);
    if (!client) return;

    const stats = client.getAlertStats();
    const setupFile = clientId === "Client01"
      ? "setuptsconfig.json"
      : `${clientId}_setuptsconfig.json`;
    const setupPath = path.resolve("./setups", setupFile);

    if (!fs.existsSync(setupPath)) return;

    let setupData: any;
    try {
      setupData = JSON.parse(fs.readFileSync(setupPath, "utf-8"));
    } catch (err) {
      console.error("Erro lendo setup:", err);
      return;
    }

    for (const tag in values) {
      const value = values[tag];
      const config = setupData[tag];
      if (!config) continue;

      const { SPAlarmH, SPAlarmHH, SPAlarmL, SPAlarmLL } = config;
      const outOfRange =
        (SPAlarmHH !== undefined && value >= SPAlarmHH) ||
        (SPAlarmH !== undefined && value >= SPAlarmH) ||
        (SPAlarmLL !== undefined && value <= SPAlarmLL) ||
        (SPAlarmL !== undefined && value <= SPAlarmL);

      if (outOfRange) {
        const stat = stats[tag] || { count: 0, lastSent: 0, lastValue: 0 };
        stat.count++;
        stat.lastValue = value;

        const elapsed = now - stat.lastSent;
        if (stat.lastSent === 0 || elapsed >= 10 * 60 * 1000) {
          console.log('entrou na condição para chamar saveAlert')
          await saveAlert({
            timestamp: new Date().toISOString(),
            alertData: { [tag]: value, AlertsCount: stat.count },
            recipients: [process.env.ALERT_EMAIL_DESTINATION || "destinatario@exemplo.com"],
            clientId
          });


          await sendEmailAlert(
            `🚨 Alerta: ${tag} (${clientId})`,
            `O instrumento \\"${tag}\\" do dispositivo \\"${clientId}\\" saiu dos limites ${stat.count} vezes.\nÚltimo valor registrado: ${value}`
          );

          stat.lastSent = now;
        }

        stats[tag] = stat;
      }
    }
  }

  async waitForAnyMongoConnected() {
    await this.mongoReadyPromise;
  }

  async prepareMongoForClient(id: string) {
    const client = this.clients.get(id);
    if (!client) return;

    const clientIndex = [...this.clients.keys()].indexOf(id) + 1;
    client.dbName = `Client${String(clientIndex).padStart(2, "0")}`;
    client.collections = {
      transmiters: `${client.dbName}_Transmiters`,
      valves: `${client.dbName}_Valves`,
      motors: `${client.dbName}_Motors`
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
      maxIdleTimeMS: 0
    });

    const attemptConnect = async () => {
      try {
        await Promise.race([
          client.mongoClient.connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Timeout conexão MongoDB")), 30000)
          )
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
}

export const clientManager = new ClientManager();
