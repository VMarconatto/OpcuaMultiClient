/**
** =======================================================
@SECTION : Express Server Bootstrap
@FILE : index.ts
@PURPOSE : Inicializar servidor Express, configurar rotas, middlewares,
métricas HTTP, agendadores, conexões Mongo e clients OPC UA.
@LAST_EDIT : 2025-11-10
** =======================================================
 */

import express from "express";
import cors from "cors";
import morgan from "morgan";
import { dataRoutes } from "./routes/data.js";
import SetupRouter from "./routes/RangesSetups.js";
import OpcuaSetupRouter from "./routes/OpcuaClient_Setups.js";
import { opcuaRoutes } from "./routes/opcuaRoutes.js";
import { checkMongoConnection } from "./Repositories/mongoConnectionStatus.js";
import { startAlertsLogCleaner } from "./services/clean-alerts-log.js";
import { startAlertScheduler } from "./services/alertScheduler.js";
import { makeUsersRoutesLazy } from "./routes/users.routes.js"; // rota /users (lazy)
import { createHttpMetrics } from "./routes/morgan.routes.js";
import bodyParser from "body-parser";
import { initializeOpcuaClientsFromJSON } from "./utils/OpcuaInitializer.js";
import { createHostRoutes } from "./routes/host.routes.js";
import dotenv from "dotenv";
import { MongoClient, Db } from "mongodb";
import makeAuthRoutesLazy from "./routes/auth.routes.js"; // rota /auth (lazy)
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();

/**
** =======================================================
@SECTION : Configuração básica e CORS
** =======================================================
 */

const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN?.trim() || "http://localhost:3001";
const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  /**
  @WHY : necessário quando o app estiver atrás de proxy/reverse-proxy
  */

  app.set("trust proxy", 1);
}

/**
** =======================================================
@SECTION : Agendadores automáticos
** =======================================================
 */
startAlertScheduler();
startAlertsLogCleaner();
/**
** =======================================================
@SECTION : Middlewares globais
** =======================================================
*/

const corsOptions: cors.CorsOptions = {
  origin: FRONTEND_ORIGIN, // lido do .env
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

const cookieSecret = process.env.COOKIE_SECRET;
if (!cookieSecret && isProd) {
  console.warn(
    "COOKIE_SECRET ausente em produção — cookies assinados podem falhar."
  );
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser(cookieSecret || "dev-secret"));

/**
 * 
** -------------------------------------------------------
@SECTION : Métricas HTTP (latência/status por rota)
** -------------------------------------------------------
*/

const httpm = createHttpMetrics({
  bucketSpanSec: 5,
  retentionMinutes: 30,
  statusWindowSec: 60,
});
app.use(httpm.record);

/**
** =======================================================
@SECTION : Rotas principais
** =======================================================
 */

app.use(dataRoutes);
console.log("Rotas de dados (dataRoutes) montadas com sucesso.");

app.use(OpcuaSetupRouter);
app.use(SetupRouter);
app.use(opcuaRoutes);

// Host monitor
app.use(
  createHostRoutes({
    bucketSpanSec: 5,
    windowSec: 300,
    opcuaHost: "SEU_OPCUA_HOSTNAME_OU_IP",
    mongoHost: "SEU_MONGO_HOSTNAME",
  })
);

// Exposição das rotas de métricas
httpm.routes(app);

/**
** =======================================================
@SECTION : Conexão DB /users e rotas lazy
** =======================================================
*/

let usersDb: Db | null = null;
app.use(makeUsersRoutesLazy(() => usersDb)); // /users (lazy)
app.use("/auth", makeAuthRoutesLazy(() => usersDb)); // /auth (lazy)

/**
=======================================================
@SECTION : Rotas de teste e fallback
** =======================================================
*/

app.get("/data", (_req, res) => {
  res.json({ status: "ok" });
});

// 404 genérico
app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

/**
** =======================================================
@SECTION : Inicialização e conexões
** =======================================================
*/

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, async () => {
  console.log(`Servidor backend ouvindo na porta ${PORT}`);

  // Conexão MongoDB dedicada aos usuários
  const usersUri =
    process.env.MONGO_URI_USERS || process.env.connectionstring3;
  const usersDbName = process.env.MONGO_DB_USERS?.trim() || "User";

  if (!usersUri) {
    console.warn(
      "MONGO_URI_USERS não definido. /users responderá 503 até configurar a conexão."
    );
  } else {
    try {
      const client = new MongoClient(usersUri);
      await client.connect();
      usersDb = client.db(usersDbName);
      console.log(`/users ativo (ENV users) db='${usersDbName}'.`);
    } catch (e) {
      console.error("Falha ao conectar no DB de usuários:", e);
    }
  }

  // Inicializa clients OPC UA
  console.log("📡 Inicializando OPC UA clients...");
  await initializeOpcuaClientsFromJSON();

  // Monitoramento periódico das conexões MongoDB
  setInterval(async () => {
    console.log("Verificando status das conexões MongoDB...");
    const mongoReady = await checkMongoConnection();
    if (mongoReady) {
      console.log("Pelo menos uma conexão MongoDB está ativa.");
    } else {
      console.warn("Nenhuma conexão MongoDB ativa no momento.");
    }
  }, 10000);
});
