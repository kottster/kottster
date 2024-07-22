import { Knex } from "knex";
import { attachPaginate } from 'knex-paginate';
import { DatabaseSchema } from "./databaseSchema.model";
import { DataSourceClientType } from "@kottster/common";

/**
 * The base class for all data source clients
 * @abstract
 */
export abstract class DataSourceClient {
  abstract type: DataSourceClientType;

  constructor(protected client: Knex) {
    try {
      attachPaginate();
    } catch (e) {
      console.error('Error attaching paginate to knex', e);
    }
  }

  /**
   * Get the database schema
   * @returns The database schema
   */
  abstract getDatabaseSchema(): Promise<DatabaseSchema>;

  /**
   * Connect to the database
   * @param reloadOnFailure - If true, will attempt to reconnect to the database on failure
   */
  connect(reloadOnFailure = true): void {
    // Set up a listener to attempt to reconnect to the database on failure
    if (reloadOnFailure) {
      this.client.client.pool.on('error', (err) => {
        console.error('Database connection error:', err);
  
        setTimeout(() => {
          console.log('Attempting to reconnect to the database...');
          this.connect();
        }, 3000);
      });
    }
  };

  /**
   * Ping the database to check if the connection is successful
   * @returns True if the connection is successful
   */
  public async pingDatabase(): Promise<boolean> {
    try {
      await this.client?.raw('SELECT 1');
      return true;
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  /**
   * Destroy the database connection
   */
  public destroyConnection(): void {
    if (this.client) {
      this.client.destroy();
    }
  }
}
