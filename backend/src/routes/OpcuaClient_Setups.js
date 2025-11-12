"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var fs_1 = require("fs");
var path_1 = require("path");
var SetupInitializer_js_1 = require("../utils/SetupInitializer.js");
var OpcuaSetupRouter = (0, express_1.Router)();
var opcuaConfigFilePath = path_1.default.join(process.cwd(), "opcuaClientConfig.json");
OpcuaSetupRouter.get("/opcuaclientsetup/:deviceId", function (req, res) {
    var _a;
    var deviceId = req.params.deviceId;
    if (!deviceId) {
        return res.status(400).json({ error: "Parâmetro deviceId é obrigatório." });
    }
    try {
        var rawConfig = fs_1.default.readFileSync(opcuaConfigFilePath, "utf-8");
        var fullConfig = JSON.parse(rawConfig);
        var clientConfig = (_a = fullConfig.clients) === null || _a === void 0 ? void 0 : _a[deviceId];
        if (!clientConfig) {
            return res.status(404).json({ error: "Client '".concat(deviceId, "' n\u00E3o encontrado.") });
        }
        res.json(clientConfig);
    }
    catch (err) {
        console.error("Erro ao buscar client individual:", err);
        res.status(500).json({ error: "Erro ao ler configurações." });
    }
});
OpcuaSetupRouter.get("/opcuaclientsetup", function (req, res) {
    try {
        var rawConfig = fs_1.default.readFileSync(opcuaConfigFilePath, "utf-8");
        var fullConfig = JSON.parse(rawConfig);
        res.json({ clients: fullConfig.clients || {} });
    }
    catch (err) {
        console.error("Erro ao ler configurações OPC UA:", err);
        res.status(500).json({ error: "Erro ao ler arquivo de configuração" });
    }
});
/**
 * Rota POST para adicionar uma nova conexão OPC UA
 * e criar automaticamente o setup analógico correspondente.
 */
OpcuaSetupRouter.post("/opcuaclientsetup", function (req, res) {
    var incomingData = req.body;
    var deviceId = incomingData.deviceId, clientConfig = __rest(incomingData, ["deviceId"]);
    if (!deviceId || !clientConfig.mapMemory) {
        return res.status(400).json({ error: "deviceId e mapMemory são obrigatórios." });
    }
    // Lê config existente ou cria nova estrutura
    var fullConfig = { clients: {} };
    if (fs_1.default.existsSync(opcuaConfigFilePath)) {
        var rawConfig = fs_1.default.readFileSync(opcuaConfigFilePath, "utf-8");
        fullConfig = JSON.parse(rawConfig);
    }
    fullConfig.clients[deviceId] = clientConfig;
    // Salva o opcuaClientConfig.json
    fs_1.default.writeFile(opcuaConfigFilePath, JSON.stringify(fullConfig, null, 2), function (err) {
        if (err) {
            console.error("\u274C Erro ao salvar ".concat(opcuaConfigFilePath, ":"), err);
            return res.status(500).json({ error: "Erro ao salvar configuração OPC UA" });
        }
        console.log("\u2705 Conex\u00E3o salva para ".concat(deviceId, " em opcuaClientConfig.json"));
        // 🔥 Cria o setup JSON automaticamente para o novo device
        (0, SetupInitializer_js_1.createSetupFileIfMissing)(deviceId, clientConfig.mapMemory);
        res.json({ message: "Configura\u00E7\u00E3o OPC UA e setup anal\u00F3gico salvos para ".concat(deviceId) });
    });
});
exports.default = OpcuaSetupRouter;
