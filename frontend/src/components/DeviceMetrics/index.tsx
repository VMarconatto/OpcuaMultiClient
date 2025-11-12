/**
** =======================================================
@SECTION  : UI — Device Metrics Panel
@FILE     : src/components/DeviceMetrics/index.tsx
@PURPOSE  : Exibir métricas de hardware e rede (CPU, memória, disco, uptime e latência)
            com ícones e layout responsivo — sem alterar lógica.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React from "react";
import { Container } from "./styled";
import {
  FaMicrochip,     // CPU
  FaMemory,        // Memória
  FaHdd,           // Disco
  FaWifi,          // Rede (Latência)
  FaClock          // Uptime
} from "react-icons/fa";

import {
  BarChart, Bar, ResponsiveContainer
} from "recharts";

/**
 * Propriedades esperadas pelo componente DeviceMetrics.
 *
 * @property systemStatus - Conjunto de métricas do sistema (CPU, memória, disco, uptime).
 * @property networkStatus - Estado de rede, incluindo latência em ms.
 * @property title - Título exibido no cabeçalho do painel.
 * @property icon - Caminho opcional para ícone representativo do device.
 * @property description - Descrição opcional do device (atualmente não exibida).
 *
 * @remarks
 * Este componente foi projetado para visualização compacta em painéis de status
 * e pode ser integrado a dashboards de monitoramento OPC UA ou MongoDB.
 */
interface IDeviceMetricsProps {
  systemStatus: {
    cpuLoad: number;
    memoryUsage: number;
    diskUsage: number;
    uptime: number;
  };
  networkStatus: {
    latencyMs: number | null;
  };
  title: string;
  icon?: string;
  description?: string;
}

/**
 * Componente visual para exibição de métricas de dispositivo.
 *
 * @param props - Propriedades do componente.
 * @param props.title - Nome/título do dispositivo.
 * @param props.icon - Caminho para o ícone do dispositivo.
 * @param props.systemStatus - Dados de CPU, memória, disco e uptime.
 * @param props.networkStatus - Dados de latência da rede.
 *
 * @returns JSX.Element contendo informações de desempenho do device.
 *
 * @note
 * O componente não possui estado interno e é puramente funcional.
 * O `uptime` é formatado dinamicamente em horas e minutos.
 */
const DeviceMetrics: React.FC<IDeviceMetricsProps> = ({
  title,
  icon,
  systemStatus,
  networkStatus,
}) => {
  /** Formata o uptime (em segundos) para o formato `xh ym`. */
  const uptime =
    systemStatus?.uptime != null
      ? `${Math.floor(systemStatus.uptime / 3600)}h ${Math.floor(
          (systemStatus.uptime % 3600) / 60
        )}m`
      : "-";

  return (
    <Container>
      <header>
        <h1>
          <img src={icon} alt={title} />
          {title}
        </h1>
      </header>

      <main>
        <p>
          <FaClock size={16} style={{ marginRight: 8, color: '#f1c40f' }} />
          <strong>Uptime:</strong> {uptime}
        </p>
        <p>
          <FaWifi size={16} style={{ marginRight: 8, color: '#3498db' }} />
          <strong>Rede (Latência):</strong> {networkStatus?.latencyMs ?? "-"} ms
        </p>
        <p>
          <FaHdd size={16} style={{ marginRight: 8, color: '#9b59b6' }} />
          <strong>Disco:</strong> {systemStatus?.diskUsage ?? "-"}%
        </p>
        <p>
          <FaMemory size={16} style={{ marginRight: 8, color: '#2ecc71' }} />
          <strong>Memória:</strong> {systemStatus?.memoryUsage ?? "-"} MB
        </p>
        <p>
          <FaMicrochip size={16} style={{ marginRight: 8, color: '#e74c3c' }} />
          <strong>CPU:</strong> {systemStatus?.cpuLoad ?? "-"}%
        </p>
      </main>
    </Container>
  );
};

export default DeviceMetrics;
