
import React, { useEffect, useMemo, useState } from "react";
import { useDevice } from "../../components/DeviceContext/DeviceContext";

import {
  Container,
  Header,
  AlertCard,
  CardHeader,
  TagName,
  Value,
  Badges,
  Badge,
  Meta,
  Timestamp,
  Recipients,
  EmptyState,
  ErrorBox,
  Loading,
} from "./styled";

/** Estrutura base do payload de alerta (pares chave-valor do backend). */
type AlertData = Record<string, string | number>;

/**
 * Entrada de alerta retornada pelo backend.
 * - `alertData` contém o valor do tag e metadados (Desvio, AlertsCount, etc.).
 */
type AlertEntry = {
  timestamp: string;
  alertData: AlertData;
  recipients: string[];
  clientId?: string;
};

/** Conjunto de chaves tratadas como metadados (não são o nome do tag). */
const KNOWN_META = new Set(["Desvio", "AlertsCount", "Unidade"]);

/**
 * Lista de alertas enviados para o client ativo.
 *
 * ### Responsabilidades
 * - Resolver o id do client (deviceXX → ClientXX).
 * - Buscar `/{ClientXX}/alerts-sent` no backend.
 * - Tratar estados de loading/erro e renderizar o histórico em cards.
 *
 * @returns {JSX.Element} Lista paginável de alertas enviados com estados de carregamento/erro.
 */
const AlertsSent: React.FC = ()  => {
  /** Client atual (do contexto global). */
  const { deviceId } = useDevice();

  /** Base do backend (mantida). */
  const API_BASE = "http://localhost:3000";

  /**
   * Converte ids iniciados com "device" para "Client".
   * Ex.: "device01" → "Client01".
   *
   * @returns {string} Identificador normalizado do client ou string vazia quando não definido.
   */
  const resolvedDeviceId = useMemo((): string => {
    if (!deviceId) return "";
    return deviceId.startsWith("device")
      ? deviceId.replace("device", "Client")
      : deviceId;
  }, [deviceId]);

  /** Lista de alertas carregados. */
  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  /** Flag de carregamento. */
  const [loading, setLoading] = useState(false);
  /** Mensagem de erro (caso ocorra). */
  const [error, setError] = useState<string | null>(null);

  /**
   * Efeito: busca o histórico de alertas do client atual.
   * - Endpoint: `GET /{ClientXX}/alerts-sent`
   * - Trate aborts para evitar setState após unmount/rerender.
   */
  useEffect(() => {
    if (!resolvedDeviceId) return;

    const controller = new AbortController();
    let active = true; // evita setState após unmount

    (async () => {
      if (!active) return;
      setLoading(true);
      setError(null);
      try {
        const url = `${API_BASE}/${resolvedDeviceId}/alerts-sent`;
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
        if (!active) return;
        setAlerts(Array.isArray(data) ? data : []);
      } catch (e: any) {
        // IGNORA aborts (StrictMode/unmount/troca de device)
        const msg = String(e?.message || "");
        if (e?.name === "AbortError" || msg.toLowerCase().includes("aborted")) {
          console.log("[AlertsSent] request aborted (cleanup/rerender)");
          return;
        }
        console.error("Falha ao buscar alertas:", e);
        if (active) setError(msg || "Erro ao carregar alertas");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [resolvedDeviceId, API_BASE]);

  /**
   * Renderiza um card para um alerta.
   * - Extrai o nome do tag (primeira chave que não seja metadado).
   * - Mostra severidade (Desvio), contagem (AlertsCount), demais metadados,
   *   timestamp (localizado) e destinatários.
   *
   * @param {AlertEntry} alert  Registro de alerta retornado pelo backend.
   * @param {number}     idx    Índice do item na lista (usado na key de fallback).
   * @returns {JSX.Element}     Card com informações do alerta.
   */
  const renderCard = (alert: AlertEntry, idx: number) => {
    // Nome do tag: primeiro campo que não seja metadado
    const tagName =
      Object.keys(alert.alertData).find((k) => !KNOWN_META.has(k)) ||
      "(sem tag)";

    const value = alert.alertData[tagName];
    const desvio = alert.alertData["Desvio"];
    const count = alert.alertData["AlertsCount"];
    const unit = String(alert.alertData["Unidade"] ?? "").trim();

    const valueCore =
      typeof value === "number"
        ? value.toLocaleString("en-US") 
        : String(value ?? "");
    const valueWithUnit = unit ? `${valueCore} ${unit}` : valueCore;

    // Demais metadados úteis (se houver)
    const extraMeta = Object.entries(alert.alertData).filter(
      ([k]) => k !== tagName && !KNOWN_META.has(k)
    );

    const when = (() => {
      const d = new Date(alert.timestamp);
      return isNaN(d.getTime()) ? alert.timestamp : d.toLocaleString("pt-BR");
    })();

    const level = desvio != null ? String(desvio).toUpperCase() : null;

    return (
      <AlertCard key={`${alert.timestamp}-${idx}`}>
        <CardHeader>
          <TagName title={tagName}>{tagName}</TagName>
          <Value>
            Value: <strong>{valueWithUnit}</strong>
          </Value>
        </CardHeader>

        <Badges>
          {level && (
            <Badge title="Deviation type" data-level={level}>
              Detour: {level}
            </Badge>
          )}
          {count != null && (
            <Badge title="Occurrences during the period">
              Occurrences: {Number(count)}
            </Badge>
          )}
        </Badges>

        {!!extraMeta.length && (
          <Meta>
            {extraMeta.map(([k, v]) => (
              <span key={k}>
                <strong>{k}:</strong> {String(v)}
              </span>
            ))}
          </Meta>
        )}

        <Timestamp>{when}</Timestamp>
        <Recipients>
          To:{" "}
          {Array.isArray(alert.recipients) && alert.recipients.length
            ? alert.recipients.join(", ")
            : "—"}
        </Recipients>
      </AlertCard>
    );
  };

  return (
    <Container>
      <Header>Alerts Sent</Header>

      {loading && <Loading>Loading alerts…</Loading>}

      {!!error && (
        <ErrorBox>
          There was a problem loading the alerts.: <em>{error}</em>
        </ErrorBox>
      )}

      {!loading && !error && alerts.length === 0 && (
        <EmptyState>No alerts sent yet.</EmptyState>
      )}

      {!loading && !error && alerts.map(renderCard)}
    </Container>
  );
};

export default AlertsSent;
