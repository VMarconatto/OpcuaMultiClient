/**
** =======================================================
@SECTION : OPC UA Client — Coleta & Telemetria
@FILE : Client.ts
@PURPOSE : Gerenciar conexão OPC UA, leitura periódica, telemetria e integração com alertas/MongoDB (sem alterar lógica).
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import {
  OPCUAClient, OPCUAClientOptions, ClientSession, MessageSecurityMode, SecurityPolicy,
  AttributeIds, TimestampsToReturn, makeBrowsePath, NodeClass
} from "node-opcua";
import { ensureClientPKI } from "../utils/pkiUtils.js";
import { Device_WriteDB } from "../Repositories/Device01Crd.js";
import { clientManager } from "../OpcuaControllers/ClientManager.js";
import { getMBData } from "../aggregations/aggregations.js";
import path from "path";
import fs from "fs";
import { resolveNodeId } from "node-opcua";
import { resolveSetupFilePath, ensureSetupCount } from "../utils/SetupInitializer.js";

// --- MÉTRICAS OPC UA (in-memory buckets de 5s / janela 60s) ---
 type MetricsBucket = {
  ts: number;                 // início do bucket (epoch ms)
  reads: number;
  writes: number;
  notifications: number;      // total de "amostras" lidas (sucesso)
  good: number;
  bad: number;
  uncertain: number;
  latenciesMs: number[];      // latência por leitura (ms) desse bucket
  errors: number;
};

 type OpcuaMetricsSnapshot = {
  connected: boolean;
  endpointUrl: string;
  sessionState: "active" | "closed";
  security: { policy: string; mode: string };
  subscriptions: {
    count: number;
    monitoredItems: number;
    sampleIntervalAvgMs: number | null;
    keepAliveSec: number | null;
  };
  rates: {
    notificationsPerSec: number;
    readsPerSec: number;
    writesPerSec: number;
    eventsPerSec: number; // sempre 0 no modelo polling
  };
  quality: {
    goodPerSec: number;
    badPerSec: number;
    uncertainPerSec: number;
    badRatePct: number;
  };
  latency: {
    publishRoundTripMs: { p50: number | null; p95: number | null; max: number | null };
  };
  network: { bytesInBps: number | null; bytesOutBps: number | null };
  stability: {
    reconnectsLast10m: number;
    lastReconnectAt: string | null;
    queueOverflowLast5m: number;
    pendingWrites: number;
    pendingReads: number;
  };
  series60s: {
    notificationsPerSec: number[]; // 12 pontos (5s cada)
    badRatePct: number[];          // 12 pontos (0–100)
  };
};

/**
 * Cliente OPC UA multi‑client (polling) com snapshots de métricas e hooks de alertas/Mongo.
 * Mantém compatibilidade total: nenhuma assinatura/visibilidade foi alterada — apenas comentários.
 */
export class OpcuaClient {
  // --- MÉTRICAS (buckets de 5s) ---
  private metrics = {
    bucketSpanMs: 5000,
    horizonMs: 60000,
    buckets: [] as MetricsBucket[],
    lastReconnectAt: null as string | null,
    reconnectsTimestamps: [] as number[],
  };
  /** Cache de *browse* (path → nodeId). */
  private browseCache = new Map<string, string>();

  /**
   * Garante que exista um bucket corrente e remove buckets fora da janela.
   * @param {number} [now=Date.now()] Timestamp de referência (ms)
   * @returns {MetricsBucket} Bucket atual
   */
  private ensureCurrentBucket(now = Date.now()): MetricsBucket {
    const span = this.metrics.bucketSpanMs;
    const bucketStart = now - (now % span);
    const buckets = this.metrics.buckets;
    const last = buckets[buckets.length - 1];
    if (!last || last.ts !== bucketStart) {
      // cria bucket(s) faltantes
      if (!last || bucketStart > last.ts) {
        // empurra buckets vazios até o current
        let ts = last ? last.ts + span : bucketStart;
        while (ts < bucketStart) {
          buckets.push({ ts, reads: 0, writes: 0, notifications: 0, good: 0, bad: 0, uncertain: 0, latenciesMs: [], errors: 0 });
          ts += span;
        }
      }
      const newBucket: MetricsBucket = { ts: bucketStart, reads: 0, writes: 0, notifications: 0, good: 0, bad: 0, uncertain: 0, latenciesMs: [], errors: 0 };
      buckets.push(newBucket);
    }
    // descarta buckets fora da janela (60s)
    const cutoff = now - this.metrics.horizonMs;
    while (this.metrics.buckets.length && this.metrics.buckets[0].ts < cutoff) {
      this.metrics.buckets.shift();
    }
    return this.metrics.buckets[this.metrics.buckets.length - 1];
  }

  /**
   * Agrega métricas dos últimos `windowMs`.
   * @param {number} [windowMs=60000] Janela em ms (padrão 60s)
   */
  private summarize(windowMs = 60000) {
    const now = Date.now();
    const cutoff = now - windowMs;
    let reads = 0, writes = 0, notifications = 0, good = 0, bad = 0, uncertain = 0, errors = 0;
    let allLat: number[] = [];
    for (const b of this.metrics.buckets) {
      if (b.ts >= cutoff) {
        reads += b.reads; writes += b.writes; notifications += b.notifications;
        good += b.good; bad += b.bad; uncertain += b.uncertain; errors += b.errors;
        allLat = allLat.concat(b.latenciesMs);
      }
    }
    const secs = windowMs / 1000;
    const readsPerSec = reads / secs;
    const writesPerSec = writes / secs;
    const notificationsPerSec = notifications / secs;

    // p50/p95/max
    let p50: number | null = null, p95: number | null = null, max: number | null = null;
    if (allLat.length) {
      allLat.sort((a, b) => a - b);
      const q = (p: number) => allLat[Math.max(0, Math.min(allLat.length - 1, Math.floor(p * (allLat.length - 1))))];
      p50 = q(0.5); p95 = q(0.95); max = allLat[allLat.length - 1];
    }
    const totalQ = good + bad + uncertain;
    const badRatePct = totalQ > 0 ? (bad / totalQ) * 100 : 0;

    return {
      readsPerSec, writesPerSec, notificationsPerSec,
      goodPerSec: good / secs, badPerSec: bad / secs, uncertainPerSec: uncertain / secs,
      badRatePct, p50, p95, max,
    };
  }

  /** Identificador lógico do cliente (ex.: "Client01"). */
  private clientId: string;
  /** Instância do cliente OPC UA. */
  private client: OPCUAClient;
  /** Sessão OPC UA ativa (quando conectada). */
  private session: ClientSession | null = null;
  /** *Flag* de conexão. */
  private connected = false;
  /** Estatísticas de alertas por tag. */
  private alertStats: Record<string, any> = {};
  /** Endpoint OPC UA. */
  private endpoint: string;
  /** Timer de *auto-read*. */
  private autoReadInterval: NodeJS.Timeout | null = null;
  /** Lista de NodeIds (forma crua) para *polling*. */
  private mapMemory: string[];
  /** Namespace padrão para composição de NodeIds. */
  private namespace: number = 3
  /** Quantidade de NodeIds ativos em *polling*. */
  private activeNodeIdsCount = 0
  /** Cliente MongoDB associado (injetado pelo ClientManager). */
  mongoClient: any;
  /** *Flag* de conexão MongoDB. */
  mongoConnected: boolean = false;

  /** Estado público (exposto via `getStatus`). */
  private opcuaStatus = {
    connected: false,
    lastSessionCreated: null as null | string,
    lastReadTimestamp: null as null | string,
    lastLatencyMs: null as null | number,
    sessionDurationMs: null as null | number,
    readCount: 0,
    readFailures: {} as Record<string, number>,
    lastError: null as null | string,
    sessionStartedAt: null as null | number,
  };

  /** Nome do banco e coleções alocadas (definidas pelo ClientManager). */
  dbName?: string;
  collections?: {
    transmiters: string;
    valves: string;
    motors: string;
  };

  /**
   * Construtor do cliente OPC UA.
   * @param {string} clientId Identificador lógico do cliente (ex.: "Client01")
   * @param {string} endpoint URL opc.tcp do servidor
   * @param {OPCUAClientOptions} [options] Opções do SDK OPC UA
   * @param {string[]} [mapMemory=[]] Lista crua de NodeIds para polling
   * @param {number} [namespace=3] Namespace padrão para compor NodeIds
   */
  constructor(clientId: string, endpoint: string, options: OPCUAClientOptions = {}, mapMemory: string[] = [], namespace?: number) {
    this.clientId = clientId;
    this.endpoint = endpoint;
    this.mapMemory = mapMemory;
    this.namespace = namespace ?? 3
    this.client = OPCUAClient.create({
      ...options,
      securityMode: MessageSecurityMode.SignAndEncrypt,
      securityPolicy: SecurityPolicy.Basic256Sha256,
      endpointMustExist: false,
    });
  }

  /**
   * Inicializa PKI e recria o cliente com certificados/URIs corretos.
   * @param {string} applicationUri URI lógica da aplicação
   */
  async initialize(applicationUri: string): Promise<void> {
    const { certFile, keyFile } = await ensureClientPKI(applicationUri, this.endpoint);

    const appName = `OpcuaClient-${applicationUri}`;
    const appUri = `urn:device01_opc_tcp___Avell_53530_OPCUA_SimulationServer`;

    this.client = OPCUAClient.create({
      applicationName: appName,
      applicationUri: appUri,
      certificateFile: certFile,
      privateKeyFile: keyFile,
      securityMode: MessageSecurityMode.SignAndEncrypt,
      securityPolicy: SecurityPolicy.Basic256Sha256,
      endpointMustExist: false,
    });

    console.log(`OPCUAClient inicializado para ${this.endpoint} com applicationUri ${appUri}`);
  }

  /**
   * Conecta, cria sessão e inicia auto‑read (se houver `mapMemory`).
   * Aguarda `waitForAnyMongoConnected()` antes de iniciar.
   */
  async connect(): Promise<void> {
    try {
      await clientManager.waitForAnyMongoConnected();

      await this.client.connect(this.endpoint);
      this.session = await this.client.createSession();
      try {
        // eventos de estabilidade (no-op se não existirem)
        // @ts-ignore
        this.client.on?.("backoff", () => {
          this.metrics.reconnectsTimestamps.push(Date.now());
        });
        // @ts-ignore
        this.client.on?.("after_reconnection", () => {
          this.metrics.lastReconnectAt = new Date().toISOString();
          this.metrics.reconnectsTimestamps.push(Date.now());
        });
      } catch { }
      this.connected = true;
      console.log(`🔌 Conectado ao servidor OPC UA em ${this.endpoint}`);

      this.opcuaStatus.connected = true;
      this.opcuaStatus.lastSessionCreated = new Date().toISOString();
      this.opcuaStatus.sessionStartedAt = Date.now();
      this.opcuaStatus.readCount = 0;
      this.opcuaStatus.readFailures = {};
      this.opcuaStatus.lastError = null;

      if (this.mapMemory.length > 0) {
        const mappedNodeIds = this.mapMemory.map((id) => this.composeNodeId(id));
        this.startAutoRead(mappedNodeIds, 2000);
      } else {
        console.warn(`Nenhum nodeId definido para leitura em ${this.endpoint}`);
      }

    } catch (err) {
      console.error(`Erro ao conectar em ${this.endpoint}:`, err);
      this.connected = false;
      this.opcuaStatus.connected = false;
      this.opcuaStatus.lastError = String(err);
    }
  }

  /**
   * Encerra auto‑read, fecha a sessão e desconecta do endpoint.
   */
  async disconnect(): Promise<void> {
    if (this.autoReadInterval) {
      clearInterval(this.autoReadInterval);
      this.autoReadInterval = null;
    }
    this.activeNodeIdsCount = 0;
    if (this.connected && this.session) {
      await this.session.close();
      await this.client.disconnect();
      this.connected = false;
      this.opcuaStatus.connected = false;
      this.opcuaStatus.sessionDurationMs = Date.now() - (this.opcuaStatus.sessionStartedAt ?? Date.now());
      this.opcuaStatus.sessionStartedAt = null;
      console.log(`Desconectado de ${this.endpoint}`);
    }
  }

  /**
   * Lê valores dos `nodeIds` informados, atualiza métricas e (quando habilitado) aciona alertas.
   * Mantida a lógica original de tratamento e logs.
   * @param {string[]} nodeIds Lista de NodeIds normalizados (ns=…)
   */
  private async readVariables(nodeIds: string[]): Promise<void> {
    if (!this.connected || !this.session) {
      console.warn(`Cliente não está conectado ou sessão inexistente para ${this.endpoint}`);
      return;
    }

    if (!this.mongoConnected) {
      console.warn(`MongoDB não conectado para ${this.dbName}. Coleta OPC UA suspensa.`);
      return;
    }

    console.log(`[${this.endpoint}] NodeIds recebidos para leitura:`, nodeIds);

    try {
      const bucket = this.ensureCurrentBucket();
      const dataValues: any[] = [];
      const startReadTime = Date.now();

      for (const nodeId of nodeIds) {
        const t0 = Date.now();
        try {
          const dv = await this.session.read(
            { nodeId, attributeId: AttributeIds.Value },
            TimestampsToReturn.Both
          );
          const v = dv.value?.value;

          const num = typeof v === "number" ? v : Number(v);
          dataValues.push(Number.isFinite(num) ? num : null);

          // classificação de qualidade pelo status code (sem enums)
          const scName = String(dv.statusCode?.name || "");
          if (scName.includes("Bad")) bucket.bad += 1;
          else if (scName.includes("Uncertain")) bucket.uncertain += 1;
          else bucket.good += 1;

          bucket.reads += 1;
          bucket.notifications += 1; // 1 leitura bem-sucedida = 1 "amostra"
          bucket.latenciesMs.push(Date.now() - t0);

          this.opcuaStatus.readCount += 1;
        } catch (readErr) {
          bucket.errors += 1;
          this.opcuaStatus.readFailures[nodeId] =
            (this.opcuaStatus.readFailures[nodeId] || 0) + 1;
          this.opcuaStatus.lastError = String(readErr);
        }
      }

      this.opcuaStatus.lastReadTimestamp = new Date().toISOString();
      this.opcuaStatus.lastLatencyMs = Date.now() - startReadTime;

      // Gravação em Mongo mantida comentada (como no original)
      // await Device_WriteDB(dataValues, this.clientId);
      // console.log(`[${this.clientId}] Dados gravados no MongoDB via Device_WriteDB`);

      // ── ALERTAS ─────────────────────────────────────────────────────────────
      if (dataValues.length > 0 && this.dbName) {
        const transmitterValues: Record<string, number> = {};
        // Carrega setup com resolver unificado + garante crescimento por length do mapMemory
        const setupPath = resolveSetupFilePath(this.clientId);

        let setupDataObj: Record<string, any> = {};
        try {
          // podem existir setups legados em array — normalizamos para objeto Tag_XX
          const raw = JSON.parse(fs.readFileSync(setupPath, "utf-8"));
          if (Array.isArray(raw)) {
            raw.forEach((entry: any, i: number) => {
              const tagName = `Tag_${String(i + 1).padStart(2, "0")}`;
              setupDataObj[tagName] = entry ?? {};
            });
          } else if (raw && typeof raw === "object") {
            setupDataObj = raw;
          }
        } catch (err) {
          console.error(`[${this.clientId}] Erro ao carregar setupJSON para alertas:`, err);
          setupDataObj = {};
        }

        // Se o setup estiver curto, cresce AGORA para casar com o mapMemory
        const desiredCount = this.mapMemory.length;
        const currentCount = Object.keys(setupDataObj).length;
        if (desiredCount > currentCount) {
          for (let i = currentCount; i < desiredCount; i++) {
            const tagName = `Tag_${String(i + 1).padStart(2, "0")}`;
            if (!(tagName in setupDataObj)) {
              setupDataObj[tagName] = {
                "mínimo": 0,
                "máximo": 0,
                "unidade": "",
                "SPAlarmL": 0,
                "SPAlarmLL": 0,
                "SPAlarmH": 0,
                "SPAlarmHH": 0
              };
            }
          }
          try {
            fs.writeFileSync(setupPath, JSON.stringify(setupDataObj, null, 2), "utf-8");
            console.info(`[AutoGrowSetup] client=${this.clientId} from=${currentCount} to=${desiredCount} path=${setupPath}`);
          } catch (e) {
            console.warn(`[AutoGrowSetup] Falha ao persistir crescimento do setup:`, (e as any)?.message || e);
          }
        }

        // Mantém a variável com o nome original esperado abaixo:
        const setupData: any = setupDataObj;

        // Import dinâmico evita ciclo Client.ts <-> ClientManager.ts
        const { clientManager } = await import("./ClientManager.js");

        // Monta { tagName: value } a partir de mapMemory + dados lidos
        for (let index = 0; index < this.mapMemory.length; index++) {
          const nodeIdFromMap = this.mapMemory[index];
          const rawValue = dataValues[index];

          if (typeof rawValue !== "number" || !Number.isFinite(rawValue)) {
            continue; // ignora leituras inválidas
          }
          const tagNameByIndex = `Tag_${String(index + 1).padStart(2, "0")}`;
          // resolve nome do tag por nodeId; se não achar, cai no setup por índice
          const resolvedName =
            (await clientManager.getTagNameByNodeId(nodeIdFromMap, this.clientId)) ||
            tagNameByIndex;

          transmitterValues[resolvedName] = rawValue;
        }

        console.log(`[${this.clientId}] Chamando checkAndSendAlerts com`, transmitterValues);
        await clientManager.checkAndSendAlerts(this.clientId, transmitterValues, setupData);
        console.log(`[${this.clientId}] Finalizou checkAndSendAlerts`);
      }
      // ────────────────────────────────────────────────────────────────────────

    } catch (err) {
      console.error(`Erro geral ao ler variáveis em ${this.endpoint}:`, err);
      this.opcuaStatus.lastError = String(err);
    }
  }

  /**
   * Inicia ou reinicia o laço de leitura periódica (polling).
   * @param {string[]} nodeIds NodeIds para leitura
   * @param {number} intervalMs Intervalo em ms
   */
  startAutoRead(nodeIds: string[], intervalMs: number): void {
    console.log(`[${this.endpoint}] Monitored items (autoRead) = ${this.activeNodeIdsCount}`);
    if (this.autoReadInterval) {
      clearInterval(this.autoReadInterval);
    }
    console.log(`[${this.endpoint}] Iniciando leitura automática a cada ${intervalMs}ms para NodeIds:`, nodeIds);
    this.activeNodeIdsCount = nodeIds.length;
    this.autoReadInterval = setInterval(() => {
      this.readVariables(nodeIds);
    }, intervalMs);
  }

  /** Retorna estado resumido do cliente OPC UA (para UI/health). */
  getStatus(): Record<string, any> {
    return this.opcuaStatus;
  }

  /** Estatísticas in‑memory de alertas por tag. */
  getAlertStats(): Record<string, any> {
    return this.alertStats;
  }

  /** Lista crua de NodeIds configurados para polling. */
  public getMapMemory(): string[] {
    return this.mapMemory;
  }

  /**
   * Encapsula `getMBData` para o client atual (verifica pré‑requisitos de Mongo).
   * @returns {Promise<any[]|null>} Resultado da agregação ou `null` se faltarem configs
   */
  public async getAggregatedData(
    month: number,
    year: number,
    firstDay = 1,
    endDay = 31
  ): Promise<any[] | null> {
    if (!this.mongoClient || !this.dbName || !this.collections?.transmiters) {
      console.warn(`[${this.clientId}] Não é possível fazer agregação: informações de Mongo incompletas.`);
      return null;
    }

    console.log(`[${this.clientId}] Chamando getMBData internamente`);
    return await getMBData(
      this.mongoClient,
      this.dbName,
      this.collections.transmiters,
      month,
      year,
      firstDay,
      endDay
    );
  }

  /**
   * Envia `ping` periódico ao MongoDB do cliente para manter a conexão ativa.
   * @param {number} [intervalMs=60000] Intervalo entre pings (ms)
   */
  startMongoPing(intervalMs: number = 60000) {
    if (!this.mongoClient) return;
    console.log(`[${this.dbName}] Iniciando ping periódico MongoDB a cada ${intervalMs / 1000}s`);
    setInterval(async () => {
      try {
        await this.mongoClient.db(this.dbName).command({ ping: 1 });
        console.log(`[${this.dbName}] Ping MongoDB bem-sucedido`);
      } catch (err) {
        console.error(`[${this.dbName}] Erro no ping MongoDB:`, err);
      }
    }, intervalMs);
  }

  /**
   * Snapshot compacto (~60s) de métricas de estabilidade/qualidade/latência.
   * Ideal para dashboards.
   */
  public getOpcuaMetricsStatus(): OpcuaMetricsSnapshot {
    const now = Date.now();
    this.ensureCurrentBucket(now);
    const sum = this.summarize(60000);

    // séries (12 pontos de 5s)
    const points = 12;
    const recent = this.metrics.buckets.slice(-points);
    const notificationsPerSecSeries = recent.map(b => b.notifications / (this.metrics.bucketSpanMs / 1000));
    const badPctSeries = recent.map(b => {
      const tot = b.good + b.bad + b.uncertain;
      return tot > 0 ? (b.bad / tot) * 100 : 0;
    });

    // estabilidade nos últimos 10m
    const tenMinAgo = now - 10 * 60 * 1000;
    const reconnectsLast10m = this.metrics.reconnectsTimestamps.filter(t => t >= tenMinAgo).length;

    return {
      connected: this.connected,
      endpointUrl: this.endpoint,
      sessionState: this.connected && this.session ? "active" : "closed",
      security: { policy: "Basic256Sha256", mode: "SignAndEncrypt" },
      subscriptions: {
        count: 0,
        monitoredItems: this.activeNodeIdsCount || (this.mapMemory?.length || 0),
        sampleIntervalAvgMs: this.autoReadInterval ? 2000 : null, // seu intervalo atual
        keepAliveSec: null
      },
      rates: {
        notificationsPerSec: Number(sum.notificationsPerSec.toFixed(2)),
        readsPerSec: Number(sum.readsPerSec.toFixed(2)),
        writesPerSec: Number(sum.writesPerSec.toFixed(2)),
        eventsPerSec: 0
      },
      quality: {
        goodPerSec: Number(sum.goodPerSec.toFixed(2)),
        badPerSec: Number(sum.badPerSec.toFixed(2)),
        uncertainPerSec: Number(sum.uncertainPerSec.toFixed(2)),
        badRatePct: Number(sum.badRatePct.toFixed(2))
      },
      latency: {
        publishRoundTripMs: {
          p50: sum.p50 ? Math.round(sum.p50) : null,
          p95: sum.p95 ? Math.round(sum.p95) : null,
          max: sum.max ? Math.round(sum.max) : null
        }
      },
      network: { bytesInBps: null, bytesOutBps: null }, // não disponível no polling
      stability: {
        reconnectsLast10m,
        lastReconnectAt: this.metrics.lastReconnectAt,
        queueOverflowLast5m: 0,
        pendingWrites: 0,
        pendingReads: 0
      },
      series60s: {
        notificationsPerSec: notificationsPerSecSeries,
        badRatePct: badPctSeries
      }
    };
  }

  /**
   * Série temporal recente (buckets de 5s) para gráficos.
   * @param {number} [windowSec=60] Janela de consulta, em segundos.
   */
  public getOpcuaTelemetry(windowSec = 60) {
    const ms = Math.max(5, windowSec) * 1000;
    this.ensureCurrentBucket(Date.now());
    const buckets = this.metrics.buckets.filter(b => b.ts >= Date.now() - ms);
    return {
      bucketSpanSec: this.metrics.bucketSpanMs / 1000,
      points: buckets.map(b => ({
        t: b.ts,
        notificationsPerSec: b.notifications / (this.metrics.bucketSpanMs / 1000),
        badRatePct: (b.good + b.bad + b.uncertain) > 0 ? (b.bad / (b.good + b.bad + b.uncertain)) * 100 : 0,
        reads: b.reads,
        errors: b.errors,
        p95ReadLatencyMs: b.latenciesMs.length ? b.latenciesMs.sort((a, b) => a - b)[Math.floor(0.95 * (b.latenciesMs.length - 1))] : null
      }))
    };
  }

  /**
   * Executa *browse* no servidor a partir de um `nodeId` (padrão: RootFolder).
   * @param {string} [nodeId="RootFolder"] Raiz de navegação
   */
  public async browse(nodeId: string = "RootFolder"): Promise<Array<{
    nodeId: string;
    browseName: string;
    displayName: string;
    nodeClass: string;
  }>> {
    if (!this.connected || !this.session) {
      throw new Error("Sessão OPC UA indisponível para browse (client não conectado).");
    }

    // Helper para higienizar strings vindas do SDK
    const clean = (v: any): string => {
      const s =
        typeof v === "string"
          ? v
          : v?.text ?? v?.name ?? v?.toString?.() ?? "";
      return s && s !== "<null>" ? String(s) : "";
    };

    // Use um BrowseDescriptionLike completo e FORCE o resultMask (63 = tudo)
    const desc = {
      nodeId,                 // string NodeIdLike
      // referenceTypeId: "HierarchicalReferences", // opcional
      // browseDirection: 0,                         // Forward
      includeSubtypes: true,
      nodeClassMask: 0,
      resultMask: 63,         // <- essencial p/ obter displayName/browseName/nodeId/etc.
    };

    const result = await (this.session as any).browse(desc);
    let refs = (result as any)?.references ?? [];

    // Fallback: alguns servidores não listam filhos em RootFolder
    if ((!refs || refs.length === 0) && nodeId === "RootFolder") {
      const r2 = await (this.session as any).browse({
        nodeId: "ObjectsFolder",
        includeSubtypes: true,
        nodeClassMask: 0,
        resultMask: 63,
      });
      refs = (r2 as any)?.references ?? [];
    }

    return (refs as any[]).map((ref: any) => {
      const dn = clean(ref.displayName);
      const bn = clean(ref.browseName);
      return {
        nodeId: ref.nodeId?.toString?.() ?? "",
        browseName: bn,
        displayName: dn || bn || "", // fallback: sempre tente mostrar algo útil
        nodeClass: NodeClass[ref.nodeClass] ?? String(ref.nodeClass),
      };
    });
  }

  /**
   * Traduz caminhos (ex.: "Objects/2:MyDevice/2:MyVar") para NodeIds via `translateBrowsePath`.
   * @param {string[]} paths Lista de caminhos relativos a RootFolder
   */
  public async translatePaths(paths: string[]): Promise<string[]> {
    if (!this.connected || !this.session) {
      throw new Error("Sessão OPC UA indisponível para translate.");
    }

    const browsePaths = paths.map((p) => makeBrowsePath("RootFolder", p));

    // Retorno pode ser objeto único ou array => normalizamos para array
    const raw = await (this.session as any).translateBrowsePath(browsePaths as any);
    const results = Array.isArray(raw) ? raw : [raw];

    const resolved: string[] = [];

    for (let i = 0; i < results.length; i++) {
      const r: any = results[i];
      const nodeId =
        r?.targets?.length
          ? r.targets[0]?.targetId?.toString?.() ?? ""
          : "";

      if (nodeId) this.browseCache.set(paths[i], nodeId);
      resolved.push(nodeId);
    }

    return resolved;
  }

  /**
   * Atualiza a lista de NodeIds normalizados para o polling (reinicia timer).
   */
  public setPollingNodeIds(nodeIds: string[], intervalMs = 2000): void {
    if (!Array.isArray(nodeIds) || nodeIds.length === 0) {
      console.warn(`[${this.clientId}] setPollingNodeIds chamado sem NodeIds; mantendo estado atual.`);
      return;
    }
    if (this.autoReadInterval) {
      clearInterval(this.autoReadInterval);
      this.autoReadInterval = null;
    }
    this.startAutoRead(nodeIds, intervalMs);
  }

  /**
   * Substitui o `mapMemory` bruto e recompõe NodeIds com o namespace atual.
   */
  public applyMapMemory(newMapMemory: string[], intervalMs = 2000) {
    this.mapMemory = newMapMemory;
    const composed = newMapMemory.map((id) => this.composeNodeId(id));
    this.setPollingNodeIds(composed, intervalMs);
  }

  /**
   * Normaliza/completa um NodeId aplicando o *namespace* padrão.
   * @param {string} raw NodeId em forma livre ("1057", "i=1057", "ns=2;i=1057", etc.)
   * @returns {string} NodeId completo (com ns=)
   */
  private composeNodeId(raw: string): string {
    const s = String(raw).trim();
    if (/^ns=\d+;/.test(s)) return s.replace(/^ns=\d+;/, `ns=${this.namespace};`);
    if (/^(i|s|b|g|o)=/.test(s)) return `ns=${this.namespace};${s}`;
    if (/^\d+$/.test(s)) return `ns=${this.namespace};i=${s}`;
    return `ns=${this.namespace};${s}`;
  }
}
