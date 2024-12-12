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
      
      // Capture error output
      let errorOutput = '';
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      // Handle process close
      child.on('close', (code) => {
        if (code !== 0) {
          // Process failed
          reject(new Error(errorOutput || 'Process failed'));
          return;
        }
        
        const command = this.getCommand(type, connectionDetails);
        exec(command, { cwd: PROJECT_DIR }, error => {
          if (error) {
            console.error(`Error executing command: ${error}`);
            return;
          }

          resolve({});
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

    return stripIndent(`
      import knex from 'knex';
      
      const client = knex({
        client: '${dataSourceData.knexClientStr}',
        connection: ${JSON.stringify(connectionDetails.connection)},
        ${connectionDetails.searchPath ? `searchPath: ${JSON.stringify(connectionDetails.searchPath)},` : ''}
      });

      try {
        await client.raw('SELECT 1');
        process.exit(0);
      } catch (err) {
        console.error(err instanceof Error ? err.message : err);
        process.exit(1);
      }
    `);
  }

  private getCommand(type: DataSourceType, connectionDetails: Data['connectionDetails']) {
    const dataOption = JSON.stringify(connectionDetails).replace(/"/g, '\\"');

    return `npm run dev:add-data-source ${type} -- --skipInstall --data "${dataOption}"`;
  }
}