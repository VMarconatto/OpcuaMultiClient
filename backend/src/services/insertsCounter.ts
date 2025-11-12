/**
** =======================================================
@SECTION : Inserts Counter
@FILE : insertsCounter.ts
@PURPOSE : Contar inserts por clientId em janelas de tempo (buckets 5s → 60s).
@LAST_EDIT : 2025-11-10
** =======================================================
 */


// Contador in-memory de inserts por clientId usando buckets de 5s e janela de 60s.
// Custo por insert: O(1). Pode futuramente ser adaptado para Redis sem alterar a API.

const BUCKET_MS = 5_000;   // 5s
const WINDOW_MS = 60_000;  // 60s (12 buckets)
const BUCKETS_IN_WINDOW = WINDOW_MS / BUCKET_MS; // 12

type Counter = {
  /** Mapa de bucketIdx → quantidade de inserts */
  buckets: Map<number, number>;
};

/** Armazena contadores por clientId */
const store = new Map<string, Counter>();

// -------------------------------------------------------
// Funções internas
// -------------------------------------------------------

/** Calcula o índice do bucket atual (inteiro baseado no timestamp atual). */
function nowBucketIdx() {
  return Math.floor(Date.now() / BUCKET_MS);
}

/** Retorna o contador existente ou cria um novo para o clientId. */
function getOrCreate(clientId: string): Counter {
  let c = store.get(clientId);
  if (!c) {
    c = { buckets: new Map() };
    store.set(clientId, c);
  }
  return c;
}

/** Remove buckets antigos fora da janela de 60s. */
function pruneOldBuckets(counter: Counter, currentIdx: number) {
  const minIdx = currentIdx - BUCKETS_IN_WINDOW + 1;
  for (const k of counter.buckets.keys()) {
    if (k < minIdx) counter.buckets.delete(k);
  }
}

// -------------------------------------------------------
// API pública
// -------------------------------------------------------

/**
 * Registra inserts realizados para um determinado cliente.
 *
 * @param clientId - Identificador lógico do cliente.
 * @param n - Quantidade de inserts (default: 1).
 *
 * @example
 * ```ts
 * recordInserts("Client01");
 * recordInserts("Client02", 3);
 * ```
 */
export function recordInserts(clientId: string, n = 1) {
  if (!clientId || n <= 0) return;
  const counter = getOrCreate(clientId);
  const idx = nowBucketIdx();
  const prev = counter.buckets.get(idx) ?? 0;
  counter.buckets.set(idx, prev + n);
  pruneOldBuckets(counter, idx);
}

/**
 * Retorna a taxa de inserts por minuto, calculada na janela dos últimos 60s.
 *
 * @param clientId - Identificador lógico do cliente.
 * @returns Número estimado de inserts/minuto.
 *
 * @example
 * ```ts
 * const rate = getInsertsPerMin("Client01");
 * console.log(rate, "inserts/min");
 * ```
 */
export function getInsertsPerMin(clientId: string): number {
  const counter = store.get(clientId);
  if (!counter) return 0;
  const idx = nowBucketIdx();
  pruneOldBuckets(counter, idx);

  let sum = 0;
  for (let i = idx - BUCKETS_IN_WINDOW + 1; i <= idx; i++) {
    sum += counter.buckets.get(i) ?? 0;
  }
  /**
  @WHY : janela total já equivale a 60s → soma == inserts por minuto
   */
 
  return sum;
}

/**
 * Retorna a série temporal (histórico) dos últimos `points` buckets (default: 12).
 * Cada ponto é convertido para “equivalente por minuto”.
 *
 * @param clientId - Identificador lógico do cliente.
 * @param points - Quantidade de pontos (default: 12 = 60s).
 * @returns Vetor numérico com taxa de inserts/minuto por bucket.
 *
 * @example
 * ```ts
 * const serie = getInsertsSeries("Client01");
 * console.log(serie);
 * ```
 */
export function getInsertsSeries(
  clientId: string,
  points = BUCKETS_IN_WINDOW
): number[] {
  const counter = store.get(clientId);
  if (!counter) return Array(points).fill(0);
  const idx = nowBucketIdx();
  pruneOldBuckets(counter, idx);

  const series: number[] = [];
  for (let i = idx - points + 1; i <= idx; i++) {
    const bucketCount = counter.buckets.get(i) ?? 0;
    // cada bucket é 5s → por minuto = count * (60/5) = *12
    series.push(bucketCount * (60_000 / BUCKET_MS));
  }
  return series;
}
