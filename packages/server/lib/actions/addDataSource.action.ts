import { DataSourceType, stripIndent, dataSourcesTypeData } from "@kottster/common";
import { exec } from "child_process";
import { spawn } from 'child_process';
import { PROJECT_DIR } from "../constants/projectDir";
import { DSAction } from "../models/action.model";

interface Data {
  type: DataSourceType;
  
  connectionDetails: {
    /** The connection details */
    connection: string | Record<string, any>;

    /** The database schema if applicable */
    searchPath?: string[];
  };
}

/**
 * Verify and add data source to the project
 */
export class AddDataSource extends DSAction {
  private readonly dbDataStartMarker = '__DB_DATA_START__';
  private readonly dbDataEndMarker = '__DB_DATA_END__';
  private readonly dbDataRegex = new RegExp(`${this.dbDataStartMarker}(.*?)${this.dbDataEndMarker}`, 's');

  private readonly dbErrorStartMarker = '__DB_ERROR_START__';
  private readonly dbErrorEndMarker = '__DB_ERROR_END__';
  private readonly dbErrorRegex = new RegExp(`${this.dbErrorStartMarker}(.*?)${this.dbErrorEndMarker}`, 's');

  public async execute(data: Data) {
    return new Promise((resolve, reject) => {
      const { type, connectionDetails } = data;
      const executableCode = this.getExecutableCode(type, connectionDetails);

      const child = spawn('node', [
        '--no-warnings',
        '--input-type=module',
        '-e',
        executableCode
      ], {
        stdio: 'pipe'
      });

      // Capture stdout
      let stdOutput = '';
      child.stdout.on('data', (data) => {
        stdOutput += data.toString();
      });
      
      // Capture error output
      let errorOutput = '';
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      // Handle process close
      child.on('close', (code) => {
        // Parse the received data
        const dbDataMatch = stdOutput.match(this.dbDataRegex);
        let data = {
          tableCount: 0,
        };
        if (dbDataMatch && dbDataMatch[1]) {
          try {
            data = JSON.parse(dbDataMatch[1]);
          } catch (err) {
            console.warn('Could not parse database info:', err);
          }
        }

        // Parse the error output
        const dbErrorMatch = stdOutput.match(this.dbErrorRegex);
        let errorMessage = '';
        if (dbErrorMatch && dbErrorMatch[1]) {
          try {
            errorMessage = dbErrorMatch[1];
            
            // Remove quotes from the error message if they exist
            if (errorMessage.startsWith(`"`) && errorMessage.endsWith(`"`)) {
              errorMessage = errorMessage.slice(1, -1);
            }
          } catch (err) {
            console.warn('Could not parse database error:', err);
          }
        }

        // Handle errors
        if (code !== 0) {
          reject(new Error(errorOutput || stdOutput || 'Process failed'));
          return;
        }
        if (errorMessage) {
          reject(new Error(errorMessage));
          return;
        }
        const tableCount = data.tableCount || 0;

        // If no tables were found, reject with an error
        if (tableCount === 0) {
          reject(new Error(`No tables were found in your database. ${connectionDetails.searchPath ? `Please check if the schema name "${connectionDetails.searchPath}" is correct.` : `Please check if the connection details are correct.`}`));
          return;
        }
        
        const command = this.getCommand(type, connectionDetails);
        exec(command, { cwd: PROJECT_DIR }, error => {
          if (error) {
            console.error(`Error executing command: ${error}`);
            return;
          }

          resolve(data);
        });
      });
      
      // Handle spawn errors
      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  private getExecutableCode(type: DataSourceType, connectionDetails: Data['connectionDetails']) {
    const dataSourceData = dataSourcesTypeData[type];

    const adapterClassName = this.getAdapterClassName(type);

    return stripIndent(`
      import knex from 'knex';
      import { createDataSource, ${adapterClassName} } from '@kottster/server';
      
      const dataSource = createDataSource({
        type: '${type}',
        name: '${type}',
        init: () => {
          const client = knex({
            client: '${dataSourceData.knexClientStr}',
            connection: ${JSON.stringify(connectionDetails.connection)},
            ${connectionDetails.searchPath ? `searchPath: ${JSON.stringify(connectionDetails.searchPath)},` : ''}
          });

          return new ${adapterClassName}(client);
        },
        tablesConfig: {}
      });

      try {
        const client = dataSource.adapter.getClient();
        const databaseTableCount = await dataSource.adapter.getDatabaseTableCount();
        process.stdout.write('${this.dbDataStartMarker}' + JSON.stringify({ tableCount: databaseTableCount }) + '${this.dbDataEndMarker}');
      } catch (err) {
        process.stdout.write('${this.dbErrorStartMarker}' + JSON.stringify((err && err.message) ? err.message : err) + '${this.dbErrorEndMarker}');
      } finally {
        process.exit(0); 
      }
    `);
  }

  private getCommand(type: DataSourceType, connectionDetails: Data['connectionDetails']) {
    const dataOption = JSON.stringify(connectionDetails).replace(/"/g, '\\"');

    return `npm run dev:add-data-source ${type} -- --skipInstall --data "${dataOption}"`;
  }
  private getAdapterClassName(type: DataSourceType) {
    switch (type) {
      case DataSourceType.postgres:
        return 'KnexPgAdapter';
      case DataSourceType.mysql:
      case DataSourceType.mariadb:
        return 'KnexMysql2Adapter';
      case DataSourceType.sqlite:
        return 'KnexBetterSqlite3Adapter';
      default:
        throw new Error(`Unsupported data source type: ${type}`);
    }
  }


}