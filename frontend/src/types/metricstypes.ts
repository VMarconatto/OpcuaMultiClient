export type StatusLevel = "ok" | "warn" | "danger" | "unknown";

export interface NetworkMetrics {
  target: string;
  online: boolean;
  latencyMs: number | null;
  packetLossPct: number | null;
}

export type OpcUaSession = "connected" | "reconnecting" | "disconnected" | "unknown";

export interface OpcuaMetrics {
  sessionStatus: OpcUaSession;
  reconnectAttempts: number;
  subscriptions: number;
  monitoredItems: number;
  lastReadTs: string | null; // ISO 8601
}

export type MongoConn = "connected" | "connecting" | "disconnected" | "unknown";

export interface MongoMetrics {
  status: MongoConn;
  opsPerMin: number | null;
  writeLagMs: number | null;
  readLagMs: number | null;
  db: string;
}

export interface MetricsPayload {
  ts: string; // ISO 8601
  network: NetworkMetrics;
  opcua: OpcuaMetrics;
  mongo: MongoMetrics;
  sparkline?: {
    latencyMs?: number[];
    opsPerMin?: number[];
    ts: string[];
  };
}