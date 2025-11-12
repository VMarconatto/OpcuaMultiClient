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
exports.ensureClientPKI = ensureClientPKI;
var path_1 = require("path");
var fs_1 = require("fs");
var os_1 = require("os");
var node_opcua_1 = require("node-opcua");
function ensureClientPKI(deviceId, endpoint) {
    return __awaiter(this, void 0, void 0, function () {
        var sanitizedDeviceId, sanitizedEndpoint, pkiDir, certFile, keyFile, certificateManager, applicationUri, rejectedDir, trustedDir, rejectedFiles, _i, rejectedFiles_1, file, source, destination;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    sanitizedDeviceId = deviceId.replace(/[^a-zA-Z0-9]/g, "_");
                    sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9]/g, "_");
                    pkiDir = path_1.default.resolve("config/pki", "".concat(sanitizedDeviceId, "_").concat(sanitizedEndpoint));
                    certFile = path_1.default.join(pkiDir, "own/certs/self_signed_certificate.pem");
                    keyFile = path_1.default.join(pkiDir, "own/private/private_key.pem");
                    // ✅ Preserva PKI existente (não apaga mais)
                    if (!fs_1.default.existsSync(pkiDir)) {
                        fs_1.default.mkdirSync(pkiDir, { recursive: true });
                        console.log("\uD83D\uDCC1 Diret\u00F3rio PKI criado: ".concat(pkiDir));
                    }
                    else {
                        console.log("\uD83D\uDCC1 Diret\u00F3rio PKI j\u00E1 existe: ".concat(pkiDir, " (preservado)"));
                    }
                    certificateManager = new node_opcua_1.OPCUACertificateManager({
                        automaticallyAcceptUnknownCertificate: true,
                        rootFolder: pkiDir
                    });
                    return [4 /*yield*/, certificateManager.initialize()];
                case 1:
                    _a.sent();
                    applicationUri = "urn:".concat(deviceId);
                    console.log("\uD83D\uDD10 Verificando certificado self-signed com applicationUri: ".concat(applicationUri));
                    if (!!fs_1.default.existsSync(certFile)) return [3 /*break*/, 3];
                    console.log("\uD83D\uDD10 Gerando novo certificado self-signed para ".concat(applicationUri));
                    return [4 /*yield*/, certificateManager.createSelfSignedCertificate({
                            applicationUri: applicationUri,
                            subject: "/CN=OpcuaClient",
                            dns: [os_1.default.hostname()],
                            validity: 365,
                            startDate: new Date(),
                        })];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    rejectedDir = path_1.default.join(pkiDir, "rejected");
                    trustedDir = path_1.default.join(pkiDir, "trusted/certs");
                    if (fs_1.default.existsSync(rejectedDir)) {
                        rejectedFiles = fs_1.default.readdirSync(rejectedDir);
                        for (_i = 0, rejectedFiles_1 = rejectedFiles; _i < rejectedFiles_1.length; _i++) {
                            file = rejectedFiles_1[_i];
                            source = path_1.default.join(rejectedDir, file);
                            destination = path_1.default.join(trustedDir, file);
                            fs_1.default.renameSync(source, destination);
                            console.log("\u2705 Certificado do servidor movido para trusted: ".concat(file));
                        }
                    }
                    console.log("📦 Arquivos PKI no diretório:", fs_1.default.readdirSync(pkiDir, { withFileTypes: true }).map(function (f) { return f.name; }));
                    console.log("📦 Arquivos em own/certs:", fs_1.default.existsSync(path_1.default.join(pkiDir, "own/certs")) ? fs_1.default.readdirSync(path_1.default.join(pkiDir, "own/certs")) : []);
                    console.log("📦 Arquivos em own/private:", fs_1.default.existsSync(path_1.default.join(pkiDir, "own/private")) ? fs_1.default.readdirSync(path_1.default.join(pkiDir, "own/private")) : []);
                    return [2 /*return*/, { certFile: certFile, keyFile: keyFile }];
            }
        });
    });
}
