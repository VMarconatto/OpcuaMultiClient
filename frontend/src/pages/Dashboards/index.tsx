/**
** =======================================================
@SECTION  : Dashboard — Analytics & History
@FILE     : src/pages/Dashboard/index.tsx
@PURPOSE  : Exibir métricas de produção, alarmes fora de faixa, gráficos e
            histórico de variáveis OPC UA para o client ativo.
            Integra os componentes WalletBox, PieChartBalance e HistoryBox,
            consumindo dados via API do backend multi-client.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";

// ** Styled Components **
import { Container, Content } from "./styled";

// ** Componentes visuais e contextuais **
import ContentHeader from "../../components/ContentHeader/index";
import TotalizerBox from "../../components/TotalizerBox";
import PieChartBalance from "../../components/PieChart";
import HistoryBox from "../../components/HistoryBox";
import SetLineColor from "../../components/SetupLineColor";
import DateRangePicker from "../../components/DateRangePicker";
import ClientPicker from "../../components/ClientPicker";
import { useDevice } from "../../components/DeviceContext/DeviceContext";

// ** Interfaces e Tipos auxiliares **
import { IContentHeaderProps } from "../../components/ContentHeader/index";
import { IPieChartProps } from "../../components/PieChart";

// ** Utils **
import listmonths from "../../utils/months";
import listdays from "../../utils/days";

/**
 * Componente principal do Dashboard.
 *
 * ### Responsabilidades
 * - Controlar seleção de cliente (`ClientPicker`) e intervalo temporal (`DateRangePicker`).
 * - Buscar e exibir dados de produção, alarmes e histórico via API REST.
 * - Calcular percentuais de alarmes fora de faixa para o gráfico `PieChartBalance`.
 * - Gerenciar esquema de cores personalizado (`SetLineColor`) para gráficos.
 *
 * @param {ISelectInputProps & IContentHeaderProps & IPieChartProps} props
 *        `controllers` e `children` (encaminhados para o ContentHeader).
 * @param {React.ReactNode} props.children Elementos adicionais a exibir no cabeçalho.
 * @param {any} props.controllers Controles/ações repassados ao `ContentHeader`.
 * @returns {JSX.Element} Tela de dashboard com cards, gráfico de pizza e histórico.
 */
const Dashboard: React.FC<
  IContentHeaderProps & IPieChartProps
> = ({ children, controllers }) => {
  /** Contexto global: client ativo */
  const { deviceId, setDeviceId } = useDevice();

  /**
   * Converte `deviceXX` → `ClientXX` para compatibilidade das rotas do backend.
   * @returns {string} Identificador normalizado do client (ex.: "Client01") ou string vazia.
   */
  const resolvedDeviceId = useMemo((): string => {
    if (!deviceId) return "";
    return deviceId.startsWith("device")
      ? deviceId.replace("device", "Client")
      : deviceId;
  }, [deviceId]);

  // === Estados de data/hora selecionada ===
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();

  const [firstDaySelected, setFirstDaySelected] = useState<number>(1);
  const [endDaySelected, setEndDaySelected] = useState<number>(lastDayOfMonth);
  const [monthSelected, setMonthSelected] = useState<number>(currentMonth);
  const [yearSelected, setYearSelected] = useState<number>(currentYear);
  const [firstHourSelected, setFirstHourSelected] = useState<number>(0);
  const [endHourSelected, setEndHourSelected] = useState<number>(23);

  // === Estados de dados e metadados ===
  const [transmitersData, setTransmitersData] = useState<any[]>([]);
  const [totals, setTotals] = useState<any | null>(null);
  const [setupConfig, setSetupConfig] = useState<Record<string, any>>({});
  const [colorsMap, setColorsMap] = useState<Record<string, string>>({});
  const [availableYears, setAvailableYears] = useState<
    { value: string; label: string }[]
  >([]);

  /**
   * Lista de dias finais para o seletor.
   * @returns {{value:string,label:string}[]} Opções para o Select de dias.
   */
  const endDay = useMemo(
    (): { value: string; label: string }[] =>
      listdays.map((day, index) => ({
        value: String(index + 1),
        label: String(day),
      })),
    []
  );

  /**
   * Lista de dias iniciais (mesmo array de `endDay`, reaproveitado).
   * @returns {{value:string,label:string}[]} Opções para o Select de dias.
   */
  const firstDay = useMemo(() => endDay, [endDay]);

  /**
   * Lista de meses para o seletor.
   * @returns {{value:string,label:string}[]} Opções para o Select de meses.
   */
  const months = useMemo(
    (): { value: string; label: string }[] =>
      listmonths.map((month, index) => ({
        value: String(index + 1),
        label: String(month),
      })),
    []
  );

  /**
   * Efeito 1 — carrega setup de alarmes do client.
   * Endpoint: `/ClientXX/setupalarms`
   */
  useEffect(() => {
    if (!resolvedDeviceId) return;
    axios
      .get(`http://localhost:3000/${resolvedDeviceId}/setupalarms`)
      .then((res) => setSetupConfig(res.data))
      .catch(console.error);
  }, [resolvedDeviceId]);

  /**
   * Efeito 2 — busca dados históricos de transmissores no intervalo selecionado.
   * Endpoint: `/ClientXX/transmiters?month=&year=&firstDay=&endDay=&firstHour=&endHour=`
   */
  useEffect(() => {
    if (!resolvedDeviceId) return;

    /**
     * Busca a série de transmissores no período atual.
     * Aplica saneamento nas horas (0–23) e garante `firstHour <= endHour`.
     * @returns {Promise<void>} Promessa resolvida após atualizar o estado local.
     */
    const fetchTransmiters = async (): Promise<void> => {
      if (firstDaySelected > endDaySelected) return;
      const fh = Math.max(0, Math.min(23, firstHourSelected));
      const eh = Math.max(fh, Math.min(23, endHourSelected));
      try {
        const url =
          `http://localhost:3000/${resolvedDeviceId}/transmiters` +
          `?month=${monthSelected}&year=${yearSelected}` +
          `&firstDay=${firstDaySelected}&endDay=${endDaySelected}` +
          `&firstHour=${fh}&endHour=${eh}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === "ok" && Array.isArray(data.exemplo))
          setTransmitersData(data.exemplo);
        else setTransmitersData([]);
      } catch (error) {
        console.error("Erro ao buscar transmiters:", error);
      }
    };

    fetchTransmiters();
  }, [
    resolvedDeviceId,
    monthSelected,
    yearSelected,
    firstDaySelected,
    endDaySelected,
    firstHourSelected,
    endHourSelected,
  ]);

  /**
   * Efeito 3 — busca totais agregados.
   * Endpoint: `/ClientXX/transmiters/total?...`
   */
  useEffect(() => {
    if (!resolvedDeviceId) return;
    const fh = Math.max(0, Math.min(23, firstHourSelected));
    const eh = Math.max(fh, Math.min(23, endHourSelected));
    fetch(
      `http://localhost:3000/${resolvedDeviceId}/transmiters/total?month=${monthSelected}&year=${yearSelected}` +
        `&firstDay=${firstDaySelected}&endDay=${endDaySelected}` +
        `&firstHour=${fh}&endHour=${eh}`
    )
      .then((res) => res.json())
      .then(setTotals)
      .catch(console.error);
  }, [
    resolvedDeviceId,
    monthSelected,
    yearSelected,
    firstDaySelected,
    endDaySelected,
    firstHourSelected,
    endHourSelected,
  ]);

  /**
   * Efeito 4 — carrega lista de anos disponíveis para o seletor.
   * Endpoint: `/ClientXX/available-years`
   */
  useEffect(() => {
    if (!resolvedDeviceId) return;
    fetch(`http://localhost:3000/${resolvedDeviceId}/available-years`)
      .then((res) => res.json())
      .then((json) =>
        setAvailableYears(
          json.map((year: number) => ({
            value: String(year),
            label: String(year),
          }))
        )
      )
      .catch(console.error);
  }, [resolvedDeviceId]);

  /**
   * Calcula os percentuais de variáveis fora de faixa (alarme)
   * com base em `setupConfig` e dados de transmissor.
   * Base para o gráfico `PieChartBalance`.
   *
   * @returns {Array<{name:string,value:number,percent:number,color:string}>}
   *          Lista agregada por variável com contagem e percentual de desvios.
   */
  const pieChartOutOfRangeData = useMemo(() => {
    const outOfRangeCount: Record<string, number> = {};
    let totalDeviations = 0;

    Object.keys(setupConfig).forEach((key) => {
      outOfRangeCount[key] = 0;
    });

    transmitersData.forEach((item) => {
      Object.entries(setupConfig).forEach(([key, cfg]) => {
        const value = item[key];
        if (typeof value !== "number") return;

        let localDeviation = 0;

        if (cfg.SPAlarmL !== undefined && value < cfg.SPAlarmL) localDeviation++;
        if (cfg.SPAlarmLL !== undefined && value < cfg.SPAlarmLL)
          localDeviation++;
        if (cfg.SPAlarmH !== undefined && value > cfg.SPAlarmH) localDeviation++;
        if (cfg.SPAlarmHH !== undefined && value > cfg.SPAlarmHH)
          localDeviation++;

        outOfRangeCount[key] += localDeviation;
        totalDeviations += localDeviation;
      });
    });

    if (totalDeviations === 0) return [];

    return Object.entries(outOfRangeCount).map(([key, count]) => ({
      name: key,
      value: count,
      percent: (count / totalDeviations) * 100,
      color: colorsMap[key] ?? "#ccc",
    }));
  }, [transmitersData, setupConfig, colorsMap]);

  /**
   * Handler para troca de client no `ClientPicker`.
   * @param {string} selectedId ID do client (ex.: "Client01").
   * @returns {void}
   */
  const handleSelectConnection = (selectedId: string): void => {
    setDeviceId(selectedId);
    console.log(`Device ativo atualizado para: ${selectedId}`);
  };

  // === Render principal ===
  return (
    <Container>
      <ContentHeader
        title="Dashboard"
        lineColor="#F7931B"
        controllers={controllers}
      >
        {children}
        <SelectWrapper>
          <ClientPicker selectedClientId={deviceId} onChange={setDeviceId} />
          <DateRangePicker
            years={availableYears}
            months={months}
            days={firstDay}
            yearSelected={yearSelected}
            setYearSelected={setYearSelected}
            monthSelected={monthSelected}
            setMonthSelected={setMonthSelected}
            firstDaySelected={firstDaySelected}
            setFirstDaySelected={setFirstDaySelected}
            endDaySelected={endDaySelected}
            setEndDaySelected={setEndDaySelected}
            firstHourSelected={firstHourSelected}
            setFirstHourSelected={setFirstHourSelected}
            endHourSelected={endHourSelected}
            setEndHourSelected={setEndHourSelected}
          />
        </SelectWrapper>
      </ContentHeader>

      <Content>
        <TotalizerBox
          title="Production"
          amount={totals?.total_FT01 || 0}
          color="#2563eb"
          unit="M³"
          icon="Droplet"
        />
        <TotalizerBox
          title="Caustic Soda Regeneration"
          amount={totals?.total_FT02 || 0}
          color="#db2777"
          unit="M³"
          icon="Droplet"
        />
        <TotalizerBox
          title="Hydrochloric Acid Regeneration"
          amount={totals?.total_FT03 || 0}
          color="#db7527"
          unit="M³"
          icon="Droplet"
        />
        <PieChartBalance data={pieChartOutOfRangeData} options={[]} onChange={() => {}} />
        <SetLineColor resolvedDeviceId={resolvedDeviceId} onColorsMapChange={setColorsMap} />
        <HistoryBox
          data={transmitersData}
          resolvedDeviceId={resolvedDeviceId}
          externalColorsMap={colorsMap}
        />
      </Content>
    </Container>
  );
};

export default Dashboard;
