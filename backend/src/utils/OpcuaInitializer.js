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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
exports.initializeOpcuaClientsFromJSON = initializeOpcuaClientsFromJSON;
var ClientManager_js_1 = require("../controllers/ClientManager.js");
var promises_1 = require("fs/promises");
var path_1 = require("path");
function initializeOpcuaClientsFromJSON() {
    return __awaiter(this, void 0, void 0, function () {
        var configPath, fileContent, parsedConfig, clients, clientKeys, _i, clientKeys_1, id, _a, endpoint, mapMemory, opcuaOptions, mongoErr_1, clientInstance, sanitizedId, sanitizedEndpoint, appUri, err_1, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 15, , 16]);
                    configPath = path_1.default.resolve("opcuaClientConfig.json");
                    console.log("\uD83D\uDCC4 [OpcuaInitializer] Lendo configura\u00E7\u00F5es de: ".concat(configPath));
                    return [4 /*yield*/, promises_1.default.readFile(configPath, "utf-8")];
                case 1:
                    fileContent = _b.sent();
                    parsedConfig = JSON.parse(fileContent);
                    clients = parsedConfig.clients || {};
                    clientKeys = Object.keys(clients);
                    if (clientKeys.length === 0) {
                        console.warn("⚠️ [OpcuaInitializer] Nenhuma configuração OPC UA encontrada no JSON.");
                        return [2 /*return*/];
                    }
                    console.log("\uD83D\uDD17 [OpcuaInitializer] Encontradas ".concat(clientKeys.length, " conex\u00F5es OPC UA no JSON"));
                    _i = 0, clientKeys_1 = clientKeys;
                    _b.label = 2;
                case 2:
                    if (!(_i < clientKeys_1.length)) return [3 /*break*/, 14];
                    id = clientKeys_1[_i];
                    _a = clients[id], endpoint = _a.endpoint, mapMemory = _a.mapMemory, opcuaOptions = __rest(_a, ["endpoint", "mapMemory"]);
                    if (!endpoint) {
                        console.warn("\u26A0\uFE0F [OpcuaInitializer] Configura\u00E7\u00E3o inv\u00E1lida para '".concat(id, "': endpoint ausente"));
                        return [3 /*break*/, 13];
                    }
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 12, , 13]);
                    console.log("\uD83C\uDD95 [OpcuaInitializer] Adicionando cliente '".concat(id, "' ao ClientManager"));
                    ClientManager_js_1.clientManager.addClient(id, endpoint, mapMemory || [], opcuaOptions);
                    // 🔥 Prepara MongoDB antes de inicializar OPC UA
                    console.log("\uD83D\uDCE6 [OpcuaInitializer] Garantindo MongoDB para cliente '".concat(id, "'"));
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, ClientManager_js_1.clientManager.prepareMongoForClient(id)];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 7];
                case 6:
                    mongoErr_1 = _b.sent();
                    if (mongoErr_1 instanceof Error) {
                        console.error("\u274C [OpcuaInitializer] Erro ao preparar MongoDB para cliente '".concat(id, "':"), mongoErr_1.stack || mongoErr_1.message);
                    }
                    else {
                        console.error("\u274C [OpcuaInitializer] Erro desconhecido ao preparar MongoDB para cliente '".concat(id, "':"), mongoErr_1);
                    }
                    return [3 /*break*/, 13]; // Pula inicialização OPC UA se MongoDB falhou
                case 7:
                    clientInstance = ClientManager_js_1.clientManager.getClient(id);
                    if (!clientInstance) return [3 /*break*/, 10];
                    console.log("\uD83D\uDD0C [OpcuaInitializer] Inicializando cliente OPC UA '".concat(id, "' em ").concat(endpoint));
                    sanitizedId = id.replace(/[^a-zA-Z0-9]/g, "_");
                    sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9]/g, "_");
                    appUri = "".concat(sanitizedId, "_").concat(sanitizedEndpoint);
                    return [4 /*yield*/, clientInstance.initialize(appUri)];
                case 8:
                    _b.sent();
                    return [4 /*yield*/, clientInstance.connect()];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 11];
                case 10:
                    console.error("\u274C [OpcuaInitializer] Cliente '".concat(id, "' n\u00E3o configurado corretamente pelo ClientManager."));
                    console.log("\uD83D\uDCE6 [OpcuaInitializer] IDs no mapa de clientes atualmente:", __spreadArray([], ClientManager_js_1.clientManager["clients"].keys(), true));
                    _b.label = 11;
                case 11: return [3 /*break*/, 13];
                case 12:
                    err_1 = _b.sent();
                    if (err_1 instanceof Error) {
                        console.error("\u274C [OpcuaInitializer] Erro ao iniciar cliente OPC UA '".concat(id, "':"), err_1.stack || err_1.message);
                    }
                    else {
                        console.error("\u274C [OpcuaInitializer] Erro desconhecido ao iniciar cliente OPC UA '".concat(id, "':"), err_1);
                    }
                    return [3 /*break*/, 13];
                case 13:
                    _i++;
                    return [3 /*break*/, 2];
                case 14: return [3 /*break*/, 16];
                case 15:
                    err_2 = _b.sent();
                    if (err_2 instanceof Error) {
                        console.error("❌ [OpcuaInitializer] Erro ao carregar configurações OPC UA do JSON:", err_2.stack || err_2.message);
                    }
                    else {
                        console.error("❌ [OpcuaInitializer] Erro desconhecido ao carregar configurações OPC UA do JSON:", err_2);
                    }
                    return [3 /*break*/, 16];
                case 16: return [2 /*return*/];
            }
        });
    });
}
