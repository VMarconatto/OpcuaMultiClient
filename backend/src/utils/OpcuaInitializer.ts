
import { clientManager } from "../OpcuaControllers/ClientManager.js";
import fs from "fs/promises";
import path from "path";
import { resolveSetupFilePath } from "../utils/SetupInitializer.js";

export async function initializeOpcuaClientsFromJSON() {
  try {
    const configPath = path.resolve("opcuaClientConfig.json");
    console.log(`[OpcuaInitializer] Lendo configurações de: ${configPath}`);
    const fileContent = await fs.readFile(configPath, "utf-8");
    const parsedConfig = JSON.parse(fileContent);

    const clients = (parsedConfig && parsedConfig.clients) || {};
    const clientKeys = Object.keys(clients);

    if (clientKeys.length === 0) {
      console.warn("[OpcuaInitializer] Nenhum cliente encontrado em 'opcuaClientConfig.json'.");
      return;
    }

    for (const id of clientKeys) {
      const cfg = clients[id] || {};
      const endpoint: string | undefined = cfg.endpoint;
      const namespace = cfg.namespace;
      const mapMemory: string[] = cfg.mapMemory || [];
      const opcuaOptions = cfg.opcuaOptions || {};
      const tagPaths: string[] | undefined = cfg.tagPaths;

      // valida endpoint
      if (!endpoint) {
        console.warn(`[OpcuaInitializer] Configuração inválida para '${id}': endpoint ausente`);
        continue;
      }
      /**
       * @WHY : namespace padrão 3 caso ausente/indefinido no JSON
       * ```ts
       */
      const ns =
        namespace == null
          ? 3
          : Number.isFinite(Number(namespace))
            ? Number(namespace)
            : 3;

      try {
        // Registra cliente no gerenciador
        clientManager.addClient(id, endpoint, mapMemory, opcuaOptions, ns);
        /**
        * @WHY : preparar MongoDB antes de iniciar a conexão garante coleções/índices prontos
        * 
        */
        console.log(`[OpcuaInitializer] Garantindo MongoDB para cliente '${id}'`);
        try {
          await clientManager.prepareMongoForClient(id);
        } catch (mongoErr) {
          if (mongoErr instanceof Error) {
            console.error(`[OpcuaInitializer] Erro ao preparar MongoDB para cliente '${id}':`, mongoErr.stack || mongoErr.message);
          } else {
            console.error(`[OpcuaInitializer] Erro desconhecido ao preparar MongoDB para cliente '${id}':`, mongoErr);
          }
        }

        const clientInstance = clientManager.getClient(id);
        if (!clientInstance) {
          console.error(`[OpcuaInitializer] Client '${id}' não encontrado após addClient.`);
          continue;
        }
        /**
         * @NOTE : appUri sanitizado evita caracteres inválidos p/ PKI e identificação do app
         * 
         */
        const sanitizedId = id.replace(/[^a-zA-Z0-9]/g, "_");
        const sanitizedEndpoint = endpoint.replace(/[^a-zA-Z0-9]/g, "_");
        const appUri = `${sanitizedId}_${sanitizedEndpoint}`;

        await clientInstance.initialize(appUri);
        await clientInstance.connect();

        try {
          // Log útil para rastrear setup real usado em runtime
          const setupPath = resolveSetupFilePath(id);
          console.log(`[OpcuaInitializer] Setup do cliente '${id}': ${setupPath}`);
        } catch (setupErr) {
          if (setupErr instanceof Error) {
            console.warn(`[OpcuaInitializer] Não foi possível resolver setup para '${id}':`, setupErr.message);
          } else {
            console.warn(`[OpcuaInitializer] Erro não mapeado ao resolver setup para '${id}':`, setupErr);
          }
        }

        if (Array.isArray(tagPaths) && tagPaths.length > 0) {
          console.log(`[OpcuaInitializer] Resolvendo ${tagPaths.length} tagPaths para '${id}'`);
          const nodeIds = await clientManager.translatePaths(id, tagPaths);

          // Narrowing: filtra nulos/undefined e informa ao TS que são strings
          const resolvidos = nodeIds.filter((n): n is string => Boolean(n));

          if (resolvidos.length) {
            /**
            * @WHY : se há NodeIds resolvidos, ativa polling por browse (2s)
            * 
            */

            console.log(`[OpcuaInitializer] ${resolvidos.length} paths traduzidos para NodeIds. Iniciando polling por browse.`);
            clientManager.setPollingNodeIds(id, resolvidos, 2000);
          } else {
            console.warn(`[OpcuaInitializer] Nenhum path traduzido para '${id}'. Permanecendo em mapMemory (se houver).`);
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          console.error(`[OpcuaInitializer] Erro ao iniciar cliente OPC UA '${id}':`, err.stack || err.message);
        } else {
          console.error(`[OpcuaInitializer] Erro desconhecido ao iniciar cliente OPC UA '${id}':`, err);
        }
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error("[OpcuaInitializer] Erro ao carregar configurações OPC UA do JSON:", err.stack || err.message);
    } else {
      console.error("[OpcuaInitializer] Erro desconhecido ao carregar configurações OPC UA do JSON:", err);
    }
  }
}
