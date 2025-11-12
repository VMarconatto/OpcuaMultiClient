"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.opcuaRoutes = void 0;
var express_1 = require("express");
var ClientManager_js_1 = require("../controllers/ClientManager.js");
exports.opcuaRoutes = (0, express_1.Router)();
// ✅ Criar nova conexão OPC UA
exports.opcuaRoutes.post("/opcua/connect", function (req, res) {
    var _a = req.body, id = _a.id, endpoint = _a.endpoint, config = _a.config;
    if (!id || !endpoint) {
        return res.status(400).json({ error: "ID e endpoint são obrigatórios" });
    }
    try {
        ClientManager_js_1.clientManager.addClient(id, endpoint, (config === null || config === void 0 ? void 0 : config.mapMemory) || [], (config === null || config === void 0 ? void 0 : config.opcuaOptions) || {});
        res.json({ success: true, message: "Cliente ".concat(id, " criado com sucesso.") });
    }
    catch (err) {
        var errorMessage = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMessage });
    }
});
// ✅ Listar todos os clientes ativos
exports.opcuaRoutes.get("/opcua/clients", function (req, res) {
    var clients = ClientManager_js_1.clientManager.getAllClients();
    res.json(clients);
});
// ✅ Obter status de todos os clientes ativos
exports.opcuaRoutes.get("/opcua/status", function (req, res) {
    var clients = ClientManager_js_1.clientManager.getAllClients();
    var statuses = Object.entries(clients).map(function (_a) {
        var id = _a[0], client = _a[1];
        return ({
            id: id,
            status: client.getStatus()
        });
    });
    res.json(statuses);
});
// ✅ Obter status de um cliente específico
exports.opcuaRoutes.get("/opcua/status/:id", function (req, res) {
    var client = ClientManager_js_1.clientManager.getClient(req.params.id);
    if (!client) {
        return res.status(404).json({ error: "Cliente ".concat(req.params.id, " n\u00E3o encontrado") });
    }
    res.json(client.getStatus());
});
// ✅ Reiniciar cliente específico
exports.opcuaRoutes.post("/opcua/reconnect/:id", function (req, res) {
    var client = ClientManager_js_1.clientManager.getClient(req.params.id);
    if (!client) {
        return res.status(404).json({ error: "Cliente ".concat(req.params.id, " n\u00E3o encontrado") });
    }
    if (typeof client.connect === "function") {
        client.connect();
        res.json({ success: true, message: "Cliente ".concat(req.params.id, " reiniciado com sucesso.") });
    }
    else {
        res.status(500).json({ error: "Método reconnect não implementado neste cliente." });
    }
});
// ✅ Remover e desconectar cliente específico
exports.opcuaRoutes.delete("/opcua/:id", function (req, res) {
    try {
        ClientManager_js_1.clientManager.removeClient(req.params.id);
        res.json({ success: true, message: "Cliente ".concat(req.params.id, " removido com sucesso.") });
    }
    catch (err) {
        var errorMessage = err instanceof Error ? err.message : String(err);
        res.status(500).json({ error: errorMessage });
    }
});
