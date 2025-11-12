/**
 * Normaliza um valor para um percentual baseado em um valor máximo.
 * Garante que o resultado esteja entre 0 e 100.
 *
 * @param value Valor atual da métrica
 * @param max Valor de referência máximo (ex: 86400 segundos, 1000ms etc.)
 * @returns Número entre 0 e 100
 */
export function normalizeMetricPercent(value: number, max: number): number {
  if (!value || !max || max <= 0) return 0;
  return Math.min((value / max) * 100, 100);
}
