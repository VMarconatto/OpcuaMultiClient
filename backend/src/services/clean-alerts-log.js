"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAlertsLogCleaner = startAlertsLogCleaner;
var fs_1 = require("fs");
var path_1 = require("path");
console.log('achou clean-alerts-log.ts');
// Caminho absoluto baseado na raiz do projeto
var ALERTS_LOG_PATH = path_1.default.resolve("alerts-log.json");
var CLEAN_INTERVAL_MS = 1 * 60 * 60 * 1000; // Você pode ajustar livremente aqui
// Tempo configurável via env (padrão: 1hr)
function startAlertsLogCleaner() {
    setInterval(function () {
        try {
            console.log('Entrou no try de startAlertsLogCleaner');
            fs_1.default.writeFileSync(ALERTS_LOG_PATH, "[]", "utf-8");
            console.log("[".concat(new Date().toISOString(), "] \uD83E\uDDF9 alerts-log.json limpo com sucesso."));
        }
        catch (err) {
            console.error("[".concat(new Date().toISOString(), "] \u274C Erro ao limpar alerts-log.json:"), err);
        }
    }, CLEAN_INTERVAL_MS);
}
