/**
** =======================================================
@SECTION  : UI — HistoryBox (Trend AreaChart)
@FILE     : src/components/HistoryBox/index.tsx
@PURPOSE  : Exibir séries históricas com navegação por índice ou por tempo,
            incluindo limpeza out-of-range baseada em setup e gradiente
            dinâmico por série.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useTheme } from "styled-components";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Customized,
} from "recharts";

import {
  Container,
  ChartContainer,
  LegendContainer,
  Legend,
  Header,
  UnitLabel,
} from "./styled";

import ChartNav from "../ChartNav";

/**
 * Propriedades do componente HistoryBox.
 *
 * @property data - Array de pontos, cada um com `timestamp` (ISO) e chaves numéricas.
 * @property resolvedDeviceId - DeviceId resolvido para buscar `setupalarms`.
 * @property externalColorsMap - (Opcional) Mapa de cores por chave (sobrescreve as geradas).
 *
 * @property windowFraction - (index) Fração do total de pontos na janela (0–1). Default: 0.33.
 * @property minWindowPoints - (index) Mínimo de pontos na janela. Default: 30.
 * @property stepFraction - (index) Fração da janela avançada por clique (0–1). Default: 0.5.
 *
 * @property navMode - 'index' (padrão) ou 'time'.
 * @property bucketSpanSec - (time) Tamanho do bucket em segundos.
 * @property points - (time) Quantidade de pontos na janela.
 * @property domainMin - (time) Limite mínimo do domínio (ISO, Date ou epoch).
 * @property domainMax - (time) Limite máximo do domínio (ISO, Date ou epoch).
 * @property currentRange - (time, controlado) Range atual `{ from, to }` em epoch ms.
 * @property onRangeChange - (time) Callback de paginação se range for controlado externamente.
 */
interface IHistoryBoxProps {
  data: { timestamp: string; [key: string]: string | number | undefined }[];
  resolvedDeviceId: string;
  externalColorsMap?: Record<string, string>;

  /** ======== Navegação por ÍNDICE (local) ======== */
  /** Fração do total de pontos exibida na janela (0–1). Default: 0.33 */
  windowFraction?: number;
  /** Mínimo de pontos na janela. Default: 30 */
  minWindowPoints?: number;
  /** Fração da janela avançada por clique (0–1). Default: 0.5 */
  stepFraction?: number;

  /** ======== Navegação por TEMPO (janela fixa) ======== */
  /** 'index' (padrão) ou 'time' */
  navMode?: "index" | "time";
  /** Tamanho do bucket em segundos (ex.: 5) */
  bucketSpanSec?: number;
  /** Quantidade de pontos na janela (ex.: 120) */
  points?: number;
  /** Limite mínimo de domínio (ISO, Date ou epoch) */
  domainMin?: string | number | Date;
  /** Limite máximo de domínio (ISO, Date ou epoch) */
  domainMax?: string | number | Date;
  /** (Opcional, controlado) Range atual em epoch ms */
  currentRange?: { from: number; to: number };
  /** (Opcional) Callback para paginação via backend no modo 'time' */
  onRangeChange?: (range: { from: number; to: number }) => void;
}

/** Item do setup com limites e unidade usado para validação e eixos. */
interface SetupConfigItem {
  mínimo: number;
  máximo: number;
  unidade: string;
}

/** Paleta default rotativa para colorir séries quando `externalColorsMap` não é fornecido. */
const availableColors = [
  "#2eff7e",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#a83279",
  "#32a852",
  "#3279a8",
  "#a83232",
  "#d46b08",
  "#006d75",
  "#9254de",
  "#f759ab",
  "#fa8c16",
  "#08979c",
  "#f5222d",
  "#2f54eb",
  "#13c2c2",
  "#52c41a",
];

/**
 * Sanitiza uma chave para uso como id de gradiente SVG.
 * @param key - Nome da série (pode conter espaços/acentos).
 * @returns Id seguro no formato `fill_<key>`.
 */
const safeId = (key: string) => `fill_${key.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

/**
 * Converte tipos diversos para epoch ms.
 * @param t - ISO string, epoch, Date ou undefined.
 * @returns epoch ms ou `undefined` se inválido.
 */
const toMs = (t?: string | number | Date) => {
  if (t === undefined) return undefined;
  if (typeof t === "number") return t;
  if (t instanceof Date) return t.getTime();
  const ms = Date.parse(t);
  return isNaN(ms) ? undefined : ms;
};

/**
 * Converte `timestamp` ISO para epoch ms.
 * @param iso - Timestamp em ISO 8601.
 * @returns epoch ms ou `undefined` se inválido.
 */
const tsToMs = (iso: string) => {
  const ms = Date.parse(iso);
  return isNaN(ms) ? undefined : ms;
};

/**
 * Alinha um tempo para baixo no múltiplo de `bucketMs`.
 * @param t - Tempo base em ms.
 * @param bucketMs - Tamanho do bucket em ms.
 * @returns Tempo alinhado para baixo.
 */
const alignDown = (t: number, bucketMs: number) =>
  Math.floor(t / bucketMs) * bucketMs;

/**
 * Componente principal para exibir séries temporais com navegação.
 *
 * @param props - Ver {@link IHistoryBoxProps}.
 * @returns JSX.Element contendo cabeçalho (legenda/unidade) e o AreaChart.
 *
 * @remarks
 * - **Index mode** pagina localmente por fatias do array (`windowFraction`).
 * - **Time mode** pagina por range fixo `bucketSpanSec`×`points`, com controle
 *   interno ou externo via `currentRange`/`onRangeChange`.
 * - Quando há **apenas uma série visível**, valores fora de `[mínimo,máximo]`
 *   são convertidos em `undefined` para limpar o gráfico (sem “picos” falsos).
 *
 * @note
 * O fetch de `setupalarms` é feito em `resolvedDeviceId` e, na ausência de
 * `externalColorsMap`, um mapa de cores é gerado por ordem das chaves.
 */
const HistoryBox: React.FC<IHistoryBoxProps> = ({
  data,
  resolvedDeviceId,
  externalColorsMap,

  // índice/local (default)
  windowFraction = 0.33,
  minWindowPoints = 30,
  stepFraction = 0.5,

  // tempo/janela fixa
  navMode = "index",
  bucketSpanSec,
  points,
  domainMin,
  domainMax,
  currentRange,
  onRangeChange,
}) => {
  const theme = useTheme();
  const isDark = theme.title === "dark";

  const [setupConfig, setSetupConfig] = useState<
    Record<string, SetupConfigItem>
  >({});
  const [colorsMap, setColorsMap] = useState<Record<string, string>>({});
  const [hiddenKeys, setHiddenKeys] = useState<string[]>([]);
  const setupKeys = useMemo(() => Object.keys(setupConfig), [setupConfig]);
  const activeColorsMap = externalColorsMap ?? colorsMap;

  // Carrega limites/unidades e gera mapa de cores (se necessário)
  useEffect(() => {
    if (!resolvedDeviceId) return;
    axios
      .get(`http://localhost:3000/${resolvedDeviceId}/setupalarms`)
      .then((res) => {
        setSetupConfig(res.data);
        if (!externalColorsMap) {
          const generated = Object.keys(res.data).reduce((acc, key, idx) => {
            acc[key] = availableColors[idx % availableColors.length];
            return acc;
          }, {} as Record<string, string>);
          setColorsMap(generated);
        }
      })
      .catch((err) => console.error("Erro ao carregar setupConfig:", err));
  }, [resolvedDeviceId, externalColorsMap]);

  /** Chaves válidas  */
  const validKeys = useMemo(() => {
    const keysFromSetup = Object.keys(setupConfig);
    return keysFromSetup.filter((key) =>
      data.some((d) => d[key] !== undefined && !isNaN(Number(d[key])))
    );
  }, [data, setupConfig]);

  /** Chaves visíveis considerando as ocultas via clique na legenda. */
  const visibleKeys = useMemo(
    () => validKeys.filter((k) => !hiddenKeys.includes(k)),
    [validKeys, hiddenKeys]
  );
  /** Quando apenas 1 série está visível, habilita limpeza out-of-range e Y axis fixo. */
  const singleVisible = visibleKeys.length === 1 ? visibleKeys[0] : null;

  /**
   * Limpeza out-of-range quando há uma única série visível.
   * @returns `data` original se não houver série única ou setup; senão, dados com valores fora do range como `undefined`.
   */
  const cleanedData = useMemo(() => {
    if (!singleVisible || !setupConfig[singleVisible]) return data;
    const { mínimo, máximo } = setupConfig[singleVisible];
    return data.map((entry) => {
      const value = Number(entry[singleVisible!]);
      if (isNaN(value) || value < mínimo || value > máximo) {
        return { ...entry, [singleVisible!]: undefined };
      }
      return entry;
    });
  }, [data, singleVisible, setupConfig]);

  // ======================================================
  //                  MODO A — POR ÍNDICE 
  // ======================================================
  // Normalização de frações e mínimos
  const wf = Math.min(1, Math.max(0.05, windowFraction));
  const sf = Math.min(1, Math.max(0.05, stepFraction));
  const minPts = Math.max(1, Math.floor(minWindowPoints));

  /** Tamanho da janela por índice, ancorado no fim ao receber novos dados. */
  const index_windowSize = useMemo(() => {
    const total = cleanedData.length;
    if (total === 0) return 0;
    const byFraction = Math.floor(total * wf);
    return Math.min(total, Math.max(minPts, byFraction));
  }, [cleanedData.length, wf, minPts]);

  const [index_startIdx, setIndexStartIdx] = useState(0);

  useEffect(() => {
    const total = cleanedData.length;
    if (total === 0) {
      setIndexStartIdx(0);
      return;
    }
    const newStart = Math.max(0, total - index_windowSize);
    setIndexStartIdx(newStart);
  }, [cleanedData.length, index_windowSize]);

  const index_maxStart = Math.max(0, cleanedData.length - index_windowSize);
  const index_step = Math.max(1, Math.floor(index_windowSize * sf));
  const index_canPrev = index_startIdx > 0;
  const index_canNext = index_startIdx < index_maxStart;

  const index_displayedData = useMemo(
    () => cleanedData.slice(index_startIdx, index_startIdx + index_windowSize),
    [cleanedData, index_startIdx, index_windowSize]
  );

  const index_handlePrev = () =>
    setIndexStartIdx((s) => Math.max(0, s - index_step));
  const index_handleNext = () =>
    setIndexStartIdx((s) => Math.min(index_maxStart, s + index_step));

  // ======================================================
  //                   MODO B — POR TEMPO 
  // ======================================================
  const isTimeMode =
    navMode === "time" &&
    typeof bucketSpanSec === "number" &&
    typeof points === "number" &&
    points > 0 &&
    bucketSpanSec > 0;

  const bucketMs = isTimeMode
    ? Math.max(1000, Math.floor(bucketSpanSec! * 1000))
    : 0;
  const windowMs = isTimeMode ? Math.max(bucketMs, bucketMs * points!) : 0;

  /** Menor timestamp dos dados em ms (ou undefined). */
  const dataMinMs = useMemo(() => {
    const vals = cleanedData
      .map((d) => tsToMs(d.timestamp))
      .filter((v): v is number => typeof v === "number");
    return vals.length ? Math.min(...vals) : undefined;
  }, [cleanedData]);

  /** Maior timestamp dos dados em ms (ou undefined). */
  const dataMaxMs = useMemo(() => {
    const vals = cleanedData
      .map((d) => tsToMs(d.timestamp))
      .filter((v): v is number => typeof v === "number");
    return vals.length ? Math.max(...vals) : undefined;
  }, [cleanedData]);

  /** Domínios efetivos (prop ou dos dados). */
  const domainMinMs = toMs(domainMin) ?? dataMinMs;
  const domainMaxMs = toMs(domainMax) ?? dataMaxMs;

  /** Range interno quando o componente não é controlado por `currentRange`. */
  const [internalRange, setInternalRange] = useState<{
    from: number;
    to: number;
  } | null>(null);

  /** Inicializa/ancora range no fim do domínio. */
  useEffect(() => {
    if (!isTimeMode || domainMinMs === undefined || domainMaxMs === undefined)
      return;

    const targetTo = currentRange?.to ?? Math.max(domainMinMs, domainMaxMs); // fim do domínio

    const rawFrom = Math.max(domainMinMs, targetTo - windowMs);
    const alignedFrom = alignDown(rawFrom, bucketMs);
    const alignedTo = alignedFrom + windowMs;

    if (!currentRange) {
      setInternalRange({
        from: alignedFrom,
        to: Math.min(alignedTo, domainMaxMs),
      });
    }
  }, [
    isTimeMode,
    bucketMs,
    windowMs,
    domainMinMs,
    domainMaxMs,
    currentRange?.to,
  ]);

  /** Range efetivo . */
  const time_from = currentRange?.from ?? internalRange?.from;
  const time_to = currentRange?.to ?? internalRange?.to;

  /** Flags de navegação prev/next no modo tempo. */
  const time_canPrev =
    !!(isTimeMode && domainMinMs !== undefined && time_from !== undefined) &&
    time_from > domainMinMs;

  const time_canNext =
    !!(isTimeMode && domainMaxMs !== undefined && time_to !== undefined) &&
    time_to < domainMaxMs;

  /** Emite range para o pai (controlado) ou atualiza interno (não-controlado). */
  const emitOrSetRange = (next: { from: number; to: number }) => {
    if (onRangeChange) onRangeChange(next);
    else setInternalRange(next);
  };

  /** Retrocede a janela temporal respeitando o domínio e alinhamento do bucket. */
  const time_handlePrev = () => {
    if (!isTimeMode || domainMinMs === undefined || time_from === undefined)
      return;
    const newFromRaw = Math.max(domainMinMs, time_from - windowMs);
    const newFrom = alignDown(newFromRaw, bucketMs);
    const newTo = newFrom + windowMs;
    emitOrSetRange({ from: newFrom, to: newTo });
  };

  /** Avança a janela temporal respeitando o domínio e alinhamento do bucket. */
  const time_handleNext = () => {
    if (!isTimeMode || domainMaxMs === undefined || time_to === undefined)
      return;
    const newToRaw = Math.min(domainMaxMs, time_to + windowMs);
    const newFrom = alignDown(newToRaw - windowMs, bucketMs);
    const newTo = newFrom + windowMs;
    emitOrSetRange({ from: newFrom, to: newTo });
  };

  /** Dados exibidos no modo tempo filtrando pelo range atual. */
  const time_displayedData = useMemo(() => {
    if (!isTimeMode || time_from === undefined || time_to === undefined)
      return cleanedData;
    return cleanedData.filter((d) => {
      const t = tsToMs(d.timestamp);
      return typeof t === "number" && t >= time_from && t <= time_to;
    });
  }, [isTimeMode, cleanedData, time_from, time_to]);

  // ======================================================
  // =========== Seleção do modo e variáveis ==============
  // ======================================================
  const chartData = isTimeMode ? time_displayedData : index_displayedData;
  const canPrev = isTimeMode ? time_canPrev : index_canPrev;
  const canNext = isTimeMode ? time_canNext : index_canNext;
  const handlePrev = isTimeMode ? time_handlePrev : index_handlePrev;
  const handleNext = isTimeMode ? time_handleNext : index_handleNext;

  return (
    <Container>
      <Header>
        {singleVisible && setupConfig[singleVisible] && (
          <span
            style={{
              textAlign: "right",
              fontSize: 30,
              color: "#ccc",
              paddingRight: 10,
            }}
          >
            {setupConfig[singleVisible].unidade}
          </span>
        )}
        <LegendContainer>
          {setupKeys.map((key) => (
            <Legend
              key={key}
              color={activeColorsMap[key] ?? "#888"} // fallback suave
              onClick={() =>
                setHiddenKeys((prev) =>
                  prev.includes(key)
                    ? prev.filter((k) => k !== key)
                    : [...prev, key]
                )
              }
            >
              <div />
              <span>{key}</span>
            </Legend>
          ))}
        </LegendContainer>
      </Header>

      <ChartContainer>
        {singleVisible && setupConfig[singleVisible] && (
          <UnitLabel>Unidade: {setupConfig[singleVisible].unidade}</UnitLabel>
        )}

        <ResponsiveContainer width="100%" height={400} minWidth={1000}>
          <AreaChart
            height={400}
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            {/* Gradientes das séries VISÍVEIS (IDs sanitizados) */}
            <defs>
              {visibleKeys.map((key) => {
                const color = activeColorsMap[key];
                const id = safeId(key);
                return (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>

            <CartesianGrid
              stroke={isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}
              vertical={false}
            />

            <XAxis
              dataKey="timestamp"
              stroke={isDark ? "#f0f0f0" : "#000"}
              tick={{ fontSize: 14, fill: isDark ? "#f0f0f0" : "#000" }}
              tickLine={false}
              axisLine={{ stroke: isDark ? "#ccc" : "#000" }}
            />

            {singleVisible && setupConfig[singleVisible] && (
              <YAxis
                domain={[
                  setupConfig[singleVisible].mínimo,
                  setupConfig[singleVisible].máximo,
                ]}
                stroke={isDark ? "#f0f0f0" : "#000"}
                tick={{ fontSize: 14, fill: isDark ? "#f0f0f0" : "#000" }}
                tickLine={false}
                axisLine={{ stroke: isDark ? "#ccc" : "#000" }}
                width={60}
                tickFormatter={(value) =>
                  typeof value === "number" ? value.toFixed(3) : (value as any)
                }
              />
            )}

            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #ccc",
                borderRadius: 8,
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}
              itemStyle={{ color: "#333", fontSize: 13 }}
              formatter={(value) => {
                const num = Number(value);
                return isNaN(num) ? "-" : num.toFixed(2);
              }}
            />

            {validKeys.map((key) => {
              const hidden = hiddenKeys.includes(key);
              const color = activeColorsMap[key];
              const id = safeId(key);
              const showFill = !hidden && singleVisible === key;

              return (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  hide={hidden}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                  fill={showFill ? `url(#${id})` : "none"}
                  fillOpacity={1}
                />
              );
            })}

            <Customized
              component={
                <ChartNav
                  canPrev={!!canPrev}
                  canNext={!!canNext}
                  onPrev={handlePrev}
                  onNext={handleNext}
                />
              }
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Container>
  );
};

export default HistoryBox;
