/**
** =======================================================
@SECTION : Host Monitor — Sistema & Rede
@FILE : HostMonitor.ts
@PURPOSE : Coletar métricas do host (CPU, memória, disco, rede, processo) em janelas de tempo fixas, expondo snapshot e série temporal.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import si from "systeminformation";
import pidusage from "pidusage";
import { monitorEventLoopDelay } from "perf_hooks";
import * as os from "node:os";       // era: require("os")
import { Socket } from "node:net";    // era: require("net")

/**
 * Estrutura com o estado atual do host medido pela coleta.
 * - Campos retornam valores já normalizados (ex.: GB, %, ms) quando aplicável.
 */
export type HostSnapshot = {
  /** Timestamp ISO (UTC) do momento da amostra. */
  timestamp: string;
  /** Uso de CPU agregado e por núcleo (0–1), e carga (load average) quando disponível. */
  cpu: { pct: number; perCore: number[]; load?: { one?: number; five?: number; fifteen?: number } };
  /** Uso de memória (fração 0–1) e tamanhos em GB; inclui swap quando disponível. */
  mem: { usedPct: number; totalGB: number; freeGB: number; swapGB?: { total: number; used: number } };
  /** Tabelas de disco por ponto de montagem, com uso e tamanhos em GB. */
  disk: Array<{ mount: string; usedPct: number; freeGB: number; sizeGB: number }>;
  /** Métricas de rede: latência (hosts relevantes) e throughput agregado desde última amostra. */
  net: {
    latencyMs: { opcua?: number; mongodb?: number };
    throughput: { rxKbps: number; txKbps: number };
    errors?: { in?: number; out?: number };
  };
  /** Métricas do processo Node atual. */
  process: { cpuPct: number; rssMB: number; eventLoopLagMs: number };
  /** Dados estáticos/dinâmicos do sistema operacional. */
  system: { uptimeSec: number; host: string; platform: string; arch: string };
};

/** Ponto de telemetria reduzido para série temporal. */
 type Point = { t: string } & Pick<HostSnapshot, "cpu" | "mem" | "disk" | "net" | "process">;

/**
 * Agregador de telemetria do host com buckets fixos.
 *
 * Responsabilidades:
 * - Agendar coletas periódicas (bucketSpanSec) e manter janela deslizante (windowSec).
 * - Fornecer **snapshot** do último ponto e **telemetry** (série) para dashboards.
 * - Medir latência de rede via ICMP e fallback TCP (porta 443).
 *
 * Somente comentários JSDoc foram adicionados; **nenhuma** lógica foi alterada.
 */
export class HostMonitor {
  /** Tamanho do bucket em segundos (ex.: 5s). */
  private bucketSpanSec: number;
  /** Quantidade máxima de pontos na janela (windowSec / bucketSpanSec). */
  private maxPoints: number;
  /** Timer do setInterval. */
  private timer?: NodeJS.Timeout;
  /** Medidor do lag do event loop (perf_hooks). */
  private elDelay = monitorEventLoopDelay({ resolution: 10 });
  /** Última leitura de bytes Rx/Tx (para calcular throughput). */
  private lastNet?: { rx: number; tx: number; ts: number };
  /** Série temporal de pontos reduzidos. */
  private points: Point[] = [];

  /**
   * @param bucketSpanSec Duração do bucket (segundos). Default: 5
   * @param windowSec Janela temporal total (segundos). Default: 300 (5 min)
   */
  constructor(bucketSpanSec = 5, windowSec = 300) {
    this.bucketSpanSec = bucketSpanSec;
    this.maxPoints = Math.ceil(windowSec / bucketSpanSec);
    this.elDelay.enable();
  }

  /**
   * Inicia a coleta periódica.
   * @param opcuaHost Hostname/IP do servidor OPC UA (para latência opcional).
   * @param mongoHost Hostname/IP do servidor MongoDB (para latência opcional).
   */
  start(opcuaHost?: string, mongoHost?: string) {
    const tick = async () => {
      const snap = await this.collect(opcuaHost, mongoHost);
      const pt: Point = { t: snap.timestamp, cpu: snap.cpu, mem: snap.mem, disk: snap.disk, net: snap.net, process: snap.process };
      this.points.push(pt);
      if (this.points.length > this.maxPoints) this.points.shift();
    };
    // executa imediatamente e agenda
    tick().catch(() => { /* silencioso por design */ });
    this.timer = setInterval(() => void tick(), this.bucketSpanSec * 1000);
  }

  /** Interrompe o timer e desabilita o medidor de lag. */
  stop() {
    if (this.timer) clearInterval(this.timer);
    this.elDelay.disable();
  }

  /**
   * Retorna o último snapshot completo (ou `null` se ainda não houver pontos).
   */
  getSnapshot(): HostSnapshot | null {
    const last = this.points[this.points.length - 1];
    if (!last) return null;
    return {
      timestamp: last.t,
      cpu: last.cpu,
      mem: last.mem,
      disk: last.disk,
      net: last.net,
      process: last.process,
      system: this.buildSystemSync()
    };
  }

  /**
   * Retorna a série temporal reduzida para gráficos.
   * @returns `{ bucketSpanSec, points }`
   */
  getTelemetry() {
    return { bucketSpanSec: this.bucketSpanSec, points: this.points };
  }

  /** Snapshot síncrono de informações do SO/host. */
  private buildSystemSync() {
    return {
      uptimeSec: os.uptime(),
      host: os.hostname(),
      platform: process.platform,
      arch: process.arch,
    };
  }

  /**
   * Executa a coleta de uma amostra completa.
   * @param opcuaHost Hostname/IP do servidor OPC UA (para latência opcional)
   * @param mongoHost Hostname/IP do servidor MongoDB (para latência opcional)
   */
  private async collect(opcuaHost?: string, mongoHost?: string): Promise<HostSnapshot> {
    const now = Date.now();
    const ts = new Date(now).toISOString();

    // CPU — carga atual agregada e por core
    const cpuLoad = await si.currentLoad();
    const perCore = cpuLoad.cpus?.map((c) => c.load / 100) ?? [];
    const cpuPct = (cpuLoad.currentLoad || 0) / 100;

    // Memória — total/disp/uso (GB e fração)
    const mem = await si.mem();
    const totalGB = mem.total / 1e9;
    const freeGB = mem.available / 1e9;
    const usedPct = totalGB > 0 ? (1 - freeGB / totalGB) : 0;

    // Disco — por filesystem/ponto de montagem
    const fs = await si.fsSize();
    const disk = fs.map(d => {
      const sizeGB = d.size / 1e9;
      const usedPct = sizeGB > 0 ? d.used / d.size : 0;
      const freeGB = (d.size - d.used) / 1e9;
      return { mount: d.mount || d.fs, usedPct, freeGB, sizeGB };
    });

    // Rede — throughput via delta de bytes entre chamadas
    const netStats = await si.networkStats();
    const agg = netStats.reduce((acc, n) => { acc.rx += n.rx_bytes; acc.tx += n.tx_bytes; return acc; }, { rx: 0, tx: 0 });
    let rxKbps = 0, txKbps = 0;
    if (this.lastNet) {
      const dt = (now - this.lastNet.ts) / 1000;
      if (dt > 0) {
        rxKbps = (agg.rx - this.lastNet.rx) * 8 / 1000 / dt;
        txKbps = (agg.tx - this.lastNet.tx) * 8 / 1000 / dt;
      }
    }
    this.lastNet = { rx: agg.rx, tx: agg.tx, ts: now };

    // Latência — ICMP com fallback TCP:443
    const latencyMs: Record<string, number | undefined> = {};
    if (opcuaHost) latencyMs.opcua = await this.latency(opcuaHost).catch(() => undefined);
    if (mongoHost) latencyMs.mongodb = await this.latency(mongoHost).catch(() => undefined);

    // Processo Node — CPU, RSS e lag de event loop
    const proc = await pidusage(process.pid);
    const eventLoopLagMs = this.elDelay.mean / 1e6; // ns → ms

    return {
      timestamp: ts,
      cpu: { pct: cpuPct, perCore, load: { one: cpuLoad.avgLoad } },
      mem: { usedPct, totalGB, freeGB, swapGB: mem.swaptotal ? { total: mem.swaptotal / 1e9, used: mem.swapused / 1e9 } : undefined },
      disk,
      net: { latencyMs: latencyMs as any, throughput: { rxKbps, txKbps } },
      process: { cpuPct: (proc.cpu || 0) / 100, rssMB: (proc.memory || 0) / 1e6, eventLoopLagMs },
      system: this.buildSystemSync()
    };
  }

  /**
   * Mede latência até um host por ICMP (`systeminformation.inetLatency`) ou TCP:443 (fallback).
   * @param host Hostname ou IP de destino
   * @returns Latência em milissegundos
   */
  private async latency(host: string): Promise<number> {
    // ICMP primeiro
    try {
      const v = await si.inetLatency(host);
      if (typeof v === "number" && v >= 0) return v;
    } catch { /* ignora e cai no fallback */ }

    // Fallback TCP (443)
    const port = 443;
    return new Promise<number>((resolve, reject) => {
      const s = new Socket();
      const start = Date.now();
      s.setTimeout(1500);
      s.once("connect", () => { const ms = Date.now() - start; s.destroy(); resolve(ms); });
      s.once("timeout", () => { s.destroy(); reject(new Error("timeout")); });
      s.once("error", (e) => { s.destroy(); reject(e); });
      s.connect(port, host);
    });
  }
}
