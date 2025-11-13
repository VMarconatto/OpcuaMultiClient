/**
** =======================================================
@SECTION  : UI — DateRangePicker (Ano/Mês/Dia + Hora)
@FILE     : src/components/DateRangePicker/index.tsx
@PURPOSE  : Componente dropdown para seleção de intervalo de datas e horas,
            com saneamento básico e fechamento ao clicar fora — sem alterar lógica.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Wrapper,
  ToggleButton,
  Dropdown,
  SelectRow,
  StyledSelect,
} from "./styled";

/**
 * Opção genérica para selects.
 * @property label - Rótulo visível no select.
 * @property value - Valor associado à opção (string).
 */
interface Option {
  label: string;
  value: string;
}

/**
 * Propriedades do DateRangePicker.
 *
 * @remarks
 * - `years`, `months`, `days` devem vir pré-formatados com `label` e `value`.
 * - Horas aceitam 0–23; o componente impede hora final < hora inicial.
 * - O fechamento ao clicar fora é feito via `useEffect` + listener `mousedown`.
 */
interface DateRangePickerProps {
  /** Lista de anos disponíveis. */
  years: Option[];
  /** Lista de meses disponíveis. */
  months: Option[];
  /** Lista de dias disponíveis. */
  days: Option[];

  /** Ano selecionado (numérico). */
  yearSelected: number;
  /** Mês selecionado (1–12). */
  monthSelected: number;
  /** Dia inicial selecionado (1–31 conforme mês). */
  firstDaySelected: number;
  /** Dia final selecionado (1–31 conforme mês). */
  endDaySelected: number;

  /** Atualiza ano selecionado. */
  setYearSelected: (year: number) => void;
  /** Atualiza mês selecionado. */
  setMonthSelected: (month: number) => void;
  /** Atualiza dia inicial selecionado. */
  setFirstDaySelected: (day: number) => void;
  /** Atualiza dia final selecionado. */
  setEndDaySelected: (day: number) => void;

  // >>> NOVO (horas)
  /** Hora inicial (0–23). */
  firstHourSelected: number;
  /** Hora final (0–23, não menor que a inicial). */
  endHourSelected: number;
  /** Atualiza hora inicial. */
  setFirstHourSelected: (hour: number) => void;
  /** Atualiza hora final. */
  setEndHourSelected: (hour: number) => void;
}

/**
 * Componente de seleção de intervalo (data + hora).
 *
 * @param props - Ver {@link DateRangePickerProps}.
 * @returns JSX.Element com botão de toggle e dropdown de selects.
 *
 * @note
 * - A label exibida no botão é gerada por `formatLabel()` usando
 *   `months`, `firstDaySelected`, `endDaySelected`, `firstHourSelected`,
 *   `endHourSelected` e `yearSelected`.
 * - As horas são geradas por `useMemo` (0–23) e exibidas no formato `HH:00`.
 */
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  years,
  months,
  days,
  yearSelected,
  monthSelected,
  firstDaySelected,
  endDaySelected,
  setYearSelected,
  setMonthSelected,
  setFirstDaySelected,
  setEndDaySelected,
  // >>> NOVO
  firstHourSelected,
  endHourSelected,
  setFirstHourSelected,
  setEndHourSelected,
}) => {
  /** Controla a visibilidade do dropdown. */
  const [open, setOpen] = useState(false);
  /** Referência raiz para detectar clique fora. */
  const ref = useRef<HTMLDivElement>(null);

  /**
   * Gera a lista de horas (0–23) memorizada.
   * @returns Array de opções `HH:00`.
   */
  const hours = useMemo<Option[]>(
    () =>
      Array.from({ length: 24 }, (_, h) => ({
        value: String(h),
        label: String(h).padStart(2, "0") + ":00",
      })),
    []
  );

  /**
   * Monta a label exibida no botão (resumo do intervalo).
   * @returns Texto no formato: `Mês DD HH:00 → DD HH:59, AAAA`.
   */
  const formatLabel = () => {
    const monthLabel = months.find(
      (m) => Number(m.value) === monthSelected
    )?.label;
    const fh = String(firstHourSelected).padStart(2, "0");
    const eh = String(endHourSelected).padStart(2, "0");
    return `${monthLabel} ${String(firstDaySelected).padStart(
      2,
      "0"
    )} ${fh}:00 → ${String(endDaySelected).padStart(2, "0")} ${eh}:59, ${yearSelected}`;
  };

  /**
   * Fecha o dropdown quando ocorre clique fora do `Wrapper`.
   * @remarks Listener registrado no `mount` e removido no `unmount`.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /**
   * Saneia e define a hora inicial (0–23); se necessário, ajusta a final.
   * @param val - Novo valor de hora inicial.
   * @note Garante `endHourSelected >= firstHourSelected`.
   */
  const handleFirstHour = (val: number) => {
    const v = Math.max(0, Math.min(23, val));
    setFirstHourSelected(v);
    if (endHourSelected < v) setEndHourSelected(v);
  };

  /**
   * Saneia e define a hora final (0–23) respeitando a hora inicial.
   * @param val - Novo valor de hora final.
   */
  const handleEndHour = (val: number) => {
    const v = Math.max(0, Math.min(23, val));
    setEndHourSelected(Math.max(v, firstHourSelected));
  };

  return (
    <Wrapper ref={ref}>
      <ToggleButton onClick={() => setOpen(!open)}>
        {formatLabel()}
        <span>▼</span>
      </ToggleButton>

      {open && (
        <Dropdown>
          <SelectRow>
            <StyledSelect
              value={String(yearSelected)}
              onChange={(e) => setYearSelected(Number(e.target.value))}
            >
              {years.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </StyledSelect>

            <StyledSelect
              value={String(monthSelected)}
              onChange={(e) => setMonthSelected(Number(e.target.value))}
            >
              {months.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </StyledSelect>

            <StyledSelect
              value={String(firstDaySelected)}
              onChange={(e) => setFirstDaySelected(Number(e.target.value))}
            >
              {days.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </StyledSelect>

            <StyledSelect
              value={String(endDaySelected)}
              onChange={(e) => setEndDaySelected(Number(e.target.value))}
            >
              {days.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </StyledSelect>

            {/* >>> NOVO: horas */}
            <StyledSelect
              value={String(firstHourSelected)}
              onChange={(e) => handleFirstHour(Number(e.target.value))}
              title="Hora inicial"
            >
              {hours.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </StyledSelect>

            <StyledSelect
              value={String(endHourSelected)}
              onChange={(e) => handleEndHour(Number(e.target.value))}
              title="Hora final"
            >
              {hours.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </StyledSelect>
          </SelectRow>
        </Dropdown>
      )}
    </Wrapper>
  );
};

export default DateRangePicker;
