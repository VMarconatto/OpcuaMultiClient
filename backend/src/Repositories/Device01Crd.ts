/**
** =======================================================
@SECTION : Device01 — WriteDB Handler
@FILE : Device01Crd.ts
@PURPOSE : Realizar gravação dos dados OPC UA no MongoDB para Client01 e similares.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import { clientManager } from "../OpcuaControllers/ClientManager.js";
import fs from "fs/promises";
import path from "path";
import { recordInserts } from "../services/insertsCounter.js";

/**
 * Carrega o arquivo de setup (setuptsconfig.json ou ClientXX_setuptsconfig.json)
 * para um client específico.
 *
 * @param clientId - Ex: "Client01", "Client02"
 * @returns Objeto contendo o setup de variáveis e limites definidos.
 *
 * @remarks
 * - Se o arquivo não existir ou estiver malformado, retorna objeto vazio.
 */
async function loadSetupConfig(clientId: string): Promise<Record<string, any>> {
  try {
    const fileName =
      clientId === "Client01"
        ? "setuptsconfig.json"
        : `${clientId}_setuptsconfig.json`;

    const setupConfigPath = path.resolve(fileName);
    const rawData = await fs.readFile(setupConfigPath, "utf-8");
    const parsed = JSON.parse(rawData);

    if (!parsed || typeof parsed !== "object" || Object.keys(parsed).length === 0) {
      console.warn(`[${clientId}] setupConfig carregado mas está vazio ou malformado.`);
    }

    return parsed;
  } catch (error) {
    console.error(`[${clientId}] Erro ao carregar arquivo de setup:`, error);
    return {};
  }
}

/**
 * Grava os dados OPC UA de um cliente nas coleções correspondentes do MongoDB.
 *
 * @param data - Array de valores lidos dos nodes OPC UA.
 * @param clientId - Identificador do client (ex: "Client01").
 *
 * @remarks
 * - Garante reconexão com o MongoDB se a topologia estiver destruída.
 * - Realiza validação da quantidade de dados com base no setup.
 * - Persiste documentos em 3 coleções: transmiters, valves, motors.
 * - Cada inserção é registrada via `recordInserts()` para fins de telemetria.
 *
 * @example
 * ```ts
 * await Device_WriteDB(leituraAtual, "Client01");
 * ```
 */
export async function Device_WriteDB(data: any[] = [], clientId: string) {
  console.log(`[${clientId}] Tentando gravar dados no MongoDB...`);

  try {
    const client = clientManager.getClient(clientId);
    if (!client || !client.dbName || !client.collections || !client.mongoClient) {
      console.error(`${clientId} não configurado corretamente pelo ClientManager.`);
      return;
    }

    // Reconecta se o MongoClient estiver fechado
    if (!client.mongoClient.topology || client.mongoClient.topology.isDestroyed()) {
      console.warn(`[${clientId}] Topologia MongoDB fechada. Tentando reconectar...`);
      try {
        await client.mongoClient.connect();
        console.log(`[${clientId}] Reconexão MongoDB bem-sucedida`);
      } catch (reconnectErr) {
        console.error(`[${clientId}] Falha ao reconectar MongoDB:`, reconnectErr);
        return;
      }
    }

    const db = client.mongoClient.db(client.dbName);
    const aggTT = db.collection(client.collections.transmiters);
    const aggVV = db.collection(client.collections.valves);
    const aggMT = db.collection(client.collections.motors);

    const setupConfig = await loadSetupConfig(clientId);
    const setupKeys = Object.keys(setupConfig);

    if (data.length !== setupKeys.length) {
      console.error(
        `[${clientId}] ERRO: Quantidade de valores recebidos (${data.length}) não bate com as chaves do setup (${setupKeys.length}).`
      );
      console.error(`[${clientId}]  Dados recebidos:`, data);
      console.error(`[${clientId}]  Chaves esperadas:`, setupKeys);
      return;
    }

    // =======================================================
    // Transmiters
    // =======================================================
    const transmittersDoc: any = {
      metadata: {
        "Desmineralized Water_Id": 1,
        type: "Equipament",
        ProdUnit: "M³/Dia",
        Job: "Utilities Desmineralized Water",
        Step: data[150] ?? null,
      },
      timestamp: new Date(),
    };

    for (let i = 0; i < setupKeys.length; i++) {
      transmittersDoc[setupKeys[i]] = data[i] ?? null;
    }

    console.log(`[${clientId}] Documento transmiters a ser gravado (aggTT):`);
    for (const key of Object.keys(transmittersDoc)) {
      if (key !== "metadata" && key !== "timestamp") {
        console.log(`    ${key}: ${transmittersDoc[key]}`);
      }
    }

    await aggTT.insertOne(transmittersDoc);
    recordInserts(clientId, aggTT?.insertedCount ?? 1);

    // =======================================================
    // Valves
    // =======================================================
    const valvesDoc = {
      metadata: { ...transmittersDoc.metadata },
      timestamp: transmittersDoc.timestamp,
      "Water Input TRC001 - XV01 Start Command": data[65],
      "Water Input TRC001 - XV01 Comando Manut": data[66],
      "Water Input TRC001 - XV01 Auto/Manual Command": data[67],
    };

    console.log(`[${clientId}] Inserindo documento em ${client.collections.valves}:`, valvesDoc);
    await aggVV.insertOne(valvesDoc);

    // =======================================================
    // Motors
    // =======================================================
    const motorsDoc = {
      metadata: { ...transmittersDoc.metadata },
      timestamp: transmittersDoc.timestamp,
      "Regeneration - BB01 Start Command": data[0],
      "Regeneration - BB01 Emergency Command": data[1],
    };

    console.log(`[${clientId}] Inserindo documento em ${client.collections.motors}:`, motorsDoc);
    await aggMT.insertOne(motorsDoc);

    console.log(`[${clientId}]  Dados inseridos com sucesso!`);
  } catch (error) {
    console.error(`[${clientId}] Erro ao inserir no MongoDB:`, error);
  }
}
