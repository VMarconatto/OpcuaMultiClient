
import { MongoClient } from "mongodb";

/**
 * Representa a conexão de um cliente lógico do sistema.
 *
 * @remarks
 * - collections.transmiters aceita qualquer nome de coleção (não fica “amarrado”
 *   a um literal fixo). A indexação `[key: string]: string` permite adicionar
 *   coleções novas no futuro sem quebrar o tipo.
 * - mongoClient` é a instância compartilhada/gerenciada externamente.
 */
export interface ClientConnection {
  /** Nome do database (ex.: `Client01_Transmiters`, `User`, etc.) */
  dbName: string;

  /**
   * Mapa de coleções utilizadas por este cliente.
   * @example
   * ```ts
   * {
   *   transmiters: "Client01_Transmiters",
   *   alerts: "Client01_Alerts"
   * }
   * ```
   */
  collections: {
    /** Coleção principal de telemetria/transmissores (nome livre). */
    transmiters: string;
    /** Outras coleções específicas podem ser adicionadas aqui. */
    [key: string]: string;
  };

  /** Instância do driver MongoDB associada a este cliente. */
  mongoClient: MongoClient;
}
