/**
** =======================================================
@SECTION  : App Metrics — Infra & Telemetry Overview
@FILE     : src/pages/AppMetrics/AppMetrics.tsx
@PURPOSE  : Painel de métricas de infraestrutura: MongoDB, Cluster, OPC UA,
            Host e HTTP (Morgan). Busca dados no backend multi-client e
            agrega/normaliza números para os cards — sem alterar lógica.
@LAST_EDIT : 2025-12-05
** =======================================================
*/

import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { normalizeMetricPercent } from "../../utils/normalizeMetrics";
import mongoIcon from "../../assets/free-mongo-db-9294853-7577996.webp";
import clusterIcon from "../../assets/rede-de-banco-de-dados-removebg-preview.png";
import opcuaIcon from "../../assets/newcsm_OPC_Organizer_UA_1000x750px_2fcfbefa93-removebg-preview-removebg-preview.png";
import hostIcon from "../../assets/newbase-de-dados-removebg-preview-removebg-preview.png";
import httpIcon from "../../assets/http-removebg-preview.png";

// ** Styled **
import { Container, BoxesRow, FullSpan } from "./styled";

// ** Componentes **
import { useDevice } from "../../components/DeviceContext/DeviceContext";
import MongoDBBox from "../../components/MongoBox";
import ClientPicker from "../../components/ClientPicker";
import OPCUABox from "../../components/OpcuaBox";
import ClusterPanelBox from "../../components/Cluster/index";
import HostMetricsBox from "../../components/HostMetrics/HostMetricsBox";
import MorganMetricsBox from "../../components/MorganMetrics/MorganMetricsBox";

/** Estado da sessão OPC UA. */
type SessionState = "active" | "reconnecting" | "closed";

/**
 * Estrutura de status do OPC UA retornada pelo backend.
 * - Os campos opcionais permitem compatibilidade com diferentes versões.
 */
type OpcuaStatus = {
  connected: boolean;
  endpointUrl: string;
  sessionState: SessionState;
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
    eventsPerSec: number;
  };
  quality: {
    goodPerSec: number;
    badPerSec: number;
    uncertainPerSec: number;
    badRatePct: number;
  };
  latency: {
    publishRoundTripMs: {
      p50: number | null;
      p95: number | null;
      max: number | null;
    };
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
    /** 12 pontos (janelas de 5s) */
    notificationsPerSec: number[];
    /** 12 pontos (0–100) */
    badRatePct: number[];
  };
};

/** Série agregada de telemetria OPC UA (janela de tempo). */
type OpcuaTelemetry = {
  bucketSpanSec: number;
  points: Array<{
    t: number;
    notificationsPerSec: number;
    badRatePct: number;
    reads: number;
    errors: number;
    p95ReadLatencyMs: number | null;
  }>;
};

/** Registro de alertas enviados pelo sistema. */
type AlertEntry = {
  timestamp: string;
  alertData: Record<string, any>;
  recipients: string[];
  clientId?: string;
};

/**
 * Componente principal de métricas da aplicação.
 *
 * ### Responsabilidades
 * - Gerenciar client ativo (contexto) e resolver `ClientXX`.
 * - Coletar métricas de MongoDB, Cluster, OPC UA, Host e Morgan HTTP.
 * - Normalizar valores para cartões/medidores visuais.
 * - Disponibilizar status/telemetria OPC UA aos componentes filhos.
 *
 * @returns {JSX.Element} Painel com boxes de métricas e telemetria.
 */
const AppMetrics: React.FC = () => {
  /** Client atual do contexto global (ex.: "device01"/"Client01"). */
  const { deviceId, setDeviceId } = useDevice();

  /**
   * Converte ids iniciados por "device" para "Client" (compat. de rotas do backend).
   * @returns {string} Identificador normalizado (ex.: "Client01") ou string vazia.
   */
  const resolvedDeviceId = useMemo((): string => {
    if (!deviceId) return "";
    return deviceId.startsWith("device")
      ? deviceId.replace("device", "Client")
      : deviceId;
  }, [deviceId]);

  /** Status resumido do MongoDB (latência, uptime, conexões, etc.). */
  const [mongoStatus, setMongoStatus] = useState<{
    connected: boolean;
    latencyMs: number | null;
    host?: string;
    version?: string;
    uptime?: number;
    opcional?: {
      clientConnections?: number;
      opcounters?: {
        insert?: number;
        query?: number;
        update?: number;
        delete?: number;
      };
      connections?: { current?: number; available?: number };
      mem?: { resident?: number; virtual?: number };
      insertsPerMin?: number;
      insertsSeries?: number[];
    };
  } | null>(null);

  /** Estado OPC UA (curto prazo) e telemetria (janelas de 60–300s). */
  const [opcuaStatus, setOpcuaStatus] = useState<OpcuaStatus | null>(null);
  const [opcuaTelemetry, setOpcuaTelemetry] = useState<OpcuaTelemetry | null>(
    null
  );

  /** Base padrão de API do backend. */
  const API_BASE = "http://localhost:3000";

  /** Alertas já enviados (para painéis de auditoria/controle). */
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  /** Flags de carregamento e erros para a área de alertas. */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Deriva dados para o card do MongoDB.
   * - Usa `normalizeMetricPercent` para gerar percentuais visuais.
   *
   * @returns {Array<{key:string, name:string, amount:number, percent:number, color:string}>}
   *          Série agregada para `MongoDBBox`.
   */
  const mongoChartData = useMemo(() => {
    if (!mongoStatus || !mongoStatus.opcional) return [];

    // Normaliza opcounters: sempre números
    const rawOps = mongoStatus.opcional.opcounters ?? {};
    const opcounters = {
      insert: rawOps.insert ?? 0,
      query: rawOps.query ?? 0,
      update: rawOps.update ?? 0,
      delete: rawOps.delete ?? 0,
    };

    const insertsPerMin = mongoStatus.opcional.insertsPerMin ?? 0;

    const clientConns =
      typeof mongoStatus.opcional.clientConnections === "number"
        ? mongoStatus.opcional.clientConnections
        : mongoStatus.connected
        ? 1
        : 0;

    const latencyMs = mongoStatus.latencyMs ?? 0;
    const uptimeH = mongoStatus.uptime
      ? +(mongoStatus.uptime / 3600).toFixed(1)
      : 0;

    const EXPECTED_CAP_PER_MIN = 600;
    const updates = opcounters.update;
    const totalOps = opcounters.insert + updates;

    return [
      {
        key: "connections" as const,
        name: "Active Connections",
        amount: clientConns,
        percent: normalizeMetricPercent(clientConns, 10),
        color: "#1890ff",
      },
      {
        key: "latency" as const,
        name: "Latency (ms)",
        amount: latencyMs,
        percent: normalizeMetricPercent(latencyMs, 1000),
        color: "#ffc53d",
      },
      {
        key: "uptime" as const,
        name: "Uptime (h)",
        amount: uptimeH,
        percent: normalizeMetricPercent(
          Number(mongoStatus.uptime ?? 0),
          604800
        ),
        color: "#73d13d",
      },
      {
        key: "inserts" as const,
        name: "Inserts/min",
        amount: Math.max(0, Math.round(insertsPerMin)),
        percent: normalizeMetricPercent(insertsPerMin, EXPECTED_CAP_PER_MIN),
        color: "#36cfc9",
      },
      {
        key: "updates" as const,
        name: "Updates",
        amount: updates,
        percent: totalOps > 0 ? Math.round((updates / totalOps) * 100) : 0,
        color: "#9254de",
      },
    ];
  }, [mongoStatus]);
  /**
   * Efeito: busca status do MongoDB para o client atual.
   * - GET `/{ClientXX}/mongodb/status`
   * - Atualiza `mongoStatus` e, por consequência, `mongoChartData`.
   */
  useEffect(() => {
    if (!resolvedDeviceId) {
      setMongoStatus(null);
      return;
    }

    let timer: any;
    let cancelled = false;

    const fetchMongoStatus = async () => {
      try {
        const { data } = await axios.get(
          `${API_BASE}/${resolvedDeviceId}/mongodb/status`,
          { withCredentials: true }
        );

        if (!cancelled) {
          setMongoStatus(data);
        }
      } catch (err) {
        console.error("Erro ao buscar MongoDB /mongodb/status:", err);
        if (!cancelled) {
          // Marca como desconectado, mas mantém estrutura se já existia
          setMongoStatus((prev) =>
            prev && prev.opcional
              ? { ...prev, connected: false }
              : {
                  connected: false,
                  latencyMs: null,
                  opcional: {
                    clientConnections: 0,
                    opcounters: {
                      insert: 0,
                      query: 0,
                      update: 0,
                      delete: 0,
                    },
                    connections: { current: 0, available: 0 },
                    mem: { resident: 0, virtual: 0 },
                    insertsPerMin: 0,
                    insertsSeries: [],
                  },
                }
          );
        }
      } finally {
        if (!cancelled) {
          timer = setTimeout(fetchMongoStatus, 10_000); // repete a cada 10s
        }
      }
    };

    fetchMongoStatus();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [resolvedDeviceId, API_BASE]);

  /**
   * Efeito: busca a lista de alertas enviados para o client atual.
   * - Descobre automaticamente o prefixo da API: `/teste` deve responder JSON.
   * - Em sucesso, popula `alerts` com um array de `AlertEntry`.
   */
  useEffect(() => {
    if (!deviceId) return;
    const controller = new AbortController();

    /**
     * Descobre um prefixo base que responda JSON em `/teste`.
     * @returns {Promise<string>} Prefixo base (ex.: "", "/api/data", "/data").
     */
    async function discoverBasePrefix(): Promise<string> {
      const envBase = (import.meta as any)?.env?.VITE_API_BASE_URL?.trim();
      const candidates = [
        envBase && envBase !== "" ? envBase : null,
        "/api/data",
        "/data",
        "",
      ].filter(Boolean) as string[];

      for (const base of candidates) {
        const url = `${String(base).replace(/\/+$/, "")}/teste`;
        try {
          const r = await fetch(url, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          });
          const ct = r.headers.get("content-type") || "";
          if (r.ok && ct.includes("application/json")) {
            console.log(`[AlertsSent] Base detectada: "${base}" via ${url}`);
            return String(base).replace(/\/+$/, "");
          }
        } catch {
          /* tenta próxima opção */
        }
      }
      throw new Error("Nenhum prefixo de API respondeu a /teste com JSON.");
    }

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const base = await discoverBasePrefix();
        const url = `${base}/${deviceId}/alerts-sent`;
        console.log("[AlertsSent] GET:", url);

        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const ct = res.headers.get("content-type") || "";

        if (!res.ok) {
          const text = await res.text();
          throw new Error(`HTTP ${res.status} — ${text.slice(0, 200)}`);
        }
        if (!ct.includes("application/json")) {
          const text = await res.text();
          throw new Error(
            `Resposta não-JSON em ${url}. Início:\n${text.slice(0, 200)}`
          );
        }

        const data: AlertEntry[] = await res.json();
        setAlerts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        console.error("Falha ao buscar alertas:", e);
        setError(e?.message || "Erro ao carregar alertas");
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [deviceId]);

  /**
   * Efeito (curto): busca status atual do OPC UA a cada 5s.
   * - GET `/{ClientXX}/opcua/status`
   * - Atualiza `opcuaStatus`
   */
  useEffect(() => {
    if (!resolvedDeviceId) return;
    let timer: any;

    /**
     * Busca o status atual da coleta OPC UA.
     * @returns {Promise<void>} Promessa após atualizar `opcuaStatus`.
     */
    const fetchStatus = async (): Promise<void> => {
      try {
        const { data } = await axios.get<OpcuaStatus>(
          `${API_BASE}/${resolvedDeviceId}/opcua/status`,
          { withCredentials: true }
        );
        setOpcuaStatus(data as any);
      } catch (err) {
        console.error("Erro ao buscar OPC UA /opcua/status/:id:", err);
      } finally {
        timer = setTimeout(fetchStatus, 5_000);
      }
    };

    fetchStatus();
    return () => clearTimeout(timer);
  }, [resolvedDeviceId]);

  /**
   * Efeito (janela): busca telemetria agregada do OPC UA a cada 10s.
   * - Tenta `/opcua/telemetry/{ClientXX}` e fallback `/{ClientXX}/opcua/telemetry`
   * - Atualiza `opcuaTelemetry`
   */
  useEffect(() => {
    if (!resolvedDeviceId) return;
    let timer: any;

    /**
     * Busca telemetria de janela (60–300s) para o client atual.
     * @returns {Promise<void>} Promessa após atualizar `opcuaTelemetry`.
     */
    const fetchTelemetry = async (): Promise<void> => {
      const tryUrls = [
        `${API_BASE}/opcua/telemetry/${resolvedDeviceId}`,
        `${API_BASE}/${resolvedDeviceId}/opcua/telemetry`,
      ];

      let ok = false;
      for (const url of tryUrls) {
        try {
          const { data } = await axios.get<OpcuaTelemetry>(url, {
            params: { windowSec: 300 },
            withCredentials: true,
          });
          setOpcuaTelemetry(data);
          ok = true;
          break;
        } catch {
          /* tenta próxima rota */
        }
      }
      if (!ok)
        console.error(
          "Erro ao buscar telemetria OPC UA (tentativas falharam)."
        );
      timer = setTimeout(fetchTelemetry, 10_000);
    };

    fetchTelemetry();
    return () => clearTimeout(timer);
  }, [resolvedDeviceId]);

  console.log(resolvedDeviceId);
  console.log(opcuaStatus);
  console.log(opcuaTelemetry);

  return (
    <Container>
      <div>
        <ClientPicker selectedClientId={deviceId} onChange={setDeviceId} />
      </div>

      <BoxesRow>
        <MongoDBBox title="MongoDB" data={mongoChartData} icon={mongoIcon} />

        <ClusterPanelBox
          title="Cluster Panel"
          deviceId={resolvedDeviceId}
          apiBase={API_BASE}
          planMaxMB={512}
          icon={clusterIcon} // ou planMaxBytes={536870912}
        />

        {/* OPCUABox pode fazer self-fetch; aqui já injetamos status/telemetria do pai */}
        <OPCUABox
          title="OPC UA (collector)"
          deviceId={resolvedDeviceId}
          basePath={API_BASE}
          statusOverride={opcuaStatus as any}
          telemetry={opcuaTelemetry}
          icon={opcuaIcon}
        />

        <HostMetricsBox title="Host" basePath={API_BASE} icon={hostIcon} />

        <FullSpan>
          <MorganMetricsBox
            title="HTTP (Morgan)"
            basePath={API_BASE}
            icon={httpIcon}
          />
        </FullSpan>
      </BoxesRow>
    </Container>
  );
};

export default AppMetrics;
