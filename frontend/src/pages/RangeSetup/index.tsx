/**
** =======================================================
@SECTION  : Analog Setup — Alarm Ranges & Setpoints
@FILE     : src/pages/RangeSetup/index.tsx
@PURPOSE  : Formulário administrativo para configurar ranges analógicos
            (mínimo, máximo, unidade), descrição e setpoints de alarme
            (SPAlarmL/LL/H/HH) por variável, por cliente — sem alterar lógica.
@LAST_EDIT : 2025-11-11
** =======================================================
*/

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Container, RangeItem, SubmitButton, TopBar } from "./styled";
import { useDevice } from "../../components/DeviceContext/DeviceContext";
import ClientPicker from "../../components/ClientPicker";

/**
 * Mapa de ranges por nome de variável.
 * - O backend usa chaves como "mínimo"/"máximo"/"unidade" (pt-BR).
 */
type RangeMap = Record<string, { min: number; max: number; unidade: string }>;

/**
 * Componente principal que:
 * - Resolve o `deviceId` do contexto para o `ClientXX` equivalente (ex.: device01 → Client01),
 * - Busca a configuração atual em `GET /ClientXX/setupalarms`,
 * - Permite editar campos (min/max/unidade/descrição e SPAlarm*),
 * - Salva tudo em `POST /ClientXX/setupalarms`.
 */
const RangeSetupForm: React.FC = () => {
  const { deviceId, setDeviceId } = useDevice();

  /**
   * Converte "deviceXX" para "ClientXX" (alinhado ao AppMetrics).
   * Mantém vazio quando não há `deviceId`.  :contentReference[oaicite:4]{index=4}
   */
  const resolvedDeviceId = useMemo(() => {
    if (!deviceId) return "";
    return deviceId.startsWith("device")
      ? deviceId.replace("device", "Client")
      : deviceId;
  }, [deviceId]);

  /** Estado: ranges básicos (mínimo, máximo, unidade) por tag. */
  const [ranges, setRanges] = useState<RangeMap>({});
  /** Estado: loading inicial ao trocar/definir cliente. */
  const [loading, setLoading] = useState(true);
  /** Estado: flag de envio/salvamento. */
  const [saving, setSaving] = useState(false);

  /** Estado: rótulo/descrição temporária por tag (permite renomear chave). */
  const [tempDescriptions, setTempDescriptions] = useState<
    Record<string, string>
  >({});
  /** Estado: checkboxes ativos por campo (habilita/desabilita edição). */
  const [enabledAlarms, setEnabledAlarms] = useState<
    Record<string, Record<string, boolean>>
  >({});
  /** Estado: valores numéricos dos setpoints de alarme por tag. */
  const [spAlarmValues, setSpAlarmValues] = useState<
    Record<string, Record<string, number>>
  >({});

  // sempre que trocar o client, limpa estados e volta ao "Carregando..."
  useEffect(() => {
    setRanges({});
    setTempDescriptions({});
    setSpAlarmValues({});
    setEnabledAlarms({});
    setLoading(true);
  }, [resolvedDeviceId]); // :contentReference[oaicite:5]{index=5}

  /**
   * Carrega a configuração atual do cliente.
   * - Endpoint: `GET /{ClientXX}/setupalarms`
   * - Popular `ranges`, descrições, SPAlarm* e checkboxes default.  :contentReference[oaicite:6]{index=6} :contentReference[oaicite:7]{index=7} :contentReference[oaicite:8]{index=8} :contentReference[oaicite:9]{index=9} :contentReference[oaicite:10]{index=10}
   */
  useEffect(() => {
    if (!resolvedDeviceId) return;

    const controller = new AbortController();

    (async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/${resolvedDeviceId}/setupalarms`,
          { withCredentials: true, signal: controller.signal }
        );

        type SetupConfig = {
          mínimo: number;
          máximo: number;
          unidade: string;
          SPAlarmL?: number;
          SPAlarmLL?: number;
          SPAlarmH?: number;
          SPAlarmHH?: number;
        };

        const data = res.data as Record<string, SetupConfig>;

        // ranges básicos (min, max, unidade)
        setRanges(
          Object.fromEntries(
            Object.entries(data).map(([key, value]) => [
              key,
              {
                min: value.mínimo ?? 0,
                max: value.máximo ?? 0,
                unidade: value.unidade ?? "",
              },
            ])
          )
        );

        // descrição temporária inicia com a própria chave
        setTempDescriptions(
          Object.keys(data).reduce((acc, key) => {
            acc[key] = key;
            return acc;
          }, {} as Record<string, string>)
        );

        // valores SPAlarm*
        setSpAlarmValues(
          Object.keys(data).reduce((acc, key) => {
            acc[key] = {
              SPAlarmL: data[key].SPAlarmL ?? 0,
              SPAlarmLL: data[key].SPAlarmLL ?? 0,
              SPAlarmH: data[key].SPAlarmH ?? 0,
              SPAlarmHH: data[key].SPAlarmHH ?? 0,
            };
            return acc;
          }, {} as Record<string, Record<string, number>>)
        );

        // checkboxes habilitados por padrão
        setEnabledAlarms(
          Object.keys(data).reduce((acc, key) => {
            acc[key] = {
              Mínimo: true,
              Máximo: true,
              Unidade: true,
              Descrição: true,
              SPAlarmL: true,
              SPAlarmLL: true,
              SPAlarmH: true,
              SPAlarmHH: true,
            };
            return acc;
          }, {} as Record<string, Record<string, boolean>>)
        );
      } catch (err) {
        if ((err as any)?.name !== "CanceledError") {
          console.error("Erro ao carregar ranges:", err);
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [resolvedDeviceId]);

  /**
   * Atualiza um campo de um range (min/max/unidade) para a tag `key`.
   * @param key   Nome da variável/tag
   * @param field Campo a alterar: "min" | "max" | "unidade"
   * @param value Novo valor (numérico ou string)
   */
  const handleChange = (
    key: string,
    field: "min" | "max" | "unidade",
    value: number | string
  ) => {
    setRanges((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  };

  /**
   * Submete as alterações:
   * - Renomeia chaves se o usuário alterou a `Descrição`,
   * - Envia todo o objeto para o backend via POST.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedDeviceId) return;

    setSaving(true);

    const renamedRanges = Object.fromEntries(
      Object.entries(ranges).map(([key, value]) => {
        const newKey = tempDescriptions[key] || key;
        const alarms = spAlarmValues[key] || {};
        return [
          newKey,
          {
            mínimo: value.min,
            máximo: value.max,
            unidade: value.unidade,
            ...alarms,
          },
        ];
      })
    );

    try {
      await axios.post(
        `http://localhost:3000/${resolvedDeviceId}/setupalarms`,
        renamedRanges,
        { withCredentials: true }
      );
      alert("Ranges salvos com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar ranges:", err);
      alert("Erro ao salvar os ranges.");
    } finally {
      setSaving(false);
    }
  };

  if (!resolvedDeviceId) {
    return (
      <Container>
        {/* <TopBar>
          <ClientPicker selectedClientId={deviceId} onChange={setDeviceId} />
        </TopBar> */}
        <p>Dispositivo não especificado no contexto.</p>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        {/* <TopBar>
          <ClientPicker selectedClientId={deviceId} onChange={setDeviceId} />
        </TopBar> */}
        <p>Carregando ranges...</p>
      </Container>
    );
  }

  return (
    <Container>
      {/* <TopBar>
        <ClientPicker selectedClientId={deviceId} onChange={setDeviceId} />
      </TopBar> */}

      <h1>Analog Variable Settings</h1>

      <form onSubmit={handleSubmit}>
        {Object.entries(ranges).map(([key, range]) => {
          const min = range?.min ?? 0;
          const max = range?.max ?? 0;
          const unidade = range?.unidade ?? "";

          return (
            <RangeItem key={key}>
              <h2>{tempDescriptions[key]}</h2>
              <div className="inputs">
                {[
                  { label: "Mínimo", type: "number", value: min },
                  { label: "Máximo", type: "number", value: max },
                  { label: "Unidade", type: "text", value: unidade },
                  {
                    label: "Descrição",
                    type: "text",
                    value: tempDescriptions[key],
                  },
                ].map((field) => (
                  <label key={field.label}>
                    <div>
                      <input
                        type="checkbox"
                        checked={enabledAlarms[key]?.[field.label] || false}
                        onChange={() =>
                          setEnabledAlarms((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              [field.label]: !prev[key]?.[field.label],
                            },
                          }))
                        }
                      />
                      {field.label}
                    </div>

                    <input
                      type={field.type}
                      step={field.type === "number" ? "any" : undefined}
                      placeholder={field.label}
                      value={field.value}
                      onChange={(e) => {
                        if (field.label === "Descrição") {
                          setTempDescriptions((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }));
                        } else {
                          handleChange(
                            key,
                            field.label === "Mínimo"
                              ? "min"
                              : field.label === "Máximo"
                              ? "max"
                              : "unidade",
                            field.type === "number"
                              ? parseFloat(e.target.value)
                              : e.target.value
                          );
                        }
                      }}
                      disabled={!enabledAlarms[key]?.[field.label]}
                    />
                  </label>
                ))}

                {["SPAlarmL", "SPAlarmLL", "SPAlarmH", "SPAlarmHH"].map(
                  (alarmKey) => (
                    <label key={alarmKey}>
                      <div>
                        <input
                          type="checkbox"
                          checked={enabledAlarms[key]?.[alarmKey] || false}
                          onChange={() =>
                            setEnabledAlarms((prev) => ({
                              ...prev,
                              [key]: {
                                ...prev[key],
                                [alarmKey]: !prev[key]?.[alarmKey],
                              },
                            }))
                          }
                        />
                        {alarmKey.replace("SPAlarm", "SP Alarm ")}
                      </div>

                      <input
                        type="number"
                        step="any"
                        placeholder={`SetPoint ${alarmKey}`}
                        value={spAlarmValues[key]?.[alarmKey] ?? ""}
                        onChange={(e) => {
                          const newValue = parseFloat(e.target.value);
                          setSpAlarmValues((prev) => ({
                            ...prev,
                            [key]: {
                              ...prev[key],
                              [alarmKey]: isNaN(newValue) ? 0 : newValue,
                            },
                          }));
                        }}
                        disabled={!enabledAlarms[key]?.[alarmKey]}
                      />
                    </label>
                  )
                )}
              </div>
            </RangeItem>
          );
        })}

        <SubmitButton type="submit" disabled={saving}>
          {saving ? "Salvando..." : "Salvar Alterações"}
        </SubmitButton>
      </form>
    </Container>
  );
};

export default RangeSetupForm;
