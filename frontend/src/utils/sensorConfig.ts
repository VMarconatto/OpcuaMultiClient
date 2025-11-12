// src/config/sensorConfig.ts

export const unitMap: Record<string, string> = {
  "Entrada TRC001 - FT01": "m³/h",
  "Demineralized Water Soda Dilution Flow - FT02": "l/h",
  "Demineralized Water Hydrochloric Acid Dilution Flow - FT03": "l/h",
  "Succion Pressure Pumps - PT01": "bar",
  "Pressure Input TRC001 - PT02": "bar",
  "Pressure Out TRC001 - PT03": "bar",
  "Pressure Input TRC002 - PT04": "bar",
  "Pressure Out TRC002 - PT05": "bar",
  "Pressure Input TRC003 - PT06": "bar",
  "Pressure Out TRC003 - PT06": "bar",
  "Condutivity Water Recirculation Water Desmineralized - CT01": "µS/cm",
  "Condutivity Water Recirculation Water Desmineralized - CT02": "µS/cm",
  "TanK Demineralized Water Level - LT01": "%",
  "TanK Client Demineralized Water Level - LT02": "%",
};

export const rangeMap: Record<string, [number, number]> = {
  "Entrada TRC001 - FT01": [0, 45],
  "Demineralized Water Soda Dilution Flow - FT02": [5000,6100 ],
  "Demineralized Water Hydrochloric Acid Dilution Flow - FT03": [1000, 1700],
  "Succion Pressure Pumps - PT01": [0, 10],
  "Pressure Input TRC001 - PT02": [0, 10],
  "Pressure Out TRC001 - PT03": [0, 10],
  "Pressure Input TRC002 - PT04": [0, 10],
  "Pressure Out TRC002 - PT05": [0, 10],
  "Pressure Input TRC003 - PT06": [0, 10],
  "Pressure Out TRC003 - PT06": [0, 10],
  "Condutivity Water Recirculation Water Desmineralized - CT01": [0, 100],
  "Condutivity Water Recirculation Water Desmineralized - CT02": [0, 100],
  "TanK Demineralized Water Level - LT01": [0, 100],
  "TanK Client Demineralized Water Level - LT02": [0, 100],
};
