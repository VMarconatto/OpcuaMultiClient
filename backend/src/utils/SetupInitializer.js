"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSetupFileIfMissing = createSetupFileIfMissing;
var fs_1 = require("fs");
var path_1 = require("path");
/**
 * Cria um arquivo de setup analógico para o device se ele ainda não existir.
 * @param deviceId - Identificador do dispositivo (ex: device01)
 * @param mapMemory - Array de tags OPC UA configurados para o device
 */
function createSetupFileIfMissing(deviceId, mapMemory) {
    var setupFileName = "".concat(deviceId, "_setuptsconfig.json");
    var setupFilePath = path_1.default.join(process.cwd(), setupFileName);
    if (fs_1.default.existsSync(setupFilePath)) {
        console.log("\u26A0\uFE0F Setup j\u00E1 existe para ".concat(deviceId, ": ").concat(setupFileName));
        return;
    }
    var setupTemplate = {};
    mapMemory.forEach(function (_, index) {
        var tagName = "tag".concat(index + 1);
        setupTemplate[tagName] = {
            "mínimo": 0,
            "máximo": 0,
            "unidade": "",
            "SPAlarmL": 0,
            "SPAlarmLL": 0,
            "SPAlarmH": 0,
            "SPAlarmHH": 0
        };
    });
    fs_1.default.writeFileSync(setupFilePath, JSON.stringify(setupTemplate, null, 2));
    console.log("\u2705 Arquivo ".concat(setupFileName, " criado automaticamente com ").concat(mapMemory.length, " tags."));
}
