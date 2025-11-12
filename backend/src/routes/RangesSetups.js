"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var fs_1 = require("fs");
var path_1 = require("path");
var SetupRouter = (0, express_1.Router)();
var setupsPath = process.cwd();
/**
 * Rota GET para obter o setup de um device específico
 */
SetupRouter.get("/:deviceId/setupalarms", function (req, res) {
    var _a;
    var deviceId = req.params.deviceId;
    var configPath = path_1.default.join(setupsPath, "opcuaClientConfig.json");
    // Leitura do config geral
    if (!fs_1.default.existsSync(configPath)) {
        return res.status(500).json({ error: "Configuração opcuaClientConfig.json não encontrada." });
    }
    var config = JSON.parse(fs_1.default.readFileSync(configPath, "utf-8"));
    var client = (_a = config.clients) === null || _a === void 0 ? void 0 : _a[deviceId];
    if (!client) {
        return res.status(404).json({ error: "Cliente ".concat(deviceId, " n\u00E3o encontrado na configura\u00E7\u00E3o.") });
    }
    var memoryTags = client.mapMemory || [];
    // Caminho do arquivo de setup
    var setupFile = deviceId === "Client01"
        ? path_1.default.join(setupsPath, "setuptsconfig.json") // correto para Client01
        : path_1.default.join(setupsPath, "".concat(deviceId, "_setuptsconfig.json"));
    var existingSetup = {};
    if (fs_1.default.existsSync(setupFile)) {
        try {
            existingSetup = JSON.parse(fs_1.default.readFileSync(setupFile, "utf-8"));
        }
        catch (err) {
            console.error("\u274C Erro ao ler ".concat(setupFile, ":"), err);
            return res.status(500).json({ error: "Erro ao ler setup existente." });
        }
    }
    // REGRA: Se o setup já existir, usar as chaves como variáveis
    if (Object.keys(existingSetup).length > 0) {
        return res.json(existingSetup);
    }
    // Fallback: não há setup salvo ainda — gerar estrutura com base no mapMemory
    var generatedSetup = {};
    memoryTags.forEach(function (tagId) {
        generatedSetup[tagId] = {
            mínimo: 0,
            máximo: 0,
            unidade: "",
            SPAlarmL: 0,
            SPAlarmLL: 0,
            SPAlarmH: 0,
            SPAlarmHH: 0,
        };
    });
    res.json(generatedSetup);
});
/**
 * Rota POST para atualizar o setup de um device específico
 */
SetupRouter.post("/:deviceId/setupalarms", function (req, res) {
    var deviceId = req.params.deviceId;
    var incomingData = req.body;
    var configPath = path_1.default.join(setupsPath, "opcuaClientConfig.json");
    if (deviceId === "Client01") {
        var outputPath = path_1.default.join(setupsPath, "setuptsconfig.json");
        try {
            fs_1.default.writeFileSync(outputPath, JSON.stringify(incomingData, null, 2));
            console.log("\u2705 Setup salvo para Client01: ".concat(outputPath));
            res.json({ message: "Setup salvo com sucesso para Client01" });
        }
        catch (err) {
            console.error("❌ Erro ao salvar setup:", err);
            return res.status(500).json({ error: "Erro ao salvar setup" });
        }
    }
    else {
        var setupFile_1 = path_1.default.join(setupsPath, "".concat(deviceId, "_setuptsconfig.json"));
        fs_1.default.writeFile(setupFile_1, JSON.stringify(incomingData, null, 2), function (err) {
            if (err) {
                console.error("\u274C Erro ao salvar ".concat(setupFile_1, ":"), err);
                return res.status(500).json({ error: "Erro ao salvar setup" });
            }
            console.log("\u2705 Setup salvo para ".concat(deviceId, ": ").concat(setupFile_1));
            res.json({ message: "Setup salvo com sucesso para ".concat(deviceId) });
        });
    }
});
exports.default = SetupRouter;
