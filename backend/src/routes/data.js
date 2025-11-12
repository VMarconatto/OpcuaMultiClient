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
exports.dataRoutes = void 0;
var express_1 = require("express");
var aggregations_js_1 = require("../aggregations/aggregations.js");
var systemStatus_js_1 = require("../controllers/systemStatus.js");
var alertsStorage_js_1 = require("../services/alertsStorage.js");
var ClientManager_js_1 = require("../controllers/ClientManager.js");
exports.dataRoutes = (0, express_1.Router)();
exports.dataRoutes.get("/:deviceId/transmiters", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var deviceId, client, _a, month, year, firstDay, endDay, first, end, transmiters, e_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                deviceId = req.params.deviceId;
                client = ClientManager_js_1.clientManager.getClient(deviceId);
                if (!client || !client.dbName || !client.collections) {
                    return [2 /*return*/, res.status(404).json({ error: "Dispositivo '".concat(deviceId, "' n\u00E3o configurado.") })];
                }
                _a = req.query, month = _a.month, year = _a.year, firstDay = _a.firstDay, endDay = _a.endDay;
                if (!month || !year || !firstDay || !endDay) {
                    return [2 /*return*/, res.status(400).json({ error: "Parâmetros obrigatórios ausentes." })];
                }
                first = Number(firstDay);
                end = Number(endDay);
                if (isNaN(first) || isNaN(end) || first > end) {
                    return [2 /*return*/, res.status(400).json({ error: "Intervalo de dias inválido." })];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, aggregations_js_1.getMBData)(client.dbName, client.collections.transmiters, Number(month), Number(year), first, end)];
            case 2:
                transmiters = _b.sent();
                res.json(transmiters);
                return [3 /*break*/, 4];
            case 3:
                e_1 = _b.sent();
                console.error("Erro no getMBData para ".concat(deviceId, ":"), e_1);
                res.status(500).json({ error: "Erro ao obter dados." });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.dataRoutes.get("/available-years", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var client, db, collection, years, result, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                client = ClientManager_js_1.clientManager.getClient("device01");
                if (!client || !client.dbName || !client.collections || !client.mongoClient) {
                    return [2 /*return*/, res.status(404).json({ error: "Dispositivo 'device01' não está configurado corretamente." })];
                }
                db = client.mongoClient.db(client.dbName);
                collection = db.collection(client.collections.transmiters);
                return [4 /*yield*/, collection.aggregate([
                        { $project: { year: { $year: "$timestamp" } } },
                        { $group: { _id: "$year" } },
                        { $sort: { _id: 1 } }
                    ]).toArray()];
            case 1:
                years = _a.sent();
                result = years.map(function (item) { return item._id; });
                console.log("Anos encontrados no MongoDB:", result);
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_1 = _a.sent();
                console.error("Erro ao buscar anos disponíveis:", err_1);
                res.status(500).json({ error: "Erro ao buscar anos disponíveis" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.dataRoutes.get("/:deviceId/transmiters/total", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var deviceId, client, _a, month, year, firstDay, endDay, result, e_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                deviceId = req.params.deviceId;
                client = ClientManager_js_1.clientManager.getClient(deviceId);
                if (!client || !client.dbName || !client.collections) {
                    return [2 /*return*/, res.status(404).json({ error: "Dispositivo '".concat(deviceId, "' n\u00E3o configurado.") })];
                }
                _a = req.query, month = _a.month, year = _a.year, firstDay = _a.firstDay, endDay = _a.endDay;
                if (!month || !year || !firstDay || !endDay) {
                    return [2 /*return*/, res.status(400).json({ error: "Parâmetros obrigatórios ausentes." })];
                }
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, (0, aggregations_js_1.getMBTotals)(client.dbName, client.collections.transmiters, Number(month), Number(year), Number(firstDay), Number(endDay))];
            case 2:
                result = _b.sent();
                res.json(result);
                return [3 /*break*/, 4];
            case 3:
                e_2 = _b.sent();
                console.error("Erro no getMBTotals para ".concat(deviceId, ":"), e_2);
                res.status(500).json({ error: "Erro ao obter totais" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.dataRoutes.get("/:deviceId/opcua-status", function (req, res) {
    var deviceId = req.params.deviceId;
    var client = ClientManager_js_1.clientManager.getClient(deviceId);
    if (!client) {
        return res.status(404).json({ error: "Cliente OPC UA '".concat(deviceId, "' n\u00E3o encontrado.") });
    }
    res.json(client.getStatus());
});
exports.dataRoutes.get("/mongodb/status", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var clients, statuses;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                clients = ClientManager_js_1.clientManager.getAllClients();
                return [4 /*yield*/, Promise.all(Object.entries(clients).map(function (_a) { return __awaiter(void 0, [_a], void 0, function (_b) {
                        var admin, ping, err_2;
                        var _c;
                        var id = _b[0], client = _b[1];
                        return __generator(this, function (_d) {
                            switch (_d.label) {
                                case 0:
                                    _d.trys.push([0, 2, , 3]);
                                    admin = (_c = client.mongoClient) === null || _c === void 0 ? void 0 : _c.db(client.dbName).admin();
                                    return [4 /*yield*/, admin.ping()];
                                case 1:
                                    ping = _d.sent();
                                    return [2 /*return*/, {
                                            id: id,
                                            mongodb: {
                                                connected: true,
                                                ping: ping.ok === 1
                                            }
                                        }];
                                case 2:
                                    err_2 = _d.sent();
                                    return [2 /*return*/, {
                                            id: id,
                                            mongodb: {
                                                connected: false,
                                                error: String(err_2)
                                            }
                                        }];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }))];
            case 1:
                statuses = _a.sent();
                res.json(statuses);
                return [2 /*return*/];
        }
    });
}); });
exports.dataRoutes.get("/host01/system-status", function (_, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, systemStatus_js_1.getSystemStatus)()];
            case 1:
                status_1 = _a.sent();
                res.json(status_1);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ error: "Erro ao obter status do sistema" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.dataRoutes.get("/host01/network-latency", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, systemStatus_js_1.getNetworkLatency)()];
            case 1:
                result = _a.sent();
                res.json(result);
                return [3 /*break*/, 3];
            case 2:
                err_3 = _a.sent();
                res.status(500).json({ error: "Erro ao obter latência de rede" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.dataRoutes.get("/:deviceId/alerts-sent", function (req, res) {
    var deviceId = req.params.deviceId;
    try {
        var alerts = (0, alertsStorage_js_1.loadAlerts)(deviceId);
        res.json(alerts);
    }
    catch (err) {
        console.error("Erro ao carregar alertas para ".concat(deviceId, ":"), err);
        res.status(500).json({ error: "Erro ao carregar alertas" });
    }
});
