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
exports.processAlerts = processAlerts;
exports.startAlertScheduler = startAlertScheduler;
var ClientManager_js_1 = require("../controllers/ClientManager.js");
var alertsStorage_js_1 = require("../services/alertsStorage.js");
var emailService_js_1 = require("../services/emailService.js");
var ALERT_INTERVAL_MS = 10 * 60 * 1000; // 10 minutos
var EMAIL_RECIPIENTS = [process.env.ALERT_EMAIL_DESTINATION || "desconhecido"];
function processAlerts() {
    return __awaiter(this, void 0, void 0, function () {
        var allStats, now, _a, _b, _c, _i, deviceId, deviceStats, _d, _e, _f, _g, key, entry, alertPayload;
        var _h, _j;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    allStats = ClientManager_js_1.clientManager.getAllAlertStats();
                    now = Date.now();
                    _a = allStats;
                    _b = [];
                    for (_c in _a)
                        _b.push(_c);
                    _i = 0;
                    _k.label = 1;
                case 1:
                    if (!(_i < _b.length)) return [3 /*break*/, 7];
                    _c = _b[_i];
                    if (!(_c in _a)) return [3 /*break*/, 6];
                    deviceId = _c;
                    deviceStats = allStats[deviceId];
                    _d = deviceStats;
                    _e = [];
                    for (_f in _d)
                        _e.push(_f);
                    _g = 0;
                    _k.label = 2;
                case 2:
                    if (!(_g < _e.length)) return [3 /*break*/, 6];
                    _f = _e[_g];
                    if (!(_f in _d)) return [3 /*break*/, 5];
                    key = _f;
                    entry = deviceStats[key];
                    if (!(now - entry.lastSent >= ALERT_INTERVAL_MS && entry.count > 0)) return [3 /*break*/, 5];
                    alertPayload = {
                        timestamp: new Date().toISOString(),
                        alertData: (_h = {},
                            _h[key] = entry.lastValue,
                            _h.AlertsCount = entry.count,
                            _h),
                        recipients: EMAIL_RECIPIENTS
                    };
                    return [4 /*yield*/, (0, alertsStorage_js_1.saveAlert)({
                            timestamp: new Date().toISOString(),
                            alertData: (_j = {},
                                _j[key] = entry.lastValue,
                                _j.AlertsCount = entry.count,
                                _j),
                            recipients: EMAIL_RECIPIENTS,
                            clientId: deviceId // 👈 aqui!
                        })];
                case 3:
                    _k.sent();
                    return [4 /*yield*/, (0, emailService_js_1.sendEmailAlert)("\uD83D\uDEA8 Alerta: ".concat(key, " (").concat(deviceId, ")"), "O instrumento \"".concat(key, "\" do dispositivo \"").concat(deviceId, "\" saiu dos limites ").concat(entry.count, " vezes.\n\u00DAltimo valor registrado: ").concat(entry.lastValue))];
                case 4:
                    _k.sent();
                    deviceStats[key].lastSent = now;
                    _k.label = 5;
                case 5:
                    _g++;
                    return [3 /*break*/, 2];
                case 6:
                    _i++;
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/];
            }
        });
    });
}
function startAlertScheduler() {
    setInterval(function () {
        processAlerts();
    }, 60000); // Executa a cada 60 segundos
    console.log("✅ Alert Scheduler iniciado");
}
