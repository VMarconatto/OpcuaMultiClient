"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var data_js_1 = require("./routes/data.js");
var RangesSetups_js_1 = require("./routes/RangesSetups.js");
var OpcuaClient_Setups_js_1 = require("./routes/OpcuaClient_Setups.js");
var mongoConnectionStatus_js_1 = require("./Repositories/mongoConnectionStatus.js");
var clean_alerts_log_js_1 = require("./services/clean-alerts-log.js");
var alertScheduler_js_1 = require("./services/alertScheduler.js");
var body_parser_1 = require("body-parser");
var OpcuaInitializer_js_1 = require("./utils/OpcuaInitializer.js");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
(0, alertScheduler_js_1.startAlertScheduler)();
(0, clean_alerts_log_js_1.startAlertsLogCleaner)();
var app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(OpcuaClient_Setups_js_1.default);
app.use(RangesSetups_js_1.default);
app.use(data_js_1.dataRoutes);
app.use(function (req, res) {
    res.status(404).json({ error: "Rota não encontrada." });
});
var PORT = 3000;
app.listen(PORT, function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("\uD83D\uDE80 Servidor backend ouvindo na porta ".concat(PORT));
                // 🔥 Inicializa OPC UA diretamente no start
                console.log("📡 Inicializando OPC UA clients...");
                return [4 /*yield*/, (0, OpcuaInitializer_js_1.initializeOpcuaClientsFromJSON)()];
            case 1:
                _a.sent();
                // 🆗 NÃO precisa mais preparar MongoDB aqui, já foi feito no fluxo de inicialização
                // 🔄 Continua monitorando status das conexões MongoDB
                setInterval(function () { return __awaiter(void 0, void 0, void 0, function () {
                    var mongoReady;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                console.log('⏳ Verificando status das conexões MongoDB...');
                                return [4 /*yield*/, (0, mongoConnectionStatus_js_1.checkMongoConnection)()];
                            case 1:
                                mongoReady = _a.sent();
                                if (mongoReady) {
                                    console.log("✅ Pelo menos uma conexão MongoDB está ativa.");
                                }
                                else {
                                    console.warn("⚠️ Nenhuma conexão MongoDB ativa no momento.");
                                }
                                return [2 /*return*/];
                        }
                    });
                }); }, 10000); // verifica a cada 10 segundos
                return [2 /*return*/];
        }
    });
}); });
app.get("/data", function (req, res) {
    res.json({ status: "ok" });
});
