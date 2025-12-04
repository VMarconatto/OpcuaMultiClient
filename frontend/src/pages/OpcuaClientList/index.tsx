/**
** =======================================================
@SECTION  : OPC UA — Client List & Status Board
@FILE     : src/pages/OpcuaClientList/index.tsx
@PURPOSE  : Listar todos os clients OPC UA configurados, exibir o status
            de comunicação (ativo/inativo/checando) e permitir a seleção de
            um client para edição/ativação no formulário ao lado
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import OpcuaClientForm from "../OpcuaSetup";
import {
  Container,
  Wrapper,
  ConnectionList,
  ConnectionCard,
  ConnectionName,
  ConnectionIcon,
  Title,
  Subtitle,
  StatusBadge,
} from "./styled";
import { useDevice } from "../../components/DeviceContext/DeviceContext";
import { motion } from "framer-motion";
import { PlugZap } from "lucide-react";

/**
 * Modelo mínimo de um client cadastrado.
 * - `id` corresponde ao identificador do client (ex.: "Client01")
 */
type Connection = {
  id: string;
  applicationName: string;
  endpoint: string;
};

/**
 * Estado de status por client:
 * - "checking" durante a verificação assíncrona,
 * - `true`/`false` quando estabelecido.
 */
type StatusState = "checking" | boolean;

/** Card animado (Framer Motion) reaproveitando o styled `ConnectionCard`. */
const AnimatedCard = motion(ConnectionCard);

/**
 * Tela de listagem/seleção de clients OPC UA.
 *
 * ### Responsabilidades
 * - Buscar os clients registrados (`GET /opcuaclientsetup`).
 * - Consultar o status de cada client (`GET /opcuaclient/status/:id`).
 * - Renderizar cards interativos com feedback (hover/focus/press).
 * - Atualizar o `deviceId` global (contexto) ao selecionar um card.
 *
 * ### Acessibilidade
 * - Cada card é `button` com `aria-pressed` e `aria-label` descritivos.
 * - Badges de status com rótulos textuais (“Checando…/Ativo/Inativo”).
 */
const OpcuaClientList: React.FC = () => {
  /** Lista de clients retornados pelo backend. */
  const [connections, setConnections] = useState<Connection[]>([]);
  /**
   * Mapa `clientId -> status`:
   * - "checking" durante a carga; depois, boolean normalizado.
   */
  const [statusMap, setStatusMap] = useState<Record<string, StatusState>>({});
  /** Client atualmente selecionado no contexto global. */
  const { deviceId, setDeviceId } = useDevice();

  /**
   * Normaliza diferentes formatos de retorno de status do backend
   * para um booleano simples (`true` = ativo/conectado).
   * @param data Resposta bruta do backend (pode variar por versão)
   */
  const normalizeConnected = (data: any): boolean => {
    if (!data) return false;
    if (typeof data.connected === "boolean") return data.connected;
    if (typeof data.isConnected === "boolean") return data.isConnected;
    if (typeof data.running === "boolean") return data.running;
    if (typeof data.status === "string") {
      const s = data.status.toLowerCase();
      if (["running", "connected", "online", "active", "on"].includes(s))
        return true;
      if (["stopped", "disconnected", "offline", "inactive", "off"].includes(s))
        return false;
    }
    if (typeof data === "boolean") return data;
    return false;
  };

  /**
   * Efeito inicial:
   * - Carrega os clients cadastrados.
   * - Inicializa todos os status como "checking".
   * - Faz 1 request de status por client e atualiza o mapa.
   */
  useEffect(() => {
    const fetchConnectionsAndStatuses = async () => {
      try {
        const res = await axios.get("http://localhost:3000/opcuaclientsetup");
        const clients = res.data?.clients || {};

        const parsedConnections: Connection[] = Object.entries(clients).map(
          ([id, config]: [string, any]) => ({
            id,
            applicationName: config.applicationName,
            endpoint: config.endpoint,
          })
        );

        setConnections(parsedConnections);

        // Inicializa como "checking"
        setStatusMap(
          Object.fromEntries(parsedConnections.map((c) => [c.id, "checking"]))
        );

        // Busca de status (1 request por clientId)
        const pairs = await Promise.all(
          parsedConnections.map(async (c) => {
            try {
              const sres = await axios.get(
                `http://localhost:3000/opcuaclient/status/${encodeURIComponent(
                  c.id
                )}`
              );
              const connected = normalizeConnected(sres.data);
              return [c.id, connected] as const;
            } catch (e) {
              console.error(`Erro ao consultar status de ${c.id}:`, e);
              return [c.id, false] as const;
            }
          })
        );

        setStatusMap((prev) => ({ ...prev, ...Object.fromEntries(pairs) }));
      } catch (err) {
        console.error("Erro ao carregar conexões:", err);
      }
    };

    fetchConnectionsAndStatuses();

    // Se desejar polling no futuro:
    // const t = setInterval(fetchConnectionsAndStatuses, 8000);
    // return () => clearInterval(t);
  }, []);

  /**
   * Seleciona um client para edição/ativação no formulário ao lado.
   * @param selectedId ID do client (ex.: "Client01")
   */
  const handleSelectConnection = (selectedId: string) => {
    setDeviceId(selectedId);
    console.log(`Device ativo atualizado para: ${selectedId}`);
  };

  /**
   * Gera rótulos acessíveis por clientId com base no status atual.
   * Ex.: "Checando status" | "Ativo" | "Inativo".
   */
  const statusAria = useMemo(() => {
    const m: Record<string, string> = {};
    for (const [id, st] of Object.entries(statusMap)) {
      m[id] = st === "checking" ? "Checando status" : st ? "Ativo" : "Inativo";
    }
    return m;
  }, [statusMap]);

  return (
    <Container>
      <Title>Registered OPC UA Clients</Title>
      <Subtitle>
        Select one of the clients below to activate it or set up a new client.
      </Subtitle>

      {/* Formulário de configuração/controle do client selecionado */}
      <Wrapper>
        <OpcuaClientForm />
      </Wrapper>

      {/* Grade de cards com todos os clients cadastrados */}
      <ConnectionList>
        {connections.map((conn) => {
          const selected = conn.id === deviceId;
          const status = statusMap[conn.id];
          const isActive = status === true;
          const statusLabel =
            status === "checking"
              ? "Checando..."
              : isActive
              ? "Ativo"
              : "Inativo";

          return (
            <AnimatedCard
              key={conn.id}
              layout
              selected={selected}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
              onClick={() => handleSelectConnection(conn.id)}
              aria-pressed={selected}
              aria-label={`${conn.applicationName}: ${
                statusAria[conn.id] || "Desconhecido"
              }`}
              title={conn.endpoint}
              type="button"
            >
              {/* Ícone (muda de cor conforme status) */}
              <ConnectionIcon
                as={PlugZap}
                aria-hidden
                size={24}
                active={isActive}
              />

              {/* Nome do client */}
              <ConnectionName>{conn.applicationName}</ConnectionName>

              {/* Badge textual de status */}
              <StatusBadge active={isActive}>{statusLabel}</StatusBadge>
            </AnimatedCard>
          );
        })}
      </ConnectionList>
    </Container>
  );
};

export default OpcuaClientList;
