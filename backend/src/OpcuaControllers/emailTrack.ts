/**
** =======================================================
@SECTION : Email Tracking — Pixel Handler
@FILE : emailTrack.ts
@PURPOSE : Servir um pixel PNG e registrar aberturas de e‑mail em um log JSON, preservando a lógica existente.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Corrigindo __dirname (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pixelPath = path.join(__dirname, "pixel.png"); // certifique-se de ter esse arquivo

/**
* Handler para rastrear leitura de e‑mail via pixel 1x1.
*
* Rota esperada: GET /track/:tag
* - Lê `req.params.tag` para identificar a campanha/mensagem.
* - Anexa um registro em logs/email-read-log.json com timestamp, UA e IP.
* - Retorna uma imagem PNG (pixel transparente) se existir, ou 404 se ausente.
*
* Importante: Somente comentários foram adicionados; a lógica foi mantida.
* @param {Request} req Requisição Express
* @param {Response} res Resposta Express
*/
export async function emailReadTracker(req: Request, res: Response) {
const tag = req.params.tag; // identificador do e‑mail/campanha

// Caminho do log consolidado no projeto (../logs/email-read-log.json)
const logPath = path.join(__dirname, "..", "logs", "email-read-log.json");

// Estrutura de log gravada no JSON
const logEntry = {
timestamp: new Date().toISOString(),
tag,
userAgent: req.headers["user-agent"] || null,
ip: req.ip,
};

try {
// Carrega o JSON atual se existir; caso contrário, começa com array vazio
const existingData = fs.existsSync(logPath)
? JSON.parse(fs.readFileSync(logPath, "utf-8"))
: [];

existingData.push(logEntry);

// Persiste o log formatado (legível)
fs.writeFileSync(logPath, JSON.stringify(existingData, null, 2));
} catch (error) {
console.error("Erro ao registrar leitura de e-mail:", error);
}

// Retorna o pixel PNG se presente; caso contrário, 404
if (fs.existsSync(pixelPath)) {
res.setHeader("Content-Type", "image/png");
return fs.createReadStream(pixelPath).pipe(res);
} else {
res.status(404).send("Pixel not found");
}
}