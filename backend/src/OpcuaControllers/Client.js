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
exports.OpcuaClient = void 0;
var node_opcua_1 = require("node-opcua");
var pkiUtils_js_1 = require("../utils/pkiUtils.js");
var Device01Crd_js_1 = require("../Repositories/Device01Crd.js");
var ClientManager_js_1 = require("../controllers/ClientManager.js");
var OpcuaClient = /** @class */ (function () {
    function OpcuaClient(endpoint, options, mapMemory) {
        if (options === void 0) { options = {}; }
        if (mapMemory === void 0) { mapMemory = []; }
        this.session = null;
        this.connected = false;
        this.alertStats = {};
        this.autoReadInterval = null;
        this.mongoConnected = false;
        this.opcuaStatus = {
            connected: false,
            lastSessionCreated: null,
            lastReadTimestamp: null,
            lastLatencyMs: null,
            sessionDurationMs: null,
            readCount: 0,
            readFailures: {},
            lastError: null,
            sessionStartedAt: null,
        };
        this.endpoint = endpoint;
        this.mapMemory = mapMemory;
        this.client = node_opcua_1.OPCUAClient.create(__assign(__assign({}, options), { securityMode: node_opcua_1.MessageSecurityMode.SignAndEncrypt, securityPolicy: node_opcua_1.SecurityPolicy.Basic256Sha256, endpointMustExist: false }));
    }
    OpcuaClient.prototype.initialize = function (applicationUri) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, certFile, keyFile, appName, appUri;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, (0, pkiUtils_js_1.ensureClientPKI)(applicationUri, this.endpoint)];
                    case 1:
                        _a = _b.sent(), certFile = _a.certFile, keyFile = _a.keyFile;
                        appName = "OpcuaClient-".concat(applicationUri);
                        appUri = "urn:device01_opc_tcp___Avell_53530_OPCUA_SimulationServer";
                        this.client = node_opcua_1.OPCUAClient.create({
                            applicationName: appName,
                            applicationUri: appUri,
                            certificateFile: certFile,
                            privateKeyFile: keyFile,
                            securityMode: node_opcua_1.MessageSecurityMode.SignAndEncrypt,
                            securityPolicy: node_opcua_1.SecurityPolicy.Basic256Sha256,
                            endpointMustExist: false,
                        });
                        console.log("\u2705 OPCUAClient inicializado para ".concat(this.endpoint, " com applicationUri ").concat(appUri));
                        return [2 /*return*/];
                }
            });
        });
    };
    OpcuaClient.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, mappedNodeIds, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, ClientManager_js_1.clientManager.waitForAnyMongoConnected()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.client.connect(this.endpoint)];
                    case 2:
                        _b.sent();
                        _a = this;
                        return [4 /*yield*/, this.client.createSession()];
                    case 3:
                        _a.session = _b.sent();
                        this.connected = true;
                        console.log("\uD83D\uDD0C Conectado ao servidor OPC UA em ".concat(this.endpoint));
                        this.opcuaStatus.connected = true;
                        this.opcuaStatus.lastSessionCreated = new Date().toISOString();
                        this.opcuaStatus.sessionStartedAt = Date.now();
                        this.opcuaStatus.readCount = 0;
                        this.opcuaStatus.readFailures = {};
                        this.opcuaStatus.lastError = null;
                        if (this.mapMemory.length > 0) {
                            mappedNodeIds = this.mapMemory.map(function (id) { return "ns=3;i=".concat(id); });
                            this.startAutoRead(mappedNodeIds, 2000);
                        }
                        else {
                            console.warn("\u26A0\uFE0F Nenhum nodeId definido para leitura em ".concat(this.endpoint));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _b.sent();
                        console.error("\u274C Erro ao conectar em ".concat(this.endpoint, ":"), err_1);
                        this.connected = false;
                        this.opcuaStatus.connected = false;
                        this.opcuaStatus.lastError = String(err_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    OpcuaClient.prototype.disconnect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.autoReadInterval) {
                            clearInterval(this.autoReadInterval);
                            this.autoReadInterval = null;
                        }
                        if (!(this.connected && this.session)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.session.close()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.client.disconnect()];
                    case 2:
                        _b.sent();
                        this.connected = false;
                        this.opcuaStatus.connected = false;
                        this.opcuaStatus.sessionDurationMs = Date.now() - ((_a = this.opcuaStatus.sessionStartedAt) !== null && _a !== void 0 ? _a : Date.now());
                        this.opcuaStatus.sessionStartedAt = null;
                        console.log("\uD83D\uDD0C Desconectado de ".concat(this.endpoint));
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    OpcuaClient.prototype.readVariables = function (nodeIds) {
        return __awaiter(this, void 0, void 0, function () {
            var dataValues_1, startReadTime, _i, nodeIds_1, nodeId, dataValue, readErr_1, transmitterValues_1, err_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.connected || !this.session) {
                            console.warn("\u26A0\uFE0F Cliente n\u00E3o est\u00E1 conectado ou sess\u00E3o inexistente para ".concat(this.endpoint));
                            return [2 /*return*/];
                        }
                        if (!this.mongoConnected) {
                            console.warn("\u26A0\uFE0F MongoDB n\u00E3o conectado para ".concat(this.dbName, ". Coleta OPC UA suspensa."));
                            return [2 /*return*/];
                        }
                        console.log("\uD83D\uDD0E [".concat(this.endpoint, "] NodeIds recebidos para leitura:"), nodeIds);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 11, , 12]);
                        dataValues_1 = [];
                        startReadTime = Date.now();
                        _i = 0, nodeIds_1 = nodeIds;
                        _a.label = 2;
                    case 2:
                        if (!(_i < nodeIds_1.length)) return [3 /*break*/, 7];
                        nodeId = nodeIds_1[_i];
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, this.session.read({
                                nodeId: nodeId,
                                attributeId: node_opcua_1.AttributeIds.Value
                            }, node_opcua_1.TimestampsToReturn.Both)];
                    case 4:
                        dataValue = _a.sent();
                        console.log("\uD83D\uDCE5 [".concat(this.endpoint, "] Valor recebido - NodeId: ").concat(nodeId, ", Valor: ").concat(JSON.stringify(dataValue.value.value)));
                        dataValues_1.push(dataValue.value.value);
                        this.opcuaStatus.readCount += 1;
                        return [3 /*break*/, 6];
                    case 5:
                        readErr_1 = _a.sent();
                        console.error("\u274C Erro ao ler NodeId ".concat(nodeId, " em ").concat(this.endpoint, ":"), readErr_1);
                        this.opcuaStatus.readFailures[nodeId] = (this.opcuaStatus.readFailures[nodeId] || 0) + 1;
                        this.opcuaStatus.lastError = String(readErr_1);
                        return [3 /*break*/, 6];
                    case 6:
                        _i++;
                        return [3 /*break*/, 2];
                    case 7:
                        this.opcuaStatus.lastReadTimestamp = new Date().toISOString();
                        this.opcuaStatus.lastLatencyMs = Date.now() - startReadTime;
                        if (!(dataValues_1.length > 0 && this.dbName)) return [3 /*break*/, 10];
                        console.log('entrou no if do readVariables para escrita no mongodb');
                        transmitterValues_1 = {};
                        this.mapMemory.forEach(function (id, index) {
                            var _a, _b;
                            var tagName = (_b = (_a = ClientManager_js_1.clientManager.getTagNameByNodeId) === null || _a === void 0 ? void 0 : _a.call(ClientManager_js_1.clientManager, id, _this.dbName)) !== null && _b !== void 0 ? _b : "Tag-".concat(id);
                            transmitterValues_1[tagName] = dataValues_1[index];
                        });
                        return [4 /*yield*/, ClientManager_js_1.clientManager.checkAndSendAlerts(this.dbName, transmitterValues_1)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, (0, Device01Crd_js_1.Device_WriteDB)(dataValues_1, this.dbName)];
                    case 9:
                        _a.sent();
                        _a.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        err_2 = _a.sent();
                        console.error("\u274C Erro geral ao ler vari\u00E1veis em ".concat(this.endpoint, ":"), err_2);
                        this.opcuaStatus.lastError = String(err_2);
                        return [3 /*break*/, 12];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    OpcuaClient.prototype.startAutoRead = function (nodeIds, intervalMs) {
        var _this = this;
        if (this.autoReadInterval) {
            clearInterval(this.autoReadInterval);
        }
        console.log("\uD83D\uDCE1 [".concat(this.endpoint, "] Iniciando leitura autom\u00E1tica a cada ").concat(intervalMs, "ms para NodeIds:"), nodeIds);
        this.autoReadInterval = setInterval(function () {
            _this.readVariables(nodeIds);
        }, intervalMs);
    };
    OpcuaClient.prototype.getStatus = function () {
        return this.opcuaStatus;
    };
    OpcuaClient.prototype.getAlertStats = function () {
        return this.alertStats;
    };
    OpcuaClient.prototype.getMapMemory = function () {
        return this.mapMemory;
    };
    OpcuaClient.prototype.startMongoPing = function (intervalMs) {
        var _this = this;
        if (intervalMs === void 0) { intervalMs = 60000; }
        if (!this.mongoClient)
            return;
        console.log("[".concat(this.dbName, "] Iniciando ping peri\u00F3dico MongoDB a cada ").concat(intervalMs / 1000, "s"));
        setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.mongoClient.db(this.dbName).command({ ping: 1 })];
                    case 1:
                        _a.sent();
                        console.log("[".concat(this.dbName, "] Ping MongoDB bem-sucedido"));
                        return [3 /*break*/, 3];
                    case 2:
                        err_3 = _a.sent();
                        console.error("[".concat(this.dbName, "] Erro no ping MongoDB:"), err_3);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); }, intervalMs);
    };
    return OpcuaClient;
}());
exports.OpcuaClient = OpcuaClient;
