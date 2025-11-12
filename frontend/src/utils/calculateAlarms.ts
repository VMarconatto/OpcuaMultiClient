type TransmiterData = {
  timestamp: string | number;
  [key: string]: any;
};

type LimitSet = Record<string, { min: number; max: number }>;

export interface Alarm {
  timestamp: string;
  tag: string;
  value: number;
  limit: { min: number; max: number };
}

export function extractAlarms(
  data: TransmiterData[],
  limits: LimitSet
): Alarm[] {
  const alarms: Alarm[] = [];

  data.forEach((item) => {
    const timestamp =
      typeof item.timestamp === "string"
        ? item.timestamp
        : new Date(item.timestamp).toISOString();

    Object.entries(limits).forEach(([key, limit]) => {
      const value = item[key];
      if (value < limit.min || value > limit.max) {
        alarms.push({ timestamp, tag: key, value, limit });
      }
    });
  });

  return alarms;
}
