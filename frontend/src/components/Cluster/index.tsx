/**
** =======================================================
@SECTION  : MongoDB — Cluster Panel Box
@FILE     : src/components/Cluster/index.tsx
@PURPOSE  : Exibir painel de status do cluster (connections, R/W por segundo,
            tráfego de rede, tamanho de dados, capacidade e % usada),
            com polling periódico e gráfico de tendência.
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
  PctBadge, // precisa existir no styled.ts
} from "./styled";

import {
  FaPlug,
  FaChartLine,
  FaHdd,
  FaDownload,
  FaUpload,
} from "react-icons/fa";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  YAxis,
  ReferenceLine,
} from "recharts";

/** Nível heurístico de status exibido na pílula. */
type StatusLevel = "ok" | "warn" | "danger" | "unknown";

/**
 * Payload retornado pelo backend para preencher o painel.
 */
type ClusterPanelPayload = {
  connections: number;
  readsPerSec: number;   // R/s
  writesPerSec: number;  // W/s
  netInBps: number;      // bytes/s
  netOutBps: number;     // bytes/s
  dataSizeBytes: number;
  indexSizeBytes: number;
  storageSizeBytes: number;
  planMaxBytes: number | null;
  percentUsed: number | null; // 0..100
};

/**
 * Propriedades do componente ClusterPanelBox.
 */
interface ClusterPanelBoxProps {
  /** Título mostrado no cabeçalho do card. */
  title: string;
  /** Identificador do client (ex.: "Client01") usado nas rotas do backend. */
  deviceId: string;
  /** Caminho/URL do ícone exibido ao lado do título. */
  icon?: string;
  /** Intervalo de polling em ms. @default 5000 */
  pollingMs?: number;
  /** Base do backend. @default "http://localhost:3000" */
  apiBase?: string;
  /** Limite de plano em MB (se ambos vierem, bytes tem prioridade). */
  planMaxMB?: number;
  /** Limite de plano em bytes (prioritário sobre MB). */
  planMaxBytes?: number;
}

/* ===========================
   Helpers de formatação
   =========================== */

/**
 * Formata taxa por segundo (ex.: "12.34/s").
 * @param {number} [v] Valor numérico em unidades/segundo.
 * @returns {string} String formatada com 2 casas e sufixo "/s", ou "—".
 */
function formatRatePerSec(v?: number): string {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${Math.max(0, +v.toFixed(2))}/s`;
}

/**
 * Converte bytes/s para KB/s (duas casas) e formata.
 * @param {number} [bytesPerSec] Taxa em bytes por segundo.
 * @returns {string} Valor em "KB/s" ou "—".
 */
function formatKBps(bytesPerSec?: number): string {
  if (bytesPerSec == null || !Number.isFinite(bytesPerSec)) return "—";
  const kb = bytesPerSec / 1024;
  return `${Math.max(0, +kb.toFixed(2))} KB/s`;
}

/**
 * Converte bytes para MB com 2 casas e formata.
 * @param {number} [bytes] Tamanho em bytes.
 * @returns {string} Valor em "MB" (2 casas) ou "—".
 */
function formatMB(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  return `${+(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Converte bytes em MB de forma numérica (sem sufixo).
 * @param {number} [b] Tamanho em bytes.
 * @returns {number} Valor em MB com 2 casas (0 se inválido).
 */
function bytesToMB(b?: number): number {
  if (b == null || !Number.isFinite(b)) return 0;
  return +(b / (1024 * 1024)).toFixed(2);
}

/* ===========================
   Componente
   =========================== */

/**
 * Card de painel do Cluster MongoDB (com polling e gráfico de Data Size).
 *
 * ### Responsabilidades
 * - Fazer polling do backend (`/mongodb/cluster-panel`) com `deviceId`.
 * - Calcular heurística de status (pelo uso do plano e conexões).
 * - Exibir indicadores (connections, R/W, tráfego) e gráfico (MB).
 *
 * @param {ClusterPanelBoxProps} props Propriedades de configuração do card.
 * @returns {JSX.Element} Componente visual do painel do cluster.
 */
const ClusterPanelBox: React.FC<ClusterPanelBoxProps> = ({
  title,
  deviceId,
  icon,
  pollingMs = 5000,
  apiBase = "http://localhost:3000",
  planMaxMB,
  planMaxBytes,
}) => {
  /** Último payload do painel (ou `null` até carregar). */
  const [panel, setPanel] = useState<ClusterPanelPayload | null>(null);

  /** Histórico curto para o gráfico (MB + %). Mantém ~5min (60 pontos c/ 5s). */
  const [dsHistory, setDsHistory] = useState<
    Array<{ t: number; mb: number; pct: number | null }>
  >([]);

  /**
   * Polling robusto: ignora AbortError, valida JSON e injeta capacidade via query string.
   * Reseta estado quando muda `deviceId`/`apiBase`/limites.
   */
  useEffect(() => {
    setPanel(null);
    setDsHistory([]);

    const controller = new AbortController();
    let inFlight = false;

    /**
     * Faz uma iteração de polling (fetch seguro).
     * @returns {Promise<void>} Resolvida após atualizar `panel` e `dsHistory`.
     */
    const fetchOnce = async (): Promise<void> => {
      if (inFlight) return;
      inFlight = true;
      try {
        const params = new URLSearchParams();
        if (typeof planMaxBytes === "number" && Number.isFinite(planMaxBytes)) {
          params.set("planMaxBytes", String(planMaxBytes));
        } else if (typeof planMaxMB === "number" && Number.isFinite(planMaxMB)) {
          params.set("planMaxMB", String(planMaxMB));
        }

        const url =
          `${apiBase}/${deviceId}/mongodb/cluster-panel` +
          (params.toString() ? `?${params.toString()}` : "");

        const res = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        const ct = res.headers.get("content-type") || "";
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (!ct.includes("application/json")) {
          throw new Error(`Resposta não-JSON (${ct || "sem content-type"})`);
        }

        const data = (await res.json()) as ClusterPanelPayload;
        setPanel(data);

        // atualiza histórico do Data Size
        const mb = bytesToMB(data.dataSizeBytes);
        const pct =
          data.percentUsed != null
            ? +data.percentUsed
            : data.planMaxBytes
            ? +((data.dataSizeBytes / data.planMaxBytes) * 100).toFixed(1)
            : typeof planMaxBytes === "number" && planMaxBytes > 0
            ? +((data.dataSizeBytes / planMaxBytes) * 100).toFixed(1)
            : typeof planMaxMB === "number" && planMaxMB > 0
            ? +((mb / planMaxMB) * 100).toFixed(1)
            : null;

        setDsHistory((h) => [...h, { t: Date.now(), mb, pct }].slice(-60));
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.warn("cluster-panel fetch falhou:", e);
        }
      } finally {
        inFlight = false;
      }
    };

    fetchOnce();
    const id = setInterval(fetchOnce, pollingMs);

    return () => {
      clearInterval(id);
      controller.abort(); // aborta só no unmount/troca de deps
    };
  }, [deviceId, pollingMs, apiBase, planMaxMB, planMaxBytes]);

  /**
   * Heurística de status do painel.
   * - "danger" se conexões = 0
   * - "warn"   se percentUsed >= 75
   * - "danger" se percentUsed >= 90
   * - "ok"     caso contrário
   * @returns {StatusLevel} Nível de status.
   */
  const status: StatusLevel = useMemo<StatusLevel>(() => {
    if (!panel) return "unknown";
    if ((panel.connections ?? 0) === 0) return "danger";
    const p = panel.percentUsed ?? null;
    if (p != null) {
      if (p >= 90) return "danger";
      if (p >= 75) return "warn";
    }
    return "ok";
  }, [panel]);

  /**
   * Indicadores exibidos na legenda (lado esquerdo).
   * @returns {Array<{name:string, amount:number, color:string, icon: any, fmt:() => string}>}
   */
  const indicators = useMemo(() => {
    if (!panel) return [];
    return [
      {
        name: "Connections",
        amount: panel.connections ?? 0,
        color: "#1890ff",
        icon: FaPlug,
        fmt: () => String(Math.max(0, Math.floor(panel.connections ?? 0))),
      },
      {
        name: "Reads/s",
        amount: panel.readsPerSec ?? 0,
        color: "#73d13d",
        icon: FaChartLine,
        fmt: () => formatRatePerSec(panel.readsPerSec),
      },
      {
        name: "Writes/s",
        amount: panel.writesPerSec ?? 0,
        color: "#9254de",
        icon: FaChartLine,
        fmt: () => formatRatePerSec(panel.writesPerSec),
      },
      {
        name: "In",
        amount: panel.netInBps ?? 0,
        color: "#36cfc9",
        icon: FaDownload,
        fmt: () => formatKBps(panel.netInBps),
      },
      {
        name: "Out",
        amount: panel.netOutBps ?? 0,
        color: "#ffc53d",
        icon: FaUpload,
        fmt: () => formatKBps(panel.netOutBps),
      },
      {
        name: "Data Size",
        amount: panel.dataSizeBytes ?? 0,
        color: "#ff7a45",
        icon: FaHdd,
        fmt: () => {
          const size = formatMB(panel.dataSizeBytes);
          const pct =
            panel.percentUsed != null ? ` (${panel.percentUsed.toFixed(1)}%)` : "";
          return `${size}${pct}`;
        },
      },
    ];
  }, [panel]);

  /**
   * Dataset do gráfico (MB) a partir do histórico.
   * @returns {{idx:number, mb:number, pct:number}[]} Série adequada ao Recharts.
   */
  const dsChartData = useMemo(
    () => dsHistory.map((p, i) => ({ idx: i + 1, mb: p.mb, pct: p.pct ?? 0 })),
    [dsHistory]
  );

  /**
   * Percentual atual usado do plano (exibe badge no gráfico).
   * @returns {number | null} Percentual com uma casa decimal (ou nulo).
   */
  const currentPct = useMemo(() => {
    const last = dsHistory[dsHistory.length - 1];
    return last?.pct ?? (panel?.percentUsed ?? null);
  }, [dsHistory, panel]);

  /**
   * Capacidade efetiva (MB) priorizando valor do backend;
   * caso ausente, cai para props (bytes > MB).
   * @returns {number | null} Capacidade em MB ou `null` se desconhecida.
   */
  const displayedCapMB = useMemo(() => {
    if (panel?.planMaxBytes != null && Number.isFinite(panel.planMaxBytes)) {
      return +(panel.planMaxBytes / (1024 * 1024)).toFixed(2);
    }
    if (typeof planMaxBytes === "number" && Number.isFinite(planMaxBytes)) {
      return +(planMaxBytes / (1024 * 1024)).toFixed(2);
    }
    if (typeof planMaxMB === "number" && Number.isFinite(planMaxMB)) {
      return +planMaxMB;
    }
    return null;
  }, [panel, planMaxBytes, planMaxMB]);

  /**
   * Domínio do eixo Y do gráfico, ancorado em zero.
   * Se houver capacidade conhecida, usa como limite superior.
   * @returns {[number, number]} Domínio mínimo e máximo.
   */
  const yDomain = useMemo<[number, number]>(() => {
    const maxMb = dsHistory.length ? Math.max(...dsHistory.map((p) => p.mb)) : 0;
    if (displayedCapMB && displayedCapMB > 0) return [0, displayedCapMB];
    const upper = Math.max(1, maxMb * 1.1); // fallback
    return [0, upper];
  }, [dsHistory, displayedCapMB]);

  return (
    <Container $status={status}>
      <SideLeft>
        <TitleRow>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {icon && <img src={icon} alt={title} width={40} height={40} />}
            <Title>{title}</Title>
          </div>
          <Pill $status={status} aria-label={`status: ${status}`}>
            {status}
          </Pill>
        </TitleRow>

        <StatGrid>
          <Stat>
            <Label>Connections</Label>
            <Value>
              {panel ? Math.max(0, Math.floor(panel.connections ?? 0)) : "—"}
            </Value>
          </Stat>

          <Stat>
            <Label>Reads/s</Label>
            <Value>{panel ? formatRatePerSec(panel.readsPerSec) : "—"}</Value>
          </Stat>

          <Stat>
            <Label>Writes/s</Label>
            <Value>{panel ? formatRatePerSec(panel.writesPerSec) : "—"}</Value>
          </Stat>

          <Stat>
            <Label>Data Size</Label>
            <Value>
              {panel ? (
                <>
                  {formatMB(panel.dataSizeBytes)}
                  {panel?.percentUsed != null
                    ? ` (${panel.percentUsed.toFixed(1)}%)`
                    : ""}
                </>
              ) : (
                "—"
              )}
            </Value>
          </Stat>

          {/* Capacidade Máxima (abaixo de Data Size, coluna da direita) */}
          <Stat style={{ gridColumn: 2 }}>
            <Label>Maximum Capacity</Label>
            <Value>
              {displayedCapMB != null ? `${displayedCapMB} MB` : "—"}
            </Value>
          </Stat>
        </StatGrid>

        <LegendContainer
          className={
            !panel || (panel.connections ?? 0) === 0 ? "disconnected" : ""
          }
        >
          {indicators.map((ind) => {
            const Icon = ind.icon as any;
            return (
              <Legend key={ind.name} color={ind.color}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon size={14} style={{ color: ind.color }} />
                  {ind.fmt()}
                </div>
                <span>{ind.name}</span>
              </Legend>
            );
          })}
        </LegendContainer>
      </SideLeft>

      <SideRight>
        <ChartWrap>
          {currentPct != null && (
            <PctBadge title="Percentual usado do plano">
              {currentPct.toFixed(1)}%
            </PctBadge>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dsChartData} margin={{ top: 8, right: 8, left: 8, bottom: 4 }}>
              <YAxis hide domain={yDomain} />

              {displayedCapMB && (
                <ReferenceLine
                  y={displayedCapMB}
                  strokeOpacity={0.35}
                  strokeWidth={1}
                  strokeDasharray="4 3"
                  ifOverflow="extendDomain"
                  label={{
                    value: `${displayedCapMB} MB`,
                    position: "right",
                    offset: 4,
                    fontSize: 11,
                  }}
                />
              )}

              <Tooltip
                formatter={(v: any, name: any) =>
                  name === "mb" ? [`${v} MB`, "Data Size"] : [`${v}%`, "% used"]
                }
                labelFormatter={() => ""}
              />
              {/* área principal em MB; base ancorada em 0 */}
              <Area type="monotone" dataKey="mb" baseValue={0} strokeWidth={2} fillOpacity={0.2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartWrap>
      </SideRight>
    </Container>
  );
};

export default ClusterPanelBox;
