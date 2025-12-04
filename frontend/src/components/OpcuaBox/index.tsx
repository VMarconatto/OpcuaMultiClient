/**
** =======================================================
@SECTION  : UI — OPC UA Box
@FILE     : src/components/OPCUABox/index.tsx
@PURPOSE  : Exibir o estado e as métricas de um cliente OPC UA (sessão,
            notificações/s, qualidade, latência p95, reconexões) com
            heurística de status e minigráfico de atividade.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

/* eslint-disable array-callback-return */
import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  Legend,
  LegendContainer,
  SideLeft,
  SideRight,
  TitleRow,
  Title,
  Pill,
  StatGrid,
  Stat,
  Label,
  Value,
  ChartWrap,
} from "./styled";
import { FaPlug, FaWifi, FaClock, FaDownload, FaUpload } from "react-icons/fa";
import { ResponsiveContainer, BarChart, Bar, Tooltip } from "recharts";

/**
 * Estado da sessão OPC UA.
 * @remarks "active" = conectado; "reconnecting" = tentativa de retomada;
 * "closed" = sessão finalizada/indisponível.
 */
type SessionState = "active" | "reconnecting" | "closed";

/**
 * Snapshot enriquecido retornado por `/opcua/status`.
 * @note Alguns campos podem ser derivados de telemetria (quando fornecida).
 */
type Snapshot = {
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
    /** 12 pontos de 5s = 60s */
    notificationsPerSec: number[];
    /** 12 pontos de 5s = 60s (0–100) */
    badRatePct: number[];
  };
};

/** Níveis de severidade do painel. */
type StatusLevel = "ok" | "warn" | "danger" | "unknown";

/**
 * Propriedades do componente OPCUABox.
 * @property title           Título do painel.
 * @property deviceId        Identificador do device (ex.: "device01").
 * @property icon            (Opcional) Ícone exibido no cabeçalho.
 * @property basePath        (Opcional) Prefixo da API (padrão: "").
 * @property statusOverride  (Opcional) Snapshot parcial para override pelo pai.
 * @property telemetry       (Opcional) Série temporal para compor séries/latência.
 * @remarks Se `statusOverride` e/ou `telemetry` são fornecidos, o componente
 * evita `self-fetch` para impedir dupla origem de dados.
 */
export interface IOPCUABoxProps {
  title: string;
  deviceId: string;
  icon?: string;
  basePath?: string;
  // NOVO: usar dados do pai (AppMetrics) quando disponíveis
  statusOverride?: Partial<Snapshot> | any;
  telemetry?: {
    bucketSpanSec: number;
    points: Array<{
      t: number;
      notificationsPerSec: number;
      badRatePct: number;
      reads: number;
      errors: number;
      p95ReadLatencyMs: number | null;
    }>;
  } | null;
}

/** Intervalo de polling local (apenas quando não há override). */
const POLL_MS = 5000;

/**
 * Componente de painel do cliente OPC UA.
 * @param title Título do painel.
 * @param deviceId Identificação do device (usado para resolver clientId).
 * @param icon Ícone opcional ao lado do título.
 * @param basePath Prefixo base da API (ex.: "", "/api").
 * @param statusOverride Snapshot parcial (pai) para evitar fetch local.
 * @param telemetry Série temporal opcional para compor séries e p95.
 * @returns JSX contendo KPIs, legenda e minigráfico (notifications/s).
 * @remarks
 * - Quando `statusOverride`/`telemetry` são informados, o componente normaliza
 *   os dados localmente (função `buildSnapshot`) e **não** realiza self-fetch.
 * - Heurística de status: considera conectividade, atividade recente, bad% e p95.
 * @note O código **não** altera estado global; é puramente visual.
 */
const OPCUABox: React.FC<IOPCUABoxProps> = ({
  title,
  deviceId,
  icon,
  basePath = "",
  statusOverride,
  telemetry,
}) => {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Normaliza `statusOverride` (legado ou parcial) em um `Snapshot` mínimo,
   * e injeta informações derivadas de `telemetry` quando disponível.
   */
  const buildSnapshot = useMemo(() => {
    return (override: any, telem: IOPCUABoxProps["telemetry"]): Snapshot => {
      const connected =
        Boolean(override?.connected) ||
        Boolean(override?.status?.connected) ||
        false;

      const monitoredItems =
        typeof override?.subscriptions?.monitoredItems === "number"
          ? override.subscriptions.monitoredItems
          : Array.isArray(override?.mapMemory)
          ? override.mapMemory.length
          : 0;

      // Base "vazia", enriquecida por telemetria quando houver
      const base: Snapshot = {
        connected,
        endpointUrl: override?.endpointUrl ?? override?.endpoint ?? "",
        sessionState: connected ? "active" : "closed",
        security: { policy: "Basic256Sha256", mode: "SignAndEncrypt" },
        subscriptions: {
          count: 0,
          monitoredItems,
          sampleIntervalAvgMs:
            override?.subscriptions?.sampleIntervalAvgMs ?? null,
          keepAliveSec: override?.subscriptions?.keepAliveSec ?? null,
        },
        rates: {
          notificationsPerSec: 0,
          readsPerSec: 0,
          writesPerSec: 0,
          eventsPerSec: 0,
        },
        quality: {
          goodPerSec: 0,
          badPerSec: 0,
          uncertainPerSec: 0,
          badRatePct: 0,
        },
        latency: {
          publishRoundTripMs: { p50: null, p95: null, max: null },
        },
        network: { bytesInBps: null, bytesOutBps: null },
        stability: {
          reconnectsLast10m: 0,
          lastReconnectAt: null,
          queueOverflowLast5m: 0,
          pendingWrites: 0,
          pendingReads: 0,
        },
        series60s: { notificationsPerSec: [], badRatePct: [] },
      };

      // Enriquecimento por telemetria (últimos 12 buckets)
      if (telem?.points?.length) {
        const last12 = telem.points.slice(-12);
        const notifSeries = last12.map((p) =>
          Math.max(0, Number(p.notificationsPerSec || 0))
        );
        const badSeries = last12.map((p) =>
          Math.max(0, Math.min(100, Number(p.badRatePct || 0)))
        );
        const avgNotif =
          notifSeries.reduce((a, b) => a + b, 0) / (notifSeries.length || 1);

        base.rates.notificationsPerSec = +avgNotif.toFixed(2);
        base.series60s.notificationsPerSec = notifSeries;
        base.series60s.badRatePct = badSeries;

        const latVals = last12
          .map((p) => p.p95ReadLatencyMs)
          .filter((v): v is number => typeof v === "number");
        if (latVals.length) {
          const sorted = [...latVals].sort((a, b) => a - b);
          const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))] ?? null;
          const max = sorted[sorted.length - 1] ?? null;
          base.latency.publishRoundTripMs.p95 = p95;
          base.latency.publishRoundTripMs.max = max;
        }
      }

      // Aproveita campos já enriquecidos (se existirem no override)
      if (override?.rates?.readsPerSec != null)
        base.rates.readsPerSec = Number(override.rates.readsPerSec);
      if (override?.rates?.writesPerSec != null)
        base.rates.writesPerSec = Number(override.rates.writesPerSec);
      if (override?.quality?.badRatePct != null)
        base.quality.badRatePct = Number(override.quality.badRatePct);

      return base;
    };
  }, []);

  // --------- Preferir dados do pai (statusOverride + telemetry) ---------
  useEffect(() => {
    if (!statusOverride && !telemetry) return;
    try {
      const normalized = buildSnapshot(statusOverride || {}, telemetry || null);
      setSnap(normalized);
      setError(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }, [statusOverride, telemetry, buildSnapshot]);

  // --------- Self-fetch SÓ quando não houver override ---------
  useEffect(() => {
    if (statusOverride) return; // evita dupla origem
    let mounted = true;
    let timer: any;

    const fetchNow = async () => {
      try {
        setError(null);
        // device01 -> Client01
        const toClientId = (dev: string) =>
          dev.replace(
            /^device(\d+)/i,
            (_, n) => `Client${String(n).padStart(2, "0")}`
          );
        const clientId = toClientId(deviceId);
        const res = await fetch(`${basePath}/opcua/status/${clientId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: Snapshot = await res.json();
        if (mounted) setSnap(json);
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e));
      } finally {
        if (mounted) timer = setTimeout(fetchNow, POLL_MS);
      }
    };

    fetchNow();
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [deviceId, basePath, statusOverride]);

  // --------- Heurística de status (considera telemetria/séries) ---------
  const status: StatusLevel = useMemo(() => {
    if (!snap) return "unknown";
    if (!snap.connected) return "danger";

    const notif = snap.rates?.notificationsPerSec ?? 0;
    const hasSeries =
      (snap.series60s?.notificationsPerSec?.length || 0) > 0;

    // Se há telemetria e há atividade recente, evita "danger" falso-positivo
    const seriesActive = hasSeries
      ? snap.series60s.notificationsPerSec.some((v) => v > 0)
      : false;

    const badPct =
      snap.quality?.badRatePct ??
      (snap.series60s?.badRatePct?.slice(-1)[0] ?? 0);
    const p95 = snap.latency?.publishRoundTripMs?.p95 ?? null;
    const sample = snap.subscriptions?.sampleIntervalAvgMs ?? null;

    if (!seriesActive && notif === 0) return "warn";
    if (badPct > 10) return "danger";
    if (p95 != null && sample != null && p95 > 2 * sample) return "danger";
    if (badPct > 3) return "warn";
    return "ok";
  }, [snap]);

  // --------- Labels/KPIs principais ---------
  const sessionLabel = useMemo(() => {
    if (!snap) return "—";
    if (!snap.connected) return "disconnected";
    return snap.sessionState;
  }, [snap]);

  const notifs = snap?.rates?.notificationsPerSec ?? null;
  const badPct = snap?.quality?.badRatePct ?? null;
  const p95 = snap?.latency?.publishRoundTripMs?.p95 ?? null;

  // --------- Dados do minigráfico (telemetria → fallback séries locais) ---------
  const chartData = useMemo(() => {
    if (telemetry?.points?.length) {
      const pts = telemetry.points.slice(-12);
      return pts.map((p, i) => ({
        idx: i + 1,
        value: Math.max(0, Math.round(p.notificationsPerSec || 0)),
      }));
    }
    const arr = snap?.series60s?.notificationsPerSec ?? [];
    return arr.map((v, i) => ({
      idx: i + 1,
      value: Math.max(0, Math.round(v)),
    }));
  }, [telemetry, snap?.series60s?.notificationsPerSec]);

  // --------- Legenda ---------
  type LegendItem = { name: string; value: string | number; color: string };

  const legend: LegendItem[] = useMemo(() => {
    const items: LegendItem[] = [];
    const green = "#2eff7e";
    const amber = "#ffb02e";
    const red = "#ff2e2e";
    const cyan = "#13c2c2";
    const purple = "#8b5cf6";

    items.push({
      name: "Sessão",
      value: sessionLabel,
      color: snap?.connected ? green : red,
    });
    items.push({
      name: "Monitored Items",
      value: snap?.subscriptions?.monitoredItems ?? "—",
      color: cyan,
    });
    items.push({
      name: "Notifications/s",
      value: notifs != null ? Math.round(notifs) : "—",
      color: green,
    });
    items.push({
      name: "Bad %",
      value: badPct != null ? badPct.toFixed(1) + "%" : "—",
      color: red,
    });
    items.push({
      name: "Reads/s",
      value:
        snap?.rates?.readsPerSec != null
          ? Math.round(snap.rates.readsPerSec)
          : "—",
      color: amber,
    });
    items.push({
      name: "Writes/s",
      value:
        snap?.rates?.writesPerSec != null
          ? Math.round(snap.rates.writesPerSec)
          : "—",
      color: amber,
    });
    items.push({
      name: "Publish p95 (ms)",
      value: p95 != null ? Math.round(p95) : "—",
      color: purple,
    });
    items.push({
      name: "Reconnects (10m)",
      value: snap?.stability?.reconnectsLast10m ?? "—",
      color: red,
    });

    return items;
  }, [snap, sessionLabel, notifs, badPct, p95]);

  const isDisconnected = !snap?.connected;

  /** 
   * @param name
   * Ícone heuristicamente escolhido com base no rótulo (name) do item. */
  const iconFor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("sess")) return FaPlug;
    if (n.includes("publish")) return FaClock;
    if (n.includes("notification")) return FaDownload;
    if (n.includes("read")) return FaDownload;
    if (n.includes("write")) return FaUpload;
    if (n.includes("monitored")) return FaWifi;
    return FaPlug;
  };

  return (
    <Container $status={status}>
      <SideLeft>
        <TitleRow>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {icon && <img src={icon} alt={title} width={50} height={50} />}
            <Title>{title}</Title>
          </div>
          <Pill $status={status} aria-label={`status: ${status}`}>
            {status}
          </Pill>
        </TitleRow>

        <StatGrid>
          <Stat>
            <Label>Session</Label>
            <Value>{sessionLabel}</Value>
          </Stat>
          <Stat>
            <Label>Notifications/s</Label>
            <Value>{notifs != null ? Math.round(notifs) : "—"}</Value>
          </Stat>
          <Stat>
            <Label>Bad %</Label>
            <Value>{badPct != null ? `${badPct.toFixed(1)}%` : "—"}</Value>
          </Stat>
          <Stat>
            <Label>Publish p95</Label>
            <Value>{p95 != null ? `${Math.round(p95)} ms` : "—"}</Value>
          </Stat>
        </StatGrid>

        <LegendContainer className={isDisconnected ? "disconnected" : ""}>
          {legend.map((it) => {
            const Icon = iconFor(it.name);
            return (
              <Legend key={it.name} color={it.color}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon size={14} style={{ color: it.color }} />
                  {it.value}
                </div>
                <span>{it.name}</span>
              </Legend>
            );
          })}
        </LegendContainer>

        {error && (
          <div
            style={{
              marginTop: 4,
              fontSize: 12,
              opacity: 0.8,
              color: "#ffb02e",
            }}
          >
            Erro ao carregar métricas: {error}
          </div>
        )}
      </SideLeft>

      <SideRight>
        <ChartWrap>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 6, right: 8, left: 8, bottom: 0 }}
            >
              <Tooltip
                formatter={(v: any) => [`${v}`, "notifications/s"]} labelFormatter={() => ""}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrap>
      </SideRight>
    </Container>
  );
};

export default OPCUABox;
