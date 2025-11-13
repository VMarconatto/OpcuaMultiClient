/**
** =======================================================
@SECTION  : UI — MongoDB Box
@FILE     : src/components/MongoDBBox/index.tsx
@PURPOSE  : Exibir métricas resumidas do MongoDB (conexões, latência, uptime e
            atividade) com status heurístico e minigráfico (ops/min).
@LAST_EDIT : 2025-10-26
** =======================================================
*/

/* eslint-disable array-callback-return */
import React, { useEffect, useMemo, useRef, useState } from "react";

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
 * Propriedades esperadas pelo gráfico/box de MongoDB.
 * @property title Título exibido no cabeçalho do box.
 * @property data Conjunto de indicadores (nome, valor absoluto, percentual e cor).
 * @property icon (Opcional) Caminho/URL do ícone exibido ao lado do título.
 * @remarks A lista `data` deve conter entradas como “Conexões ativas”, “Latência”,
 * “Uptime”, “Inserts”, “Updates”, etc., cujos nomes são usados para inferir ícones e formatação.
 */
interface IBarChartProps {
  title: string;
  data: {
    name: string;
    amount: number;
    percent: number;
    color: string;
  }[];
  icon?: string;
}

/** Níveis de status sintetizados a partir de heurística local. */
type StatusLevel = "ok" | "warn" | "danger" | "unknown";

/**
 * Box de métricas do MongoDB com status e minigráfico.
 * @param title Título do painel.
 * @param data Indicadores básicos (conexões, latência, uptime, inserts/updates, etc.).
 * @param icon Ícone opcional do painel.
 * @returns JSX do painel completo (lado esquerdo: KPIs/legenda; lado direito: gráfico).
 * @remarks
 * - Status: baseado em presença de conexões e faixas de latência (ms).
 * - Ops/min: calculado por diferença de cumulativos (inserts + updates) entre renderizações.
 * - O minigráfico exibe uma janela deslizante de até 24 amostras recentes.
 * @note Não há efeitos colaterais externos; o componente guarda apenas histórico local para o gráfico.
 */
const MongoDBBox: React.FC<IBarChartProps> = ({ title, data, icon }) => {
  // ---------- Helpers para buscar métricas por nome ----------
  const getBy = (needle: string) =>
    data.find((d) => d.name.toLowerCase().includes(needle.toLowerCase()));

  const conn = getBy("conexões ativas"); // número atual de conexões
  const latency = getBy("latência"); // ms
  const uptimeH = getBy("uptime"); // horas
  const inserts = getBy("inserts");
  const updates = getBy("updates");

  // ---------- Status heurístico ----------
  const isDisconnected = (conn?.amount ?? 0) === 0;
  const status: StatusLevel = useMemo(() => {
    if (conn == null) return "unknown";
    if (conn.amount === 0) return "danger";
    // latência ajuda a graduar warn
    const l = latency?.amount ?? 0;
    if (l > 500) return "danger";
    if (l > 200) return "warn";
    return "ok";
  }, [conn, latency]);

  // ---------- Ops/min: calculado a partir de cumulativos (inserts+updates) ----------
  const prev = useRef<{ opsTotal: number; ts: number } | null>(null);
  const [opsPerMin, setOpsPerMin] = useState<number>(0);
  const [opsHistory, setOpsHistory] = useState<number[]>([]);

  useEffect(() => {
    const ins = inserts?.amount ?? 0;
    const upd = updates?.amount ?? 0;
    const currentTotal = ins + upd;
    const now = Date.now();

    if (prev.current) {
      const deltaOps = currentTotal - prev.current.opsTotal;
      const minutes = (now - prev.current.ts) / 60000;
      const perMin =
        minutes > 0 ? Math.max(0, Math.round(deltaOps / minutes)) : 0;
      setOpsPerMin(perMin);
      setOpsHistory((h) => [...h, perMin].slice(-24)); // até 24 amostras recentes
    }
    prev.current = { opsTotal: currentTotal, ts: now };
  }, [inserts?.amount, updates?.amount]);

  // ---------- Dados para o mini gráfico ----------
  const chartData = useMemo(
    () => opsHistory.map((v, i) => ({ idx: i + 1, value: v })),
    [opsHistory]
  );

  // ---------- Legenda (a sua lista original) + pill de status ----------
  /** Seleciona ícone apropriado com base no nome do indicador. */
  const iconFor = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("conex")) return FaPlug;
    if (n.includes("latên")) return FaWifi;
    if (n.includes("uptime")) return FaClock;
    if (n.includes("insert")) return FaDownload;
    if (n.includes("update")) return FaUpload;
    return FaPlug; // fallback
  };

  /**
   * Formata o valor exibido na legenda, respeitando a semântica de cada indicador.
   * @param ind Indicador com nome e valores.
   * @returns String formatada (ex.: “123”, “250 ms”, “4 h”, “12.3”).
   * @note Para Inserts/Updates, mantida a apresentação em percentuais,
   *       mas pode-se alternar para o valor bruto caso preferir.
   */
  function legendValue(ind: { name: string; amount: number; percent: number }) {
    const n = ind.name.toLowerCase();
    if (n.includes("conex")) {

      return String(Math.max(0, Math.floor(ind.amount)));
    }
    if (n.includes("latên")) {
      return `${Math.round(ind.amount)} ms`;
    }
    if (n.includes("uptime")) {
      return `${ind.amount} h`;
    }
    // para Inserts/Updates, você decide: número bruto ou %.
    // Se preferir número bruto (recomendo), mude para: return String(ind.amount);
    return `${ind.percent.toFixed(1)}`;
  }

  console.log("estou no MBBOX");

  return (
    <Container $status={status}>
      <SideLeft>
        <TitleRow>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {icon && <img src={icon} alt={title} width={35} height={40} />}
            <Title>{title}</Title>
          </div>
          <Pill $status={status} aria-label={`status: ${status}`}>
            {status}
          </Pill>
        </TitleRow>

        <StatGrid>
          <Stat>
            <Label>Active connections</Label>
            <Value>{conn?.amount ?? "—"}</Value>
          </Stat>
          <Stat>
            <Label>Ops/min</Label>
            <Value>{Number.isFinite(opsPerMin) ? opsPerMin : "—"}</Value>
          </Stat>
          <Stat>
            <Label>Latency</Label>
            <Value>
              {latency?.amount != null
                ? `${Math.round(latency.amount)} ms`
                : "—"}
            </Value>
          </Stat>
          <Stat>
            <Label>Uptime</Label>
            <Value>
              {uptimeH?.amount != null ? `${uptimeH.amount} h` : "—"}
            </Value>
          </Stat>
        </StatGrid>

        <LegendContainer className={isDisconnected ? "disconnected" : ""}>
          {data.map((indicator) => {
            const Icon = iconFor(indicator.name);
            return (
              <Legend key={indicator.name} color={indicator.color}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon size={14} style={{ color: indicator.color }} />
                  {legendValue(indicator)}
                </div>
                <span>{indicator.name}</span>
              </Legend>
            );
          })}
        </LegendContainer>
      </SideLeft>

      <SideRight>
        <ChartWrap>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 6, right: 8, left: 8, bottom: 0 }}
            >
              <Tooltip
                formatter={(v: any) => [`${v}`, "ops/min"]}
                labelFormatter={() => ""}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartWrap>
      </SideRight>
    </Container>
  );
};

export default MongoDBBox;
