
import React from "react";
import { Container } from "./styled";

/**
 * Informações de status OPC UA opcionalmente exibidas no card.
 */
export type OpcStatus = {
  /** Conexão atual do cliente OPC UA. */
  connected: boolean;
  /** ISO datetime da última criação de sessão. */
  lastSessionCreated: string | null;
  /** ISO datetime da última leitura efetuada. */
  lastReadTimestamp: string | null;
  /** Mensagem do último erro (se houver). */
  lastError: string | null;
  /** Latência da última leitura (ms). */
  lastLatencyMs: number | null;
  /** Duração da sessão corrente (ms). */
  sessionDurationMs: number | null;
  /** Número total de leituras realizadas na sessão. */
  readCount: number;
  /** Falhas de leitura por NodeId (acumulado). */
  readFailures: Record<string, number>;
};

/**
 * Propriedades do cartão de configurações/status do cliente.
 */
export interface IMessageBox {
  /** Título do card (aparece ao lado do ícone). */
  title?: string;
  /** Descrição abaixo do título. */
  description?: string;
  /** Texto do rodapé. */
  footertext?: string;
  /** Bloco opcional extra (renderizado após o header). */
  extraInfo?: React.ReactNode;
  /** URL do ícone a ser renderizado no header. */
  icon: string;
  /** Status OPC UA (quando presente, renderiza bloco detalhado). */
  opcStatus?: OpcStatus;
}

/**
 * Card de configurações/status do cliente OPC UA.
 *
 * ### Responsabilidades
 * - Renderizar título, descrição, ícone e rodapé.
 * - Quando `opcStatus` é fornecido, exibir bloco com dados operacionais.
 * - Permitir conteúdo extra via `extraInfo`.
 *
 * @param {IMessageBox} props Propriedades do componente (texto/ícone/status).
 * @param {string} [props.title]        Título exibido.
 * @param {string} [props.description]  Descrição do card.
 * @param {string} [props.footertext]   Texto do rodapé.
 * @param {React.ReactNode} [props.extraInfo] Bloco extra após o header.
 * @param {string} props.icon           Caminho/URL do ícone do card.
 * @param {OpcStatus} [props.opcStatus] Status OPC UA detalhado a exibir.
 * @returns {JSX.Element} Card visual contendo as informações configuradas.
 */
const ClientSettings: React.FC<IMessageBox> = ({
  title,
  description,
  footertext,
  extraInfo,
  icon,
  opcStatus,
}) => {
  return (
    <Container>
      <header>
        <div>
          <h1>
            {title}
            <img src={icon} alt={title} />
          </h1>
          <p>{description}</p>
        </div>
      </header>

      {extraInfo && <div style={{ marginTop: "10px" }}>{extraInfo}</div>}

      {opcStatus && (
        <div
          style={{
            marginTop: "0px",
            padding: "10px",
            borderRadius: "6px",
            color: "#ffffff",
            fontSize: "1.15rem",
          }}
        >
          <strong style={{ fontSize: "1rem" }}>
            {opcStatus.connected ? "🟢 Conectado" : "🔴 Desconectado"}
          </strong>
          <br />
          📆 Última sessão: {opcStatus.lastSessionCreated ?? "–"}
          <br />
          ⏱️ Última leitura: {opcStatus.lastReadTimestamp ?? "–"}
          <br />
          🚀 Latência: {opcStatus.lastLatencyMs ?? "–"} ms
          <br />
          🔁 Leituras realizadas: {opcStatus.readCount}
          <br />
          🕒 Duração da sessão: {opcStatus.sessionDurationMs ?? "–"} ms
          <br />
          ⚠️ Erros por nó:{" "}
          {Object.keys(opcStatus.readFailures).length > 0
            ? Object.entries(opcStatus.readFailures)
                .map(([k, v]) => `${k} (${v})`)
                .join(", ")
            : "Nenhum"}
        </div>
      )}

      <footer>
        <span>{footertext}</span>
      </footer>
    </Container>
  );
};

export default ClientSettings;
