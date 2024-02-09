import { Pool, PoolConnection } from 'mysql2/promise';

export abstract class MySqlConnection {
  static pool: Pool | undefined;

  static async getConnection(): Promise<PoolConnection> {
    if (!MySqlConnection.pool) {
      throw new Error('Pool MySQL não foi inicializado.');
    }
    try {
      const connection = await MySqlConnection.pool.getConnection();
      return connection;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  static async closeConnection(
    conn: PoolConnection | undefined,
  ): Promise<void> {
    if (conn) {
      conn.release();
    }
  }
}
