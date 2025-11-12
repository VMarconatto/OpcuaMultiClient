/**
** =======================================================
@SECTION : Host Routes (Health & Telemetry)
@FILE : host.routes.ts
@PURPOSE : Expor status instantâneo do host e série de telemetria agregada.
@LAST_EDIT : 2025-11-10
** =======================================================
*/


import { Router } from "express";
import { HostMonitor } from "../monitor/HostMonitor.js";

/**
 * Cria o roteador de monitoramento do host (status + telemetria).
 *
 * @param opts.bucketSpanSec - Tamanho do bucket de agregação em segundos (default: 5).
 * @param opts.windowSec - Janela padrão para corte da telemetria em segundos (default: 300).
 * @param opts.opcuaHost - Host/IP opcional para ping/latência OPC UA.
 * @param opts.mongoHost - Host/IP opcional para ping/latência MongoDB.
 * @returns Router com as rotas `/host/status` e `/host/telemetry`.
 *
 * @remarks
 * - O `HostMonitor` é inicializado e iniciado aqui (método `start`).
 * - `/host/status` retorna um snapshot único (ou 503 durante warm-up).
 * - `/host/telemetry` retorna pontos (rpm/latência/erros) recortados na janela solicitada.
 */
export function createHostRoutes(opts: { bucketSpanSec?: number; windowSec?: number; opcuaHost?: string; mongoHost?: string }) {
  const router = Router();
   /**
   @WHY : instancia o monitor com granularidade/janela padrão e inicia sondagens
   */
  
  const mon = new HostMonitor(opts.bucketSpanSec ?? 5, opts.windowSec ?? 300);
  mon.start(opts.opcuaHost, opts.mongoHost);

  // -------------------------------------------------------
  // GET /host/status — snapshot atual (saúde do host)
  // -------------------------------------------------------
  router.get("/host/status", (_req, res) => {
    const snap = mon.getSnapshot();
    if (!snap) return res.status(503).json({ error: "warming_up" });
    res.json({ snapshot: snap });
  });

  // -------------------------------------------------------
  // GET /host/telemetry — série agregada na janela pedida
  // -------------------------------------------------------
  router.get("/host/telemetry", (req, res) => {
    const { bucketSpanSec, points } = mon.getTelemetry();
    /**
      @WHY : limita a quantidade de pontos à janela desejada (default 300s)
    */
    const windowSec = Number(req.query.windowSec || 300);
    const max = Math.ceil(windowSec / bucketSpanSec);
    const sliced = points.slice(-max);

    res.json({ bucketSpanSec, points: sliced });
  });

  return router;
}
