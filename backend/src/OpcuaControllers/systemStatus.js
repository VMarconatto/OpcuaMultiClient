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
exports.getSystemStatus = getSystemStatus;
exports.getNetworkLatency = getNetworkLatency;
var os_1 = require("os");
// @ts-ignore
var node_os_utils_1 = require("node-os-utils");
var child_process_1 = require("child_process");
var util_1 = require("util");
var cpu = node_os_utils_1.default.cpu, drive = node_os_utils_1.default.drive, mem = node_os_utils_1.default.mem, netstat = node_os_utils_1.default.netstat;
function getSystemStatus() {
    return __awaiter(this, void 0, void 0, function () {
        var memoryUsage, diskUsage, cpuLoad, uptime, memory, err_1, disk, err_2, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    memoryUsage = 0;
                    diskUsage = 0;
                    cpuLoad = 0;
                    uptime = 0;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, mem.info()];
                case 2:
                    memory = _a.sent();
                    memoryUsage = Number(memory.usedMemMb);
                    return [3 /*break*/, 4];
                case 3:
                    err_1 = _a.sent();
                    console.error("Erro ao obter memória:", err_1);
                    return [3 /*break*/, 4];
                case 4:
                    _a.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, drive.info()];
                case 5:
                    disk = _a.sent();
                    diskUsage = Number(disk.usedGb);
                    return [3 /*break*/, 7];
                case 6:
                    err_2 = _a.sent();
                    console.error("Erro ao obter disco:", err_2);
                    return [3 /*break*/, 7];
                case 7:
                    _a.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, cpu.usage()];
                case 8:
                    cpuLoad = _a.sent();
                    return [3 /*break*/, 10];
                case 9:
                    err_3 = _a.sent();
                    console.error("Erro ao obter CPU:", err_3);
                    return [3 /*break*/, 10];
                case 10:
                    try {
                        uptime = os_1.default.uptime();
                    }
                    catch (err) {
                        console.error("Erro ao obter uptime:", err);
                    }
                    return [2 /*return*/, {
                            memoryUsage: memoryUsage,
                            diskUsage: diskUsage,
                            uptime: uptime,
                            cpuLoad: cpuLoad,
                        }];
            }
        });
    });
}
var execPromise = (0, util_1.promisify)(child_process_1.exec);
function getNetworkLatency() {
    return __awaiter(this, void 0, void 0, function () {
        var stdout, match, latency, err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, execPromise("ping -n 1 8.8.8.8")];
                case 1:
                    stdout = (_a.sent()).stdout;
                    match = stdout.match(/tempo[=<]\s*(\d+)\s*ms/i) || stdout.match(/time[=<]\s*(\d+)\s*ms/i);
                    latency = match ? parseInt(match[1], 10) : null;
                    return [2 /*return*/, { latencyMs: latency }];
                case 2:
                    err_4 = _a.sent();
                    console.error("Erro ao medir latência:", err_4);
                    return [2 /*return*/, { latencyMs: null }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
