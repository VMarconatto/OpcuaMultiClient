"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.Device_WriteDB = Device_WriteDB;
var ClientManager_js_1 = require("../controllers/ClientManager.js");
var promises_1 = require("fs/promises");
var path_1 = require("path");
function loadSetupConfig(clientId) {
    return __awaiter(this, void 0, void 0, function () {
        var fileName, setupConfigPath, rawData, parsed, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    fileName = clientId === "Client01"
                        ? "setuptsconfig.json"
                        : "".concat(clientId, "_setuptsconfig.json");
                    setupConfigPath = path_1.default.resolve(fileName);
                    return [4 /*yield*/, promises_1.default.readFile(setupConfigPath, 'utf-8')];
                case 1:
                    rawData = _a.sent();
                    parsed = JSON.parse(rawData);
                    if (!parsed || typeof parsed !== 'object' || Object.keys(parsed).length === 0) {
                        console.warn("\u26A0\uFE0F [".concat(clientId, "] setupConfig carregado mas est\u00E1 vazio ou malformado."));
                    }
                    return [2 /*return*/, parsed];
                case 2:
                    error_1 = _a.sent();
                    console.error("\u274C [".concat(clientId, "] Erro ao carregar arquivo de setup:"), error_1);
                    return [2 /*return*/, {}];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function Device_WriteDB() {
    return __awaiter(this, arguments, void 0, function (data, clientId) {
        var client, reconnectErr_1, db, aggTT, aggVV, aggMT, setupConfig, setupKeys, transmittersDoc, i, _i, _a, key, valvesDoc, motorsDoc, error_2;
        var _b, _c;
        if (data === void 0) { data = []; }
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("[".concat(clientId, "] \uD83D\uDCE5 Tentando gravar dados no MongoDB..."));
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 10, , 11]);
                    client = ClientManager_js_1.clientManager.getClient(clientId);
                    if (!client || !client.dbName || !client.collections || !client.mongoClient) {
                        console.error("\u274C ".concat(clientId, " n\u00E3o configurado corretamente pelo ClientManager."));
                        return [2 /*return*/];
                    }
                    if (!(!client.mongoClient.topology || client.mongoClient.topology.isDestroyed())) return [3 /*break*/, 5];
                    console.warn("[".concat(clientId, "] \u26A0\uFE0F Topologia MongoDB fechada. Tentando reconectar..."));
                    _d.label = 2;
                case 2:
                    _d.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, client.mongoClient.connect()];
                case 3:
                    _d.sent();
                    console.log("[".concat(clientId, "] \uD83D\uDD01 Reconex\u00E3o MongoDB bem-sucedida"));
                    return [3 /*break*/, 5];
                case 4:
                    reconnectErr_1 = _d.sent();
                    console.error("[".concat(clientId, "] \u274C Falha ao reconectar MongoDB:"), reconnectErr_1);
                    return [2 /*return*/];
                case 5:
                    db = client.mongoClient.db(client.dbName);
                    aggTT = db.collection(client.collections.transmiters);
                    aggVV = db.collection(client.collections.valves);
                    aggMT = db.collection(client.collections.motors);
                    return [4 /*yield*/, loadSetupConfig(clientId)];
                case 6:
                    setupConfig = _d.sent();
                    setupKeys = Object.keys(setupConfig);
                    if (data.length !== setupKeys.length) {
                        console.error("[".concat(clientId, "] \u274C ERRO: Quantidade de valores recebidos (").concat(data.length, ") n\u00E3o bate com as chaves do setup (").concat(setupKeys.length, ")."));
                        console.error("[".concat(clientId, "] \u26A0\uFE0F Dados recebidos:"), data);
                        console.error("[".concat(clientId, "] \u26A0\uFE0F Chaves esperadas:"), setupKeys);
                        return [2 /*return*/];
                    }
                    transmittersDoc = {
                        metadata: {
                            "Desmineralized Water_Id": 1,
                            "type": "Equipament",
                            "ProdUnit": "M³/Dia",
                            "Job": "Utilities Desmineralized Water",
                            "Step": (_b = data[150]) !== null && _b !== void 0 ? _b : null
                        },
                        timestamp: new Date()
                    };
                    for (i = 0; i < setupKeys.length; i++) {
                        transmittersDoc[setupKeys[i]] = (_c = data[i]) !== null && _c !== void 0 ? _c : null;
                    }
                    // 🔍 Log detalhado dos campos e valores inseridos
                    console.log("[".concat(clientId, "] \uD83D\uDCCB Documento transmitters a ser gravado (aggTT):"));
                    for (_i = 0, _a = Object.keys(transmittersDoc); _i < _a.length; _i++) {
                        key = _a[_i];
                        if (key !== "metadata" && key !== "timestamp") {
                            console.log("    ".concat(key, ": ").concat(transmittersDoc[key]));
                        }
                    }
                    return [4 /*yield*/, aggTT.insertOne(transmittersDoc)];
                case 7:
                    _d.sent();
                    valvesDoc = {
                        metadata: __assign({}, transmittersDoc.metadata),
                        timestamp: transmittersDoc.timestamp,
                        "Water Input TRC001 - XV01 Start Command": data[65],
                        "Water Input TRC001 - XV01 Comando Manut": data[66],
                        "Water Input TRC001 - XV01 Auto/Manual Command": data[67],
                    };
                    console.log("[".concat(clientId, "] \uD83D\uDCC2 Inserindo documento em ").concat(client.collections.valves, ":"), valvesDoc);
                    return [4 /*yield*/, aggVV.insertOne(valvesDoc)];
                case 8:
                    _d.sent();
                    motorsDoc = {
                        metadata: __assign({}, transmittersDoc.metadata),
                        timestamp: transmittersDoc.timestamp,
                        "Regeneration - BB01 Start Command": data[0],
                        "Regeneration - BB01 Emergency Command": data[1],
                    };
                    console.log("[".concat(clientId, "] \uD83D\uDCC2 Inserindo documento em ").concat(client.collections.motors, ":"), motorsDoc);
                    return [4 /*yield*/, aggMT.insertOne(motorsDoc)];
                case 9:
                    _d.sent();
                    console.log("[".concat(clientId, "] \u2705 Dados inseridos com sucesso!"));
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _d.sent();
                    console.error("[".concat(clientId, "] \u274C Erro ao inserir no MongoDB:"), error_2);
                    return [3 /*break*/, 11];
                case 11: return [2 /*return*/];
            }
        });
    });
}
