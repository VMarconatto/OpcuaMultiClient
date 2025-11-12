"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limits = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var rangeSetupFilePath = path_1.default.join(process.cwd(), "setuptsconfig.json");
var limitsData = {};
// Tenta carregar os valores do JSON
try {
    var fileContent = fs_1.default.readFileSync(rangeSetupFilePath, "utf-8");
    limitsData = JSON.parse(fileContent);
    console.log("✅ setuptsconfig.json carregado com sucesso.");
}
catch (err) {
    console.warn("⚠️ Não foi possível carregar setuptsconfig.json. Usando valores padrão.", err);
}
// Monta o objeto limits dinamicamente
exports.limits = Object.fromEntries(Object.entries(limitsData).map(function (_a) {
    var _b, _c, _d, _e, _f, _g, _h;
    var key = _a[0], value = _a[1];
    return [
        key,
        {
            min: (_b = value.mínimo) !== null && _b !== void 0 ? _b : 0,
            max: (_c = value.máximo) !== null && _c !== void 0 ? _c : 0,
            unidade: (_d = value.unidade) !== null && _d !== void 0 ? _d : "",
            SPAlarmL: (_e = value.SPAlarmL) !== null && _e !== void 0 ? _e : 0,
            SPAlarmLL: (_f = value.SPAlarmLL) !== null && _f !== void 0 ? _f : 0,
            SPAlarmH: (_g = value.SPAlarmH) !== null && _g !== void 0 ? _g : 0,
            SPAlarmHH: (_h = value.SPAlarmHH) !== null && _h !== void 0 ? _h : 0
        }
    ];
}));
