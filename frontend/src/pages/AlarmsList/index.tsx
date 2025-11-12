// src/pages/AlarmsList/index.tsx

import React, { useEffect, useMemo, useState } from "react";
import ContentHeader from "../../components/ContentHeader";
import SelectInput from "../../components/Olds/SelectInput";
import { SelectWrapper } from "../../components/Olds/SelectInput/style";
import formatDate from "../../utils/formatDate";
import formatCurrency from "../../utils/formatCurrency";
import listmonths from "../../utils/months";
import listdays from "../../utils/days";
import HistoryAlertsCard from "../../components/HistoryAlertsCard";
import { Container, Content, Filters, ScrollableList } from "./styled";
import { unitMap } from "../../utils/sensorConfig";
import { rangeMap } from "../../utils/sensorConfig";

export type TransmiterData = Record<string, number> & { timestamp: string };

const limits = {
  "Entrada TRC001 - FT01": { min: 1000, max: 5000 },
  "Demineralized Water Soda Dilution Flow - FT02": { min: 10, max: 40 },
  "Demineralized Water Hydrochloric Acid Dilution Flow - FT03": {
    min: 2000,
    max: 18000,
  },
  "Succion Pressure Pumps - PT01": { min: 1, max: 4 },
  "Pressure Input TRC001 - PT02": { min: 1, max: 4 },
  "Pressure Out TRC001 - PT03": { min: 1, max: 4 },
  "Pressure Input TRC002 - PT04": { min: 1, max: 4 },
  "Pressure Out TRC002 - PT05": { min: 1, max: 4 },
  "Pressure Input TRC003 - PT06": { min: 1, max: 4 },
  "Pressure Out TRC003 - PT06": { min: 1, max: 4 },
  "Condutivity Water Recirculation Water Desmineralized - CT01": {
    min: 0,
    max: 2,
  },
  "Condutivity Water Recirculation Water Desmineralized - CT02": {
    min: 0,
    max: 2,
  },
  "TanK Demineralized Water Level - LT01": { min: 0, max: 100 },
  "TanK Client Demineralized Water Level - LT02": { min: 0, max: 100 },
} as const;

type LimitKey = keyof typeof limits;

const AlarmsList: React.FC = () => {
  const [firstDaySelected, setFirstDaySelected] = useState<number>(1);
  const [endDaySelected, setEndDaySelected] = useState<number>(1);
  const [transmitersData, setTransmitersData] = useState<TransmiterData[]>([]);
  const [monthSelected, setMonthSelected] = useState<number>(6);
  const [yearSelected, setYearSelected] = useState<number>(2025);
  const [availableYears, setAvailableYears] = useState<
    { value: string; label: string }[]
  >([]);
  const [filter, setFilter] = useState<"all" | "above" | "below">("all");

  const firstDay = useMemo(
    () =>
      listdays.map((day, index) => ({
        value: String(index + 1),
        label: String(day),
      })),
    []
  );
  const endDay = useMemo(
    () =>
      listdays.map((day, index) => ({
        value: String(index + 1),
        label: String(day),
      })),
    []
  );

  const months = useMemo(
    () =>
      listmonths.map((month, index) => ({
        value: String(index + 1),
        label: String(month),
      })),
    []
  );

  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const response = await fetch("http://localhost:3000/available-years");
        const yearsData: number[] = await response.json();
        const yearsOptions = yearsData.map((year) => ({
          value: String(year),
          label: String(year),
        }));
        setAvailableYears(yearsOptions);
      } catch (error) {
        console.error("Erro ao buscar anos disponíveis:", error);
      }
    };
    fetchAvailableYears();
  }, []);

  useEffect(() => {
    const fetchTransmiters = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/device01/transmiters?month=${monthSelected}&year=${yearSelected}&firstDay=${firstDaySelected}&endDay=${endDaySelected}`
        );
        const data = await res.json();

        const formatted = data.map((item: any) => {
          const date = new Date(item.timestamp);
          const numericFields = Object.fromEntries(
            Object.keys(limits).map((key) => [key, Number(item[key] ?? 0)])
          );
          return {
            ...numericFields,
            timestamp: date.toISOString(),
          } as TransmiterData;
        });

        setTransmitersData(formatted);
      } catch (err) {
        console.error("Erro ao buscar transmiters:", err);
      }
    };
    fetchTransmiters();
  }, [monthSelected, yearSelected, firstDaySelected, endDaySelected]);

  const alarmData = useMemo(() => {
    return transmitersData.flatMap((item) => {
      return (Object.keys(limits) as LimitKey[]).flatMap((key) => {
        const rawValue = item[key];
        const value =
          typeof rawValue === "number" ? rawValue : Number(rawValue);
        const { min, max } = limits[key];

        if (typeof value !== "number" || isNaN(value)) return [];

        const isBelow = value < min;
        const isAbove = value > max;

        const matchesFilter =
          filter === "all" ||
          (filter === "above" && isAbove) ||
          (filter === "below" && isBelow);

        if (!matchesFilter) return [];

        const unit = unitMap[key] || "";

        return {
          id: `${key}-${item.timestamp}`,
          description: key,
          amountFormatted: `${value.toFixed(2)} ${unit}`,
          frenquency: isBelow ? "Abaixo do Limite" : "Acima do Limite",
          dataFormatted: formatDate(item.timestamp),
          tagColor: isBelow ? "#F7931B" : " #E44C4E",
        };
      });
    });
  }, [transmitersData, filter]);

  const handleFirstDaySelected = (day: string) =>
    setFirstDaySelected(Number(day));
  const handleEndDaySelected = (day: string) => setEndDaySelected(Number(day));
  const handleMonthSelected = (month: string) =>
    setMonthSelected(Number(month));
  const handleYearSelected = (year: string) => setYearSelected(Number(year));

  return (
    <Container>
      <ContentHeader title="Alarmes de Desvios" lineColor="#e8f71b" />
      <SelectWrapper>
        <SelectInput
          options={availableYears}
          onChange={(e) => handleYearSelected(e.target.value)}
          defaultValue={yearSelected}
        />
        <SelectInput
          options={months}
          onChange={(e) => handleMonthSelected(e.target.value)}
          defaultValue={monthSelected}
        />
        <SelectInput
          options={firstDay}
          onChange={(e) => handleFirstDaySelected(e.target.value)}
          defaultValue={firstDaySelected}
        />
        <SelectInput
          options={endDay}
          onChange={(e) => handleEndDaySelected(e.target.value)}
          defaultValue={endDaySelected}
        />
      </SelectWrapper>

      <Filters>
        <button
          className={`tag-filter-above ${filter === "above" ? "active" : ""}`}
          onClick={() => setFilter("above")}
        >
          <h1>High Alerts</h1>
        </button>
        <button
          className={`tag-filter-below ${filter === "below" ? "active" : ""}`}
          onClick={() => setFilter("below")}
        >
          <h1>Low Alerts</h1>
        </button>
        <button
          className={`tag-filter-all ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          <h1>Todos</h1>
        </button>
      </Filters>

      <Content>
        <ScrollableList>
          {alarmData.map((item) => (
            <HistoryAlertsCard
              key={item.id}
              tagColor={item.tagColor}
              title={item.description}
              subtitle={item.dataFormatted}
              amount={item.amountFormatted}
            />
          ))}
        </ScrollableList>
      </Content>
    </Container>
  );
};

export default AlarmsList;
