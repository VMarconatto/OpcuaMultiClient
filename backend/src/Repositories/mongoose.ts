// =============================
// File: mongoose.ts
// (Observação: este arquivo usa o driver oficial `mongodb`, não o Mongoose)
// =============================

import { MongoClient } from 'mongodb';
import dotenv from "dotenv";
dotenv.config();

/**
* String de conexão do MongoDB, lida via variável de ambiente.
*
* **Importante:** aqui é utilizada a variável `connectionstring3`.
* Garanta que o `.env` define corretamente esse nome de variável.
*
* @type {string | undefined}
*/
const uri = process.env.connectionstring3;

if (!uri) {
// Observação: mensagem preservada como no original. Ajuste o texto se desejar.
throw new Error("A variável de ambiente connectionstring não foi definida.");
}

/**
* Instância singleton de {@link MongoClient} compartilhada pela aplicação.
*
* Opções:
* - `tls: true` — habilita TLS para conexões seguras.
* - `tlsAllowInvalidCertificates: false` — recusa certificados inválidos.
*/
const Device_MongoClient = new MongoClient(uri, {
tls: true,
tlsAllowInvalidCertificates: false,
});

/**
* Flag de controle local para evitar conexões repetidas.
* @type {boolean}
*/
let isConnected = false;

/**
* Obtém um cliente MongoDB já conectado (padrão singleton).
*
* A primeira chamada estabelece a conexão e mantém o cliente disponível
* para reuso subsequente. Chamadas posteriores retornam a mesma instância.
*
* @async
* @function getConnectedClient
* @returns {Promise<MongoClient>} Uma instância de {@link MongoClient} conectada.
*
* @example
* (async () => {
* const client = await getConnectedClient();
* const db = client.db("MinhaBase");
* const ping = await db.command({ ping: 1 });
* console.log(ping);
* })();
*/
export async function getConnectedClient(): Promise<MongoClient> {
if (!isConnected) {
await Device_MongoClient.connect();
isConnected = true;
console.log('entrou no getConnected Client')
console.log("MongoDB conectado (Device01_MongoClient)");
}
return Device_MongoClient;
}

export default Device_MongoClient;