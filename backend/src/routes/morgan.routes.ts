/**
** =======================================================
@SECTION : HTTP Metrics (Lightweight)
@FILE : morgan.routes.ts
@PURPOSE : Coletar métricas HTTP (latência, status, top routes) em buckets
e expor endpoints de status/telemetria.
@LAST_EDIT : 2025-11-10
** =======================================================
 */


// http.metrics.ts
import type { Express, Request, Response, NextFunction } from "express";

type Bucket = {
  t0: number;              // epoch do início do bucket (ms)
  n: number;               // total reqs
  errs: number;            // total erros (status >= 500)
  lat: number[];           // latências em ms (amostra)
  status: Record<string, number>;
  method: Record<string, number>;
  routes: Record<string, { c: number; p95: number; lat: number[] }>;
};

type MetricsOpts = {
  bucketSpanSec?: number;      // padrão 5s
  retentionMinutes?: number;   // padrão 30min
  topRoutesLimit?: number;     // padrão 5
  statusWindowSec?: number;    // janela do snapshot (padrão 60s)
};

/**
 * Cria coletor de métricas HTTP com middleware de baixa sobrecarga.
 *
 * @param opts.bucketSpanSec - Granularidade dos buckets (segundos).
 * @param opts.retentionMinutes - Retenção na memória (minutos).
 * @param opts.topRoutesLimit - Quantidade de rotas no ranking.
 * @param opts.statusWindowSec - Janela (segundos) para o snapshot em /http/status.
 * @returns Objeto com:
 *  - `record`: middleware Express para registrar métricas;
 *  - `routes(app)`: registra endpoints `/http/status` e `/http/telemetry`;
 *  - `snapshot()`: snapshot da janela recente;
 *  - `telemetry()`: série ao longo da retenção.
 *
 * @example
 * ```ts
 * const httpm = createHttpMetrics({ bucketSpanSec: 5, retentionMinutes: 30 });
 * app.use(httpm.record);
 * httpm.routes(app);
 * ```
 */
export function createHttpMetrics(opts: MetricsOpts = {}) {
  const bucketSpanSec    = opts.bucketSpanSec ?? 5;
  const retentionMinutes = opts.retentionMinutes ?? 30;
  const topRoutesLimit   = opts.topRoutesLimit ?? 5;
  const statusWindowSec  = opts.statusWindowSec ?? 60;

  const BUCKET_MS = bucketSpanSec * 1000;
  const RET_MS    = retentionMinutes * 60 * 1000;

  const buckets = new Map<number, Bucket>(); // key: Math.floor(ts/BUCKET_MS)

  // Remove buckets fora da janela de retenção
  const prune = (now = Date.now()) => {
    const minTs = now - RET_MS;
    for (const [key, b] of buckets.entries()) {
      if ((b.t0 + BUCKET_MS) < minTs) buckets.delete(key);
    }
  };

  // Garante bucket para um timestamp
  const ensureBucket = (ts: number) => {
    const key = Math.floor(ts / BUCKET_MS);
    let b = buckets.get(key);
    if (!b) {
      b = { t0: key * BUCKET_MS, n: 0, errs: 0, lat: [], status: {}, method: {}, routes: {} };
      buckets.set(key, b);
      prune(ts);
    }
    return b;
  };

  // pXX auxiliar
  const pxx = (arr: number[], p: number) => {
    if (!arr.length) return 0;
    const a = arr.slice().sort((x, y) => x - y);
    const idx = Math.floor((p / 100) * (a.length - 1));
    return a[idx];
  };

  // -------------------------------------------------------
  // Middleware: mede latência e agrega por bucket
  // -------------------------------------------------------
  const record = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on("finish", () => {
      const dur = Date.now() - start;
      const b = ensureBucket(start);

      b.n++;
      if (res.statusCode >= 500) b.errs++;

      const sc = String(res.statusCode);
      b.status[sc] = (b.status[sc] || 0) + 1;

      const m = req.method.toUpperCase();
      b.method[m] = (b.method[m] || 0) + 1;

      // caminho "normalizado" simples (até 3 segmentos)
      const url = req.originalUrl.split("?")[0] || "/";
      const parts = url.split("/").filter(Boolean).slice(0, 3); // curta
      const pathKey = "/" + parts.join("/");
      const route = (b.routes[pathKey] ||= { c: 0, p95: 0, lat: [] });
      route.c += 1;
      route.lat.push(dur);

      // amostras limitadas para latência
      if (b.lat.length < 2000) b.lat.push(dur);
      if (route.lat.length > 1000) route.lat.shift();
    });
    next();
  };

  // -------------------------------------------------------
  // Snapshot: última janela (statusWindowSec)
  // -------------------------------------------------------
   
  const snapshot = () => {
    const now = Date.now();
    const since = now - statusWindowSec * 1000;
    let n = 0, errs = 0;
    let allLat: number[] = [];
    const status: Record<string, number> = {};
    const method: Record<string, number> = {};
    const routesAgg: Record<string, { c: number; lat: number[] }> = {};

    for (const b of buckets.values()) {
      if ((b.t0 + BUCKET_MS) < since) continue;
      n += b.n; errs += b.errs;
      allLat = allLat.concat(b.lat);
      for (const [k, v] of Object.entries(b.status)) status[k] = (status[k] || 0) + v;
      for (const [k, v] of Object.entries(b.method)) method[k] = (method[k] || 0) + v;
      for (const [k, v] of Object.entries(b.routes)) {
        const r = (routesAgg[k] ||= { c: 0, lat: [] });
        r.c += v.c; r.lat = r.lat.concat(v.lat);
      }
    }

    const p50 = pxx(allLat, 50);
    const p95 = pxx(allLat, 95);
    const avg = allLat.length ? (allLat.reduce((a, b) => a + b, 0) / allLat.length) : 0;
    const rpm = (n / (statusWindowSec / 60));

    const topRoutes = Object.entries(routesAgg)
      .map(([path, r]) => ({ path, count: r.c, p95Ms: pxx(r.lat, 95) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, topRoutesLimit);

    const errorRatePct = n ? (errs / n) * 100 : 0;

    return {
      windowSec: statusWindowSec,
      reqPerMin: rpm,
      errorRatePct,
      p50Ms: p50,
      p95Ms: p95,
      avgMs: avg,
      statusCounts: status,
      methodCounts: method,
      topRoutes
    };
  };

  // -------------------------------------------------------
  // Telemetria: série ao longo da retenção
  // -------------------------------------------------------
  const telemetry = () => {
    const now = Date.now();
    const minTs = now - RET_MS;
    const points = Array.from(buckets.values())
      .filter(b => (b.t0 + BUCKET_MS) >= minTs)
      .sort((a, b) => a.t0 - b.t0)
      .map(b => {
        const rpm = (b.n / (bucketSpanSec / 60));
        const p95 = pxx(b.lat, 95);
        return { t: new Date(b.t0 + BUCKET_MS).toISOString(), rpm, p95, err: b.errs };
      });

    return { bucketSpanSec, points };
  };

  // -------------------------------------------------------
  // Rotas de exposição das métricas
  // -------------------------------------------------------
  const routes = (app: Express) => {
    app.get("/http/status", (req, res) => {
      try {
        res.status(200).json({ snapshot: snapshot() });
      } catch (e: any) {
        res.status(500).json({ error: e?.message ?? "internal_error" });
      }
    });

    app.get("/http/telemetry", (req, res) => {
      try {
        res.status(200).json(telemetry());
      } catch (e: any) {
        res.status(500).json({ error: e?.message ?? "internal_error" });
      }
    });
  };

  return { record, routes, snapshot, telemetry };
}
