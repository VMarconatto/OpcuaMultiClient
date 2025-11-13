// src/utils/formatUnits.ts

export function formatUnits(value: number, context: string): string {
  if (isNaN(value)) return "-";

  switch (true) {
    case /mongo|insert|query|op/i.test(context):
      return `${value} operações`;
    case /leituras|leituras OPC|read/i.test(context):
      return `${value} leituras`;
    case /latência|latency/i.test(context):
      return `${value} ms`;
    case /taxa|rate|throughput/i.test(context):
      return `${value} req/s`;
    case /uso cpu|cpu usage/i.test(context):
      return `${value}%`;
    case /memória|memory/i.test(context):
      return `${value} MB`;
    default:
      return `${value}`;
  }
}
