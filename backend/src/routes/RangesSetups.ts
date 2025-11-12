/**
** =======================================================
@SECTION : Ranges & Setups Routes
@FILE : RangesSetups.ts
@PURPOSE : Expor e persistir arquivos de setup de alarmes por deviceId,
reaproveitando chaves existentes ou gerando estrutura pelo mapMemory.
@LAST_EDIT : 2025-11-10
** =======================================================
*/


import { Router } from "express";
import fs from "fs";
import path from "path";

const SetupRouter = Router();
const setupsPath = process.cwd();

/**
 * GET /:deviceId/setupalarms
 * Retorna o setup de um device.
 *
 * @remarks
 * - Se houver um setup salvo (arquivo JSON), retorna exatamente aquele conteúdo.
 * - Caso contrário, gera um objeto “fallback” com base nas tags do `mapMemory`
 *   encontradas no `opcuaClientConfig.json`.
 * - `Client01` usa o arquivo `setuptsconfig.json` (padrão histórico).
 * - Outros clientes usam `<ClientXX>_setuptsconfig.json`.
 */
SetupRouter.get("/:deviceId/setupalarms", (req, res) => {
  const { deviceId } = req.params;

  const configPath = path.join(setupsPath, "opcuaClientConfig.json");
  /**
  @WHY : sem config geral não sabemos o mapMemory para fallback
  */
  
  if (!fs.existsSync(configPath)) {
    return res
      .status(500)
      .json({ error: "Configuração opcuaClientConfig.json não encontrada." });
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  const client = config.clients?.[deviceId];

  if (!client) {
    return res
      .status(404)
      .json({ error: `Cliente ${deviceId} não encontrado na configuração.` });
  }

  const memoryTags = client.mapMemory || [];

  // Caminho do arquivo de setup
  const setupFile =
    deviceId === "Client01"
      ? path.join(setupsPath, "setuptsconfig.json") // histórico para Client01
      : path.join(setupsPath, `${deviceId}_setuptsconfig.json`);

  let existingSetup: Record<string, any> = {};
  if (fs.existsSync(setupFile)) {
    try {
      existingSetup = JSON.parse(fs.readFileSync(setupFile, "utf-8"));
    } catch (err) {
      console.error(`Erro ao ler ${setupFile}:`, err);
      return res.status(500).json({ error: "Erro ao ler setup existente." });
    }
  }
  /**
  @WHY : Se já existe arquivo de setup, respeitar chaves e valores atuais
  */

  if (Object.keys(existingSetup).length > 0) {
    return res.json(existingSetup);
  }

  // Fallback: não há setup salvo — gerar estrutura a partir do mapMemory
  const generatedSetup: Record<string, any> = {};
  memoryTags.forEach((tagId: string) => {
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
 * POST /:deviceId/setupalarms
 * Persiste o setup informado pelo cliente para o arquivo correspondente.
 *
 * @remarks
 * - `Client01` → `setuptsconfig.json`
 * - Demais → `<ClientXX>_setuptsconfig.json`
 */
SetupRouter.post("/:deviceId/setupalarms", (req, res) => {
  const { deviceId } = req.params;
  const incomingData = req.body;

  const configPath = path.join(setupsPath, "opcuaClientConfig.json");

  if (deviceId === "Client01") {
    const outputPath = path.join(setupsPath, "setuptsconfig.json");

    try {
      fs.writeFileSync(outputPath, JSON.stringify(incomingData, null, 2));
      console.log(`Setup salvo para Client01: ${outputPath}`);
      res.json({ message: "Setup salvo com sucesso para Client01" });
    } catch (err) {
      console.error("Erro ao salvar setup:", err);
      return res.status(500).json({ error: "Erro ao salvar setup" });
    }
  } else {
    const setupFile = path.join(setupsPath, `${deviceId}_setuptsconfig.json`);
    fs.writeFile(setupFile, JSON.stringify(incomingData, null, 2), (err) => {
      if (err) {
        console.error(`Erro ao salvar ${setupFile}:`, err);
        return res.status(500).json({ error: "Erro ao salvar setup" });
      }

      console.log(`Setup salvo para ${deviceId}: ${setupFile}`);
      res.json({ message: `Setup salvo com sucesso para ${deviceId}` });
    });
  }
});

export default SetupRouter;
