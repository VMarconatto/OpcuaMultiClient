
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
import styled, { useTheme } from "styled-components";

/**
 * Nível de severidade sintetizado a partir das métricas.
 * - "ok"     → operação normal
 * - "warn"   → atenção (limiar de alerta)
 * - "danger" → crítico
 * - "unknown"→ indefinido/indisponível
 */
type StatusLevel = "ok" | "warn" | "danger" | "unknown";

/**
 * Estrutura do snapshot retornado por `/host/status`.
 *
 * @remarks
 * Este payload é consolidado (CPU/memória/disco/rede/processo/sistema) para
 * renderização rápida; números podem vir como frações (ex.: usedPct ∈ [0..1]).
 */
type HostSnapshot = {
  timestamp: string;
  cpu: { pct: number; perCore: number[]; load?: { one?: number; five?: number; fifteen?: number } };
  mem: { usedPct: number; totalGB: number; freeGB: number; swapGB?: { total: number; used: number } };
  disk: Array<{ mount: string; usedPct: number; freeGB: number; sizeGB: number }>;
  net: {
    latencyMs: { opcua?: number; mongodb?: number };
    throughput: { rxKbps: number; txKbps: number };
    errors?: { in?: number; out?: number };
  };
  process: { cpuPct: number; rssMB: number; eventLoopLagMs: number };
  system: { uptimeSec: number; host: string; platform: string; arch: string };
};

/**
 * Propriedades do componente HostMetricsBox.
 *
 * @property title - Título exibido no cabeçalho do box.
 * @property icon - Caminho/URL do ícone exibido ao lado do título.
 * @property basePath - Prefixo da rota de API (ex.: "" | "/api").
 * @property statusOverride - Snapshot parcial vindo do pai (opcional).
 *
 * @remarks
 * Se `statusOverride` estiver presente (e não vazio), o componente **não** fará
 * auto-fetch — respeitando o dado do pai. Caso contrário, fará polling periódico.
 */
export interface IHostMetricsBoxProps {
  title: string;
  icon?: string;
  basePath?: string;
  /** Snapshot vindo do pai (AppMetrics). Se ausente, o componente faz self-fetch. */
  statusOverride?: Partial<HostSnapshot> | { snapshot?: Partial<HostSnapshot> } | null;
}

/** Intervalo de polling em milissegundos para o self-fetch. */
const POLL_MS = 5000;

/** Barras horizontais (CPU/Mem) — seguem o mesmo look do tema. */
const Bar = styled.div`
  width: 100%;
  height: 20px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06);
  overflow: hidden;
  position: relative;
`;

/**
 * Preenchimento da barra (CPU/Mem) com largura proporcional.
 * @param pct - Percentual 0..100 (saneado para os limites).
 * @param color - Cor de preenchimento (conforme severidade).
 */
const BarFill = styled.div<{ pct: number; color: string }>`
  height: 100%;
  width: ${({ pct }) => Math.max(0, Math.min(100, pct))}%;
  background: ${({ color }) => color};
  transition: width 0.4s ease;
`;

/**
 * Componente de métricas do host com auto-fetch e/ou override.
 *
 * @param props - Ver {@link IHostMetricsBoxProps}.
 * @returns JSX.Element contendo título, legenda, KPIs e barras CPU/Mem.
 *
 * @note
 * - O snapshot do pai, quando fornecido, **tem precedência** sobre o fetch.
 * - A síntese de `boxStatus` considera o pior entre CPU, Memória, Disco,
 *   event loop lag e latência de rede (OPC UA / MongoDB).
 */
const HostMetricsBox: React.FC<IHostMetricsBoxProps> = ({
  title,
  icon,
  basePath = "",
  statusOverride,
}) => {
  const theme: any = useTheme();
  const [snap, setSnap] = useState<HostSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Normaliza o `statusOverride` (pode vir como objeto direto ou `{ snapshot }`)
   * para um `Partial<HostSnapshot>`.
   */
  const normalizeOverride = useMemo(() => {
    return (ov: any | null | undefined): Partial<HostSnapshot> => {
      if (!ov) return {};
      return (ov.snapshot ? ov.snapshot : ov) as Partial<HostSnapshot>;
    };
  }, []);

  // --------- Preferir "statusOverride" do pai ---------
  useEffect(() => {
    if (!statusOverride) return;
    try {
      const normalized = normalizeOverride(statusOverride);
      // não força campos ausentes; mantém nulo até vir algo do fetch se precisar
      if (Object.keys(normalized).length > 0) setSnap((prev) => ({ ...(prev as any), ...normalized } as HostSnapshot));
      setError(null);
    } catch (e: any) {
      setError(String(e?.message || e));
    }
  }, [statusOverride, normalizeOverride]);

  // --------- Self-fetch SÓ se não houver override suficiente ---------
  useEffect(() => {
    if (statusOverride && Object.keys(normalizeOverride(statusOverride)).length > 0) return;

    let mounted = true;
    let timer: any;

    const fetchNow = async () => {
      try {
        setError(null);
        const s = await fetch(`${basePath}/host/status`, { credentials: "include" });
        if (!s.ok) throw new Error(`HTTP ${s.status}`);
        const js = await s.json();
        if (mounted) setSnap(js.snapshot as HostSnapshot);
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
  }, [basePath, statusOverride, normalizeOverride]);

  /** Helpers de formatação para exibição amigável. */
  const fmtPct = (n?: number) => (Number.isFinite(n) ? `${Math.round(n!)}%` : "—");
  const fmtMs  = (n?: number) => (Number.isFinite(n) ? `${Math.round(n!)} ms` : "—");
  const fmtGb  = (n?: number) => (Number.isFinite(n) ? `${n!.toFixed(1)} GB` : "—");
  const fmtKb  = (n?: number) => (Number.isFinite(n) ? `${Math.round(n!)} kbps` : "—");

  /**
   * Converte segundos em `Xd Yh Zm`.
   * @param s - Segundos desde o boot (uptime).
   * @returns String formatada ou "—" se inválido.
   */
  const secsToHms = (s?: number) => {
    if (!Number.isFinite(s)) return "—";
    const d = Math.floor((s as number) / 86400);
    const h = Math.floor(((s as number) % 86400) / 3600);
    const m = Math.floor(((s as number) % 3600) / 60);
    return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
  };

  /**
   * Classifica um valor numérico em severidade.
   * @param val - Valor numérico avaliado.
   * @param warn - Limiar de aviso.
   * @param danger - Limiar crítico.
   */
  const level = (val: number, warn: number, danger: number): StatusLevel => {
    if (!Number.isFinite(val)) return "unknown";
    if (val >= danger) return "danger";
    if (val >= warn) return "warn";
    return "ok";
  };

  /** Escolhe o pior nível entre vários. */
  const worst = (...levels: StatusLevel[]): StatusLevel => {
    if (levels.includes("danger")) return "danger";
    if (levels.includes("warn")) return "warn";
    if (levels.includes("ok")) return "ok";
    return "unknown";
  };

  // --------- Derivados ----------
  /** CPU total do host (0..100). */
  const cpuPct = Math.round(((snap?.cpu.pct ?? 0) * 100));
  /** Memória usada em % (0..100). */
  const memPct = Math.round(((snap?.mem.usedPct ?? 0) * 100));

  /**
   * Partição/disco com maior utilização (para destacar).
   * @returns O item de disco de maior `usedPct` ou `null`.
   */
  const maxDisk = useMemo(() => {
    if (!snap?.disk?.length) return null;
    return snap.disk.reduce((a, b) => (b.usedPct > a.usedPct ? b : a));
  }, [snap]);

  /** Severidades por domínio. */
  const cpuLv = level(cpuPct, 75, 85);
  const memLv = level(memPct, 75, 85);
  const diskLv = level(Math.round((maxDisk?.usedPct ?? 0) * 100), 80, 90);
  const loopLv = level(snap?.process.eventLoopLagMs ?? NaN, 50, 100);

  /** Pior latência entre OPC UA e MongoDB. */
  const latArr = [snap?.net.latencyMs.opcua, snap?.net.latencyMs.mongodb].filter((v) => Number.isFinite(v)) as number[];
  const maxLat = latArr.length ? Math.max(...latArr) : NaN;
  const latLv = level(maxLat, 100, 300);

  /** Status agregado do box. */
  const boxStatus: StatusLevel = worst(cpuLv, memLv, diskLv, loopLv, latLv);

  /** Paleta do tema (fallbacks inclusos). */
  const colorOk    = theme?.italiaGreen || "#2eff7e";
  const colorWarn  = theme?.italiaAmber || "#ffb02e";
  const colorDanger= theme?.italiaRed   || "#ff2e2e";
  const cpuColor = cpuLv === "danger" ? colorDanger : cpuLv === "warn" ? colorWarn : colorOk;
  const memColor = memLv === "danger" ? colorDanger : memLv === "warn" ? colorWarn : colorOk;

  /** Item da legenda lateral. */
  type LegendItem = { name: string; value: string | number; color: string };

  /**
   * Constrói a legenda informativa (lado esquerdo).
   * @returns Vetor com rótulos, valores formatados e cor por item.
   */
  const legend: LegendItem[] = useMemo(() => {
    const items: LegendItem[] = [];
    const green = colorOk;
    const amber = colorWarn;
    const red   = colorDanger;

    items.push({ name: "CPU", value: fmtPct(cpuPct), color: cpuColor });
    items.push({ name: "Memória", value: fmtPct(memPct), color: memColor });

    const diskPct = Math.round((maxDisk?.usedPct ?? 0) * 100);
    items.push({ name: "Disco (máx)", value: Number.isFinite(diskPct) ? `${diskPct}%` : "—", color: diskLv === "danger" ? red : diskLv === "warn" ? amber : green });
    items.push({ name: "Livre (máx)", value: fmtGb(maxDisk?.freeGB), color: green });

    items.push({ name: "Latência OPC UA", value: fmtMs(snap?.net.latencyMs.opcua), color: amber });
    items.push({ name: "Latência MongoDB", value: fmtMs(snap?.net.latencyMs.mongodb), color: amber });
    items.push({ name: "Throughput Rx/Tx", value: `${fmtKb(snap?.net.throughput.rxKbps)} / ${fmtKb(snap?.net.throughput.txKbps)}`, color: green });

    items.push({ name: "Loop Lag", value: fmtMs(snap?.process.eventLoopLagMs), color: loopLv === "danger" ? red : loopLv === "warn" ? amber : green });
    items.push({ name: "Proc. CPU", value: fmtPct(Math.round((snap?.process.cpuPct ?? 0) * 100)), color: green });
    items.push({ name: "RSS", value: Number.isFinite(snap?.process.rssMB) ? `${Math.round(snap!.process.rssMB)} MB` : "—", color: amber });

    items.push({ name: "Uptime", value: secsToHms(snap?.system.uptimeSec), color: green });
    items.push({ name: "Plataforma", value: snap ? `${snap.system.platform}-${snap.system.arch}` : "—", color: green });

    return items;
  }, [snap, cpuPct, memPct, maxDisk, cpuColor, memColor, colorOk, colorWarn, colorDanger, diskLv, loopLv]);

  console.log(`Este é o valor DA CPU: ${cpuPct}`);

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
            <Label>CPU (total)</Label>
            <Value>{fmtPct(cpuPct)}</Value>
          </Stat>
          <Stat>
            <Label>Cores</Label>
            <Value>{snap?.cpu.perCore?.length ?? "—"}</Value>
          </Stat>

          <Stat>
            <Label>Memory used</Label>
            <Value>{fmtPct(memPct)}</Value>
          </Stat>
          <Stat>
            <Label>Free memory / total</Label>
            <Value>{fmtGb(snap?.mem.freeGB)} / {fmtGb(snap?.mem.totalGB)}</Value>
          </Stat>
        </StatGrid>

        <LegendContainer>
          {legend.map((it) => (
            <Legend key={it.name} color={String(it.color)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: String(it.color), display: "inline-block" }} />
                {it.value}
              </div>
              <span>{it.name}</span>
            </Legend>
          ))}
        </LegendContainer>

        {error && (
          <div style={{ marginTop: 4, fontSize: 12, opacity: 0.8, color: "#ffb02e" }}>
            Erro ao carregar métricas: {error}
          </div>
        )}
      </SideLeft>

      <SideRight>
        <ChartWrap>
          {/* Barras horizontais (CPU e Memória) */}
          <div style={{ display: "grid", gap: 12, width: "100%" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <Label>CPU</Label><Label>{fmtPct(cpuPct)}</Label>
              </div>
              <Bar><BarFill pct={cpuPct} color={cpuColor} /></Bar>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <Label>Memory</Label><Label>{fmtPct(memPct)}</Label>
              </div>
              <Bar><BarFill pct={memPct} color={memColor} /></Bar>
            </div>
          </div>
        </ChartWrap>
      </SideRight>
    </Container>
  );
};

export default HostMetricsBox;
