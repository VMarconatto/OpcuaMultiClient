/**
** =======================================================
@SECTION : Rate Calculator
@FILE : rate.ts
@PURPOSE : Calcular a taxa de variação (Δvalor / Δtempo) em Hz ou unidades por segundo.
@LAST_EDIT : 2025-11-10
** =======================================================
 */

// Armazena último valor e timestamp por chave monitorada.
const last = new Map<string, { v: number; t: number }>();

/**
 * Calcula a taxa de variação por segundo de uma métrica.
 *
 * @param key - Identificador da série (ex.: `Client01_flow`).
 * @param current - Valor atual medido.
 * @returns Taxa Δvalor/Δtempo (por segundo).
 *
 * @remarks
 * - Se não houver valor anterior, retorna `0` (primeira medição).
 * - Se o valor regredir (`dv < 0`), também retorna `0` (para evitar taxa negativa).
 *
 * @example
 * ```ts
 * const rate = ratePerSec("Client01_PT02", newValue);
 * console.log(rate.toFixed(2), "unidades/s");
 * ```
 */
export function ratePerSec(key: string, current: number): number {
  const now = Date.now();
  const prev = last.get(key);
  last.set(key, { v: current, t: now });

  if (!prev) return 0;

  const dt = (now - prev.t) / 1000; // Δt em segundos
  const dv = current - prev.v;      // Δvalor
  /** 
  @WHY : retorna 0 se tempo <= 0 ou se o contador resetou (valor menor)
  */
  
  return dt > 0 && dv >= 0 ? dv / dt : 0;
}
