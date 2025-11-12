/**
@SECTION : Device01 — WriteDB Handler
@FILE : Device01Crd.ts
@PURPOSE : Realizar gravação dos dados OPC UA no MongoDB para Client01 e similares.
@LAST_EDIT : 2025-11-10

* Verifica o status de conexão com o MongoDB para todos os clientes
* gerenciados pelo {@link clientManager}.
* A função itera sobre cada cliente cadastrado, tenta estabelecer a conexão
* (se necessário) e executa um comando `ping` no banco específico do cliente.
* Durante o processo, logs informativos são emitidos sobre o sucesso ou
* falha de cada conexão testada. Caso nenhuma conexão seja estabelecida,
* um aviso adicional é logado no final.
* @async : 
* @function checkMongoConnection
* @returns {Promise<boolean>} `true` se ao menos um cliente conseguiu conectar
* e responder ao `ping`; `false` caso contrário.
* @example
* (async () => {
* const ok = await checkMongoConnection();
* if (!ok) {
* // Tomar ações de contingência (ex.: aguardar OPC UA, re-tentar, etc.)
* }
* })();
 */

import { clientManager } from '../OpcuaControllers/ClientManager.js';
export async function checkMongoConnection(): Promise<boolean> {
  /**
  * Flag acumulativa para indicar se ao menos um cliente conectou com sucesso.
  * @type {boolean}
  */
  let anyConnected = false;

  // Percorre o dicionário de clientes gerenciados (id => client)
  for (const [id, client] of Object.entries(clientManager.getAllClients())) {
    try {
      // Garante que o cliente possui uma instância configurada de mongoClient
      if (!client.mongoClient) {
        console.error(`Client ${id} não possui mongoClient configurado.`);
        continue;
      }

      // Estabelece a conexão (idempotente segundo o driver) e pinga o DB do cliente
      await client.mongoClient.connect();
      await client.mongoClient.db(client.dbName).command({ ping: 1 });
      console.log(`MongoDB conectado para ${id}`);
      anyConnected = true;
    } catch (err) {
      // Loga erros de conexão/execução de comando para o cliente atual
      console.error(`Erro ao conectar MongoDB para ${id}:`, err);
    }
  }

  // Caso nenhuma conexão tenha sido estabelecida, emite um aviso consolidado
  if (!anyConnected) {
    console.error("Nenhuma conexão MongoDB estabelecida. OPC UA aguardando...");
  }


  return anyConnected;
}
