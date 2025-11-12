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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientManager = exports.ClientManager = void 0;
var Client_js_1 = require("./Client.js");
var mongodb_1 = require("mongodb");
var dotenv_1 = require("dotenv");
var fs_1 = require("fs");
var path_1 = require("path");
var alertsStorage_js_1 = require("../services/alertsStorage.js");
var emailService_js_1 = require("../services/emailService.js");
dotenv_1.default.config();
process.env.DEBUG = "mongodb";
var ClientManager = /** @class */ (function () {
    function ClientManager() {
        var _this = this;
        this.clients = new Map();
        this.mongoReadyPromise = new Promise(function (resolve) {
            _this.mongoReadyResolve = resolve;
        });
    }
    ClientManager.prototype.addClient = function (id, endpoint, mapMemory, options) {
        if (mapMemory === void 0) { mapMemory = []; }
        if (options === void 0) { options = {}; }
        if (this.clients.has(id)) {
            console.warn("\u26A0\uFE0F Cliente '".concat(id, "' j\u00E1 existe."));
            return;
        }
        var client = new Client_js_1.OpcuaClient(endpoint, options, mapMemory);
        this.clients.set(id, client);
    };
    ClientManager.prototype.getClient = function (id) {
        return this.clients.get(id);
    };
    ClientManager.prototype.getAllClients = function () {
        var result = {};
        for (var _i = 0, _a = this.clients.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], client = _b[1];
            result[id] = client.getStatus();
        }
        return result;
    };
    ClientManager.prototype.removeClient = function (id) {
        var _this = this;
        var client = this.clients.get(id);
        if (client) {
            client.disconnect().then(function () {
                _this.clients.delete(id);
                console.log("\uD83D\uDDD1\uFE0F Cliente ".concat(id, " removido."));
            });
        }
    };
    ClientManager.prototype.getAllAlertStats = function () {
        var allStats = {};
        for (var _i = 0, _a = this.clients.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], id = _b[0], client = _b[1];
            allStats[id] = client.getAlertStats();
        }
        return allStats;
    };
    ClientManager.prototype.getAlertStats = function (clientId) {
        var client = this.clients.get(clientId);
        if (!client)
            throw new Error("Client ".concat(clientId, " n\u00E3o encontrado."));
        return client.getAlertStats();
    };
    ClientManager.prototype.getTagNameByNodeId = function (nodeId, clientId) {
        var _a;
        var client = this.clients.get(clientId);
        var mapMemory = (_a = client === null || client === void 0 ? void 0 : client.getMapMemory) === null || _a === void 0 ? void 0 : _a.call(client);
        if (!mapMemory) {
            console.warn("\u26A0\uFE0F Cliente '".concat(clientId, "' sem mapMemory."));
            return undefined;
        }
        var index = mapMemory.indexOf(nodeId);
        if (index === -1)
            return undefined;
        var setupFileName = clientId === "Client01"
            ? "setuptsconfig.json"
            : "".concat(clientId, "_setuptsconfig.json");
        var setupPath = path_1.default.resolve("./setups", setupFileName);
        if (!fs_1.default.existsSync(setupPath))
            return undefined;
        try {
            var setupData = JSON.parse(fs_1.default.readFileSync(setupPath, "utf-8"));
            var tagNames = Object.keys(setupData);
            return tagNames[index];
        }
        catch (err) {
            console.error("Erro ao ler setup '".concat(setupFileName, "':"), err);
            return undefined;
        }
    };
    ClientManager.prototype.checkAndSendAlerts = function (clientId, values) {
        return __awaiter(this, void 0, void 0, function () {
            var now, client, stats, setupFile, setupPath, setupData, _a, _b, _c, _i, tag, value, config, SPAlarmH, SPAlarmHH, SPAlarmL, SPAlarmLL, outOfRange, stat, elapsed;
            var _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        now = Date.now();
                        client = this.clients.get(clientId);
                        if (!client)
                            return [2 /*return*/];
                        stats = client.getAlertStats();
                        setupFile = clientId === "Client01"
                            ? "setuptsconfig.json"
                            : "".concat(clientId, "_setuptsconfig.json");
                        setupPath = path_1.default.resolve("./setups", setupFile);
                        if (!fs_1.default.existsSync(setupPath))
                            return [2 /*return*/];
                        try {
                            setupData = JSON.parse(fs_1.default.readFileSync(setupPath, "utf-8"));
                        }
                        catch (err) {
                            console.error("Erro lendo setup:", err);
                            return [2 /*return*/];
                        }
                        _a = values;
                        _b = [];
                        for (_c in _a)
                            _b.push(_c);
                        _i = 0;
                        _e.label = 1;
                    case 1:
                        if (!(_i < _b.length)) return [3 /*break*/, 6];
                        _c = _b[_i];
                        if (!(_c in _a)) return [3 /*break*/, 5];
                        tag = _c;
                        value = values[tag];
                        config = setupData[tag];
                        if (!config)
                            return [3 /*break*/, 5];
                        SPAlarmH = config.SPAlarmH, SPAlarmHH = config.SPAlarmHH, SPAlarmL = config.SPAlarmL, SPAlarmLL = config.SPAlarmLL;
                        outOfRange = (SPAlarmHH !== undefined && value >= SPAlarmHH) ||
                            (SPAlarmH !== undefined && value >= SPAlarmH) ||
                            (SPAlarmLL !== undefined && value <= SPAlarmLL) ||
                            (SPAlarmL !== undefined && value <= SPAlarmL);
                        if (!outOfRange) return [3 /*break*/, 5];
                        stat = stats[tag] || { count: 0, lastSent: 0, lastValue: 0 };
                        stat.count++;
                        stat.lastValue = value;
                        elapsed = now - stat.lastSent;
                        if (!(elapsed >= 10 * 60 * 1000)) return [3 /*break*/, 4];
                        return [4 /*yield*/, (0, alertsStorage_js_1.saveAlert)({
                                timestamp: new Date().toISOString(),
                                alertData: (_d = {}, _d[tag] = value, _d.AlertsCount = stat.count, _d),
                                recipients: [process.env.ALERT_EMAIL_DESTINATION || "destinatario@exemplo.com"],
                                clientId: clientId
                            })];
                    case 2:
                        _e.sent();
                        return [4 /*yield*/, (0, emailService_js_1.sendEmailAlert)("\uD83D\uDEA8 Alerta: ".concat(tag, " (").concat(clientId, ")"), "O instrumento \\\"".concat(tag, "\\\" do dispositivo \\\"").concat(clientId, "\\\" saiu dos limites ").concat(stat.count, " vezes.\n\u00DAltimo valor registrado: ").concat(value))];
                    case 3:
                        _e.sent();
                        stat.lastSent = now;
                        _e.label = 4;
                    case 4:
                        stats[tag] = stat;
                        _e.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    ClientManager.prototype.waitForAnyMongoConnected = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.mongoReadyPromise];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ClientManager.prototype.prepareMongoForClient = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var client, clientIndex, uri, attemptConnect;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        client = this.clients.get(id);
                        if (!client)
                            return [2 /*return*/];
                        clientIndex = __spreadArray([], this.clients.keys(), true).indexOf(id) + 1;
                        client.dbName = "Client".concat(String(clientIndex).padStart(2, "0"));
                        client.collections = {
                            transmiters: "".concat(client.dbName, "_Transmiters"),
                            valves: "".concat(client.dbName, "_Valves"),
                            motors: "".concat(client.dbName, "_Motors")
                        };
                        uri = process.env.connectionstring3;
                        if (!uri)
                            throw new Error("connectionstring3 não definida");
                        client.mongoClient = new mongodb_1.MongoClient(uri, {
                            tls: true,
                            tlsAllowInvalidCertificates: false,
                            socketTimeoutMS: 0,
                            serverSelectionTimeoutMS: 30000,
                            maxPoolSize: 10,
                            minPoolSize: 1,
                            maxIdleTimeMS: 0
                        });
                        attemptConnect = function () { return __awaiter(_this, void 0, void 0, function () {
                            var db, _i, _a, collection, exists, err_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 8, , 9]);
                                        return [4 /*yield*/, Promise.race([
                                                client.mongoClient.connect(),
                                                new Promise(function (_, reject) {
                                                    return setTimeout(function () { return reject(new Error("Timeout conexão MongoDB")); }, 30000);
                                                })
                                            ])];
                                    case 1:
                                        _b.sent();
                                        return [4 /*yield*/, client.mongoClient.db("admin").command({ ping: 1 })];
                                    case 2:
                                        _b.sent();
                                        db = client.mongoClient.db(client.dbName);
                                        if (!client.collections) return [3 /*break*/, 7];
                                        _i = 0, _a = Object.values(client.collections);
                                        _b.label = 3;
                                    case 3:
                                        if (!(_i < _a.length)) return [3 /*break*/, 7];
                                        collection = _a[_i];
                                        return [4 /*yield*/, db.listCollections({ name: collection }).hasNext()];
                                    case 4:
                                        exists = _b.sent();
                                        if (!!exists) return [3 /*break*/, 6];
                                        return [4 /*yield*/, db.createCollection(collection)];
                                    case 5:
                                        _b.sent();
                                        _b.label = 6;
                                    case 6:
                                        _i++;
                                        return [3 /*break*/, 3];
                                    case 7:
                                        client.mongoConnected = true;
                                        client.startMongoPing(60000);
                                        if (this.mongoReadyResolve) {
                                            this.mongoReadyResolve();
                                            this.mongoReadyResolve = null;
                                        }
                                        return [3 /*break*/, 9];
                                    case 8:
                                        err_1 = _b.sent();
                                        console.error("[".concat(client.dbName, "] Erro ao conectar MongoDB:"), err_1);
                                        client.mongoConnected = false;
                                        setTimeout(attemptConnect, 5000);
                                        return [3 /*break*/, 9];
                                    case 9: return [2 /*return*/];
                                }
                            });
                        }); };
                        return [4 /*yield*/, attemptConnect()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return ClientManager;
}());
exports.ClientManager = ClientManager;
exports.clientManager = new ClientManager();
