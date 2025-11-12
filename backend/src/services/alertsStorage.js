"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveAlert = saveAlert;
exports.loadAlerts = loadAlerts;
// alertsStorage.ts
var fs_1 = require("fs");
var path_1 = require("path");
function getAlertsFile(clientId) {
    return path_1.default.resolve("../alerts/alerts-log-".concat(clientId, ".json"));
}
function saveAlert(alert) {
    var filePath = getAlertsFile(alert.clientId);
    var alerts = loadAlerts(alert.clientId);
    alerts.unshift(alert);
    if (alerts.length > 100) {
        alerts.pop();
    }
    fs_1.default.writeFileSync(filePath, JSON.stringify(alerts, null, 2), "utf-8");
}
function loadAlerts(clientId) {
    var filePath = getAlertsFile(clientId);
    try {
        if (!fs_1.default.existsSync(filePath)) {
            return [];
        }
        var content = fs_1.default.readFileSync(filePath, "utf-8");
        return JSON.parse(content);
    }
    catch (error) {
        console.error("Erro ao carregar alertas para ".concat(clientId, ":"), error);
        return [];
    }
}
