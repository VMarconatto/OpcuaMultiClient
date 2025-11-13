/**
** =======================================================
@SECTION : Mongo Aggregations — Histórico e Totais
@FILE : aggregations.ts
@PURPOSE : Fornecer funções de agregação temporal para consultas históricas e totais de variáveis industriais no MongoDB.
@LAST_EDIT : 2025-11-10
** =======================================================
*/

import { getConnectedClient } from "../Repositories/mongoose.js";
import { MongoClient } from "mongodb";

/**
 * Obtém documentos de uma coleção no intervalo de tempo especificado.
 *
 * Filtro por:
 * - `timestamp` entre `firstDay/firstHour` e `endDay/endHour`
 * - Resultados ordenados por `timestamp`
 *
 * Somente comentários foram adicionados; a lógica original foi mantida.
 * @param mongoClient Instância do cliente MongoDB (já conectado)
 * @param dbName Nome do banco de dados
 * @param collectionName Nome da coleção
 * @param month Mês (1–12)
 * @param year Ano completo (ex.: 2025)
 * @param firstDay Primeiro dia (default: 1)
 * @param endDay Último dia (default: 31)
 * @param firstHour Hora inicial (0–23, default: 0)
 * @param endHour Hora final (0–23, default: 23)
 * @returns {Promise<any[] | null>} Lista de documentos encontrados ou null se erro
 */
export async function getMBData(
  mongoClient: MongoClient,
  dbName: string,
  collectionName: string,
  month: number,
  year: number,
  firstDay = 1,
  endDay = 31,
  firstHour = 0,
  endHour = 23
) {
  console.log("getMBData chamado com:");
  console.log("db:", dbName);
  console.log("collection:", collectionName);
  console.log("filtro:", { year, month, firstDay, endDay, firstHour, endHour });

  // saneamento simples
  const fh = Math.max(0, Math.min(23, firstHour));
  const eh = Math.max(fh, Math.min(23, endHour));

  const startDate = new Date(Date.UTC(year, month - 1, firstDay, fh, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month - 1, endDay, eh, 59, 59, 999));

  // pipeline básico: match + sort
  const pipeline = [
    { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    { $sort: { timestamp: 1 } },
  ];

  try {
    const aggDB = mongoClient.db(dbName).collection(collectionName);

    console.log(`[${dbName}.${collectionName}] Entre:`, startDate.toISOString(), "e", endDate.toISOString());

    const result = await aggDB.aggregate(pipeline).toArray();
    console.log("Resultado transmiters:", result.length, "documentos");

    return result;
  } catch (e) {
    console.error("Erro no getMBData:", e);
    return null;
  }
}

/**
 * Calcula totais mensais de variáveis principais (FT01–FT03) com base nos documentos filtrados.
 *
 * - Usa `$match` por `timestamp` entre o intervalo solicitado.
 * - Agrupa e soma campos numéricos principais (FT01, FT02, FT03).
 * - Retorna um único documento com os totais.
 *
 * Somente comentários foram adicionados; a lógica original foi mantida.
 * @param dbName Nome do banco de dados
 * @param collectionName Nome da coleção
 * @param month Mês (1–12)
 * @param year Ano completo (ex.: 2025)
 * @param firstDay Primeiro dia (default: 1)
 * @param endDay Último dia (default: 31)
 * @param firstHour Hora inicial (default: 0)
 * @param endHour Hora final (default: 23)
 * @returns {Promise<Record<string, any> | null>} Objeto agregado com totais ou null se erro
 */
export async function getMBTotals(
  dbName: string,
  collectionName: string,
  month: number,
  year: number,
  firstDay = 1,
  endDay = 31,
  firstHour = 0,
  endHour = 23
) {
  const fh = Math.max(0, Math.min(23, firstHour));
  const eh = Math.max(fh, Math.min(23, endHour));

  const startDate = new Date(Date.UTC(year, month - 1, firstDay, fh, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month - 1, endDay, eh, 59, 59, 999));

  // pipeline de agregação: match + group
  const pipeline = [
    { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: null,
        total_FT01: { $sum: "$Entrada TRC001 - FT01" },
        total_FT02: { $sum: "$Demineralized Water Soda Dilution Flow - FT02" },
        total_FT03: { $sum: "$Demineralized Water Hydrochloric Acid Dilution Flow - FT03" },
      },
    },
  ];

  try {
    const client = await getConnectedClient();
    const aggDB = client.db(dbName).collection(collectionName);

    console.log(`[${dbName}.${collectionName}] Calculando totais entre:`, startDate.toISOString(), "e", endDate.toISOString());

    const [result] = await aggDB.aggregate(pipeline).toArray();
    return result;
  } catch (e) {
    console.error("Erro no getMBTotals:", e);
    return null;
  }
}