/**
** =======================================================
@SECTION  : UI — Morgan HTTP Metrics Box
@FILE     : src/components/MorganMetricsBox/MorganMetricsBox.tsx
@PURPOSE  : Exibir métricas HTTP coletadas (via Morgan/telemetria) com
            painel de status, KPIs e minigráfico (RPM x p95), fazendo
            polling periódico de /http/status e /http/telemetry.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { useEffect, useMemo, useState } from "react";
import {
  Container,
  SideLeft,
  SideRight,
  TitleRow,
  Title,
  StatGrid,
  Stat,
  Label,
  Value,
  LegendContainer,
  Legend,
  ChartWrap,
} from "./styled";
import styled, { useTheme } from "styled-components";
import {
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

/** Níveis de severidade de status do box. */
type StatusLevel = "ok" | "warn" | "danger" | "unknown";

/**
 * Snapshot consolidado de métricas HTTP numa janela de tempo.
 * @property windowSec   Janela (segundos) usada no snapshot.
 * @property reqPerMin   Requisições por minuto na janela atual.
 * @property errorRatePct Percentual de erros (HTTP >= 500).
 * @property p50Ms       Latência p50 em milissegundos.
 * @property p95Ms       Latência p95 em milissegundos.
 * @property avgMs       Latência média em milissegundos.
 * @property statusCounts Contagem por status HTTP (ex.: "200":120).
 * @property methodCounts Contagem por método HTTP (ex.: "GET":100).
 * @property topRoutes    Rotas mais acessadas com p95Ms por rota.
 */
type HttpStatusSnapshot = {
  windowSec: number;
  reqPerMin: number;
  errorRatePct: number;
  p50Ms: number;
  p95Ms: number;
  avgMs: number;
  statusCounts: Record<string, number>;
  methodCounts: Record<string, number>;
  topRoutes: Array<{ path: string; count: number; p95Ms: number }>;
};

/**
 * Ponto de telemetria por bucket.
 * @property t    Timestamp ISO8601 do bucket.
 * @property rpm  Requisições/minuto no bucket.
 * @property p95  Latência p95 do bucket (ms).
 * @property err  Quantidade de erros no bucket.
 */
type HttpTelemetryPoint = {
  t: string;
  rpm: number;
  p95: number;
  err: number;
};

/**
 * Série de telemetria temporal.
 * @property bucketSpanSec Tamanho do bucket (s).
 * @property points        Série de pontos no tempo.
 */
type HttpTelemetry = {
  bucketSpanSec: number;
  points: HttpTelemetryPoint[];
};

/**
 * Propriedades do componente MorganMetricsBox.
 * @property title    Título do painel.
 * @property icon     (Opcional) Ícone exibido ao lado do título.
 * @property basePath (Opcional) Prefixo da API (ex.: "", "/api"); default "".
 */
export interface IMorganMetricsBoxProps {
  title: string;
  icon?: string;
  basePath?: string;
}

/** Intervalos de polling (ms) para snapshot e telemetria. */
const POLL_MS_STATUS = 5000;
const POLL_MS_TELEM = 5000;

/** Formata percentual (1 casa) ou “—” se indefinido. */
const fmtPct = (n?: number) =>
  Number.isFinite(n) ? `${(n as number).toFixed(1)}%` : "—";

/** Formata milissegundos inteiros ou “—” se indefinido. */
const fmtMs = (n?: number) => (Number.isFinite(n) ? `${Math.round(n as number)} ms` : "—");

/**
 * Classifica status por percentual (ex.: taxa de erro).
 * @param val   Valor percentual.
 * @param warn  Limiar de aviso (padrão: 2.0).
 * @param danger Limiar de perigo (padrão: 5.0).
 * @returns Nível de severidade correspondente.
 */
const levelByPct = (val?: number, warn = 2.0, danger = 5.0): StatusLevel => {
  if (!Number.isFinite(val)) return "unknown";
  if ((val as number) >= danger) return "danger";
  if ((val as number) >= warn) return "warn";
  return "ok";
};

/**
 * Classifica status por latência (ms).
 * @param ms     Latência em milissegundos.
 * @param warn   Limiar de aviso (padrão: 300ms).
 * @param danger Limiar de perigo (padrão: 800ms).
 * @returns Nível de severidade correspondente.
 */
const levelByLatency = (ms?: number, warn = 300, danger = 800): StatusLevel => {
  if (!Number.isFinite(ms)) return "unknown";
  if ((ms as number) >= danger) return "danger";
  if ((ms as number) >= warn) return "warn";
  return "ok";
};

/**
 * MorganMetricsBox — painel de métricas HTTP com polling e gráfico.
 * @param title    Título a ser exibido no cabeçalho do box.
 * @param icon     Ícone opcional ao lado do título.
 * @param basePath Prefixo base para as rotas `/http/status` e `/http/telemetry`.
 * @returns JSX do painel completo (KPIs, legenda e minigráfico de área/linha).
 * @remarks
 * - O “status” do box é derivado da pior condição entre taxa de erro, p95 e (opcionalmente) volume.
 * - Faz polling suave: cada efeito agenda o próximo ciclo apenas quando o atual termina.
 * - A telemetria é opcional: se ausente, exibe placeholder “Coletando telemetria…”.
 * @note O componente é somente-visual; não altera estado global nem escreve lado-servidor.
 */
const MorganMetricsBox: React.FC<IMorganMetricsBoxProps> = ({
  title,
  icon,
  basePath = "",
}) => {
  const theme: any = useTheme();
  const [snap, setSnap] = useState<HttpStatusSnapshot | null>(null);
  const [telem, setTelem] = useState<HttpTelemetry | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ---------- Poll do snapshot (/http/status) ----------
  useEffect(() => {
    let mounted = true;
    let timer: any;
    const run = async () => {
      try {
        setError(null);
        const r = await fetch(`${basePath}/http/status`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const text = await r.text();
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/json"))
          throw new Error(`HTTP ${r.status} não-JSON: ${text.slice(0, 120)}`);
        const js = JSON.parse(text);
        if (mounted) setSnap(js.snapshot as HttpStatusSnapshot);
      } catch (e: any) {
        if (mounted) setError(String(e?.message || e));
      } finally {
        if (mounted) timer = setTimeout(run, POLL_MS_STATUS);
      }
    };
    run();
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [basePath]);

  // ---------- Poll da telemetria (/http/telemetry) ----------
  useEffect(() => {
    let mounted = true;
    let timer: any;
    const run = async () => {
      try {
        const r = await fetch(`${basePath}/http/telemetry`, {
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const text = await r.text();
        const ct = r.headers.get("content-type") || "";
        if (!ct.includes("application/json"))
          throw new Error(`HTTP ${r.status} não-JSON: ${text.slice(0, 120)}`);
        const js = JSON.parse(text);
        if (mounted) setTelem(js as HttpTelemetry);
      } catch {
        // silencioso; snapshot já exibe aviso se houver problema geral
      } finally {
        if (mounted) timer = setTimeout(run, POLL_MS_TELEM);
      }
    };
    run();
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [basePath]);

  // ---------- Paleta e níveis ----------
  const colorOk = theme?.italiaGreen || "#2eff7e";
  const colorWarn = theme?.italiaAmber || "#ffb02e";
  const colorError = theme?.italiaRed || "#ff2e2e";

  const errLv = levelByPct(snap?.errorRatePct);
  const p95Lv = levelByLatency(snap?.p95Ms);
  // Heurística simples: RPM muito alto pode indicar carga (ajuste fino livre).
  const rpmLv: StatusLevel = snap && snap.reqPerMin > 500 ? "warn" : "ok";

  /** Retorna a pior severidade entre as fornecidas. */
  const worst = (...a: StatusLevel[]): StatusLevel =>
    a.includes("danger") ? "danger" : a.includes("warn") ? "warn" : a.includes("ok") ? "ok" : "unknown";

  /** Status global do box. */
  const boxStatus: StatusLevel = worst(errLv, p95Lv, rpmLv);

  /**
   * Legenda resumida dos principais indicadores.
   * @returns Array com nome, valor e cor de cada item exibido.
   */
  const legend = useMemo(() => {
    if (!snap) return [];
    return [
      { name: "RPM (janela)", value: snap.reqPerMin.toFixed(1), color: colorOk },
      {
        name: "Erro (%)",
        value: fmtPct(snap.errorRatePct),
        color: errLv === "danger" ? colorError : errLv === "warn" ? colorWarn : colorOk,
      },
      {
        name: "p95",
        value: fmtMs(snap.p95Ms),
        color: p95Lv === "danger" ? colorError : p95Lv === "warn" ? colorWarn : colorOk,
      },
      { name: "p50", value: fmtMs(snap.p50Ms), color: colorOk },
      { name: "média", value: fmtMs(snap.avgMs), color: colorOk },
    ];
  }, [snap, colorOk, colorWarn, colorError, errLv, p95Lv]);

  console.log(`Este é o nosso P95Lv: ${p95Lv}`);

  return (
    <Container $status={boxStatus}>
      <SideLeft>
        <TitleRow>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {icon && <img src={icon} alt={title} width={28} height={28} />}
            <Title>{title}</Title>
          </div>
          <Pill $status={boxStatus} aria-label={`status: ${boxStatus}`}>
            {boxStatus}
          </Pill>
        </TitleRow>

        <StatGrid>
          <Stat>
            <Label>RPM</Label>
            <Value>{snap ? snap.reqPerMin.toFixed(1) : "—"}</Value>
          </Stat>
          <Stat>
            <Label>Errors</Label>
            <Value>{snap ? fmtPct(snap.errorRatePct) : "—"}</Value>
          </Stat>
          <Stat>
            <Label>p95</Label>
            <Value>{fmtMs(snap?.p95Ms)}</Value>
          </Stat>
          <Stat>
            <Label>p50</Label>
            <Value>{fmtMs(snap?.p50Ms)}</Value>
          </Stat>
        </StatGrid>

        <LegendContainer>
          {legend.map((it) => (
            <Legend key={it.name} color={String(it.color)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: String(it.color),
                    display: "inline-block",
                  }}
                />
                {it.value}
              </div>
              <span>{it.name}</span>
            </Legend>
          ))}

          {/* Status & métodos (compacto) */}
          {snap && (
            <>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                Status (janela):
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(snap.statusCounts)
                  .slice(0, 6)
                  .map(([s, c]) => (
                    <span key={s} style={{ fontSize: 12, opacity: 0.9 }}>
                      {s}:{c}
                    </span>
                  ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                Métodos:
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(snap.methodCounts).map(([m, c]) => (
                  <span key={m} style={{ fontSize: 12, opacity: 0.9 }}>
                    {m}:{c}
                  </span>
                ))}
              </div>
            </>
          )}

          {error && (
            <div style={{ marginTop: 6, fontSize: 12, color: "#ffb02e" }}>
              Erro ao carregar métricas HTTP: {error}
            </div>
          )}
        </LegendContainer>
      </SideLeft>

      <SideRight>
        <ChartWrap>
          <ResponsiveContainer width="100%" height="100%">
            {telem?.points?.length ? (
              <AreaChart data={telem.points}>
                <defs>
                  <linearGradient id="rpmFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colorOk} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={colorOk} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="rgba(255,255,255,0.08)"
                  vertical={false}
                />
                <XAxis dataKey="t" hide />
                <YAxis hide />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="rpm"
                  stroke={colorOk}
                  fillOpacity={1}
                  fill="url(#rpmFill)"
                />
                <Line
                  type="monotone"
                  dataKey="p95"
                  stroke={colorWarn}
                  dot={false}
                  strokeWidth={2}
                />
              </AreaChart>
            ) : (
              <div style={{ opacity: 0.7, fontSize: 12, padding: 8 }}>
                Coletando telemetria HTTP…
              </div>
            )}
          </ResponsiveContainer>
        </ChartWrap>
      </SideRight>
    </Container>
  );
};

export default MorganMetricsBox;

/**
 * Pill (badge de status) — definido aqui para manter compatibilidade visual
 * com outros boxes (ex.: HostMetrics), sem alterar a exportação local.
 * @remarks Caso prefira consolidar, você já possui uma definição semelhante em styled.ts.
 */
export const Pill = styled.span<{ $status: StatusLevel }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  line-height: 1;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${({ theme }) => (theme as any).textPrimary || "#fff"};
  background: ${({ $status, theme }) => {
    const red = (theme as any)?.italiaRed || "#ff2e2e";
    const amber = (theme as any)?.italiaAmber || "#ffb02e";
    const green = (theme as any)?.italiaGreen || "#2eff7e";
    const gray = (theme as any)?.italiaGray || "#3a3a3a";
    switch ($status) {
      case "danger":
        return `linear-gradient(135deg, ${red}33, ${red}22)`;
      case "warn":
        return `linear-gradient(135deg, ${amber}33, ${amber}22)`;
      case "ok":
        return `linear-gradient(135deg, ${green}2b, ${green}1a)`;
      default:
        return `linear-gradient(135deg, ${gray}44, ${gray}22)`;
    }
  }};
`;
